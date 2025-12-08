import { memo } from "react";
import { Edit2, Trash2, Reply, MoreVertical, Smile, Pin, Flag, Forward } from "lucide-react";

interface MessageActionsProps {
  isOwn: boolean;
  isMobile: boolean;
  message: any;
  menuOpen: boolean;
  showEmojiPicker: boolean;
  showCopied: boolean;
  onReply?: (message: any) => void;
  onEdit: () => void;
  onUnsend: () => void;
  onForward: () => void;
  onPin: () => void;
  onReport: () => void;
  onReaction: (emoji: string) => void;
  onCopyText: () => void;
  onCopyImage: () => void;
  setMenuOpen: (open: boolean) => void;
  setShowEmojiPicker: (show: boolean) => void;
  timestamp: number;
}

function MessageActions({
  isOwn,
  isMobile,
  message,
  menuOpen,
  showEmojiPicker,
  showCopied,
  onReply,
  onEdit,
  onUnsend,
  onForward,
  onPin,
  onReport,
  onReaction,
  onCopyText,
  onCopyImage,
  setMenuOpen,
  setShowEmojiPicker,
  timestamp,
}: MessageActionsProps) {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];

  return (
    <div className="flex items-center gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-[#26211c] border border-[#53473c] rounded-full px-2 py-1 shadow-lg">
        {/* Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="text-[#b8aa9d] hover:text-white p-1.5 md:p-1 rounded-full hover:bg-[#3a332c] transition-colors flex items-center justify-center"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 md:w-4 md:h-4" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <>
              {/* Backdrop for mobile */}
              {isMobile && (
                <div
                  className="fixed inset-0 z-40 bg-black/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
              )}

              <div
                className={`${isMobile ? "fixed left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[999]" : "absolute bottom-full left-0 mb-2 w-48 z-50"} bg-[#26211c] border border-[#53473c] rounded-lg shadow-xl overflow-hidden flex flex-col ${
                  isMobile ? "py-3" : "py-1"
                }`}
                style={isMobile ? { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' } : undefined}
              >
                {/* Mobile: Quick reactions and copy options */}
                {isMobile && (
                  <div className="px-4 pt-2 pb-3 border-b border-[#53473c]">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReaction(emoji);
                          }}
                          className="text-xl px-2 py-1 rounded-full hover:bg-[#3a332c] active:scale-95 transition-all"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {message.body && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyText();
                          }}
                          className="text-sm px-4 py-2 bg-[#3a332c] text-white rounded-full hover:bg-[#4a433c] active:scale-95 transition-all flex-1"
                        >
                          Copy Text
                        </button>
                      )}
                      {message.images && message.images.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyImage();
                          }}
                          className="text-sm px-4 py-2 bg-[#3a332c] text-white rounded-full hover:bg-[#4a433c] active:scale-95 transition-all flex-1"
                        >
                          Copy Image
                        </button>
                      )}
                    </div>
                    {showCopied && (
                      <div className="text-center text-sm text-green-400 mt-2 font-medium">✓ Copied!</div>
                    )}
                  </div>
                )}

                {/* Menu Actions */}
                {isOwn && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                        setMenuOpen(false);
                      }}
                      className={`text-left ${isMobile ? "px-6 py-3" : "px-4 py-2"} text-sm md:text-xs text-[#b8aa9d] hover:bg-[#3a332c] hover:text-white flex items-center gap-3 md:gap-2 w-full transition-colors`}
                    >
                      <Edit2 className={`${isMobile ? "w-5 h-5" : "w-3 h-3"}`} /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnsend();
                        setMenuOpen(false);
                      }}
                      className={`text-left ${isMobile ? "px-6 py-3" : "px-4 py-2"} text-sm md:text-xs text-[#b8aa9d] hover:bg-[#3a332c] hover:text-white flex items-center gap-3 md:gap-2 w-full transition-colors`}
                    >
                      <Trash2 className={`${isMobile ? "w-5 h-5" : "w-3 h-3"}`} /> Unsend
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onForward();
                  }}
                  className={`text-left ${isMobile ? "px-6 py-3" : "px-4 py-2"} text-sm md:text-xs text-[#b8aa9d] hover:bg-[#3a332c] hover:text-white flex items-center gap-3 md:gap-2 w-full transition-colors`}
                >
                  <Forward className={`${isMobile ? "w-5 h-5" : "w-3 h-3"}`} /> Forward
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin();
                  }}
                  className={`text-left ${isMobile ? "px-6 py-3" : "px-4 py-2"} text-sm md:text-xs text-[#b8aa9d] hover:bg-[#3a332c] hover:text-white flex items-center gap-3 md:gap-2 w-full transition-colors`}
                >
                  <Pin className={`${isMobile ? "w-5 h-5" : "w-3 h-3"}`} /> {message.isPinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReport();
                  }}
                  className={`text-left ${isMobile ? "px-6 py-3" : "px-4 py-2"} text-sm md:text-xs text-[#b8aa9d] hover:bg-[#3a332c] hover:text-white flex items-center gap-3 md:gap-2 w-full transition-colors`}
                >
                  <Flag className={`${isMobile ? "w-5 h-5" : "w-3 h-3"}`} /> Report
                </button>
                {isMobile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                    className="text-center px-6 py-3 text-sm text-white bg-[#3a332c] hover:bg-[#4a433c] w-full mt-2 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Reply - Desktop only */}
        {onReply && !isMobile && (
          <button
            onClick={() => onReply(message)}
            className="text-[#b8aa9d] hover:text-white p-1 rounded-full hover:bg-[#3a332c] transition-colors flex items-center justify-center"
            aria-label="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>
        )}

        {/* React - Desktop only */}
        {!isMobile && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="text-[#b8aa9d] hover:text-white p-1 rounded-full hover:bg-[#3a332c] transition-colors flex items-center justify-center"
              aria-label="Add reaction"
            >
              <Smile className="w-4 h-4" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-[#26211c] border border-[#53473c] rounded-full shadow-lg p-1 flex gap-1 z-50">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReaction(emoji);
                    }}
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
      <span className="text-xs text-[#b8aa9d] select-none whitespace-nowrap">
        {new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

export default memo(MessageActions);

