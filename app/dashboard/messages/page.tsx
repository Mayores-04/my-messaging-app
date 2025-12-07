"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";
import { Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const storeUser = useMutation(api.users.storeUser);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  useEffect(() => {
    storeUser()
      .then(() => console.log("User stored in messages page"))
      .catch((err) => console.error("Failed to store user:", err));
  }, [storeUser]);

  return (
    <div className="flex gap-0 w-full h-screen">
      {/* Conversations Sidebar */}
      <aside className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-80 bg-[#181411] border-[#53473c] border-r-2 p-5 overflow-y-auto h-full`}>
        <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>
        <ConversationsList 
          onSelectConversation={setSelectedConversation}
          selectedId={selectedConversation?._id}
        />
      </aside>

      {/* Conversation View */}
      <section className={`${selectedConversation ? 'block' : 'hidden md:block'} flex-1 flex flex-col bg-[#211811]`}>
        {selectedConversation ? (
          <ConversationView 
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#b8aa9d]">
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ConversationsList({ onSelectConversation, selectedId }: any) {
  const conversations = useQuery(api.messages.getConversationsForCurrentUser);
  const friends = useQuery(api.friends.getFriendsForCurrentUser);
  const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation);

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
    <div className="w-full rounded-lg">
      <div className="mb-3">
        <input
          placeholder="Search conversations..."
          className="w-full bg-[#211811] placeholder-[#b8aa9d] text-white rounded-md px-3 py-2 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        {/* Show existing conversations */}
        {conversations.map((conv: any) => (
          <div
            key={conv._id}
            onClick={() => onSelectConversation(conv)}
            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[#2d2520] cursor-pointer transition-colors border ${
              selectedId === conv._id ? 'bg-[#2d2520] border-[#e67919]' : 'bg-[#211811] border-[#53473c]'
            }`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#53473c] flex items-center justify-center text-white font-semibold">
              {conv.otherUserAvatar ? (
                <Image
                  src={conv.otherUserAvatar}
                  alt={conv.otherUserName}
                  width={48}
                  height={48}
                />
              ) : (
                <span className="text-sm">{conv.otherUserName[0]}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium text-sm truncate">
                  {conv.otherUserName}
                </p>
                <span className="text-xs text-[#b8aa9d]">
                  {new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[#b8aa9d] text-xs truncate">
                  {conv.lastMessage}
                </p>
                {conv.unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center bg-[#e67919] text-black rounded-full px-2 text-xs">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Show friends without conversations */}
        {friends?.filter((friend: any) => 
          !conversations.some((conv: any) => conv.otherUserEmail === friend.email)
        ).map((friend: any) => (
          <div
            key={friend._id}
            onClick={() => handleSelectFriend(friend)}
            className="flex items-center gap-3 p-3 bg-[#211811] rounded-lg hover:bg-[#2d2520] cursor-pointer transition-colors border border-[#53473c]"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#53473c] flex items-center justify-center text-white font-semibold">
              {friend.avatarUrl ? (
                <Image
                  src={friend.avatarUrl}
                  alt={friend.fullName ?? "user"}
                  width={48}
                  height={48}
                />
              ) : (
                <span className="text-sm">
                  {(friend.firstName || friend.fullName || "?")[0]}
                </span>
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

function ConversationView({ conversation, onBack }: any) {
  const messages = useQuery(api.messages.getMessagesForConversation, {
    conversationId: conversation._id,
  });
  const sendMessage = useMutation(api.messages.sendMessage);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage({
        conversationId: conversation._id,
        body: messageText.trim(),
      });
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#53473c] bg-[#181411]">
        <Button
          onClick={onBack}
          className="md:hidden text-white hover:text-[#e67919]"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#53473c] flex items-center justify-center text-white font-semibold">
          {conversation.otherUserAvatar ? (
            <Image
              src={conversation.otherUserAvatar}
              alt={conversation.otherUserName}
              width={40}
              height={40}
            />
          ) : (
            <span className="text-sm">{conversation.otherUserName[0]}</span>
          )}
        </div>
        <div>
          <h2 className="text-white font-semibold">{conversation.otherUserName}</h2>
          <p className="text-[#b8aa9d] text-xs">Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages === undefined ? (
          <div className="text-[#b8aa9d] text-center">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-[#b8aa9d] text-center">
            No messages yet. Send the first message!
          </div>
        ) : (
          messages.map((message: any) => {
            const isOwn = message.senderEmail !== conversation.otherUserEmail;
            return (
              <div
                key={message._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? "bg-[#e67919] text-white"
                      : "bg-[#26211c] text-white border border-[#53473c]"
                  }`}
                >
                  <p className="wrap-break-word">{message.body}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      isOwn ? "text-[#211811]" : "text-[#b8aa9d]"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-[#53473c] bg-[#181411]">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-[#211811] text-white placeholder-[#b8aa9d] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#e67919]"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="bg-[#e67919] hover:bg-[#cf6213] disabled:bg-[#53473c] text-white rounded-lg px-4 py-2 transition-colors"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
