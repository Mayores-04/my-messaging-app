"use client";

import {
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { SignIn } from "@clerk/nextjs";
import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";

export default function Dashboard() {

  return (
    <div className="flex min-h-screen bg-[#211811]">
        
    
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
            <div className="text-[#b8aa9d]">
              <p>Welcome to your dashboard. Use the sidebar to navigate.</p>
            </div>
          </div>
     
    </div>
  );
}
