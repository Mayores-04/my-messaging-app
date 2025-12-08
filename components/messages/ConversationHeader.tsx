import Image from "next/image";
import { ArrowLeft, MenuIcon, PhoneCall, VideoIcon } from "lucide-react";
import { Button } from "../ui/button";

interface ConversationHeaderProps {
  conversation: any;
  isTyping: boolean | undefined;
  userStatus: { isOnline: boolean } | undefined;
  onBack: () => void;
  onVideoCall: () => void;
}

export default function ConversationHeader({
  conversation,
  isTyping,
  userStatus,
  onBack,
  onVideoCall,
}: ConversationHeaderProps) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-[#53473c] bg-[#181411]">
      <div className="flex flex-row w-full gap-3 items-center">
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
        <VideoIcon
          onClick={onVideoCall}
          className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer ml-4"
        />
        <MenuIcon className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer ml-4" />
      </div>
    </div>
  );
}
