import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Get or create a conversation between two users
export const getOrCreateConversation = mutation({
  args: {
    otherUserEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null || !identity.email) {
      throw new Error('Not authenticated')
    }

    // Check if conversation already exists
    const existing = await ctx.db
      .query('conversations')
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field('user1Email'), identity.email),
            q.eq(q.field('user2Email'), args.otherUserEmail)
          ),
          q.and(
            q.eq(q.field('user1Email'), args.otherUserEmail),
            q.eq(q.field('user2Email'), identity.email)
          )
        )
      )
      .first()

    if (existing) {
      return existing._id
    }

    // Check if they are friends
    const friendship = await ctx.db
      .query('friendships')
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'accepted'),
          q.or(
            q.and(q.eq(q.field('user1Email'), identity.email), q.eq(q.field('user2Email'), args.otherUserEmail)),
            q.and(q.eq(q.field('user1Email'), args.otherUserEmail), q.eq(q.field('user2Email'), identity.email))
          )
        )
      )
      .first();

    const acceptedBy = friendship ? [identity.email, args.otherUserEmail] : [identity.email];

    // Create new conversation
    const conversationId = await ctx.db.insert('conversations', {
      user1Email: identity.email,
      user2Email: args.otherUserEmail,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      acceptedBy,
    })

    return conversationId
  },
})

// Get all messages for a conversation
export const getMessagesForConversation = query({
  args: {
    conversationId: v.id('conversations'),
    paginationOpts: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Verify user is part of the conversation
    if (
      conversation.user1Email !== identity.email &&
      conversation.user2Email !== identity.email
    ) {
      throw new Error('Unauthorized')
    }

    const results = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .order('desc')
      .paginate(args.paginationOpts)

    // Determine the last-read timestamp for the OTHER user in this conversation
    const isUser1 = conversation.user1Email === identity.email
    const otherUserLastReadAt = isUser1
      ? (conversation.user2LastReadAt ?? 0)
      : (conversation.user1LastReadAt ?? 0)

    // Map messages and fetch reply data
    const page = await Promise.all(
      results.page.map(async (m) => {
        let replyToMessage = null
        if (m.replyToId) {
          const repliedMsg = await ctx.db.get(m.replyToId)
          if (repliedMsg && !repliedMsg.isDeleted) {
            replyToMessage = {
              _id: repliedMsg._id,
              body: repliedMsg.body,
              images: repliedMsg.images,
              senderEmail: repliedMsg.senderEmail,
            }
          }
        }

        return {
          _id: m._id,
          conversationId: m.conversationId,
          senderEmail: m.senderEmail,
          body: m.body,
          images: m.images ?? undefined,
          createdAt: m._creationTime,
          isEdited: m.isEdited ?? false,
          isDeleted: m.isDeleted ?? false,
          replyTo: replyToMessage,
          // Mark whether this message (sent by the current user) has been read by the other user
          readByOther:
            // Only messages authored by the current user can be "read by the other"
            (m.senderEmail === identity.email) && (m._creationTime <= otherUserLastReadAt),
          reactions: m.reactions ?? [],
          isPinned: m.isPinned ?? false,
        }
      })
    )

    return {
      ...results,
      page: page // Return all messages, including deleted ones
    }
  },
})

// Edit a message
export const editMessage = mutation({
  args: {
    messageId: v.id('messages'),
    newBody: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new Error('Message not found')
    }

    // Verify user is the sender
    if (message.senderEmail !== identity.email) {
      throw new Error('Unauthorized')
    }

    // Update message and store original body if first edit
    await ctx.db.patch(args.messageId, {
      body: args.newBody,
      isEdited: true,
      originalBody: message.isEdited ? message.originalBody : message.body,
    })
  },
})

