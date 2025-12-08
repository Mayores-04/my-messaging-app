import Image from "next/image";
import { useState, memo, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Edit2, Trash2, Reply } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  conversation: any;
  isLastRead: boolean;
  onReply?: (message: any) => void;
}

function MessageBubble({
  message,
  isOwn,
  conversation,
  isLastRead,
  onReply,
}: MessageBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.body || "");
  const [showUnsendConfirm, setShowUnsendConfirm] = useState(false);
  
  const editMessage = useMutation(api.messages.editMessage);
  const unsendMessage = useMutation(api.messages.unsendMessage);

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
    await unsendMessage({
      messageId: message._id,
    });
    setShowUnsendConfirm(false);
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

  return (
    <>
      {/* Full-width hover container */}
      <div
        className={`group w-full flex ${isOwn ? "justify-end" : "justify-start"}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`flex items-center gap-2 ${isOwn ? "flex-row" : "flex-row-reverse"}`}>
          {/* Reply button - shows on hover */}
          {isHovered && onReply && (
            <button
              onClick={() => onReply(message)}
              className="text-[#b8aa9d] hover:text-[#e67919] transition-colors p-1.5 rounded-full hover:bg-[#26211c]"
              aria-label="Reply to message"
            >
              {/* <Reply className="w-4 h-4" /> */}
              Reply
            </button>
          )}

          <div className="flex flex-col">
            <div
              className={`relative max-w-[500px] rounded-2xl px-4 py-2 ${
                isOwn
                  ? "bg-[#e67919] text-white"
                  : "bg-[#26211c] text-white border border-[#53473c]"
              }`}
            >
            {/* Replied Message Preview */}
            {message.replyTo && (
              <div className="mb-2 p-2 bg-black/20 rounded border-l-2 border-white/50">
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

            {/* Edit and Unsend buttons */}
            {isHovered && isOwn && !isEditing && (
            <div className="absolute -top-6.5  right-0 flex gap-2 bg-[#26211c] border border-[#53473c] rounded px-2 py-1">
              {message.body && (
                <button
                  onClick={handleEdit}
                  className="text-xs text-white hover:text-[#e67919] transition-colors flex items-center gap-1"
                  aria-label="Edit message"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              )}
              <button
                onClick={handleUnsend}
                className="text-xs text-white hover:text-red-500 transition-colors flex items-center gap-1"
                aria-label="Unsend message"
              >
                <Trash2 className="w-3 h-3" />
                Unsend
              </button>
            </div>
          )}
          {message.images && message.images.length > 0 ? (
            <div className="mb-2">
              {message.images.length === 1 ? (
                <img
                  src={message.images[0]}
                  alt="attachment"
                  className="w-full rounded object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openLightbox(0)}
                />
              ) : message.images.length === 2 ? (
                <div className="grid grid-cols-2 gap-1">
                  {message.images.map((img: string, index: number) => (
                    <img
                      key={index}
                      src={img}
                      alt={`attachment ${index + 1}`}
                      className="w-full rounded object-cover h-48 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(index)}
                    />
                  ))}
                </div>
              ) : message.images.length === 3 ? (
                <div className="grid grid-cols-2 gap-1">
                  <img
                    src={message.images[0]}
                    alt="attachment 1"
                    className="col-span-2 w-full rounded object-cover h-48 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openLightbox(0)}
                  />
                  <img
                    src={message.images[1]}
                    alt="attachment 2"
                    className="w-full rounded object-cover h-32 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openLightbox(1)}
                  />
                  <img
                    src={message.images[2]}
                    alt="attachment 3"
                    className="w-full rounded object-cover h-32 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openLightbox(2)}
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
                      onClick={() => openLightbox(index)}
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
                        onClick={() => openLightbox(index)}
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
          ) : null}
          {message.body && (
            isEditing ? (
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
            )
          )}
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

            {/* Show other user's avatar under the latest message they have read */}
            {isLastRead && message.readByOther && (
              <div className={`relative mt-1 ${isOwn ? "mr-0" : "ml-0"}`}>
                <div className="w-4 h-4 rounded-full overflow-hidden bg-[#53473c]">
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
                className="px-4 py-2 rounded bg-[#53473c] text-white hover:bg-[#6a5a4a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnsend}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Unsend
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
    </>
  );
}

export default memo(MessageBubble);
