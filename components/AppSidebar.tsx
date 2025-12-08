"use client";

import { Archive, Bell, MessageSquare, ChevronRight } from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState, memo } from "react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const sections = [
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    href: "/dashboard/messages",
  },
  {
    id: "archived",
    label: "Archived",
    icon: Archive,
    href: "/dashboard/archived",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    href: "/dashboard/notifications",
  },
];

function AppSidebarComponent({ isOpen, toggleSidebar }: AppSidebarProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user } = useUser();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-[#181411] border-r border-[#53473c] transition-all duration-300 z-40",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#53473c]">
          {isOpen && (
            <h2 className="text-white font-semibold text-lg">ConnectApp</h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded hover:bg-[#3a322e] text-white"
            aria-label="Toggle sidebar"
          >
            <ChevronRight
              className={cn(
                "w-5 h-5 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-4 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.id}
                href={section.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  "text-[#b8aa9d] hover:bg-[#3a322e] hover:text-white",
                  activeSection === section.id && "bg-[#3a322e] text-white"
                )}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon className="w-5 h-5 flex shrink-0" />
                {isOpen && (
                  <span className="text-sm font-medium">{section.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Button at Bottom */}
        <div className="p-6 border-t border-[#53473c]">
          <div className={cn("flex items-center", isOpen ? "gap-3" : "")}>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-12 h-12",
                  userButtonTrigger: "focus:ring-2 focus:ring-[#e67919]",
                  userButtonPopoverCard: "bg-[#181411] border border-[#53473c]",
                  userButtonPopoverActionButton: "text-white hover:bg-[#3a322e]",
                },
              }}
            />
            {isOpen && (
              <div className="flex flex-col text-sm">
                <span className="text-white font-medium truncate max-w-[140px]">{user?.fullName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export const AppSidebar = memo(AppSidebarComponent);
