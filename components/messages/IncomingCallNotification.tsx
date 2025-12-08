import { Button } from "../ui/button";
import Image from "next/image";

interface IncomingCallNotificationProps {
  conversation: any;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallNotification({
  conversation,
  onAccept,
  onReject,
}: IncomingCallNotificationProps) {
  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-[#181411] border border-[#53473c] rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#26211c] flex items-center justify-center text-white font-semibold mx-auto mb-4">
            {conversation.otherUserAvatar ? (
              <Image
                src={conversation.otherUserAvatar}
                alt={conversation.otherUserName}
                width={80}
                height={80}
              />
            ) : (
              <span className="text-2xl">
                {conversation.otherUserName[0]}
              </span>
            )}
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">
            {conversation.otherUserName}
          </h3>
          <p className="text-[#b8aa9d] mb-6">Incoming video call...</p>
          <div className="flex gap-4">
            <Button
              onClick={onReject}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Decline
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
