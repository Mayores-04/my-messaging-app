import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    fullName: v.optional(v.string()),
    firstName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    lastActive: v.optional(v.number()),
  }).index("by_email", ["email"]),

  friendships: defineTable({
    user1Email: v.string(),
    user2Email: v.string(),
    status: v.optional(v.union(v.literal("pending"), v.literal("accepted"))),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_user1", ["user1Email"])
    .index("by_user2", ["user2Email"])
    .index("by_status", ["status"]),

  notifications: defineTable({
    recipientEmail: v.string(),
    senderEmail: v.string(),
    type: v.string(),
    message: v.string(),
    read: v.boolean(),
    friendshipId: v.optional(v.id("friendships")),
    senderName: v.optional(v.string()),
    senderAvatar: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }).index("by_recipient", ["recipientEmail"]),

  conversations: defineTable({
    user1Email: v.string(),
    user2Email: v.string(),
    createdAt: v.number(),
    lastMessageAt: v.number(),
    user1LastReadAt: v.optional(v.number()),
    user2LastReadAt: v.optional(v.number()),
  })
    .index("by_user1", ["user1Email"])
    .index("by_user2", ["user2Email"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderEmail: v.string(),
    body: v.string(),
    createdAt: v.optional(v.number()),
    author: v.optional(v.string()),
    read: v.optional(v.boolean()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderEmail"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userEmail: v.string(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userEmail"])
    .index("by_conversation_and_user", ["conversationId", "userEmail"]),
});
