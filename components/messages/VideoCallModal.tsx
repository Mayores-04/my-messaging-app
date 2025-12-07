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
  const isConnectedRef = useRef(false);
  const isIntentionalCloseRef = useRef(false);

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
        // Support for legacy APIs (allow any browser implementation)
        const getUserMedia = 
          navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ||
          (navigator as any).getUserMedia?.bind(navigator) ||
          (navigator as any).webkitGetUserMedia?.bind(navigator) ||
          (navigator as any).mozGetUserMedia?.bind(navigator);

        if (!getUserMedia) {
          throw new Error("Your browser doesn't support media devices.");
        }

        // Request with mobile-friendly constraints
        const stream = await new Promise<MediaStream>((resolve, reject) => {
          const constraints = {
            video: {
              width: { min: 320, ideal: 1280, max: 1920 },
              height: { min: 240, ideal: 720, max: 1080 },
              frameRate: { ideal: 24, max: 30 },
              facingMode: "user"
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          };

          if (navigator.mediaDevices?.getUserMedia) {
            navigator.mediaDevices.getUserMedia(constraints).then(resolve).catch(reject);
          } else {
            // Legacy callback style
            (getUserMedia as any)(constraints, resolve, reject);
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
    const video = localVideoRef.current;
    if (localStream && video) {
      // Prevent resetting if already set to the same stream
      if (video.srcObject === localStream) {
        return;
      }

      console.log("[VideoCall] Setting local video stream");
      video.srcObject = localStream;
      
      // Force play with error handling
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log("[VideoCall] Local video playing successfully"))
          .catch(err => {
            if (err.name === 'AbortError') {
              console.log("[VideoCall] Local video play interrupted (likely due to update)");
            } else {
              console.error("[VideoCall] Error playing local video:", err);
            }
          });
      }
    }
  }, [localStream]);

  // Ensure remote video is playing
  useEffect(() => {
    const video = remoteVideoRef.current;
    if (remoteStream && video) {
      // Prevent resetting if already set to the same stream
      if (video.srcObject === remoteStream) {
        console.log("[VideoCall] Remote video stream already set, skipping update");
        return;
      }

      console.log("[VideoCall] ====== SETTING UP REMOTE VIDEO ======");
      console.log("[VideoCall] Remote stream tracks:", {
        video: remoteStream.getVideoTracks().map(t => ({ 
          id: t.id, 
          enabled: t.enabled, 
          readyState: t.readyState,
          muted: t.muted,
          settings: t.getSettings()
        })),
        audio: remoteStream.getAudioTracks().map(t => ({ 
          id: t.id, 
          enabled: t.enabled, 
          readyState: t.readyState 
        }))
      });
      
      video.srcObject = remoteStream;
      
      // Add event listeners to debug video loading
      video.onloadedmetadata = () => {
        console.log("[VideoCall] Remote video metadata loaded:", {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          duration: video.duration
        });
      };
      
      video.onloadeddata = () => {
        console.log("[VideoCall] Remote video data loaded");
      };
      
      video.onplay = () => {
        console.log("[VideoCall] Remote video started playing");
      };
      
      video.onerror = (e) => {
        console.error("[VideoCall] Remote video error:", e);
      };
      
      // Force play with robust error handling
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("[VideoCall] Remote video play() succeeded");
            console.log("[VideoCall] Remote video element after play:", {
              readyState: video.readyState,
              paused: video.paused,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            });
          })
          .catch(err => {
            if (err.name === 'AbortError') {
              console.log("[VideoCall] Remote video play interrupted (likely due to update)");
            } else {
              console.error("[VideoCall] Remote video play() failed:", err);
            }
          });
      }
      
      console.log("[VideoCall] ====================================");
    }
  }, [remoteStream]);

  // Initialize peer connection
  useEffect(() => {
    if (!localStream) return;

    // Reset intentional close ref for new connection attempt
    isIntentionalCloseRef.current = false;

    // If we already have an active peer for this stream, don't recreate
    // This helps with React Strict Mode double-invocation
    if (peerRef.current && !peerRef.current.destroyed) {
      console.log("[VideoCall] Peer already exists and is active, skipping creation");
      return;
    }

    console.log(`[VideoCall] ====== INITIALIZING PEER CONNECTION ======`);
    console.log(`[VideoCall] Role: ${initiator ? 'INITIATOR (Caller)' : 'RECEIVER (Answerer)'}`);
    console.log(`[VideoCall] Local stream details:`, {
      streamId: localStream.id,
      active: localStream.active,
      videoTracks: localStream.getVideoTracks().length,
      audioTracks: localStream.getAudioTracks().length,
      videoTrackDetails: localStream.getVideoTracks().map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState,
        settings: t.getSettings()
      })),
      audioTrackDetails: localStream.getAudioTracks().map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState
      }))
    });

    const newPeer = new SimplePeer({
      initiator,
      trickle: true, // Re-enable trickle ICE for better connectivity
      stream: localStream,
      config: {
        iceServers: [
          // Google Public STUN
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          // STUN on Port 443 (Bypasses many firewalls)
          { urls: "stun:stun.nextcloud.com:443" },
          { urls: "stun:stun.piratenbrandenburg.de:443" },
          // Other reliable public STUN servers
          { urls: "stun:stun.voip.blackberry.com:3478" },
          { urls: "stun:stun.stunprotocol.org:3478" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      },
    });
    
    console.log("[VideoCall] SimplePeer instance created");
    console.log("[VideoCall] ====================================");

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
      console.log("[VideoCall] ====== RECEIVED REMOTE STREAM ======");
      console.log("[VideoCall] Stream ID:", stream.id);
      console.log("[VideoCall] Video tracks:", stream.getVideoTracks().map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState,
        settings: t.getSettings()
      })));
      console.log("[VideoCall] Audio tracks:", stream.getAudioTracks().map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState
      })));
      console.log("[VideoCall] Stream active:", stream.active);
      console.log("[VideoCall] ====================================");
      
      clearTimeout(connectionTimeout);
      setRemoteStream(stream);
      setCallStatus("Connected");
      setConnectionState("connected");
      isConnectedRef.current = true;
    });

    newPeer.on("connect", () => {
      console.log("[VideoCall] Peer connected");
      setCallStatus("Connected");
      setConnectionState("connected");
      isConnectedRef.current = true;
    });

    newPeer.on("error", (err) => {
      console.error("[VideoCall] Peer error:", err);
      console.log("[VideoCall] Error type:", err.name, "Message:", err.message);
      console.log("[VideoCall] Current connection state:", connectionState);
      console.log("[VideoCall] Is connected:", isConnectedRef.current);
      
      // Ignore non-critical errors, especially during connection negotiation
      const nonCriticalErrors = [
        "ERR_WEBRTC_SUPPORT",
        "ERR_CREATE_OFFER",
        "ERR_CREATE_ANSWER", 
        "ERR_SET_LOCAL_DESCRIPTION",
        "ERR_SET_REMOTE_DESCRIPTION",
        "Error: Connection failed", // Ignore if already connected
      ];
      
      const isNonCritical = nonCriticalErrors.some(errType => 
        err.message?.includes(errType) || (err as any).code === errType
      );
      
      // If already connected, ignore all errors except data channel errors
      if (isConnectedRef.current) {
        console.log("[VideoCall] Ignoring error - already connected");
        return;
      }
      
      // Don't show error status for non-critical errors during negotiation
      if (!isNonCritical) {
        setCallStatus("Connecting...");
      }
      
      // Only close on truly critical errors
      if (err.message?.includes("Ice connection failed") || 
          err.message?.includes("Connection timeout")) {
        setCallStatus("Connection failed");
        setTimeout(() => {
          setCallEnded(true);
          onClose();
        }, 2000);
      }
    });

    newPeer.on("close", () => {
      console.log("[VideoCall] Peer closed");
      
      // Ignore if we intentionally closed it (e.g. end call or cleanup)
      if (isIntentionalCloseRef.current) {
        console.log("[VideoCall] Ignoring intentional peer closure");
        return;
      }

      console.log("[VideoCall] Unexpected peer closure");
      
      // Only show "Connection Lost" if we were actually connected
      if (isConnectedRef.current) {
        setCallStatus("Connection lost");
        setConnectionState("disconnected");
      } else {
        setCallStatus("Connection failed");
        setConnectionState("failed");
      }
      
      isConnectedRef.current = false;
    });

    setPeer(newPeer);
    peerRef.current = newPeer;

    return () => {
      clearTimeout(connectionTimeout);
      console.log("[VideoCall] Peer effect cleanup triggered");
      
      if (newPeer && !newPeer.destroyed) {
        console.log("[VideoCall] Destroying peer in cleanup");
        // Mark as intentional to prevent "Connection Lost" state
        isIntentionalCloseRef.current = true;
        newPeer.destroy();
      }
    };
  }, [localStream, initiator]);

  // Process incoming signals
  useEffect(() => {
    if (!pendingSignals || pendingSignals.length === 0) return;
    if (!peer || peer.destroyed) return;

    const processSignals = async () => {
      // Sort signals to ensure offer/answer are processed before candidates
      const sortedSignals = [...pendingSignals].sort((a, b) => {
        const getPriority = (type: string) => {
          if (type === 'offer') return 0;
          if (type === 'answer') return 1;
          if (type === 'candidate') return 2;
          return 3;
        };
        return getPriority(a.type) - getPriority(b.type);
      });

      for (const signal of sortedSignals) {
        // Skip if already processed
        if (processedSignals.has(signal._id)) {
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
    isIntentionalCloseRef.current = true;
    
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
          {connectionState === "disconnected" && (
            <span className="text-xs text-red-500">(✗ Connection Lost)</span>
          )}
          {connectionState === "failed" && (
            <span className="text-xs text-red-500">(✗ Connection Failed)</span>
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
