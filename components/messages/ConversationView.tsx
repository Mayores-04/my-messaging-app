"use client";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense, useMemo } from "react";
import { ChevronDown, Pin } from "lucide-react";
import ConversationHeader from "./ConversationHeader";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";
import { useVideoCall } from "@/hooks/useVideoCall";

// Lazy load heavy components
const VideoCallModal = lazy(() => import("./VideoCallModal"));
const IncomingCallNotification = lazy(() => import("./IncomingCallNotification"));

export default function ConversationView({ conversation, onBack }: any) {
  const liveConversation = useQuery(api.messages.getConversation, { conversationId: conversation._id });
  const activeConversation = liveConversation || conversation;

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
    conversationId: activeConversation._id,
    otherUserEmail: activeConversation.otherUserEmail,
  });

  const userStatus = useQuery(api.users.getUserOnlineStatus, {
    userEmail: activeConversation.otherUserEmail,
  });

  const pinnedMessages = useQuery(api.messages.getPinnedMessages, {
    conversationId: activeConversation._id,
  });

  const sendMessage = useMutation(api.messages.sendMessage);
  const setTypingStatus = useMutation(api.messages.setTyping);
  const markAsRead = useMutation(api.messages.markConversationAsRead);

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<any>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingLocalRef = useRef(false);
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
  } = useVideoCall(activeConversation);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null);
  const previousScrollHeightRef = useRef(0);
  const lastMessageIdRef = useRef<string | null>(null);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight } = messagesContainerRef.current;
    
    if (scrollTop < 100 && status === "CanLoadMore" && !isLoadingMore && !targetMessageId) {
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
    if (messages.length > 0 && !isInitialLoadRef.current && !isLoadingMore && !targetMessageId && messagesContainerRef.current) {
        const newestMessage = messages[messages.length - 1];
        if (newestMessage._id !== lastMessageIdRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
            lastMessageIdRef.current = newestMessage._id;
        }
    }
  }, [messages, isLoadingMore, targetMessageId]);

  // Reset initial load flag when conversation changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    lastMessageIdRef.current = null;
    setIsLoadingMore(false);
  }, [activeConversation._id]);

  // Mark messages as read when conversation opens or new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      markAsRead({ conversationId: activeConversation._id });
    }
  }, [messages, activeConversation._id, markAsRead]);

  const handleTyping = (text: string) => {
    setMessageText(text);

    // Only send a "typing=true" update when the local typing state transitions
    if (!isTypingLocalRef.current) {
      isTypingLocalRef.current = true;
      setTypingStatus({
        conversationId: activeConversation._id,
        isTyping: true,
      });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to false after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingLocalRef.current = false;
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
      isTypingLocalRef.current = false;
      setTypingStatus({
        conversationId: conversation._id,
        isTyping: false,
      });
    };
  }, [conversation._id, setTypingStatus]);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [showPinnedDropdown, setShowPinnedDropdown] = useState(false);

  const handleEmojiClick = (emojiData: any) => {
    setMessageText((prev) => prev + emojiData.emoji);
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-white/10");
      setTimeout(() => element.classList.remove("bg-white/10"), 1000);
      return true;
    }
    return false;
  };

  const handleReplyClick = (messageId: string) => {
    if (scrollToMessage(messageId)) {
        return;
    }
    // Not found, start searching
    setTargetMessageId(messageId);
    if (status === "CanLoadMore") {
        loadMore(20);
    }
  };

  const handlePinClick = (messageId: string) => {
    handleReplyClick(messageId);
    setShowPinnedDropdown(false);
  };

  // Search for message effect
  useEffect(() => {
    if (targetMessageId) {
        const found = messages.some(m => m._id === targetMessageId);
        if (found) {
             // Wait for render
             setTimeout(() => {
                 if (scrollToMessage(targetMessageId)) {
                     setTargetMessageId(null);
                 }
             }, 100);
        } else {
            if (status === "CanLoadMore") {
                loadMore(20);
            } else if (status === "Exhausted") {
                setTargetMessageId(null);
                alert("Message not found in history");
            }
        }
    }
  }, [messages, targetMessageId, status, loadMore]);

  return (
    <div className="flex flex-col h-screen w-full relative">
      {/* Loading overlay when searching for message */}
      {targetMessageId && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-[#26211c] border border-[#e67919] text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2">
           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
           <span className="text-sm">Loading message...</span>
        </div>
      )}
      {/* Header */}
      <ConversationHeader
        conversation={activeConversation}
        isTyping={isTyping}
        userStatus={userStatus}
        onBack={onBack}
        onVideoCall={handleStartVideoCall}
      />

      {/* Pinned Messages Banner */}
      {pinnedMessages && pinnedMessages.length > 0 && (
        <div className="relative z-20 bg-[#26211c] border-b border-[#53473c] px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-[#3a332c] transition-colors"
             onClick={() => {
                 if (pinnedMessages.length === 1) {
                     handlePinClick(pinnedMessages[0]._id);
                 } else {
                     setShowPinnedDropdown(!showPinnedDropdown);
                 }
             }}>
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-[#e67919] p-1.5 rounded-full shrink-0">
                    <Pin className="w-3 h-3 text-white fill-current" />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs text-[#e67919] font-medium">
                        {pinnedMessages[0].senderEmail === conversation.otherUserEmail ? conversation.otherUserName : "You"}
                    </span>
                    <span className="text-xs text-[#b8aa9d] truncate">
                        {pinnedMessages[0].body || "Image"}
                    </span>
                </div>
            </div>
            {pinnedMessages.length > 1 && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#b8aa9d] bg-[#3a332c] px-1.5 py-0.5 rounded-full">
                        +{pinnedMessages.length - 1}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#b8aa9d] transition-transform ${showPinnedDropdown ? "rotate-180" : ""}`} />
                </div>
            )}

            {/* Pinned Messages Dropdown */}
            {showPinnedDropdown && (
                <div className="absolute top-full left-0 right-0 bg-[#26211c] border-b border-[#53473c] shadow-lg max-h-60 overflow-y-auto z-30">
                    {pinnedMessages.map((msg: any) => (
                        <div 
                            key={msg._id}
                            className="px-4 py-2 hover:bg-[#3a332c] cursor-pointer border-b border-[#53473c]/30 last:border-0 flex items-center gap-3"
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePinClick(msg._id);
                            }}
                        >
                            <div className="bg-[#e67919]/20 p-1.5 rounded-full shrink-0">
                                <Pin className="w-3 h-3 text-[#e67919] fill-current" />
                            </div>
                            <div className="flex flex-col overflow-hidden flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#e67919] font-medium">
                                        {msg.senderEmail === conversation.otherUserEmail ? conversation.otherUserName : "You"}
                                    </span>
                                    <span className="text-[10px] text-[#b8aa9d]">
                                        {new Date(msg._creationTime).toLocaleDateString()}
                                    </span>
                                </div>
                                <span className="text-xs text-[#b8aa9d] truncate">
                                    {msg.body || "Image"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

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
          <div className="text-[#b8aa9d] text-center mt-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#e67919] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-[#b8aa9d] text-center">
            No messages yet. Send the first message!
          </div>
        ) : (
          messages.map((message: any) => {
            const isOwn = message.senderEmail !== activeConversation.otherUserEmail;
            return (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={isOwn}
                conversation={activeConversation}
                isLastRead={message._id === lastReadMessageId}
                onReply={setReplyTo}
                onReplyClick={handleReplyClick}
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
            conversation={activeConversation}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
        </Suspense>
      )}

      {/* Video Call Modal */}
      {isVideoCallActive && (
        <Suspense fallback={<div>Starting call...</div>}>
          <VideoCallModal
            conversation={activeConversation}
            onClose={handleCloseVideoCall}
            initiator={isCallInitiator}
          />
        </Suspense>
      )}
    </div>
  );
}
