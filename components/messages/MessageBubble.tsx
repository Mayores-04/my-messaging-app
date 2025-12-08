import Image from "next/image";
import { useState, memo, useCallback, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Edit2, Trash2, Reply, MoreVertical, Smile, Pin, Flag, Forward, Eye, EyeOff, Check } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ForwardMessageModal from "./ForwardMessageModal";
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
  const [viewLevel, setViewLevel] = useState<0 | 1 | 2>(0); // 0: Hidden, 1: Blurred, 2: Visible
  
  const isMobile = useIsMobile();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
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
  const handleTouchStart = useCallback(() => {
    if (!isMobile) return;
    
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
      setMenuOpen(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setTimeout(() => setIsLongPressing(false), 100);
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
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
      <div className={`w-full flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
        <div className={`px-4 py-2 rounded-2xl border border-[#53473c] bg-[#26211c] text-[#b8aa9d] text-sm italic`}>
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
        className={`group w-full flex ${isOwn ? "justify-end" : "justify-start"} transition-colors duration-500 ${isLongPressing ? 'bg-[#2d2520]' : ''} select-none`}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        <div className={`flex items-center gap-2 ${isOwn ? "flex-row" : "flex-row-reverse"}`}>
          {/* Action Toolbar - shows on hover (desktop) or long-press (mobile) */}
          {(isHovered || (isMobile && menuOpen)) && !isEditing && (
            <div className="flex items-center gap-2">
               {/* Toolbar */}
               <div className="flex items-center gap-1 bg-[#26211c] border border-[#53473c] rounded-full px-2 py-1 shadow-lg">
                  {/* Menu */}
                  <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                        className="text-[#b8aa9d] hover:text-white p-1.5 md:p-1 rounded-full hover:bg-[#3a332c] transition-colors flex items-center justify-center"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-5 h-5 md:w-4 md:h-4" />
                      </button>
                      
                      {/* Dropdown Menu - Larger touch targets for mobile */}
                      {menuOpen && (
                        <>
                          {/* Backdrop for mobile */}
                          {isMobile && (
                            <div 
                              className="fixed inset-0 z-40 bg-black/20"
                              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                            />
                          )}
                          <div className={`absolute ${isMobile ? 'fixed bottom-4 left-4 right-4' : 'bottom-full left-0 mb-2'} ${isMobile ? 'w-auto' : 'w-40'} bg-[#26211c] border border-[#53473c] rounded-lg shadow-xl overflow-hidden z-50 flex flex-col ${isMobile ? 'py-2' : 'py-1'}`}>
                            {isOwn && (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(); setMenuOpen(false); }} className={`text-left ${isMobile ? 'px-6 py-3' : 'px-4 py-2'} text-sm md:text-xs text-[#b8aa9d] hover:bg-[#3a332c] hover:text-white flex items-center gap-3 md:gap-2 w-full`}>
                                        <Edit2 className={`${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`} /> Edit
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleUnsend(); setMenuOpen(false); }} className={`text-left ${isMobile ? 'px-6 py-3' : 'px-4 py-2'} text-sm md:text-xs text-[#b8aa9d] hover:bg-[#3a332c] hover:text-white flex items-center gap-3 md:gap-2 w-full`}>
                                        <Trash2 className={`${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`} /> Unsend
                                    </button>
                                </>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handleForward(); }} className={`text-left ${isMobile ? 'px-6 py-3' : 'px-4 py-2'} text-sm md:text-xs text-[#b8aa9d] hover:bg-[#3a332c] hover:text-white flex items-center gap-3 md:gap-2 w-full`}>
                                <Forward className={`${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`} /> Forward
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handlePin(); }} className={`text-left ${isMobile ? 'px-6 py-3' : 'px-4 py-2'} text-sm md:text-xs text-[#b8aa9d] hover:bg-[#3a332c] hover:text-white flex items-center gap-3 md:gap-2 w-full`}>
                                <Pin className={`${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`} /> {message.isPinned ? "Unpin" : "Pin"}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleReport(); }} className={`text-left ${isMobile ? 'px-6 py-3' : 'px-4 py-2'} text-sm md:text-xs text-[#b8aa9d] hover:bg-[#3a332c] hover:text-white flex items-center gap-3 md:gap-2 w-full`}>
                                <Flag className={`${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`} /> Report
                            </button>
                            {isMobile && (
                              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} className="text-center px-6 py-3 text-sm text-white bg-[#3a332c] hover:bg-[#4a433c] w-full mt-2">
                                Cancel
                              </button>
                            )}
                        </div>
                        </>
                      )}
                  </div>

                  {/* Reply - Hidden on mobile when menu is open */}
                  {onReply && !isMobile && (
                    <button 
                      onClick={() => onReply(message)}
                      className="text-[#b8aa9d] hover:text-white p-1 rounded-full hover:bg-[#3a332c] transition-colors flex items-center justify-center"
                      aria-label="Reply"
                    >
                      <Reply className="w-4 h-4" />
                    </button>
                  )}

                  {/* React - Hidden on mobile when menu is open */}
                  {!isMobile && (
                    <div className="relative">
                      <button 
                          onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                          className="text-[#b8aa9d] hover:text-white p-1 rounded-full hover:bg-[#3a332c] transition-colors flex items-center justify-center"
                          aria-label="Add reaction"
                      >
                          <Smile className="w-4 h-4" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 bg-[#26211c] border border-[#53473c] rounded-full shadow-lg p-1 flex gap-1 z-50">
                            {["👍", "❤️", "😂", "😮", "😢", "😡"].map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={(e) => { e.stopPropagation(); handleReaction(emoji); }}
                                    className="hover:bg-[#3a332c] p-1 rounded-full text-lg transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
               </div>

               {/* Timestamp */}
               <span className="text-xs text-[#b8aa9d] select-none">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
               </span>
            </div>
          )}

          <div className="flex flex-col">
            <div
              className={`relative max-w-[500px] ${
                (!message.body && message.images && message.images.length > 0)
                  ? "bg-transparent"
                  : `rounded-2xl px-4 py-2 ${
                      isOwn
                        ? "bg-[#e67919] text-white"
                        : "bg-[#26211c] text-white border border-[#53473c]"
                    }`
              }`}
            >
            {/* Replied Message Preview */}
            {message.replyTo && (
              <div 
                className="mb-2 p-2 bg-black/20 rounded border-l-2 border-white/50 cursor-pointer hover:bg-black/30 transition-colors"
                onClick={() => onReplyClick?.(message.replyTo._id)}
              >
                <p className="text-xs opacity-75 mb-1">
                  {message.replyTo.senderEmail === message.senderEmail ? "You" : conversation.otherUserName} replied:
                </p>
                {message.replyTo.images && message.replyTo.images.length > 0 && (
                  <img
                    src={message.replyTo.images[0]}
                    alt="Replied image"
                    className="w-10 h-10 rounded object-cover mb-1"
                  />
                )}
                <p className="text-xs opacity-90 truncate">{message.replyTo.body || "Image"}</p>
              </div>
            )}

            {/* Pinned Indicator */}
            {message.isPinned && (
                <div className="absolute -top-2 -right-2 bg-[#e67919] text-white rounded-full p-1 shadow-sm z-10">
                    <Pin className="w-3 h-3 fill-current" />
                </div>
            )}

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
                <div className="absolute -bottom-3 right-0 flex gap-1 bg-[#26211c] border border-[#53473c] rounded-full px-1 py-0.5 shadow-sm z-10">
                    {Object.entries(
                        message.reactions.reduce((acc: any, curr: any) => {
                            acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                            return acc;
                        }, {})
                    ).map(([emoji, count]: any) => (
                        <span key={emoji} className="text-xs px-1">
                            {emoji} {count > 1 && <span className="text-[10px] text-[#b8aa9d] ml-0.5">{count}</span>}
                        </span>
                    ))}
                </div>
            )}

          {message.images && message.images.length > 0 ? (
            <div className="mb-2">
              {isContentHidden ? (
                <div className="bg-[#26211c] border border-[#53473c] rounded p-4 flex flex-col items-center justify-center gap-3 min-w-[200px]">
                  <EyeOff className="w-8 h-8 text-[#b8aa9d]" />
                  <p className="text-[#b8aa9d] text-sm text-center">Message Request</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewLevel(1)}
                      className="bg-[#53473c] hover:bg-[#3a332c] text-white text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Peek
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {isContentBlurred && (
                    <div 
                        className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setViewLevel(2);
                        }}
                    >
                      <button
                        className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all flex items-center gap-2 pointer-events-none"
                      >
                        <Eye className="w-4 h-4" />
                        Tap to View
                      </button>
                    </div>
                  )}
                  <div className={`${isContentBlurred ? "filter blur-md select-none" : ""}`}>
                  {message.images.length === 1 ? (
                    <img
                      src={message.images[0]}
                      alt="attachment"
                      className="w-full rounded object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => !isContentBlurred && openLightbox(0)}
                    />
                  ) : message.images.length === 2 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {message.images.map((img: string, index: number) => (
                        <img
                          key={index}
                          src={img}
                          alt={`attachment ${index + 1}`}
                          className="w-full rounded object-cover h-48 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => !isContentBlurred && openLightbox(index)}
                        />
                      ))}
                    </div>
                  ) : message.images.length === 3 ? (
                    <div className="grid grid-cols-2 gap-1">
                      <img
                        src={message.images[0]}
                        alt="attachment 1"
                        className="col-span-2 w-full rounded object-cover h-48 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => !isContentBlurred && openLightbox(0)}
                      />
                      <img
                        src={message.images[1]}
                        alt="attachment 2"
                        className="w-full rounded object-cover h-32 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => !isContentBlurred && openLightbox(1)}
                      />
                      <img
                        src={message.images[2]}
                        alt="attachment 3"
                        className="w-full rounded object-cover h-32 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => !isContentBlurred && openLightbox(2)}
                      />
                    </div>
                  ) : message.images.length === 4 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {message.images.map((img: string, index: number) => (
                        <img
                          key={index}
                          src={img}
                          alt={`attachment ${index + 1}`}
                          className="w-full rounded object-cover h-40 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => !isContentBlurred && openLightbox(index)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {message.images
                        .slice(0, 4)
                        .map((img: string, index: number) => (
                          <div
                            key={index}
                            className="relative cursor-pointer"
                            onClick={() => !isContentBlurred && openLightbox(index)}
                          >
                            <img
                              src={img}
                              alt={`attachment ${index + 1}`}
                              className="w-full rounded object-cover h-40 hover:opacity-90 transition-opacity"
                            />
                            {index === 3 && message.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/70 bg-opacity-60 rounded flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">
                                  +{message.images.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          {message.body && (
            isContentHidden ? (
               <div className="bg-[#26211c] border border-[#53473c] rounded p-4 flex flex-col items-center justify-center gap-3 min-w-[200px]">
                  <p className="text-[#b8aa9d] text-sm text-center">Message Request</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewLevel(message.images && message.images.length > 0 ? 1 : 2)}
                      className="bg-[#53473c] hover:bg-[#3a332c] text-white text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      {message.images && message.images.length > 0 ? "Peek" : "View"}
                    </button>
                  </div>
               </div>
            ) : (
              <div className="relative">
                {isContentBlurred && (
                    <div 
                        className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setViewLevel(2);
                        }}
                    >
                      <button
                        className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all flex items-center gap-2 pointer-events-none"
                      >
                        <Eye className="w-4 h-4" />
                        Tap to View
                      </button>
                    </div>
                )}
                <div className={`${isContentBlurred ? "filter blur-md select-none" : ""}`}>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      className="bg-[#26211c] text-white border border-[#53473c] rounded px-2 py-1 focus:outline-none focus:border-[#e67919]"
                      placeholder="Edit message..."
                      aria-label="Edit message text"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="text-xs px-2 py-1 rounded hover:bg-[#53473c] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="text-xs px-2 py-1 rounded bg-[#e67919] hover:bg-[#d56f15] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="wrap-break-word">{message.body}</p>
                    {message.isEdited && (
                      <span className={`text-xs italic ${
                        isOwn ? "text-[#211811]" : "text-[#b8aa9d]"
                      }`}>
                        (edited)
                      </span>
                    )}
                  </>
                )}
                </div>
              </div>
            )
          )}
          
            </div>

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

      {/* Unsend Confirmation Modal */}
      {showUnsendConfirm && (
        <div
          className="fixed inset-0 bg-black/70 bg-opacity-50 z-50 flex items-center justify-center"
          onClick={cancelUnsend}
        >
          <div
            className="bg-[#26211c] border border-[#53473c] rounded-lg p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-lg font-semibold mb-2">
              Unsend message?
            </h3>
            <p className="text-[#b8aa9d] text-sm mb-6">
              This message will be removed for everyone in the conversation.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelUnsend}
                disabled={isUnsending}
                className="px-4 py-2 rounded bg-[#53473c] text-white hover:bg-[#6a5a4a] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnsend}
                disabled={isUnsending}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isUnsending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Unsending...
                  </>
                ) : (
                  "Unsend"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Confirmation Modal */}
      {showReportConfirm && (
        <div
          className="fixed inset-0 bg-black/70 bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setShowReportConfirm(false)}
        >
          <div
            className="bg-[#26211c] border border-[#53473c] rounded-lg p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-lg font-semibold mb-2">
              Report message?
            </h3>
            <p className="text-[#b8aa9d] text-sm mb-6">
              This message will be reported to admins for review.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowReportConfirm(false)}
                className="px-4 py-2 rounded bg-[#53473c] text-white hover:bg-[#6a5a4a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReport}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && message.images && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-[#e67919] transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
            {currentImageIndex + 1} / {message.images.length}
          </div>

          {/* Previous button */}
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 text-white hover:text-[#e67919] transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-12 h-12" />
            </button>
          )}

          {/* Image */}
          <img
            src={message.images[currentImageIndex]}
            alt={`Image ${currentImageIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {currentImageIndex < message.images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 text-white hover:text-[#e67919] transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-12 h-12" />
            </button>
          )}
        </div>
      )}

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        message={message}
      />
    </>
  );
}

export default memo(MessageBubble);
