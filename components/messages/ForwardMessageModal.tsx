import { useState, useEffect } from "react";
import { X, Search, Send, User, UserCheck } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: any;
}

export default function ForwardMessageModal({ isOpen, onClose, message }: ForwardMessageModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const users = useQuery(api.users.searchUsers, { searchTerm });
  const friends = useQuery(api.friends.getFriendsForCurrentUser);
  const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation);
  const sendMessage = useMutation(api.messages.sendMessage);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSelectedUsers([]);
      setIsSending(false);
    }
  }, [isOpen]);

  const handleForward = async () => {
    if (selectedUsers.length === 0 || isSending) return;

    setIsSending(true);
    try {
      // Send to all selected users
      await Promise.all(selectedUsers.map(async (email) => {
        // 1. Get or create conversation
        const conversationId = await getOrCreateConversation({ otherUserEmail: email });
        
        // 2. Send message
        await sendMessage({
          conversationId,
          body: message.body || "",
          images: message.images,
        });
      }));
      
      onClose();
      alert("Message forwarded successfully");
    } catch (error) {
      console.error("Failed to forward message:", error);
      alert("Failed to forward message");
    } finally {
      setIsSending(false);
    }
  };

  const toggleUserSelection = (email: string) => {
    if (selectedUsers.includes(email)) {
      setSelectedUsers(selectedUsers.filter(e => e !== email));
    } else {
      setSelectedUsers([...selectedUsers, email]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#26211c] border border-[#53473c] rounded-lg w-full max-w-md mx-4 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-[#53473c] flex items-center justify-between">
          <h3 className="text-white font-semibold">Forward Message</h3>
          <button onClick={onClose} className="text-[#b8aa9d] hover:text-white transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#53473c]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#b8aa9d]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e1a16] border border-[#53473c] rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#e67919]"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2">
          {users === undefined ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-[#e67919] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-[#b8aa9d] py-4 text-sm">No users found</div>
          ) : (
            <div className="space-y-1">
              {users.map((user: any) => {
                const isFriend = friends?.some((f: any) => f.email === user.email);
                return (
                  <div
                    key={user._id}
                    onClick={() => toggleUserSelection(user.email)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(user.email) ? "bg-[#e67919]/20 border border-[#e67919]/50" : "hover:bg-[#3a332c] border border-transparent"
                    }`}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#53473c] shrink-0">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.fullName || "User"} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium truncate">{user.fullName || user.firstName || "Unknown User"}</p>
                        {isFriend && (
                          <span className="bg-[#e67919]/20 text-[#e67919] text-[10px] px-1.5 py-0.5 rounded border border-[#e67919]/30 font-normal flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            Friend
                          </span>
                        )}
                      </div>
                      <p className="text-[#b8aa9d] text-xs truncate">{user.email}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedUsers.includes(user.email) ? "bg-[#e67919] border-[#e67919]" : "border-[#53473c]"
                    }`}>
                      {selectedUsers.includes(user.email) && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#53473c] flex justify-end">
          <button
            onClick={handleForward}
            disabled={selectedUsers.length === 0 || isSending}
            className="bg-[#e67919] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d56f15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
