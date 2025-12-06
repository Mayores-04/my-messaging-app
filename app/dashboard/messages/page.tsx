"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function MessagesPage() {
  const messages = useQuery(api.messages.getForCurrentUser);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>
      
      <div className="bg-[#26211c] border border-[#53473c] rounded-lg p-6">
        {messages === undefined ? (
          <div className="text-[#b8aa9d]">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-[#b8aa9d]">No messages yet.</div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: any) => (
              <div
                key={message._id}
                className="bg-[#211811] border border-[#53473c] rounded-lg p-4"
              >
                <p className="text-white">{message.body ?? JSON.stringify(message)}</p>
                <span className="text-xs text-[#b8aa9d] mt-2 block">
                  {new Date(message._creationTime).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
