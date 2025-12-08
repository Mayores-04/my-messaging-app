import Image from "next/image";
import { ArrowLeft, MenuIcon, PhoneCall, VideoIcon, Check, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  const acceptConversation = useMutation(api.messages.acceptConversation);
  const deleteConversation = useMutation(api.messages.deleteConversation);

  const myEmail = conversation.user1Email === conversation.otherUserEmail ? conversation.user2Email : conversation.user1Email;
  const isAccepted = conversation.acceptedBy?.includes(myEmail) || false;
  const isRestricted = !isAccepted;

  const handleAccept = async () => {
    await acceptConversation({ conversationId: conversation._id });
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation({ conversationId: conversation._id });
      onBack();
    }
  };

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
      <div className="flex flex-row items-center gap-4">
        {isRestricted ? (
          <>
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-400 flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={handleAccept}
              className="text-[#e67919] hover:text-[#cf6213] flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#e67919]/10 hover:bg-[#e67919]/20 transition-colors text-sm font-medium"
            >
              <Check className="w-4 h-4" />
              Accept
            </button>
          </>
        ) : (
          <>
            <PhoneCall className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer" />
            <VideoIcon
              onClick={onVideoCall}
              className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer"
            />
            <MenuIcon className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer" />
          </>
        )}
      </div>
    </div>
  );
}
