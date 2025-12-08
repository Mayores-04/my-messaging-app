import {
  ImageIcon,
  PlusCircleIcon,
  ScanFace,
  Send,
  SmileIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { RefObject } from "react";

interface MessageInputProps {
  messageText: string;
  sending: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onTyping: (text: string) => void;
  onSend: (e: React.FormEvent) => void;
}

export default function MessageInput({
  messageText,
  sending,
  inputRef,
  onTyping,
  onSend,
}: MessageInputProps) {
  return (
    <form onSubmit={onSend} className="p-4 border-t border-[#53473c] bg-[#181411]">
      <div className="flex gap-2 items-center">
        <PlusCircleIcon className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer" />
        <ImageIcon className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer" />
        <ScanFace className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer" />
        <div className="flex-1 px-2 flex items-center bg-[#211811] text-white placeholder-[#b8aa9d] rounded-lg focus-within:ring-2 focus-within:ring-[#e67919]">
          <SmileIcon className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={messageText}
            onChange={(e) => onTyping(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-2 py-2 bg-transparent outline-none rounded-lg"
            disabled={sending}
          />
        </div>
        <Button
          type="submit"
          disabled={!messageText.trim() || sending}
          className="bg-[#e67919] hover:bg-[#cf6213] disabled:bg-[#53473c] text-white rounded-lg px-4 py-2 transition-colors"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}
