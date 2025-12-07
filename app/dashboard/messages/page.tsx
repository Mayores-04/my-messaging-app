"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ConversationsList from "@/components/messages/ConversationsList";
import ConversationView from "@/components/messages/ConversationView";

export default function MessagesPage() {
  const storeUser = useMutation(api.users.storeUser);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  useEffect(() => {
    storeUser()
      .then(() => console.log("User stored in messages page"))
      .catch((err) => console.error("Failed to store user:", err));
  }, [storeUser]);

  return (
    <div className="flex gap-0 w-full h-screen">
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

