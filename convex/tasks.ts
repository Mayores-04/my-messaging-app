import { mutation, query } from "./_generated/server";

export const getActiveTasks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("archived"), false))
      .collect();
  },
});

export const getAllTasks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  }
})

export const create = mutation({
  handler: async (ctx, args: any) => {
    const taskTitle = args.taskTitle;
    const taskDescription = args.taskDescription;
    await ctx.db.insert("tasks", {
      title: taskTitle,
      description: taskDescription,
      archived: false,
    });
  }
});

export const archive = mutation({
  handler: async (ctx, args: any) => {
    const taskId = args.taskId;
    await ctx.db.patch(taskId, { archived: true});
  }
})