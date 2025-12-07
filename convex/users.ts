import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const getAllUsers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (identity === null) {
            throw new Error('Not authenticated')
        }

        const all = await ctx.db.query('users').collect()

        return all.map((u: any) => ({
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

export const searchUsers = query({
    args: {
        searchTerm: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (identity === null) {
            throw new Error('Not authenticated')
        }

        const all = await ctx.db.query('users').collect()
        
        // If no search term, return all users except current user
        if (!args.searchTerm || args.searchTerm.length < 2) {
            const filtered = all.filter((u: any) => u.email !== identity.email)
            return filtered.slice(0, 20).map((u: any) => ({
                _id: u._id,
                fullName: u.fullName ?? null,
                firstName: u.firstName ?? null,
                email: u.email ?? null,
                avatarUrl: u.avatarUrl ?? null,
            }))
        }

        const searchLower = args.searchTerm.toLowerCase()

        // Filter users by name or email, exclude current user
        const filtered = all.filter((u: any) => {
            if (u.email === identity.email) return false
            
            const fullName = (u.fullName ?? '').toLowerCase()
            const firstName = (u.firstName ?? '').toLowerCase()
            const email = (u.email ?? '').toLowerCase()
            
            return fullName.includes(searchLower) || 
                   firstName.includes(searchLower) || 
                   email.includes(searchLower)
        })

        return filtered.slice(0, 10).map((u: any) => ({
            _id: u._id,
            fullName: u.fullName ?? null,
            firstName: u.firstName ?? null,
            email: u.email ?? null,
            avatarUrl: u.avatarUrl ?? null,
        }))
    },
})

// Store or update current user in the database
export const storeUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (identity === null) {
            throw new Error('Not authenticated')
        }

        // Check if user already exists
        const existingUser = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), identity.email))
            .first()

        const userData = {
            email: identity.email!,
            fullName: identity.name ?? undefined,
            firstName: identity.givenName ?? undefined,
            avatarUrl: identity.pictureUrl ?? undefined,
            lastActive: Date.now(),
        }

        if (existingUser) {
            // Update existing user
            await ctx.db.patch(existingUser._id, userData)
            return existingUser._id
        } else {
            // Create new user
            const userId = await ctx.db.insert('users', userData)
            return userId
        }
    },
})

// Get user online status by email
export const getUserOnlineStatus = query({
    args: {
        userEmail: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), args.userEmail))
            .first()

        if (!user) {
            return { isOnline: false }
        }

        // Check if user is online (active within last 5 minutes)
        const isOnline = user.lastActive ? (Date.now() - user.lastActive) < 5 * 60 * 1000 : false
        
        return { isOnline }
    },
})

// Set user as offline (call when signing out)
export const setUserOffline = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (identity === null) {
            return // User already signed out
        }

        // Find user and set lastActive to 0 to mark as offline
        const existingUser = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), identity.email))
            .first()

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                lastActive: 0,
            })
        }
    },
})