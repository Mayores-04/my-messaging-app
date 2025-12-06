"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";

export default function MessagesPage() {
  const messages = useQuery(api.messages.getForCurrentUser);
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    storeUser()
      .then(() => console.log("User stored in messages page"))
      .catch((err) => console.error("Failed to store user:", err));
  }, [storeUser]);

  return (
    <div className="flex gap-6 max-w-7xl mx-auto w-full">
      <aside className="w-80">
        <AllUsers />
      </aside>

      <section className="flex-1">
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
                  <p className="text-white">
                    {message.body ?? JSON.stringify(message)}
                  </p>
                  <span className="text-xs text-[#b8aa9d] mt-2 block">
                    {new Date(message._creationTime).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AllUsers() {
  const friends = useQuery(api.friends.getFriendsForCurrentUser);

  if (friends === undefined) {
    return <div className="text-[#b8aa9d]">Loading friends...</div>;
  }

  if (friends.length === 0) {
    return (
      <div className="w-full bg-[#26211c] border border-[#53473c] rounded-lg p-4 text-center">
        <p className="text-[#b8aa9d]">No friends yet</p>
        <p className="text-[#b8aa9d] text-xs mt-2">Add friends to start messaging</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#26211c] border border-[#53473c] rounded-lg p-3">
      <div className="mb-3">
        <input
          placeholder="Search conversations..."
          className="w-full bg-[#211811] placeholder-[#b8aa9d] text-white rounded-md px-3 py-2 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        {friends.map((u: any) => (
          <div
            key={u._id}
            className="flex items-center gap-3 p-3 bg-[#211811] rounded-lg hover:bg-[#2d2520] cursor-pointer transition-colors border border-[#53473c]"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#53473c] flex items-center justify-center text-white font-semibold">
              {u.avatarUrl ? (
                <Image
                  src={u.avatarUrl}
                  alt={u.fullName ?? "user"}
                  width={48}
                  height={48}
                />
              ) : (
                <span className="text-sm">
                  {(u.firstName || u.fullName || "?")[0]}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium text-sm truncate">
                  {u.fullName ?? u.email}
                </p>
                <span className="text-xs text-[#b8aa9d]">
                  {u.lastActive
                    ? new Date(u.lastActive).toLocaleTimeString()
                    : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[#b8aa9d] text-xs truncate">
                  {u.lastMessage ?? "No recent message"}
                </p>
                {u.unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center bg-[#e67919] text-black rounded-full px-2 text-xs">
                    {u.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
