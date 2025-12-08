"use client";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import Image from "next/image";
import { useMemo, memo } from "react";

interface ConversationsListProps {
  onSelectConversation: (conversation: any) => void;
  selectedId?: string;
}

function ConversationsList({ onSelectConversation, selectedId }: ConversationsListProps) {
  const conversations = useQuery(api.messages.getConversationsForCurrentUser);
  const friends = useQuery(api.friends.getFriendsForCurrentUser);
  const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation);

  // Memoize friends without conversations to avoid recalculation
  const friendsWithoutConversations = useMemo(() => {
    if (!friends || !conversations) return [];
    return friends.filter((friend: any) => 
      !conversations.some((conv: any) => conv.otherUserEmail === friend.email)
    );
  }, [friends, conversations]);

  const handleSelectFriend = async (friend: any) => {
    try {
      const conversationId = await getOrCreateConversation({ 
        otherUserEmail: friend.email 
      });
      onSelectConversation({
        _id: conversationId,
        otherUserEmail: friend.email,
        otherUserName: friend.fullName ?? friend.firstName,
        otherUserAvatar: friend.avatarUrl,
      });
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  if (conversations === undefined) {
    return <div className="text-[#b8aa9d]">Loading conversations...</div>;
  }

  if (conversations.length === 0 && friends?.length === 0) {
    return (
      <div className="w-full bg-[#26211c] border border-[#53473c] rounded-lg p-4 text-center">
        <p className="text-[#b8aa9d]">No friends yet</p>
        <p className="text-[#b8aa9d] text-xs mt-2">Add friends to start messaging</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col rounded-lg">
      <h1 className="text-3xl font-bold text-white mb-4">Messages</h1>
      <div className="mb-3">
        <input
          placeholder="Search conversations..."
          className="w-full bg-[#211811] placeholder-[#b8aa9d] text-white rounded-md px-3 py-2 focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {/* Show existing conversations */}
        {conversations.map((conv: any) => (
          <div
            key={conv._id}
            onClick={() => onSelectConversation(conv)}
            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[#2d2520] cursor-pointer transition-colors border-2 ${
              selectedId === conv._id 
                ? 'bg-[#2d2520] border-transparent' 
                : conv.unreadCount > 0
                  ? 'bg-[#211811] border-[#e67919]'
                  : 'bg-[#181411] border-transparent'
            }`}
          >
            <div className="relative w-12 h-12">
              <div className="rounded-full overflow-hidden bg-[#53473c] flex items-center justify-center text-white font-semibold">
                {conv.otherUserAvatar ? (
                  <Image
                    src={conv.otherUserAvatar}
                    alt={conv.otherUserName}
                    width={48}
                    height={48}
                    quality={75}
                    loading="lazy"
                  />
                ) : (
                  <span className="text-sm">{conv.otherUserName[0]}</span>
                )}
              </div>
              {/* Online indicator - green dot when user is active */}
              {conv.isOnline && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#181411]"></span>
              )}
            </div>

            <div className="relative  w-full flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`font-medium text-sm truncate ${conv.unreadCount > 0 ? 'text-white font-bold' : 'text-white'}`}>
                  {conv.otherUserName}
                </p>
                <div className="flex flex-col items-end absolute right-0 top-0">
                  <span className="text-xs text-[#b8aa9d]">
                    {new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center bg-[#e67919] text-white rounded-full w-5 h-5 text-xs font-bold mt-2">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-white font-semibold' : 'text-[#b8aa9d]'}`}>
                  {conv.lastMessage}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Show friends without conversations */}
        {friendsWithoutConversations.map((friend: any) => (
          <div
            key={friend._id}
            onClick={() => handleSelectFriend(friend)}
            className="flex items-center gap-3 p-3 bg-[#211811] rounded-lg hover:bg-[#2d2520] cursor-pointer transition-colors border border-[#53473c]"
          >
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#53473c] flex items-center justify-center text-white font-semibold">
                {friend.avatarUrl ? (
                  <Image
                    src={friend.avatarUrl}
                    alt={friend.fullName ?? "user"}
                    width={48}
                    height={48}
                    quality={75}
                    loading="lazy"
                  />
                ) : (
                  <span className="text-sm">
                    {(friend.firstName || friend.fullName || "?")[0]}
                  </span>
                )}
              </div>
              {/* Online indicator - green dot when user is active */}
              {friend.isOnline && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#181411]"></span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {friend.fullName ?? friend.email}
              </p>
              <p className="text-[#b8aa9d] text-xs">Start a conversation</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ConversationsList);
