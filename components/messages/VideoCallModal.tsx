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
    initiator ? "Calling..." : "Waiting for connection..."
  );
  const [processedSignals, setProcessedSignals] = useState<Set<string>>(
    new Set()
  );
  const [connectionState, setConnectionState] = useState<string>("initializing");
  const [callEnded, setCallEnded] = useState(false);

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
        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Your browser doesn't support media devices. Please use a modern browser.");
        }

        // Request with more specific constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
            facingMode: "user"
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        console.log("[VideoCall] Media stream obtained:", {
          videoTracks: stream.getVideoTracks().map(t => ({
            label: t.label,
            settings: t.getSettings(),
            enabled: t.enabled
          })),
          audioTracks: stream.getAudioTracks().map(t => ({
            label: t.label,
            enabled: t.enabled
          }))
        });
        
        setLocalStream(stream);
        setConnectionState("media-ready");
        console.log("[VideoCall] Media stream initialized successfully");
      } catch (error: any) {
        console.error("Failed to get media devices:", error);
        
        let errorMessage = "Failed to access camera/microphone. ";
        
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage += "Permission was denied. Please allow camera and microphone access in your browser settings.";
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          errorMessage += "No camera or microphone found. Please connect a device.";
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          errorMessage += "Camera/microphone is already in use by another application.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage += "Camera doesn't meet requirements. Trying with basic settings...";
          
          // Retry with minimal constraints
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true
            });
            setLocalStream(basicStream);
            return; // Success with basic constraints
          } catch (retryError) {
            errorMessage = "Failed to access camera/microphone even with basic settings.";
          }
        } else if (error.name === "TypeError") {
          errorMessage += "Browser doesn't support media access. Use Chrome, Firefox, or Edge on HTTPS.";
        } else {
          errorMessage += error.message || "Unknown error occurred.";
        }
        
        alert(errorMessage);
        console.log("Error details:", {
          name: error.name,
          message: error.message,
          constraint: error.constraint
        });
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

  // Ensure local video is playing
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log("[VideoCall] Setting local video stream");
      console.log("[VideoCall] Local stream tracks:", {
        video: localStream.getVideoTracks().map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })),
        audio: localStream.getAudioTracks().map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState }))
      });
      localVideoRef.current.srcObject = localStream;
      // Force play
      localVideoRef.current.play().catch(err => {
        console.error("[VideoCall] Error playing local video:", err);
      });
    }
  }, [localStream]);

  // Ensure remote video is playing
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log("[VideoCall] Setting remote video stream");
      console.log("[VideoCall] Remote stream tracks:", {
        video: remoteStream.getVideoTracks().map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })),
        audio: remoteStream.getAudioTracks().map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState }))
      });
      remoteVideoRef.current.srcObject = remoteStream;
      // Force play
      remoteVideoRef.current.play().catch(err => {
        console.error("[VideoCall] Error playing remote video:", err);
      });
    }
  }, [remoteStream]);

  // Initialize peer connection
  useEffect(() => {
    if (!localStream) return;

    console.log(`[VideoCall] Initializing peer connection as ${initiator ? 'initiator' : 'receiver'}`);
    console.log(`[VideoCall] Local stream ready:`, {
      videoTracks: localStream.getVideoTracks().length,
      audioTracks: localStream.getAudioTracks().length
    });

    const newPeer = new SimplePeer({
      initiator,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
        ],
      },
    });

    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      if (!remoteStream) {
        console.log("[VideoCall] Connection timeout - no remote stream received");
        setCallStatus("Connection timeout");
      }
    }, 30000); // 30 seconds timeout

    newPeer.on("signal", async (data) => {
      try {
        console.log("[VideoCall] Sending signal:", data.type);
        const signalType = data.type === "offer" ? "offer" : data.type === "answer" ? "answer" : "candidate";
        await sendSignal({
          conversationId: conversation._id,
          toEmail: conversation.otherUserEmail,
          type: signalType,
          signal: JSON.stringify(data),
        });
        console.log("[VideoCall] Signal sent successfully");
      } catch (error) {
        console.error("[VideoCall] Failed to send signal:", error);
      }
    });

    newPeer.on("stream", (stream) => {
      console.log("[VideoCall] Received remote stream");
      clearTimeout(connectionTimeout);
      setRemoteStream(stream);
      setCallStatus("Connected");
      setConnectionState("connected");
    });

    newPeer.on("connect", () => {
      console.log("[VideoCall] Peer connected");
      setCallStatus("Connected");
      setConnectionState("connected");
    });

    newPeer.on("error", (err) => {
      console.error("[VideoCall] Peer error:", err);
      setCallStatus("Connection error");
      // Only close on critical errors
      if (err.message?.includes("Connection failed") || err.message?.includes("Ice connection failed")) {
        setTimeout(() => {
          setCallEnded(true);
          onClose();
        }, 2000);
      }
    });

    newPeer.on("close", () => {
      console.log("[VideoCall] Peer closed");
      // Only trigger onClose if call was intentionally ended
      if (callEnded) {
        setCallStatus("Call ended");
        setTimeout(() => onClose(), 500);
      }
    });

    setPeer(newPeer);
    peerRef.current = newPeer;

    return () => {
      clearTimeout(connectionTimeout);
      if (newPeer && !newPeer.destroyed) {
        console.log("[VideoCall] Cleaning up peer connection");
        newPeer.destroy();
      }
    };
  }, [localStream, initiator]);

  // Process incoming signals
  useEffect(() => {
    if (!pendingSignals || pendingSignals.length === 0) return;
    if (!peer || peer.destroyed) return;

    const processSignals = async () => {
      for (const signal of pendingSignals) {
        // Skip if already processed
        if (processedSignals.has(signal._id)) {
          console.log("[VideoCall] Signal already processed:", signal._id);
          continue;
        }

        console.log("[VideoCall] Processing signal:", signal.type, signal._id);

        try {
          if (signal.type === "call-ended") {
            console.log("[VideoCall] Received call-ended signal");
            setCallStatus("Call ended by other user");
            setCallEnded(true);
            // Mark as processed before clearing
            setProcessedSignals((prev) => {
              const newSet = new Set(prev);
              newSet.add(signal._id);
              return newSet;
            });
            await clearSignal({ signalId: signal._id }).catch(err => {
              console.log("[VideoCall] Signal already cleared:", err);
            });
            // Immediate cleanup
            setTimeout(() => endCall(), 500);
            return;
          }

          if (signal.type === "call-rejected") {
            console.log("[VideoCall] Call was rejected");
            alert("Call was rejected");
            setProcessedSignals((prev) => {
              const newSet = new Set(prev);
              newSet.add(signal._id);
              return newSet;
            });
            await clearSignal({ signalId: signal._id }).catch(err => {
              console.log("[VideoCall] Signal already cleared:", err);
            });
            endCall();
            return;
          }

          if (signal.signal) {
            try {
              const signalData = JSON.parse(signal.signal);
              console.log("[VideoCall] Signaling peer with:", signalData.type || "candidate");
              
              // Only process WebRTC signals if peer is ready
              if (peer && !peer.destroyed) {
                peer.signal(signalData);
                setProcessedSignals((prev) => {
                  const newSet = new Set(prev);
                  newSet.add(signal._id);
                  return newSet;
                });
              }
            } catch (parseError) {
              console.error("[VideoCall] Failed to parse signal data:", parseError);
            }
          }

          // Clear processed signal with error handling
          await clearSignal({ signalId: signal._id }).catch(err => {
            console.log("[VideoCall] Signal already cleared:", err);
          });
        } catch (error) {
          console.error("[VideoCall] Failed to process signal:", error);
          // Mark as processed even if there was an error
          setProcessedSignals((prev) => {
            const newSet = new Set(prev);
            newSet.add(signal._id);
            return newSet;
          });
        }
      }
    };

    processSignals();
  }, [pendingSignals, peer]);

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
    console.log("[VideoCall] Ending call...");
    setCallEnded(true);
    
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
        <div className="flex items-center gap-2">
          <p className="text-sm text-[#b8aa9d]">{callStatus}</p>
          {connectionState === "initializing" && (
            <span className="text-xs text-yellow-500">(Setting up...)</span>
          )}
          {connectionState === "media-ready" && (
            <span className="text-xs text-blue-500">(Connecting...)</span>
          )}
          {connectionState === "connected" && (
            <span className="text-xs text-green-500">(✓ Connected)</span>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-10">
            <div>Local Stream (YOU): {localStream ? '✓' : '✗'}</div>
            <div>Remote Stream (THEM): {remoteStream ? '✓' : '✗'}</div>
            <div>Peer: {peer && !peer.destroyed ? '✓' : '✗'}</div>
            <div>Connection: {connectionState}</div>
            <div>Role: {initiator ? 'Caller' : 'Receiver'}</div>
          </div>
        )}
        
        {/* Remote Video (Large) - Shows the OTHER person's camera */}
        <div className="relative w-full h-full max-w-6xl max-h-[80vh] bg-[#26211c] rounded-lg overflow-hidden">
          {remoteStream ? (
            <>
              <video
                key="remote-video"
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </>
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
                key="local-video"
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
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
