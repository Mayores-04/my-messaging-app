"use client";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense, useMemo } from "react";
import ConversationHeader from "./ConversationHeader";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";
import { useVideoCall } from "@/hooks/useVideoCall";

// Lazy load heavy components
const VideoCallModal = lazy(() => import("./VideoCallModal"));
const IncomingCallNotification = lazy(() => import("./IncomingCallNotification"));

export default function ConversationView({ conversation, onBack }: any) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.getMessagesForConversation,
    { conversationId: conversation._id },
    { initialNumItems: 20 }
  );

  const messages = useMemo(() => (results ? [...results].reverse() : []), [results]);

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
  const [images, setImages] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<any>(null);

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

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const previousScrollHeightRef = useRef(0);
  const lastMessageIdRef = useRef<string | null>(null);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight } = messagesContainerRef.current;
    
    if (scrollTop < 100 && status === "CanLoadMore" && !isLoadingMore) {
        setIsLoadingMore(true);
        previousScrollHeightRef.current = scrollHeight;
        loadMore(20);
    }
  };

  // Scroll management
  useLayoutEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0) return;

    if (isInitialLoadRef.current) {
        // Instant scroll to bottom on initial load
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        isInitialLoadRef.current = false;
        lastMessageIdRef.current = messages[messages.length - 1]._id;
    } else if (isLoadingMore) {
        // Maintain scroll position after loading more
        const newScrollHeight = messagesContainerRef.current.scrollHeight;
        const diff = newScrollHeight - previousScrollHeightRef.current;
        if (diff > 0) {
            messagesContainerRef.current.scrollTop = diff;
        }
        setIsLoadingMore(false);
    }
  }, [messages, isLoadingMore]);

  // Smooth scroll for new messages
  useEffect(() => {
    if (messages.length > 0 && !isInitialLoadRef.current && !isLoadingMore && messagesContainerRef.current) {
        const newestMessage = messages[messages.length - 1];
        if (newestMessage._id !== lastMessageIdRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
            lastMessageIdRef.current = newestMessage._id;
        }
    }
  }, [messages, isLoadingMore]);

  // Reset initial load flag when conversation changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    lastMessageIdRef.current = null;
    setIsLoadingMore(false);
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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!messageText.trim() && images.length === 0) || sending) return;

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
        images: images.length > 0 ? images : undefined,
        replyToId: replyTo?._id,
      });
      setMessageText("");
      setImages([]);
      setReplyTo(null);
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

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiClick = (emojiData: any) => {
    setMessageText((prev) => prev + emojiData.emoji);
  };

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
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {status === "LoadingMore" && (
            <div className="flex justify-center py-2">
                <div className="w-6 h-6 border-2 border-[#e67919] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
        {status === "LoadingFirstPage" ? (
          <div className="text-[#b8aa9d] text-center mt-10">Loading messages...</div>
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
                onReply={setReplyTo}
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
        onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
        showEmojiPicker={showEmojiPicker}
        onEmojiClick={handleEmojiClick}
        images={images}
        onImagesChange={setImages}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      {/* Incoming Call Notification */}
      {showIncomingCall && (
        <Suspense fallback={<div>Loading call...</div>}>
          <IncomingCallNotification
            conversation={conversation}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
        </Suspense>
      )}

      {/* Video Call Modal */}
      {isVideoCallActive && (
        <Suspense fallback={<div>Starting call...</div>}>
          <VideoCallModal
            conversation={conversation}
            onClose={handleCloseVideoCall}
            initiator={isCallInitiator}
          />
        </Suspense>
      )}
    </div>
  );
}