// Unsend a message (delete for both users)
export const unsendMessage = mutation({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new Error('Message not found')
    }

    // Verify user is the sender
    if (message.senderEmail !== identity.email) {
      throw new Error('Unauthorized')
    }

    // Archive message (mark as deleted) instead of actually deleting
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
    })
  },
})

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    body: v.string(),
    images: v.optional(v.array(v.string())),
    replyToId: v.optional(v.id('messages')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Verify user is part of the conversation
    if (
      conversation.user1Email !== identity.email &&
      conversation.user2Email !== identity.email
    ) {
      throw new Error('Unauthorized')
    }

    // Insert message
    const messageId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      senderEmail: identity.email,
      body: args.body,
      images: args.images ?? undefined,
      createdAt: Date.now(),
      replyToId: args.replyToId,
    })

    // Update conversation's last message time
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    })

    // Check if we need to send a message request notification
    const recipientEmail = conversation.user1Email === identity.email ? conversation.user2Email : conversation.user1Email;

    // Check if they are friends
    const friendship = await ctx.db
      .query('friendships')
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'accepted'),
          q.or(
            q.and(q.eq(q.field('user1Email'), identity.email), q.eq(q.field('user2Email'), recipientEmail)),
            q.and(q.eq(q.field('user1Email'), recipientEmail), q.eq(q.field('user2Email'), identity.email))
          )
        )
      )
      .first();

    if (!friendship) {
      // Check if there is already a pending message request notification
      const existingNotification = await ctx.db
        .query('notifications')
        .filter((q) =>
          q.and(
            q.eq(q.field('recipientEmail'), recipientEmail),
            q.eq(q.field('senderEmail'), identity.email),
            q.eq(q.field('type'), 'message_request')
          )
        )
        .first();

      if (!existingNotification) {
        await ctx.db.insert('notifications', {
          recipientEmail,
          senderEmail: identity.email,
          type: 'message_request',
          message: 'sent you a message request',
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    return messageId
  },
})

// Get all conversations for current user with last message
export const getConversationsForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null || !identity.email) {
      throw new Error('Not authenticated')
    }

    const conversations = await ctx.db
      .query('conversations')
      .filter((q) =>
        q.or(
          q.eq(q.field('user1Email'), identity.email),
          q.eq(q.field('user2Email'), identity.email)
        )
      )
      .order('desc')
      .collect()

    // Sort and limit to 50 most recent
    const recentConversations = conversations
      .sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt))
      .slice(0, 50)

    const allUsers = await ctx.db.query('users').collect()
    const allMessages = await ctx.db.query('messages').collect()

    return recentConversations.map((conv) => {
      const isUser1 = conv.user1Email === identity.email
      const otherUserEmail = isUser1 ? conv.user2Email : conv.user1Email
      const otherUser = allUsers.find((u: any) => u.email === otherUserEmail)

      // Get last message for this conversation
      const convMessages = allMessages
        .filter((m: any) => m.conversationId === conv._id)
        .sort((a, b) => b._creationTime - a._creationTime)
      const lastMessage = convMessages[0]

      // Calculate unread count - messages sent by other user after my last read
      const lastReadAt = isUser1 ? (conv.user1LastReadAt ?? 0) : (conv.user2LastReadAt ?? 0)
      const unreadCount = convMessages.filter(
        (m: any) => m.senderEmail === otherUserEmail && m._creationTime > lastReadAt && !m.isDeleted
      ).length

      // Check if user is online (active within last 5 minutes)
      const isOnline = otherUser?.lastActive ? (Date.now() - otherUser.lastActive) < 5 * 60 * 1000 : false

      let lastMessagePreview = 'No messages yet'
      if (lastMessage) {
        if (lastMessage.isDeleted) {
          lastMessagePreview = lastMessage.senderEmail === identity.email ? 'You unsent a message' : 'Message unsent'
        } else if (lastMessage.images && lastMessage.images.length > 0) {
          lastMessagePreview = 'Sent an image'
        } else {
          lastMessagePreview = lastMessage.body
        }
      }

      return {
        _id: conv._id,
        otherUserEmail,
        otherUserName: otherUser?.fullName ?? otherUser?.firstName ?? otherUserEmail,
        otherUserAvatar: otherUser?.avatarUrl ?? null,
        lastMessage: lastMessagePreview,
        lastMessageAt: conv.lastMessageAt ?? conv.createdAt,
        unreadCount,
        isOnline,
      }
    })
  },
})

// Set typing indicator
export const setTyping = mutation({
  args: {
    conversationId: v.id('conversations'),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null || !identity.email) {
      throw new Error('Not authenticated')
    }

    // Check if typing indicator already exists
    const existing = await ctx.db
      .query('typingIndicators')
      .filter((q) =>
        q.and(
          q.eq(q.field('conversationId'), args.conversationId),
          q.eq(q.field('userEmail'), identity.email)
        )
      )
      .first()

    if (existing) {
      if (args.isTyping) {
        // Update timestamp
        await ctx.db.patch(existing._id, {
          updatedAt: Date.now(),
        })
      } else {
        // Remove typing indicator
        await ctx.db.delete(existing._id)
      }
    } else if (args.isTyping) {
      // Create new typing indicator
      await ctx.db.insert('typingIndicators', {
        conversationId: args.conversationId,
        userEmail: identity.email,
        updatedAt: Date.now(),
      })
    }
  },
})

