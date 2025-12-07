"use client";
import { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "../ui/button";
import { VideoIcon, VideoOffIcon, MicIcon, MicOffIcon, PhoneOff } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface VideoCallModalProps {
  conversation: any;
  onClose: () => void;
  initiator: boolean;
}

export default function VideoCallModal({
  conversation,
  onClose,
  initiator,
}: VideoCallModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState<string>(
    initiator ? "Calling..." : "Incoming call..."
  );
  const [processedSignals, setProcessedSignals] = useState<Set<string>>(
    new Set()
  );

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);

  const sendSignal = useMutation(api.videoCalls.sendSignal);
  const clearSignal = useMutation(api.videoCalls.clearSignal);
  const clearConversationSignals = useMutation(
    api.videoCalls.clearConversationSignals
  );
  const pendingSignals = useQuery(api.videoCalls.getPendingSignals, {
    conversationId: conversation._id as Id<"conversations">,
  });

  // Initialize media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Failed to get media devices:", error);
        alert("Failed to access camera/microphone. Please check permissions.");
        onClose();
      }
    };

    initMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Initialize peer connection
  useEffect(() => {
    if (!localStream) return;

    const newPeer = new SimplePeer({
      initiator,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    newPeer.on("signal", async (data) => {
      try {
        const signalType = data.type === "offer" ? "offer" : data.type === "answer" ? "answer" : "candidate";
        await sendSignal({
          conversationId: conversation._id,
          toEmail: conversation.otherUserEmail,
          type: signalType,
          signal: JSON.stringify(data),
        });
      } catch (error) {
        console.error("Failed to send signal:", error);
      }
    });

    newPeer.on("stream", (stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setCallStatus("Connected");
    });

    newPeer.on("connect", () => {
      setCallStatus("Connected");
    });

    newPeer.on("error", (err) => {
      console.error("Peer error:", err);
      setCallStatus("Connection error");
    });

    newPeer.on("close", () => {
      setCallStatus("Call ended");
      setTimeout(() => onClose(), 1000);
    });

    setPeer(newPeer);
    peerRef.current = newPeer;

    return () => {
      if (newPeer) {
        newPeer.destroy();
      }
    };
  }, [localStream, initiator]);

  // Process incoming signals
  useEffect(() => {
    if (!pendingSignals || !peer) return;

    const processSignals = async () => {
      for (const signal of pendingSignals) {
        // Skip if already processed
        if (processedSignals.has(signal._id)) continue;

        try {
          if (signal.type === "call-ended") {
            await clearSignal({ signalId: signal._id });
            endCall();
            return;
          }

          if (signal.signal) {
            const signalData = JSON.parse(signal.signal);
            
            // Only process WebRTC signals if peer is ready
            if (peer && !peer.destroyed) {
              peer.signal(signalData);
              setProcessedSignals((prev) => new Set(prev).add(signal._id));
            }
          }

          // Clear processed signal
          await clearSignal({ signalId: signal._id });
        } catch (error) {
          console.error("Failed to process signal:", error);
        }
      }
    };

    processSignals();
  }, [pendingSignals, peer, processedSignals]);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    try {
      // Send end call signal
      await sendSignal({
        conversationId: conversation._id,
        toEmail: conversation.otherUserEmail,
        type: "call-ended",
      });

      // Clean up
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
      await clearConversationSignals({ conversationId: conversation._id });
    } catch (error) {
      console.error("Failed to end call:", error);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-[#181411] text-white">
        <h2 className="text-xl font-semibold">
          {conversation.otherUserName}
        </h2>
        <p className="text-sm text-[#b8aa9d]">{callStatus}</p>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* Remote Video (Large) */}
        <div className="relative w-full h-full max-w-6xl max-h-[80vh] bg-[#26211c] rounded-lg overflow-hidden">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center text-[#b8aa9d]">
                <div className="w-24 h-24 rounded-full bg-[#181411] flex items-center justify-center text-4xl mx-auto mb-4">
                  {conversation.otherUserName[0]}
                </div>
                <p>Waiting for {conversation.otherUserName}...</p>
              </div>
            </div>
          )}

          {/* Local Video (Small PIP) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-[#181411] rounded-lg overflow-hidden shadow-lg border-2 border-[#53473c]">
            {localStream && isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-[#26211c]">
                <VideoOffIcon className="w-12 h-12 text-[#b8aa9d]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-[#181411] flex justify-center gap-4">
        <Button
          onClick={toggleVideo}
          className={`rounded-full w-14 h-14 ${
            isVideoEnabled
              ? "bg-[#26211c] hover:bg-[#53473c]"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isVideoEnabled ? (
            <VideoIcon className="w-6 h-6" />
          ) : (
            <VideoOffIcon className="w-6 h-6" />
          )}
        </Button>

        <Button
          onClick={toggleAudio}
          className={`rounded-full w-14 h-14 ${
            isAudioEnabled
              ? "bg-[#26211c] hover:bg-[#53473c]"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isAudioEnabled ? (
            <MicIcon className="w-6 h-6" />
          ) : (
            <MicOffIcon className="w-6 h-6" />
          )}
        </Button>

        <Button
          onClick={endCall}
          className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
