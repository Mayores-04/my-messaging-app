# Video Call Flow Explanation

## Video Display Logic (Paano Gumagana)

### Both Caller at Receiver:

```
┌─────────────────────────────────────┐
│  YOUR SCREEN (Kahit Caller/Receiver)│
├─────────────────────────────────────┤
│                                     │
│   ┌───────────────────────────┐   │
│   │   LARGE BOX (CENTER)      │   │
│   │                           │   │
│   │   REMOTE VIDEO            │   │
│   │   = OTHER PERSON'S        │   │
│   │     CAMERA                │   │
│   │   (Nakikita mo sila)      │   │
│   │                           │   │
│   │      ┌──────────────┐     │   │
│   │      │ SMALL BOX    │     │   │
│   │      │ LOCAL VIDEO  │     │   │
│   │      │ = YOUR CAMERA│     │   │
│   │      │ (Nakikita mo │     │   │
│   │      │  sarili mo)  │     │   │
│   │      └──────────────┘     │   │
│   └───────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## WebRTC Connection Flow

### 1. Caller Side (Nag-initiate ng call)
```
Caller's Browser:
├── LOCAL STREAM → Your camera/mic
│   └── Displayed in: Small box (bottom-right)
│   └── Sent via WebRTC to: Receiver
│
└── REMOTE STREAM ← Receiver's camera/mic
    └── Received via WebRTC from: Receiver
    └── Displayed in: Large box (center)
```

### 2. Receiver Side (Na-call)
```
Receiver's Browser:
├── LOCAL STREAM → Your camera/mic
│   └── Displayed in: Small box (bottom-right)
│   └── Sent via WebRTC to: Caller
│
└── REMOTE STREAM ← Caller's camera/mic
    └── Received via WebRTC from: Caller
    └── Displayed in: Large box (center)
```

## Ano ang Nangyayari sa Code

### Local Stream (YOUR camera)
```typescript
// Both caller and receiver:
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});
setLocalStream(stream); // → Small box
```

### Remote Stream (OTHER person's camera)
```typescript
// Received through WebRTC peer connection:
peer.on("stream", (stream) => {
  setRemoteStream(stream); // → Large box
});
```

## Signal Flow

### Caller → Receiver
```
1. Caller: getUserMedia() → Local camera
2. Caller: Create SimplePeer(initiator: true)
3. Caller: Send "call-request" signal
4. Receiver: See incoming call popup
5. Receiver: Click Accept
6. Receiver: getUserMedia() → Local camera
7. Receiver: Create SimplePeer(initiator: false)
8. Both: Exchange WebRTC signals (offer/answer/candidates)
9. Connection established
10. Caller: Receives Receiver's stream → Remote video
11. Receiver: Receives Caller's stream → Remote video
```

## Debug Checklist

### Sa Caller's Screen:
- ✅ Small box (bottom-right) = Dapat makita sarili mo
- ✅ Large box (center) = Dapat makita yung na-call mo
- ✅ Debug panel: "Role: Caller"

### Sa Receiver's Screen:
- ✅ Small box (bottom-right) = Dapat makita sarili mo
- ✅ Large box (center) = Dapat makita yung nag-call
- ✅ Debug panel: "Role: Receiver"

## Common Scenarios

### ✅ Working Correctly:
```
Caller sees:
  Small box: Their own face (mirrored)
  Large box: Receiver's face

Receiver sees:
  Small box: Their own face (mirrored)
  Large box: Caller's face
```

### ❌ Problem: Both see themselves everywhere
```
Issue: Both local and remote showing same stream
Cause: Remote stream not being received
Fix: Check WebRTC signals in console
```

### ❌ Problem: Black screens
```
Issue: No video in either box
Cause: Camera not accessible or tracks disabled
Fix: Check camera permissions and track status
```

### ❌ Problem: Only local works
```
Issue: See yourself but not other person
Cause: Peer connection failed
Fix: Check STUN server connection, check signals
```

## Key Points

1. **LOCAL = ALWAYS YOUR CAMERA**
   - Same for both caller and receiver
   - Shows in small box (bottom-right)
   - Mirrored (flipped) so you see yourself naturally

2. **REMOTE = ALWAYS OTHER PERSON'S CAMERA**
   - Same for both caller and receiver
   - Shows in large box (center)
   - Not mirrored (you see them as they see themselves)

3. **SYMMETRICAL SETUP**
   - Both sides use same component
   - Both get their own local stream
   - Both receive other's stream as remote
   - Only difference: `initiator: true/false`

4. **INITIATOR ROLE**
   - Caller: `initiator: true` (starts WebRTC handshake)
   - Receiver: `initiator: false` (responds to handshake)
   - After connection: No difference, both peer-to-peer

## Console Logs to Check

### Successful Connection:
```
[VideoCall] Initializing peer connection as initiator
[VideoCall] Media stream obtained: {videoTracks: [...], audioTracks: [...]}
[VideoCall] Local stream ready: {videoTracks: 1, audioTracks: 1}
[VideoCall] Sending signal: offer
[VideoCall] Processing signal: answer
[VideoCall] Received remote stream
[VideoCall] Remote stream tracks: {video: [...], audio: [...]}
[VideoCall] Peer connected
```

### What Each Log Means:
- `Local stream ready` = Your camera working
- `Received remote stream` = Got their camera feed
- `Peer connected` = WebRTC connection established
- Both should see all these logs (with different initiator value)
