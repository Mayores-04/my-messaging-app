"use client";

import { Archive, Bell, MessageSquare, ChevronRight } from "lucide-react";
import { useUser, useClerk, UserButton, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState, memo } from "react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile?: boolean;
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

function AppSidebarComponent({ isOpen, toggleSidebar, isMobile = false }: AppSidebarProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user } = useUser();
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const clerk = useClerk();
  const avatarSrc = (user as any)?.profileImageUrl ?? (user as any)?.imageUrl ?? undefined;

  return (
    <aside
      className={cn(
        "bg-[#181411] border-r border-[#53473c] transition-all duration-300 z-40",
        isMobile ? "w-full h-full" : "fixed left-0 top-0 h-screen",
        !isMobile && (isOpen ? "w-64" : "w-20")
      )}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#53473c]">
          {(isOpen || isMobile) && (
            <h2 className="text-white font-semibold text-lg">ConnectApp</h2>
          )}
          {!isMobile && (
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
          )}
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
                onClick={() => {
                  setActiveSection(section.id);
                  if (isMobile) toggleSidebar();
                }}
              >
                <Icon className="w-5 h-5 flex shrink-0" />
                {(isOpen || isMobile) && (
                  <span className="text-sm font-medium">{section.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Button at Bottom */}
        <div className="p-6 border-t border-[#53473c]">
          <div className={cn("flex items-center", (isOpen || isMobile) ? "gap-3" : "")}>
            {/* On desktop show Clerk UserButton; on mobile show a custom avatar button that opens a fixed mobile menu */}
            {!isMobile ? (
              <>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-12 h-12",
                      userButtonTrigger: "focus:ring-2 focus:ring-[#e67919]",
                      userButtonPopoverCard: `bg-[#181411] border border-[#53473c]`,
                      userButtonPopoverActionButton: `text-white hover:bg-[#3a322e]`,
                    },
                  }}
                />
                {(isOpen || isMobile) && (
                  <div className="flex flex-col text-sm">
                    <span className="text-white font-medium truncate max-w-[140px]">{user?.fullName}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setMobileUserMenuOpen((s) => !s)}
                  className="w-12 h-12 rounded-full bg-[#3a322e] flex items-center justify-center text-white"
                  aria-label="Open user menu"
                >
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt={user?.fullName || "User"} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm">{user?.fullName?.[0] || "U"}</span>
                  )}
                </button>
                {(isOpen || isMobile) && (
                  <div className="flex flex-col text-sm">
                    <span className="text-white font-medium truncate max-w-[140px]">{user?.fullName}</span>
                  </div>
                )}

                {/* Mobile user menu (fixed) */}
                {mobileUserMenuOpen && (
                  <div className="fixed left-4 right-4 bottom-4 z-50 bg-[#181411] border border-[#53473c] rounded-lg p-3 shadow-lg">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setMobileUserMenuOpen(false);
                          try {
                            clerk?.openUserProfile?.();
                          } catch (e) {
                            // fallback: navigate to local profile page
                            window.location.href = '/profile';
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-[#3a322e] rounded"
                      >
                        Manage account
                      </button>
                      <SignOutButton>
                        <button className="w-full text-left px-4 py-2 text-white hover:bg-[#3a322e] rounded">Sign out</button>
                      </SignOutButton>
                      <button onClick={() => setMobileUserMenuOpen(false)} className="w-full px-4 py-2 text-center text-sm text-[#b8aa9d] hover:bg-[#3a322e] rounded">Close</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export const AppSidebar = memo(AppSidebarComponent);
