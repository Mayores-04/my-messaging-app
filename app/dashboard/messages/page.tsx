"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ConversationsList from "@/components/messages/ConversationsList";
import ConversationView from "@/components/messages/ConversationView";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MessagesPage() {
  const storeUser = useMutation(api.users.storeUser);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    storeUser()
      .then(() => console.log("User stored in messages page"))
      .catch((err) => console.error("Failed to store user:", err));
  }, [storeUser]);

  return (
    <div className="flex gap-0 w-full h-screen relative">
      {/* Hamburger menu - only show on mobile when viewing conversation list */}
      {isMobile && !selectedConversation && (
        <div className="fixed top-4 right-4 z-50">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-[#3a322e]">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 bg-[#181411] border-r border-[#53473c] text-white border-none">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <AppSidebar 
                isOpen={true} 
                toggleSidebar={() => setSidebarOpen(false)} 
                isMobile={true}
              />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Conversations Sidebar */}
      <aside className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-80 bg-[#181411] border-[#53473c] border-r-2 p-5 overflow-hidden h-full flex flex-col`}>
        <ConversationsList 
          onSelectConversation={setSelectedConversation}
          selectedId={selectedConversation?._id}
        />
      </aside>

      {/* Conversation View */}
      <section className={`${selectedConversation ? 'block' : 'hidden md:block'} flex-1 flex flex-col bg-[#211811]`}>
        {selectedConversation ? (
          <ConversationView 
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#b8aa9d]">
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

