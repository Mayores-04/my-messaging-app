"use client";

import { AppSidebar } from "@/components/AppSidebar";
import { SignIn } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#211811]">
      <Authenticated>
        <AppSidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            sidebarOpen ? "ml-64" : "ml-16"
          )}
        >
          {children}
        </main>
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-center w-full min-h-screen">
          <SignIn routing="hash" />
        </div>
      </Unauthenticated>
    </div>
  );
}
