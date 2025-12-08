"use client";

import { AppSidebar } from "@/components/AppSidebar";
import { SignIn } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUserPresence } from "@/hooks/useUserPresence";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  
  // Track user presence and handle offline status
  useUserPresence();

  // Only show hamburger on messages page when no conversation is selected (controlled by messages page component)
  const isMessagesPage = pathname === '/dashboard/messages';

  return (
    <div className="flex min-h-screen bg-[#211811] w-full">
      <Authenticated>
        {isMobile ? (
           <>
             {!isMessagesPage && (
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
             <main className="flex-1 w-full">
                {children}
             </main>
           </>
        ) : (
          <>
            <AppSidebar
              isOpen={sidebarOpen}
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
            <main
              className={cn(
                "flex-1 transition-all duration-300",
                sidebarOpen ? "ml-64" : "ml-20"
              )}
            >
              {children}
            </main>
          </>
        )}
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-center w-full min-h-screen">
          <SignIn routing="hash" />
        </div>
      </Unauthenticated>
    </div>
  );
}
