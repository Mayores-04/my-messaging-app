"use client";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import VideoCallModal from "./VideoCallModal";
import ConversationHeader from "./ConversationHeader";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";
import IncomingCallNotification from "./IncomingCallNotification";
import { useVideoCall } from "@/hooks/useVideoCall";

export default function ConversationView({ conversation, onBack }: any) {
  const messages = useQuery(api.messages.getMessagesForConversation, {
    conversationId: conversation._id,
  });

  // Compute the latest message id that the other user has read (for read-receipt avatar)
  const lastReadMessageId = (() => {
    if (!messages || messages.length === 0) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].readByOther) return messages[i]._id;
    }
    return null;
  })();

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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);

  // Video call hook
  const {
    isVideoCallActive,
    isCallInitiator,
    showIncomingCall,
    handleStartVideoCall,
    handleAcceptCall,
    handleRejectCall,
    handleCloseVideoCall,
  } = useVideoCall(conversation);

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
      // Keep focus on the input so the user can continue typing
      try {
        // small delay to ensure React has updated the value
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            const len = inputRef.current.value.length;
            inputRef.current.setSelectionRange(len, len);
          }
        });
      } catch (focusErr) {
        // ignore focus errors
      }
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
      <ConversationHeader
        conversation={conversation}
        isTyping={isTyping}
        userStatus={userStatus}
        onBack={onBack}
        onVideoCall={handleStartVideoCall}
      />

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
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={isOwn}
                conversation={conversation}
                isLastRead={message._id === lastReadMessageId}
              />
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Input Message*/}
      <MessageInput
        messageText={messageText}
        sending={sending}
        inputRef={inputRef}
        onTyping={handleTyping}
        onSend={handleSend}
      />

      {/* Incoming Call Notification */}
      {showIncomingCall && (
        <IncomingCallNotification
          conversation={conversation}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Video Call Modal */}
      {isVideoCallActive && (
        <VideoCallModal
          conversation={conversation}
          onClose={handleCloseVideoCall}
          initiator={isCallInitiator}
        />
      )}
    </div>
  );
}
