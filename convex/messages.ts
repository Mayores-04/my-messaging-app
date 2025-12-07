import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Get or create a conversation between two users
export const getOrCreateConversation = mutation({
  args: {
    otherUserEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
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

    // Create new conversation
    const conversationId = await ctx.db.insert('conversations', {
      user1Email: identity.email,
      user2Email: args.otherUserEmail,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    })

    return conversationId
  },
})

// Get all messages for a conversation
export const getMessagesForConversation = query({
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
      .filter((q) => q.eq(q.field('conversationId'), args.conversationId))
      .order('asc')
      .collect()

    return messages.map((m) => ({
      _id: m._id,
      conversationId: m.conversationId,
      senderEmail: m.senderEmail,
      body: m.body,
      createdAt: m._creationTime,
    }))
  },
})

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    body: v.string(),
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
    })

    // Update conversation's last message time
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    })

    return messageId
  },
})

// Get all conversations for current user with last message
export const getConversationsForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
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

    const allUsers = await ctx.db.query('users').collect()
    const allMessages = await ctx.db.query('messages').collect()

    return conversations.map((conv) => {
      const otherUserEmail =
        conv.user1Email === identity.email ? conv.user2Email : conv.user1Email
      const otherUser = allUsers.find((u: any) => u.email === otherUserEmail)

      // Get last message for this conversation
      const convMessages = allMessages
        .filter((m: any) => m.conversationId === conv._id)
        .sort((a, b) => b._creationTime - a._creationTime)
      const lastMessage = convMessages[0]

      return {
        _id: conv._id,
        otherUserEmail,
        otherUserName: otherUser?.fullName ?? otherUser?.firstName ?? otherUserEmail,
        otherUserAvatar: otherUser?.avatarUrl ?? null,
        lastMessage: lastMessage?.body ?? 'No messages yet',
        lastMessageAt: conv.lastMessageAt ?? conv.createdAt,
        unreadCount: 0, // TODO: implement unread count
      }
    })
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