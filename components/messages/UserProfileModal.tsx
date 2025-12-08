import { X, Mail, User } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useUser } from "@clerk/nextjs";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    avatar?: string;
    isOnline?: boolean;
  };
}

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#26211c] border border-[#53473c] rounded-2xl w-full max-w-sm overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header/Cover */}
        <div className="h-24 bg-linear-to-r from-[#e67919] to-[#53473c] relative">
          <Button 
            onClick={onClose}
            className="absolute top-0 right-2 p-1 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Avatar */}
        <div className="relative px-6 pb-6">
          <div className="absolute -top-30 left-1/2 -translate-x-1/2 p-1 bg-[#26211c] rounded-full">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#181411] flex items-center justify-center border-2 border-[#53473c]">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-3xl text-[#b8aa9d] font-bold">{user.name[0]}</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mt-16 space-y-4 text-center">
            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-[#b8aa9d] text-sm flex items-center justify-center gap-1 mt-1">
                <span className={`w-2 h-2 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-500"} inline-block`}></span>
                {user.isOnline ? "Active now" : "Offline"}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#53473c]/50 text-left">
              <div className="flex items-center gap-3 text-[#b8aa9d]">
                <div className="p-2 bg-[#181411] rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs opacity-50">Email</span>
                  <span className="text-sm text-white">{user.email}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-[#b8aa9d]">
                <div className="p-2 bg-[#181411] rounded-lg">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs opacity-50">Username</span>
                  <span className="text-sm text-white">{user.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
