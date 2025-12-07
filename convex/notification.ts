import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Get all notifications for the current user
export const getNotificationsForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const notifications = await ctx.db
      .query('notifications')
      .filter((q) => q.eq(q.field('recipientEmail'), identity.email))
      .order('desc')
      .collect()

    return notifications.map((n) => ({
      _id: n._id,
      type: n.type,
      message: n.message,
      senderEmail: n.senderEmail,
      senderName: n.senderName,
      senderAvatar: n.senderAvatar,
      read: n.read,
      createdAt: n.createdAt,
      friendshipId: n.friendshipId ?? null,
    }))
  },
})

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error('Notification not found')
    }

    if (notification.recipientEmail !== identity.email) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(args.notificationId, { read: true })
    return { success: true }
  },
})

// Get unread notification count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return 0
    }

    const notifications = await ctx.db
      .query('notifications')
      .filter((q) =>
        q.and(
          q.eq(q.field('recipientEmail'), identity.email),
          q.eq(q.field('read'), false)
        )
      )
      .collect()

    return notifications.length
  },
})