# Video Call Debugging Guide

## Quick Fixes

### 1. Check Browser Console
Open browser DevTools (F12) and look for logs starting with `[VideoCall]` or `[ConversationView]`

### 2. Common Issues & Solutions

#### "Failed to access camera/microphone"
- **Chrome**: Click the camera icon in the address bar → Allow
- **Firefox**: Click the permissions icon → Allow camera and microphone
- **Safari**: Safari menu → Settings for This Website → Camera/Microphone → Allow

#### "No signal/Not connecting"
1. Check browser console for errors
2. Make sure both users are on the page
3. Try refreshing the page
4. Check if you're on HTTPS (required for production)

#### "Can't hear/see other person"
1. Check if both camera and microphone are enabled (buttons should not be red)
2. Make sure the other person accepted the call
3. Check if their camera/microphone is working in their browser

### 3. Testing Locally

**Localhost (Development):**
```bash
npm run dev
```
- WebRTC works on localhost without HTTPS
- Test with two different browser windows/tabs
- Use incognito mode for second user to avoid session conflicts

**Production (Vercel):**
- Always served over HTTPS ✓
- HTTPS is required for WebRTC in production
- Your deployment at https://jm-messaging-app.vercel.app is HTTPS ✓

### 4. Network Requirements

**Ports & Protocols:**
- WebRTC uses UDP ports 1024-65535
- STUN servers are configured (Google's public STUN)
- Works behind most NATs/routers

**Firewall:**
- Make sure UDP traffic is not blocked
- Some corporate networks block WebRTC

### 5. Browser Compatibility

✅ **Supported:**
- Chrome/Edge 80+
- Firefox 75+
- Safari 14.1+
- Opera 67+

❌ **Not Supported:**
- Internet Explorer
- Old mobile browsers

### 6. Debug Checklist

**Before starting a call:**
- [ ] Browser supports WebRTC
- [ ] On HTTPS (or localhost)
- [ ] Camera/microphone permissions granted
- [ ] No other app using camera/microphone
- [ ] Internet connection is stable

**During call:**
- [ ] Check browser console for `[VideoCall]` logs
- [ ] Look for WebRTC errors (red text in console)
- [ ] Verify signals are being sent/received
- [ ] Check connection state in UI (Setting up/Connecting/Connected)

### 7. Testing Between Two Accounts

1. **User A (Caller):**
   - Opens conversation with User B
   - Clicks video call icon
   - Should see "Calling..." status

2. **User B (Receiver):**
   - Should see incoming call popup
   - Clicks "Accept"
   - Should see "Waiting for connection..." status

3. **Both Users:**
   - Wait 5-10 seconds for WebRTC handshake
   - Should see "Connected" status
   - Local video appears in small box (bottom-right)
   - Remote video appears in large box (center)

### 8. Console Logs to Look For

**Successful Connection Flow:**
```
[ConversationView] Call request sent, opening video call modal
[VideoCall] Initializing peer connection as initiator
[VideoCall] Media stream initialized successfully
[VideoCall] Sending signal: offer
[VideoCall] Signal sent successfully
[VideoCall] Processing signal: answer
[VideoCall] Signaling peer with: answer
[VideoCall] Received remote stream
[VideoCall] Peer connected
```

### 9. Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `NotAllowedError` | Permission denied | Grant camera/mic access |
| `NotFoundError` | No device found | Connect camera/microphone |
| `NotReadableError` | Device in use | Close other apps using camera |
| `OverconstrainedError` | Camera doesn't meet requirements | Will auto-retry with basic settings |

### 10. Still Not Working?

1. Clear browser cache and cookies
2. Try a different browser
3. Check if both users can access their camera in other apps
4. Test on different network (try mobile hotspot)
5. Check browser console for specific error messages
6. Verify Convex backend is running: `npx convex dev`

## Technical Details

**WebRTC Flow:**
1. Caller sends "call-request" signal via Convex
2. Receiver gets notification and clicks Accept
3. Both initialize SimplePeer with their media streams
4. SimplePeer handles SDP offer/answer exchange via Convex signals
5. ICE candidates exchanged for NAT traversal
6. Direct P2P connection established
7. Video/audio streams flow directly between peers

**STUN Servers Used:**
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`
- `stun:stun2.l.google.com:19302`
- `stun:stun3.l.google.com:19302`
- `stun:stun4.l.google.com:19302`

These are public STUN servers by Google and work ~80% of the time. For better reliability in restrictive networks, you'd need a TURN server.
