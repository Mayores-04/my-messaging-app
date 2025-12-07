import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a video call signal (offer, answer, ICE candidate, etc.)
export const sendSignal = mutation({
  args: {
    conversationId: v.id("conversations"),
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
    signal: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.insert("videoCallSignals", {
      conversationId: args.conversationId,
      fromEmail: identity.email!,
      toEmail: args.toEmail,
      type: args.type,
      signal: args.signal,
      createdAt: Date.now(),
    });
  },
});

// Get pending signals for the current user
export const getPendingSignals = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const signals = await ctx.db
      .query("videoCallSignals")
      .withIndex("by_conversation_and_recipient", (q) =>
        q.eq("conversationId", args.conversationId).eq("toEmail", identity.email!)
      )
      .order("desc")
      .take(50);

    return signals;
  },
});

// Clear old signals after processing
export const clearSignal = mutation({
  args: {
    signalId: v.id("videoCallSignals"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.signalId);
  },
});

// Clear all signals for a conversation (when call ends)
export const clearConversationSignals = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const signals = await ctx.db
      .query("videoCallSignals")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const signal of signals) {
      await ctx.db.delete(signal._id);
    }
  },
});
