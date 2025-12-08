import Image from "next/image";
import { useState, memo, useCallback, useRef, useEffect } from "react";
import { CornerUpLeft } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ForwardMessageModal from "./ForwardMessageModal";
import MessageActions from "./MessageActions";
import MessageContent from "./MessageContent";
import { ConfirmModal, LightboxModal } from "./MessageModals";
import { useIsMobile } from "@/hooks/use-mobile";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  conversation: any;
  isLastRead: boolean;
  onReply?: (message: any) => void;
  onReplyClick?: (messageId: string) => void;
}

function MessageBubble({
  message,
  isOwn,
  conversation,
  isLastRead,
  onReply,
  onReplyClick,
}: MessageBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.body || "");
  const [showUnsendConfirm, setShowUnsendConfirm] = useState(false);
  const [isUnsending, setIsUnsending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [viewLevel, setViewLevel] = useState<0 | 1 | 2>(0); // 0: Hidden, 1: Blurred, 2: Visible
  
  const isMobile = useIsMobile();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchMovedRef = useRef(false);
  const [touchTranslate, setTouchTranslate] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const editMessage = useMutation(api.messages.editMessage);
  const unsendMessage = useMutation(api.messages.unsendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const togglePin = useMutation(api.messages.togglePin);
  const reportMessage = useMutation(api.messages.reportMessage);
  const acceptConversation = useMutation(api.messages.acceptConversation);
  
  const myEmail = isOwn ? message.senderEmail : (conversation.user1Email === message.senderEmail ? conversation.user2Email : conversation.user1Email);
  const isAccepted = conversation.acceptedBy?.includes(myEmail) || false;
  const isRestricted = !isOwn && !isAccepted;
  
  // Determine visibility based on restriction and local view level
  const isContentVisible = !isRestricted || viewLevel === 2;
  const isContentBlurred = isRestricted && viewLevel === 1;
  const isContentHidden = isRestricted && viewLevel === 0;

  const handleAccept = async () => {
    await acceptConversation({ conversationId: conversation._id });
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteMessage({ messageId: message._id });
    }
  };

  const handleDecline = () => {
    setViewLevel(0);
  };

  const handlePin = async () => {
    await togglePin({ messageId: message._id });
    setMenuOpen(false);
  };

  const handleForward = () => {
    setShowForwardModal(true);
    setMenuOpen(false);
  };

  const handleReport = () => {
    setShowReportConfirm(true);
    setMenuOpen(false);
  };

  const confirmReport = async () => {
    await reportMessage({ messageId: message._id, reason: "User reported" });
    setShowReportConfirm(false);
  };

  const handleReaction = async (emoji: string) => {
    await toggleReaction({ messageId: message._id, emoji });
    setShowEmojiPicker(false);
    setMenuOpen(false);
  };

  const handleCopyText = async () => {
    if (!message.body) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message.body);
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement("textarea");
        textArea.value = message.body;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1600);
      setMenuOpen(false);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleCopyImage = async () => {
    if (!message.images || message.images.length === 0) return;
    try {
      const imageUrl = message.images[0];
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(imageUrl);
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement("textarea");
        textArea.value = imageUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1600);
      setMenuOpen(false);
    } catch (err) {
      console.error("Copy image failed:", err);
    }
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (message.images && currentImageIndex < message.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "Escape") setLightboxOpen(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (editedText.trim()) {
      await editMessage({
        messageId: message._id,
        newBody: editedText.trim(),
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedText(message.body || "");
    setIsEditing(false);
  };

  const handleUnsend = () => {
    setShowUnsendConfirm(true);
  };

  const confirmUnsend = async () => {
    setIsUnsending(true);
    try {
      await unsendMessage({
        messageId: message._id,
      });
    } catch (error) {
      console.error("Failed to unsend message:", error);
      setIsUnsending(false);
    } finally {
      setShowUnsendConfirm(false);
    }
  };

  const cancelUnsend = () => {
    setShowUnsendConfirm(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Long press handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    const t = e.touches[0];
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
    touchMovedRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
      setMenuOpen(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
  }, [isMobile]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Detect swipe gesture (only for touch end)
    try {
      const t = e.changedTouches[0];
      const startX = touchStartXRef.current;
      const startY = touchStartYRef.current;
      if (startX != null && startY != null) {
        const deltaX = t.clientX - startX;
        const deltaY = t.clientY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const threshold = 60; // px
        const verticalTolerance = 40; // px
        if (absX > threshold && absY < verticalTolerance) {
          // left-to-right swipe: deltaX > 0
          // right-to-left swipe: deltaX < 0
          if (!isOwn && deltaX > threshold) {
            // incoming message swiped left->right to reply
            if (onReply) onReply(message);
            else if (onReplyClick) onReplyClick(message._id);
          } else if (isOwn && deltaX < -threshold) {
            // own message swiped right->left to reply
            if (onReply) onReply(message);
            else if (onReplyClick) onReplyClick(message._id);
          }
        }
      }
    } catch (err) {
      // ignore
    }

    setTimeout(() => setIsLongPressing(false), 100);
    // animate back to original position (imperative style)
    try {
      if (containerRef.current) {
        containerRef.current.style.transition = 'transform 180ms ease-out';
        containerRef.current.style.transform = 'translateX(0px)';
      }
    } catch (err) {
      // ignore
    }
    setTimeout(() => setTouchTranslate(0), 160);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchMovedRef.current = false;
  }, [isOwn, message, onReply, onReplyClick]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchMovedRef.current = true;
    try {
      const t = e.touches[0];
      const startX = touchStartXRef.current;
      const startY = touchStartYRef.current;
      if (startX != null && startY != null) {
        const deltaX = t.clientX - startX;
        const deltaY = t.clientY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        // Only apply horizontal translate when mostly horizontal movement
        if (absX > 6 && absY < 60) {
          // Only allow swipe in the configured direction: incoming -> right swipe, own -> left swipe
          const allowed = (!isOwn && deltaX > 0) || (isOwn && deltaX < 0);
          if (!allowed) {
            // ignore opposite-direction swipes
            setTouchTranslate(0);
            try {
              if (containerRef.current) {
                containerRef.current.style.transition = 'transform 0s';
                containerRef.current.style.transform = `translateX(0px)`;
              }
            } catch (err) {
              // ignore
            }
            return;
          }

          // clamp translate to reasonable bounds
          const max = 140;
          const clamp = Math.max(-max, Math.min(max, deltaX));
          setTouchTranslate(clamp);
          try {
            if (containerRef.current) {
              containerRef.current.style.transition = 'transform 0s';
              containerRef.current.style.transform = `translateX(${clamp}px)`;
            }
          } catch (err) {
            // ignore
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  if (message.isDeleted) {
    return (
      <div className={`w-full flex ${isOwn ? "justify-end" : "justify-start"} mb-1 px-2 sm:px-4 lg:px-6 xl:px-8`}>
        <div className={`px-4 py-2 rounded-2xl border border-[#53473c] bg-[#26211c] text-[#b8aa9d] text-sm italic max-w-md`}>
          {isOwn ? "You" : conversation.otherUserName.split(' ')[0]} unsent a message
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full-width hover container */}
      <div
        id={`message-${message._id}`}
        className={`group relative w-full flex ${isOwn ? "justify-end" : "justify-start"} transition-colors duration-200 ${
          isLongPressing ? 'bg-[#2d2520]' : ''
        } px-2 sm:px-3 lg:px-4 xl:px-5 mb-1`}
        ref={containerRef}
        onMouseEnter={() => {
          if (!isMobile) {
            setIsHovered(true);
            setMenuOpen(true);
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setIsHovered(false);
            setMenuOpen(false);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        <div className={`flex items-center gap-2 max-w-full sm:max-w-[90%] md:max-w-[90%] lg:max-w-[85%] xl:max-w-[75%] 2xl:max-w-[70%] ${isOwn ? "flex-row" : "flex-row-reverse"}`}>
          {/* Action Toolbar - Always reserve space to prevent layout shift */}
          <div className={`shrink-0 transition-opacity duration-200 ${(isHovered || (isMobile && menuOpen)) && !isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <MessageActions
                isOwn={isOwn}
                isMobile={isMobile}
                message={message}
                menuOpen={menuOpen}
                showEmojiPicker={showEmojiPicker}
                showCopied={showCopied}
                onReply={onReply}
                onEdit={handleEdit}
                onUnsend={handleUnsend}
                onForward={handleForward}
                onPin={handlePin}
                onReport={handleReport}
                onReaction={handleReaction}
                onCopyText={handleCopyText}
                onCopyImage={handleCopyImage}
                setMenuOpen={setMenuOpen}
                setShowEmojiPicker={setShowEmojiPicker}
                timestamp={message.createdAt}
            />
          </div>

          {/* Message Content Container */}
          <div className="flex flex-col min-w-0">
            <MessageContent
              message={message}
              isOwn={isOwn}
              isEditing={isEditing}
              editedText={editedText}
              isContentHidden={isContentHidden}
              isContentBlurred={isContentBlurred}
              conversation={conversation}
              onReplyClick={onReplyClick}
              onEditChange={setEditedText}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onEditKeyDown={handleEditKeyDown}
              onViewLevelChange={setViewLevel}
              onImageClick={openLightbox}
            />

            {/* Show other user's avatar under the latest message they have read */}
            {isLastRead && message.readByOther && (
              <div className={`relative mt-1 ${isOwn ? "mr-0" : "ml-0"}`}>
                <div className="w-4 h-4 absolute right-0 -bottom-4 rounded-full overflow-hidden bg-[#53473c]">
                  {conversation.otherUserAvatar ? (
                    <Image
                      src={conversation.otherUserAvatar}
                      alt={conversation.otherUserName}
                      width={18}
                      height={18}
                    />
                  ) : (
                    <span className="text-xs text-white flex items-center justify-center h-4">
                      {conversation.otherUserName[0]}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showUnsendConfirm}
        title="Unsend message?"
        message="This message will be removed for everyone in the conversation."
        confirmText="Unsend"
        confirmAction={confirmUnsend}
        cancelAction={cancelUnsend}
        isLoading={isUnsending}
        isDanger={true}
      />

      <ConfirmModal
        isOpen={showReportConfirm}
        title="Report message?"
        message="This message will be reported to admins for review."
        confirmText="Report"
        confirmAction={confirmReport}
        cancelAction={() => setShowReportConfirm(false)}
        isDanger={true}
      />

      <LightboxModal
        isOpen={lightboxOpen}
        images={message.images}
        currentIndex={currentImageIndex}
        onClose={() => setLightboxOpen(false)}
        onNext={nextImage}
        onPrev={prevImage}
        onKeyDown={handleKeyDown}
      />

      <ForwardMessageModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        message={message}
      />
    </>
  );
}

export default memo(MessageBubble);
