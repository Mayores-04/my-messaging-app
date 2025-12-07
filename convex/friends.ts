import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Get all friends for the current user (accepted friendships only)
export const getFriendsForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    // Get all accepted friendships where current user is either user1 or user2
    const friendships = await ctx.db
      .query('friendships')
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'accepted'),
          q.or(
            q.eq(q.field('user1Email'), identity.email),
            q.eq(q.field('user2Email'), identity.email)
          )
        )
      )
      .collect()

    // Extract friend emails (the other person in each friendship)
    const friendEmails = friendships.map((f) =>
      f.user1Email === identity.email ? f.user2Email : f.user1Email
    )

    // Get user profiles for all friends
    const allUsers = await ctx.db.query('users').collect()
    const friends = allUsers.filter((u: any) => friendEmails.includes(u.email))

    return friends.map((u: any) => ({
      _id: u._id,
      fullName: u.fullName ?? null,
      firstName: u.firstName ?? null,
      email: u.email ?? null,
      avatarUrl: u.avatarUrl ?? null,
      lastMessage: u.lastMessage ?? null,
      lastActive: u.lastActive ?? null,
      unreadCount: typeof u.unreadCount === 'number' ? u.unreadCount : 0,
    }))
  },
})

// Send a friend request
export const sendFriendRequest = mutation({
  args: {
    friendEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    // Don't allow friending yourself
    if (args.friendEmail === identity.email) {
      throw new Error('Cannot send friend request to yourself')
    }

    // Check if friendship or request already exists
    const existing = await ctx.db
      .query('friendships')
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field('user1Email'), identity.email),
            q.eq(q.field('user2Email'), args.friendEmail)
          ),
          q.and(
            q.eq(q.field('user1Email'), args.friendEmail),
            q.eq(q.field('user2Email'), identity.email)
          )
        )
      )
      .first()

    if (existing) {
      if (existing.status === 'accepted') {
        throw new Error('Already friends')
      } else if (existing.status === 'pending') {
        throw new Error('Friend request already sent')
      }
    }

    // Create the friend request
    const requestId = await ctx.db.insert('friendships', {
      user1Email: identity.email, // sender
      user2Email: args.friendEmail, // receiver
      status: 'pending',
      createdAt: Date.now(),
    })

    // Create notification for the receiver
    await ctx.db.insert('notifications', {
      recipientEmail: args.friendEmail,
      senderEmail: identity.email,
      senderName: identity.name ?? identity.email,
      senderAvatar: identity.pictureUrl ?? null,
      type: 'friend_request',
      message: `${identity.name ?? identity.email} sent you a friend request`,
      read: false,
      createdAt: Date.now(),
      friendshipId: requestId,
    })

    return { success: true, requestId }
  },
})

// Accept a friend request
export const acceptFriendRequest = mutation({
  args: {
    friendshipId: v.id('friendships'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const friendship = await ctx.db.get(args.friendshipId)
    if (!friendship) {
      throw new Error('Friend request not found')
    }

    // Verify the current user is the receiver
    if (friendship.user2Email !== identity.email) {
      throw new Error('Unauthorized to accept this request')
    }

    if (friendship.status !== 'pending') {
      throw new Error('Friend request is not pending')
    }

    // Update status to accepted
    await ctx.db.patch(args.friendshipId, {
      status: 'accepted',
      acceptedAt: Date.now(),
    })

    // Create notification for the sender
    await ctx.db.insert('notifications', {
      recipientEmail: friendship.user1Email,
      senderEmail: identity.email,
      senderName: identity.name ?? identity.email,
      senderAvatar: identity.pictureUrl ?? null,
      type: 'friend_accepted',
      message: `${identity.name ?? identity.email} accepted your friend request`,
      read: false,
      createdAt: Date.now(),
      friendshipId: args.friendshipId,
    })

    return { success: true }
  },
})

// Reject a friend request
export const rejectFriendRequest = mutation({
  args: {
    friendshipId: v.id('friendships'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const friendship = await ctx.db.get(args.friendshipId)
    if (!friendship) {
      throw new Error('Friend request not found')
    }

    // Verify the current user is the receiver
    if (friendship.user2Email !== identity.email) {
      throw new Error('Unauthorized to reject this request')
    }

    // Delete the friend request
    await ctx.db.delete(args.friendshipId)

    return { success: true }
  },
})

// Get pending friend requests for the current user
export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    // Get all pending requests where current user is the receiver
    const requests = await ctx.db
      .query('friendships')
      .filter((q) =>
        q.and(
          q.eq(q.field('user2Email'), identity.email),
          q.eq(q.field('status'), 'pending')
        )
      )
      .collect()

    // Get sender info for each request
    const allUsers = await ctx.db.query('users').collect()
    
    return requests.map((req) => {
      const sender = allUsers.find((u: any) => u.email === req.user1Email)
      return {
        _id: req._id,
        senderEmail: req.user1Email,
        senderName: sender?.fullName ?? sender?.firstName ?? req.user1Email,
        senderAvatar: sender?.avatarUrl ?? null,
        createdAt: req.createdAt,
      }
    })
  },
})

// Get sent friend requests by the current user
export const getSentRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    // Get all pending requests where current user is the sender
    const requests = await ctx.db
      .query('friendships')
      .filter((q) =>
        q.and(
          q.eq(q.field('user1Email'), identity.email),
          q.eq(q.field('status'), 'pending')
        )
      )
      .collect()

    // Get receiver info for each request
    const allUsers = await ctx.db.query('users').collect()
    
    return requests.map((req) => {
      const receiver = allUsers.find((u: any) => u.email === req.user2Email)
      return {
        _id: req._id,
        receiverEmail: req.user2Email,
        receiverName: receiver?.fullName ?? receiver?.firstName ?? req.user2Email,
        receiverAvatar: receiver?.avatarUrl ?? null,
        createdAt: req.createdAt,
      }
    })
  },
})

// Remove a friend
export const removeFriend = mutation({
  args: {
    friendEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    // Find the friendship
    const friendship = await ctx.db
      .query('friendships')
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field('user1Email'), identity.email),
            q.eq(q.field('user2Email'), args.friendEmail)
          ),
          q.and(
            q.eq(q.field('user1Email'), args.friendEmail),
            q.eq(q.field('user2Email'), identity.email)
          )
        )
      )
      .first()

    if (!friendship) {
      throw new Error('Friendship not found')
    }

    // Delete the friendship
    await ctx.db.delete(friendship._id)

    return { success: true }
  },
})

// Check if there's a pending request or existing friendship
export const checkFriendshipStatus = query({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const friendship = await ctx.db
      .query('friendships')
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field('user1Email'), identity.email),
            q.eq(q.field('user2Email'), args.userEmail)
          ),
          q.and(
            q.eq(q.field('user1Email'), args.userEmail),
            q.eq(q.field('user2Email'), identity.email)
          )
        )
      )
      .first()

    if (!friendship) {
      return { status: 'none' }
    }

    return { 
      status: friendship.status,
      isSender: friendship.user1Email === identity.email,
    }
  },
})
