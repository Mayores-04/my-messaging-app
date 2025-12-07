"use client";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { ArrowLeft, MenuIcon, PhoneCall, Send, VideoIcon } from "lucide-react";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Button } from "../ui/button";
import Image from "next/image";

export default function ConversationView({ conversation, onBack }: any) {
  const messages = useQuery(api.messages.getMessagesForConversation, {
    conversationId: conversation._id,
  });
  const isTyping = useQuery(api.messages.isOtherUserTyping, {
    conversationId: conversation._id,
    otherUserEmail: conversation.otherUserEmail,
  });
  const userStatus = useQuery(api.users.getUserOnlineStatus, {
    userEmail: conversation.otherUserEmail,
  });
  const sendMessage = useMutation(api.messages.sendMessage);
  const setTypingStatus = useMutation(api.messages.setTyping);
  const markAsRead = useMutation(api.messages.markConversationAsRead);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);

  // Scroll to bottom immediately when messages load - use useLayoutEffect to avoid flash
  useLayoutEffect(() => {
    if (messages && messages.length > 0 && messagesContainerRef.current) {
      if (isInitialLoadRef.current) {
        // Instant scroll to bottom on initial load, before paint
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
        isInitialLoadRef.current = false;
      }
    }
  }, [messages]);

  // Smooth scroll for new messages after initial load
  useEffect(() => {
    if (
      messages &&
      messages.length > 0 &&
      !isInitialLoadRef.current &&
      messagesContainerRef.current
    ) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages?.length]);

  // Reset initial load flag when conversation changes
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [conversation._id]);

  // Mark messages as read when conversation opens or new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      markAsRead({ conversationId: conversation._id });
    }
  }, [messages, conversation._id, markAsRead]);

  const handleTyping = (text: string) => {
    setMessageText(text);

    // Set typing to true
    setTypingStatus({
      conversationId: conversation._id,
      isTyping: true,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to false after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus({
        conversationId: conversation._id,
        isTyping: false,
      });
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    // Clear typing indicator immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTypingStatus({
      conversationId: conversation._id,
      isTyping: false,
    });

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTypingStatus({
        conversationId: conversation._id,
        isTyping: false,
      });
    };
  }, [conversation._id, setTypingStatus]);

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#53473c] bg-[#181411]">
        <div className="flex flex-row w-full gap-3 items-center ">
          <Button
            onClick={onBack}
            className="md:hidden text-white hover:text-[#e67919]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#181411] flex items-center justify-center text-white font-semibold">
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
            <h2 className="text-white font-semibold">
              {conversation.otherUserName}
            </h2>
            <p className="text-[#b8aa9d] text-xs">
              {isTyping
                ? "typing..."
                : userStatus?.isOnline
                  ? "Active now"
                  : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex flex-row">
          <PhoneCall className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer" />
          <VideoIcon className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer ml-4" />
          <MenuIcon className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer ml-4" />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
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

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#26211c] border border-[#53473c] rounded-lg px-4 py-3">
              <div className="flex gap-1 items-end h-6">
                <span className="w-2.5 h-2.5 bg-[#b8aa9d] rounded-full typing-dot-1"></span>
                <span className="w-2.5 h-2.5 bg-[#b8aa9d] rounded-full typing-dot-2"></span>
                <span className="w-2.5 h-2.5 bg-[#b8aa9d] rounded-full typing-dot-3"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Message*/}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-[#53473c] bg-[#181411]"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => handleTyping(e.target.value)}
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
