import { memo } from "react";
import { Pin, Eye, EyeOff } from "lucide-react";
import MessageImages from "./MessageImages";

interface MessageContentProps {
  message: any;
  isOwn: boolean;
  isEditing: boolean;
  editedText: string;
  isContentHidden: boolean;
  isContentBlurred: boolean;
  conversation: any;
  onReplyClick?: (messageId: string) => void;
  onEditChange: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onViewLevelChange: (level: 0 | 1 | 2) => void;
  onImageClick: (index: number) => void;
}

function MessageContent({
  message,
  isOwn,
  isEditing,
  editedText,
  isContentHidden,
  isContentBlurred,
  conversation,
  onReplyClick,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onEditKeyDown,
  onViewLevelChange,
  onImageClick,
}: MessageContentProps) {
  return (
    <div
      className={`relative inline-block ${
        !message.body && message.images && message.images.length > 0
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
            {message.replyTo.senderEmail === message.senderEmail
              ? "You"
              : conversation.otherUserName}{" "}
            replied:
          </p>
          {message.replyTo.images && message.replyTo.images.length > 0 && (
            <img
              src={message.replyTo.images[0]}
              alt="Replied image"
              className="w-10 h-10 rounded object-cover mb-1"
            />
          )}
          <p className="text-xs opacity-90 truncate">
            {message.replyTo.body || "Image"}
          </p>
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
              {emoji}{" "}
              {count > 1 && (
                <span className="text-[10px] text-[#b8aa9d] ml-0.5">{count}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Images */}
      {message.images && message.images.length > 0 && (
        <MessageImages
          images={message.images}
          isContentHidden={isContentHidden}
          isContentBlurred={isContentBlurred}
          onViewLevelChange={onViewLevelChange}
          onImageClick={onImageClick}
          hasText={!!message.body}
        />
      )}

      {/* Text Content */}
      {message.body && (
        <>
          {isContentHidden ? (
            <div className="bg-[#26211c] border border-[#53473c] rounded p-4 flex flex-col items-center justify-center gap-3 min-w-[200px]">
              <p className="text-[#b8aa9d] text-sm text-center">Message Request</p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onViewLevelChange(
                      message.images && message.images.length > 0 ? 1 : 2
                    )
                  }
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
                    onViewLevelChange(2);
                  }}
                >
                  <button className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all flex items-center gap-2 pointer-events-none">
                    <Eye className="w-4 h-4" />
                    Tap to View
                  </button>
                </div>
              )}
              <div
                className={`${isContentBlurred ? "filter blur-md select-none" : ""}`}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editedText}
                      onChange={(e) => onEditChange(e.target.value)}
                      onKeyDown={onEditKeyDown}
                      className="bg-[#26211c] text-white border border-[#53473c] rounded px-2 py-1 focus:outline-none focus:border-[#e67919]"
                      placeholder="Edit message..."
                      aria-label="Edit message text"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={onCancelEdit}
                        className="text-xs px-2 py-1 rounded hover:bg-[#53473c] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onSaveEdit}
                        className="text-xs px-2 py-1 rounded bg-[#e67919] hover:bg-[#d56f15] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="wrap-break-word whitespace-pre-wrap">
                      {message.body}
                    </p>
                    {message.isEdited && (
                      <span
                        className={`text-xs italic ${
                          isOwn ? "text-[#211811]" : "text-[#b8aa9d]"
                        }`}
                      >
                        (edited)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default memo(MessageContent);
