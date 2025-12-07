"use client";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import {
  ArrowLeft,
  ImageIcon,
  MenuIcon,
  PhoneCall,
  PlusCircleIcon,
  ScanFace,
  Send,
  SmileIcon,
  ThumbsUpIcon,
  VideoIcon,
} from "lucide-react";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import VideoCallModal from "./VideoCallModal";
import { Id } from "@/convex/_generated/dataModel";

export default function ConversationView({ conversation, onBack }: any) {
  const messages = useQuery(api.messages.getMessagesForConversation, {
    conversationId: conversation._id,
  });
  const isTyping = useQuery(api.messages.isOtherUserTyping, {
    conversationId: conversation._id,
    otherUserEmail: conversation.otherUserEmail,
  });
  const userStatus = useQuery(api.users.getUserOnlineStatus, {
    userEmail: conversation.otherUserEmail,
  });
  const sendMessage = useMutation(api.messages.sendMessage);
  const setTypingStatus = useMutation(api.messages.setTyping);
  const markAsRead = useMutation(api.messages.markConversationAsRead);
  const sendSignal = useMutation(api.videoCalls.sendSignal);
  const clearSignal = useMutation(api.videoCalls.clearSignal);
  const pendingSignals = useQuery(api.videoCalls.getPendingSignals, {
    conversationId: conversation._id as Id<"conversations">,
  });
  
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);

  // Scroll to bottom immediately when messages load - use useLayoutEffect to avoid flash
  useLayoutEffect(() => {
    if (messages && messages.length > 0 && messagesContainerRef.current) {
      if (isInitialLoadRef.current) {
        // Instant scroll to bottom on initial load, before paint
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
        isInitialLoadRef.current = false;
      }
    }
  }, [messages]);

  // Smooth scroll for new messages after initial load
  useEffect(() => {
    if (
      messages &&
      messages.length > 0 &&
      !isInitialLoadRef.current &&
      messagesContainerRef.current
    ) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages?.length]);

  // Reset initial load flag when conversation changes
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [conversation._id]);

  // Mark messages as read when conversation opens or new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      markAsRead({ conversationId: conversation._id });
    }
  }, [messages, conversation._id, markAsRead]);

  const handleTyping = (text: string) => {
    setMessageText(text);

    // Set typing to true
    setTypingStatus({
      conversationId: conversation._id,
      isTyping: true,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to false after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus({
        conversationId: conversation._id,
        isTyping: false,
      });
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    // Clear typing indicator immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTypingStatus({
      conversationId: conversation._id,
      isTyping: false,
    });

    setSending(true);
    try {
      await sendMessage({
        conversationId: conversation._id,
        body: messageText.trim(),
      });
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTypingStatus({
        conversationId: conversation._id,
        isTyping: false,
      });
    };
  }, [conversation._id, setTypingStatus]);

  // Check for incoming call signals
  useEffect(() => {
    if (pendingSignals && pendingSignals.length > 0) {
      console.log("[ConversationView] Pending signals:", pendingSignals.map(s => s.type));
      const callRequest = pendingSignals.find(
        (signal) => signal.type === "call-request"
      );
      if (callRequest && !isVideoCallActive) {
        console.log("[ConversationView] Showing incoming call notification");
        setShowIncomingCall(true);
      }
    }
  }, [pendingSignals, isVideoCallActive]);

  const handleStartVideoCall = async () => {
    try {
      console.log("[ConversationView] Starting video call check...");
      console.log("[ConversationView] Protocol:", window.location.protocol);
      console.log("[ConversationView] Hostname:", window.location.hostname);
      console.log("[ConversationView] Full URL:", window.location.href);
      console.log("[ConversationView] Navigator exists:", typeof navigator !== 'undefined');
      console.log("[ConversationView] MediaDevices exists:", !!navigator?.mediaDevices);
      console.log("[ConversationView] getUserMedia exists:", !!navigator?.mediaDevices?.getUserMedia);
      
      // Check for HTTPS (except localhost) - more important than browser check
      if (typeof window !== 'undefined' && 
          window.location.protocol !== 'https:' && 
          !window.location.hostname.includes('localhost') && 
          window.location.hostname !== '127.0.0.1') {
        alert("⚠️ Video calls require HTTPS.\n\nPlease use:\nhttps://jm-messaging-app.vercel.app\n\nNot:\nhttp://jm-messaging-app.vercel.app");
        return;
      }

      // Check if browser supports media devices (should work on modern mobile browsers)
      if (typeof navigator === 'undefined' || 
          !navigator.mediaDevices || 
          !navigator.mediaDevices.getUserMedia) {
        console.error("[ConversationView] Media devices not supported:", {
          navigator: typeof navigator,
          mediaDevices: !!navigator?.mediaDevices,
          getUserMedia: !!navigator?.mediaDevices?.getUserMedia
        });
        alert("Your browser doesn't support video calls. Please use:\n- Chrome/Safari on iOS\n- Chrome on Android\n- Make sure you're using HTTPS");
        return;
      }

      // Pre-check permissions before starting the call
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true
        });
        // Immediately stop the test stream
        testStream.getTracks().forEach(track => track.stop());
      } catch (permError: any) {
        let errorMsg = "Cannot start video call: ";
        if (permError.name === "NotAllowedError" || permError.name === "PermissionDeniedError") {
          errorMsg += "Camera/microphone permission denied. Please allow access when prompted.";
        } else if (permError.name === "NotFoundError" || permError.name === "DevicesNotFoundError") {
          errorMsg += "No camera or microphone found. Please check your device.";
        } else if (permError.name === "NotReadableError" || permError.name === "TrackStartError") {
          errorMsg += "Camera/microphone is being used by another application.";
        } else if (permError.name === "NotSupportedError") {
          errorMsg += "Your browser doesn't support camera access on this device.";
        } else if (permError.name === "SecurityError") {
          errorMsg += "Camera access blocked. Make sure you're using HTTPS.";
        } else {
          errorMsg += permError.message || "Unknown error";
        }
        alert(errorMsg);
        return;
      }

      // Permissions granted, start the call
      await sendSignal({
        conversationId: conversation._id,
        toEmail: conversation.otherUserEmail,
        type: "call-request",
      });
      console.log("[ConversationView] Call request sent, opening video call modal");
      setIsCallInitiator(true);
      setIsVideoCallActive(true);
    } catch (error) {
      console.error("Failed to initiate call:", error);
      alert("Failed to start video call");
    }
  };

  const handleAcceptCall = async () => {
    // Pre-check permissions before accepting
    try {
      if (typeof navigator === 'undefined' || 
          !navigator.mediaDevices || 
          !navigator.mediaDevices.getUserMedia) {
        alert("Your browser doesn't support video calls. Please update your browser.");
        setShowIncomingCall(false);
        return;
      }

      const testStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true
      });
      testStream.getTracks().forEach(track => track.stop());
      
      // Clear call-request signals before accepting
      if (pendingSignals) {
        const callRequestSignals = pendingSignals.filter(s => s.type === "call-request");
        console.log("[ConversationView] Clearing call-request signals:", callRequestSignals.length);
        for (const signal of callRequestSignals) {
          await clearSignal({ signalId: signal._id });
        }
      }
      
      // Send acceptance signal
      await sendSignal({
        conversationId: conversation._id,
        toEmail: conversation.otherUserEmail,
        type: "call-accepted",
      });
      
      console.log("[ConversationView] Call accepted, opening video call modal");
      setShowIncomingCall(false);
      setIsCallInitiator(false);
      setIsVideoCallActive(true);
    } catch (permError: any) {
      let errorMsg = "Cannot accept call: ";
      if (permError.name === "NotAllowedError" || permError.name === "PermissionDeniedError") {
        errorMsg += "Please allow camera/microphone access when prompted.";
      } else if (permError.name === "NotFoundError" || permError.name === "DevicesNotFoundError") {
        errorMsg += "No camera or microphone found on your device.";
      } else if (permError.name === "NotReadableError" || permError.name === "TrackStartError") {
        errorMsg += "Camera/microphone is being used by another app.";
      } else if (permError.name === "NotSupportedError") {
        errorMsg += "Camera access not supported on this device.";
      } else if (permError.name === "SecurityError") {
        errorMsg += "Camera access blocked for security reasons.";
      } else {
        errorMsg += permError.message || "Unknown error";
      }
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

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#53473c] bg-[#181411]">
        <div className="flex flex-row w-full gap-3 items-center ">
          <Button
            onClick={onBack}
            className="md:hidden text-white hover:text-[#e67919]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#181411] flex items-center justify-center text-white font-semibold">
            {conversation.otherUserAvatar ? (
              <Image
                src={conversation.otherUserAvatar}
                alt={conversation.otherUserName}
                width={40}
                height={40}
              />
            ) : (
              <span className="text-sm">{conversation.otherUserName[0]}</span>
            )}
          </div>
          <div>
            <h2 className="text-white font-semibold">
              {conversation.otherUserName}
            </h2>
            <p className="text-[#b8aa9d] text-xs">
              {isTyping
                ? "typing..."
                : userStatus?.isOnline
                  ? "Active now"
                  : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex flex-row">
          <PhoneCall className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer" />
          <VideoIcon
            onClick={handleStartVideoCall}
            className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer ml-4"
          />
          <MenuIcon className="w-5 h-5 text-white hover:text-[#e67919] cursor-pointer ml-4" />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages === undefined ? (
          <div className="text-[#b8aa9d] text-center">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-[#b8aa9d] text-center">
            No messages yet. Send the first message!
          </div>
        ) : (
          messages.map((message: any) => {
            const isOwn = message.senderEmail !== conversation.otherUserEmail;
            return (
              <div
                key={message._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? "bg-[#e67919] text-white"
                      : "bg-[#26211c] text-white border border-[#53473c]"
                  }`}
                >
                  <p className="wrap-break-word">{message.body}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      isOwn ? "text-[#211811]" : "text-[#b8aa9d]"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#26211c] border border-[#53473c] rounded-lg px-4 py-3">
              <div className="flex gap-1 items-end h-6">
                <span className="w-2.5 h-2.5 bg-[#b8aa9d] rounded-full typing-dot-1"></span>
                <span className="w-2.5 h-2.5 bg-[#b8aa9d] rounded-full typing-dot-2"></span>
                <span className="w-2.5 h-2.5 bg-[#b8aa9d] rounded-full typing-dot-3"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Message*/}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-[#53473c] bg-[#181411]"
      >
        <div className="flex gap-2 items-center">
          <PlusCircleIcon className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer" />
          <ImageIcon className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer" />
          <ScanFace className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer" />
          <div className="flex-1 px-2 flex items-center bg-[#211811] text-white placeholder-[#b8aa9d] rounded-lg  focus-within:ring-2 focus-within:ring-[#e67919]">
            <SmileIcon className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer" />
            <input
              type="text"
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-2 py-2 bg-transparent outline-none rounded-lg"
              disabled={sending}
            />
          </div>
          <Button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="bg-[#e67919] hover:bg-[#cf6213] disabled:bg-[#53473c] text-white rounded-lg px-4 py-2 transition-colors"
          > 
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>

      {/* Incoming Call Notification */}
      {showIncomingCall && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#181411] border border-[#53473c] rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[#26211c] flex items-center justify-center text-white font-semibold mx-auto mb-4">
                {conversation.otherUserAvatar ? (
                  <Image
                    src={conversation.otherUserAvatar}
                    alt={conversation.otherUserName}
                    width={80}
                    height={80}
                  />
                ) : (
                  <span className="text-2xl">
                    {conversation.otherUserName[0]}
                  </span>
                )}
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                {conversation.otherUserName}
              </h3>
              <p className="text-[#b8aa9d] mb-6">Incoming video call...</p>
              <div className="flex gap-4">
                <Button
                  onClick={handleRejectCall}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Decline
                </Button>
                <Button
                  onClick={handleAcceptCall}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {isVideoCallActive && (
        <VideoCallModal
          conversation={conversation}
          onClose={handleCloseVideoCall}
          initiator={isCallInitiator}
        />
      )}
    </div>
  );
}
