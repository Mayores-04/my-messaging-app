"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

export function useUserPresence() {
  const setUserOffline = useMutation(api.users.setUserOffline);
  const storeUser = useMutation(api.users.storeUser);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    // Update user as active when component mounts
    storeUser().catch(console.error);

    // Update user presence periodically (every 2 minutes)
    const intervalId = setInterval(() => {
      storeUser().catch(console.error);
    }, 2 * 60 * 1000);

    // Set user as offline only when they close the browser/tab completely
    const handleBeforeUnload = () => {
      setUserOffline().catch(console.error);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Set offline on component unmount (navigation away or sign out)
      setUserOffline().catch(console.error);
    };
  }, [isSignedIn, storeUser, setUserOffline]);
}
