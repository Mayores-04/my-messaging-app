import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Get all friends for the current user
export const getFriendsForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    // Get all friendships where current user is either user1 or user2
    const friendships = await ctx.db
      .query('friendships')
      .filter((q) =>
        q.or(
          q.eq(q.field('user1Email'), identity.email),
          q.eq(q.field('user2Email'), identity.email)
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

// Add a friend (creates a friendship between two users)
export const addFriend = mutation({
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
      throw new Error('Cannot add yourself as a friend')
    }

    // Check if friendship already exists
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
      throw new Error('Friendship already exists')
    }

    // Create the friendship
    await ctx.db.insert('friendships', {
      user1Email: identity.email,
      user2Email: args.friendEmail,
      createdAt: Date.now(),
    })

    return { success: true }
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
