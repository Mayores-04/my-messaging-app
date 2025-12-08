"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { redirect } from "next/navigation";

export default function Dashboard() {
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    storeUser()
      .then(() => console.log("User stored successfully"))
      .catch((err) => console.error("Failed to store user:", err));
  }, [storeUser]);

  return redirect('/dashboard/messages');
    // <div className="max-w-7xl mx-auto">
    //   <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
    //   <div className="text-[#b8aa9d]">
    //     <p>Welcome to your dashboard. Use the sidebar to navigate.</p>
    //   </div>
    // </div>
}