// Mark conversation as read
export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null || !identity.email) {
      throw new Error('Not authenticated')
    }

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Verify user is part of the conversation
    if (
      conversation.user1Email !== identity.email &&
      conversation.user2Email !== identity.email
    ) {
      throw new Error('Unauthorized')
    }

    // Update last read timestamp for current user
    const isUser1 = conversation.user1Email === identity.email
    await ctx.db.patch(args.conversationId, {
      [isUser1 ? 'user1LastReadAt' : 'user2LastReadAt']: Date.now(),
    })
  },
})

// Check if other user is typing
export const isOtherUserTyping = query({
  args: {
    conversationId: v.id('conversations'),
    otherUserEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    // Get typing indicator for the other user
    const typingIndicator = await ctx.db
      .query('typingIndicators')
      .filter((q) =>
        q.and(
          q.eq(q.field('conversationId'), args.conversationId),
          q.eq(q.field('userEmail'), args.otherUserEmail)
        )
      )
      .first()

    if (!typingIndicator) {
      return false
    }

    // Check if typing indicator is recent (within last 3 seconds)
    const isRecent = Date.now() - typingIndicator.updatedAt < 3000
    return isRecent
  },
})

// Legacy query for compatibility
export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }
    return await ctx.db
      .query('messages')
      .filter((q) => q.eq(q.field('author'), identity.email))
      .collect()
  },
})

export const getPinnedMessages = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Verify user is part of the conversation
    if (
      conversation.user1Email !== identity.email &&
      conversation.user2Email !== identity.email
    ) {
      throw new Error('Unauthorized')
    }

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .filter((q) => q.eq(q.field('isPinned'), true))
      .order('desc')
      .collect()

    return messages.filter(m => !m.isDeleted)
  },
})

export const toggleReaction = mutation({
  args: {
    messageId: v.id('messages'),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new Error('Message not found')
    }

    const reactions = message.reactions ?? []
    const existingReactionIndex = reactions.findIndex(
      (r: any) => r.userEmail === identity.email && r.emoji === args.emoji
    )

    if (existingReactionIndex !== -1) {
      // Remove reaction
      reactions.splice(existingReactionIndex, 1)
    } else {
      // Add reaction
      reactions.push({
        userEmail: identity.email!,
        emoji: args.emoji,
      })
    }

    await ctx.db.patch(args.messageId, { reactions })
  },
})

export const togglePin = mutation({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new Error('Message not found')
    }

    // Verify user is part of the conversation
    const conversation = await ctx.db.get(message.conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }
    if (
      conversation.user1Email !== identity.email &&
      conversation.user2Email !== identity.email
    ) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(args.messageId, { isPinned: !message.isPinned })
  },
})

export const acceptConversation = mutation({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null || !identity.email) {
      throw new Error('Not authenticated')
    }

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    if (
      conversation.user1Email !== identity.email &&
      conversation.user2Email !== identity.email
    ) {
      throw new Error('Unauthorized')
    }

    const acceptedBy = conversation.acceptedBy || [];
    if (!acceptedBy.includes(identity.email)) {
      await ctx.db.patch(args.conversationId, {
        acceptedBy: [...acceptedBy, identity.email],
      })
    }
  },
})

export const getConversation = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      return null
    }

    if (
      conversation.user1Email !== identity.email &&
      conversation.user2Email !== identity.email
    ) {
      throw new Error('Unauthorized')
    }

    // Determine other user
    const otherUserEmail =
      conversation.user1Email === identity.email
        ? conversation.user2Email
        : conversation.user1Email

    const otherUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', otherUserEmail))
      .first()

    return {
      ...conversation,
      otherUserEmail,
      otherUserName: otherUser?.fullName ?? otherUser?.firstName ?? otherUserEmail,
      otherUserAvatar: otherUser?.avatarUrl ?? null,
      otherUserLastActive: otherUser?.lastActive ?? null,
    }
  },
})

export const reportMessage = mutation({
  args: {
    messageId: v.id('messages'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    await ctx.db.insert('reports', {
      messageId: args.messageId,
      reporterEmail: identity.email!,
      reason: args.reason,
      createdAt: Date.now(),
    })
  },
})