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
    lastMessageBody: v.optional(v.string()), // Cache last message text
    user1LastReadAt: v.optional(v.number()),
    user2LastReadAt: v.optional(v.number()),
    user1UnreadCount: v.optional(v.number()), // Cache unread count for user1
    user2UnreadCount: v.optional(v.number()), // Cache unread count for user2
  })
    .index("by_user1", ["user1Email"])
    .index("by_user2", ["user2Email"])
    .index("by_lastMessageAt", ["lastMessageAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderEmail: v.string(),
    body: v.string(),
    images: v.optional(v.array(v.string())),
    createdAt: v.optional(v.number()),
    author: v.optional(v.string()),
    read: v.optional(v.boolean()),
    isEdited: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    originalBody: v.optional(v.string()),
    replyToId: v.optional(v.id("messages")),
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

  videoCallSignals: defineTable({
    conversationId: v.id("conversations"),
    fromEmail: v.string(),
    toEmail: v.string(),
    type: v.union(
      v.literal("offer"),
      v.literal("answer"),
      v.literal("candidate"),
      v.literal("call-request"),
      v.literal("call-accepted"),
      v.literal("call-rejected"),
      v.literal("call-ended")
    ),
    signal: v.optional(v.string()), // JSON stringified WebRTC signal data
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_recipient", ["toEmail"])
    .index("by_conversation_and_recipient", ["conversationId", "toEmail"]),
});
