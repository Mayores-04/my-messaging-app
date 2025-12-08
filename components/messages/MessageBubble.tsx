import Image from "next/image";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  conversation: any;
  isLastRead: boolean;
}

export default function MessageBubble({
  message,
  isOwn,
  conversation,
  isLastRead,
}: MessageBubbleProps) {
  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
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
      {/* Show other user's avatar under the latest message they have read */}
      {isLastRead && message.readByOther && (
        <div className="relative -bottom-1 -right-1">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-[#53473c]">
            {conversation.otherUserAvatar ? (
              <Image
                src={conversation.otherUserAvatar}
                alt={conversation.otherUserName}
                width={24}
                height={24}
              />
            ) : (
              <span className="text-xs text-white flex items-center justify-center h-6">
                {conversation.otherUserName[0]}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
