import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useVideoCall(conversation: any) {
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);

  const sendSignal = useMutation(api.videoCalls.sendSignal);
  const clearSignal = useMutation(api.videoCalls.clearSignal);
  const pendingSignals = useQuery(api.videoCalls.getPendingSignals, {
    conversationId: conversation._id as Id<"conversations">,
  });

  // Check for incoming call signals
  useEffect(() => {
    if (pendingSignals && pendingSignals.length > 0) {
      console.log("[VideoCall] Pending signals:", pendingSignals.map((s) => s.type));
      const callRequest = pendingSignals.find((signal) => signal.type === "call-request");
      if (callRequest && !isVideoCallActive) {
        console.log("[VideoCall] Showing incoming call notification");
        setShowIncomingCall(true);
      }
    }
  }, [pendingSignals, isVideoCallActive]);

  const handleStartVideoCall = async () => {
    try {
      console.log("[VideoCall] Starting video call check...");
      
      // Pre-check permissions
      try {
        const getUserMedia =
          navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ||
          (navigator as any).getUserMedia?.bind(navigator) ||
          (navigator as any).webkitGetUserMedia?.bind(navigator) ||
          (navigator as any).mozGetUserMedia?.bind(navigator);

        if (!getUserMedia) {
          console.warn("getUserMedia not found");
        }

        let testStream: MediaStream;

        if (navigator.mediaDevices?.getUserMedia) {
          testStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: true,
          });
        } else if (getUserMedia) {
          testStream = await new Promise<MediaStream>((resolve, reject) => {
            (getUserMedia as any)(
              { video: { facingMode: "user" }, audio: true },
              resolve,
              reject
            );
          });
        } else {
          throw new Error("No media API available");
        }

        testStream.getTracks().forEach((track) => track.stop());
        console.log("[VideoCall] Permission test successful!");
      } catch (permError: any) {
        console.error("[VideoCall] Permission error:", permError);
        let errorMsg = "Cannot start video call:\n\n";
        
        if (permError.name === "NotAllowedError" || permError.name === "PermissionDeniedError") {
          errorMsg += "❌ Camera/microphone permission denied.\n\nPlease:\n1. Tap 'Allow' when prompted\n2. Check browser settings\n3. Grant camera/mic permissions";
        } else if (permError.name === "NotFoundError" || permError.name === "DevicesNotFoundError") {
          errorMsg += "❌ No camera or microphone found.\n\nPlease check:\n1. Device has a camera\n2. Camera is not covered\n3. Try restarting your browser";
        } else if (permError.name === "NotReadableError" || permError.name === "TrackStartError") {
          errorMsg += "❌ Camera is already in use.\n\nPlease:\n1. Close other apps using camera\n2. Refresh the page\n3. Restart your browser";
        } else if (permError.name === "NotSupportedError") {
          errorMsg += "❌ Your browser doesn't support video calls.\n\nPlease use:\n• Chrome on Android\n• Safari on iOS\n• Make sure you're on HTTPS";
        } else if (permError.name === "SecurityError") {
          errorMsg += "❌ Camera access blocked.\n\nPlease:\n1. Make sure URL is HTTPS\n2. Check browser permissions\n3. Try incognito/private mode";
        } else if (permError.name === "TypeError") {
          if (window.location.protocol === "http:" && !window.location.hostname.includes("localhost")) {
            errorMsg += "⚠️ Warning: You are using HTTP (insecure).\nMost browsers block camera access on HTTP.\n\nIf it fails, please switch to HTTPS or use localhost.";
          } else {
            errorMsg += "❌ Browser doesn't support media access.\n\nPlease:\n1. Update your browser\n2. Use Chrome/Safari\n3. Make sure you're on HTTPS";
          }
        } else {
          errorMsg += "❌ " + (permError.message || "Unknown error") + "\n\nBrowser: " + (navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Safari") ? "Safari" : "Other");
        }

        alert(errorMsg + "\n\nAttempting to start call anyway...");
      }

      await sendSignal({
        conversationId: conversation._id,
        toEmail: conversation.otherUserEmail,
        type: "call-request",
      });
      
      console.log("[VideoCall] Call request sent, opening video call modal");
      setIsCallInitiator(true);
      setIsVideoCallActive(true);
    } catch (error) {
      console.error("Failed to initiate call:", error);
      alert("Failed to start video call");
    }
  };

  const handleAcceptCall = async () => {
    try {
      console.log("[VideoCall] Accepting call, checking permissions...");

      const getUserMedia =
        (typeof navigator !== "undefined" &&
          navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices)) ||
        (typeof navigator !== "undefined" && (navigator as any).getUserMedia?.bind(navigator)) ||
        (typeof navigator !== "undefined" && (navigator as any).webkitGetUserMedia?.bind(navigator)) ||
        (typeof navigator !== "undefined" && (navigator as any).mozGetUserMedia?.bind(navigator));

      if (getUserMedia) {
        try {
          const testStream = await new Promise<MediaStream>((resolve, reject) => {
            const constraints = { video: { facingMode: "user" }, audio: true };
            if (navigator.mediaDevices?.getUserMedia) {
              navigator.mediaDevices.getUserMedia(constraints).then(resolve).catch(reject);
            } else {
              (getUserMedia as any)(constraints, resolve, reject);
            }
          });
          testStream.getTracks().forEach((track) => track.stop());
          console.log("[VideoCall] Permission granted, accepting call");
        } catch (e) {
          console.warn("Permission check failed, but proceeding as requested:", e);
        }
      } else {
        console.warn("No getUserMedia found, proceeding as requested");
      }

      // Clear call-request signals before accepting
      if (pendingSignals) {
        const callRequestSignals = pendingSignals.filter((s) => s.type === "call-request");
        console.log("[VideoCall] Clearing call-request signals:", callRequestSignals.length);
        for (const signal of callRequestSignals) {
          await clearSignal({ signalId: signal._id });
        }
      }

      await sendSignal({
        conversationId: conversation._id,
        toEmail: conversation.otherUserEmail,
        type: "call-accepted",
      });

      console.log("[VideoCall] Call accepted, opening video call modal");
      setShowIncomingCall(false);
      setIsCallInitiator(false);
      setIsVideoCallActive(true);
    } catch (permError: any) {
      console.error("Accept call error:", permError);
      let errorMsg = "Cannot accept call: " + (permError.message || "Unknown error");
      alert(errorMsg);
      setShowIncomingCall(false);
    }
  };

  const handleRejectCall = async () => {
    try {
      await sendSignal({
        conversationId: conversation._id,
        toEmail: conversation.otherUserEmail,
        type: "call-rejected",
      });
      setShowIncomingCall(false);
    } catch (error) {
      console.error("Failed to reject call:", error);
    }
  };

  const handleCloseVideoCall = () => {
    setIsVideoCallActive(false);
    setIsCallInitiator(false);
  };

  return {
    isVideoCallActive,
    isCallInitiator,
    showIncomingCall,
    handleStartVideoCall,
    handleAcceptCall,
    handleRejectCall,
    handleCloseVideoCall,
  };
}
