# Video Not Showing - Troubleshooting Steps

## If video says "Connected" but shows black screen:

### 1. Open Browser Console (F12)
Look for these specific logs:

**Check if streams are initialized:**
```
[VideoCall] Media stream initialized successfully
[VideoCall] Local stream tracks: {...}
```

**Check if remote stream is received:**
```
[VideoCall] Received remote stream
[VideoCall] Remote stream tracks: {...}
```

**Check video track status:**
- `enabled: true` - Track is active
- `readyState: "live"` - Track is streaming
- If `readyState: "ended"` - Track has stopped

### 2. Common Causes of Black Screen:

#### A. Camera is blocked/disabled
```javascript
// In console, check:
localStream.getVideoTracks()[0].enabled  // Should be true
localStream.getVideoTracks()[0].readyState  // Should be "live"
```

**Fix:** Make sure:
- Camera isn't physically covered
- No other app is using the camera
- Browser has camera permission
- Video toggle button isn't red (disabled)

#### B. Video element not rendering
**Fix:** 
- Try toggling video off and on (camera button)
- Check if local video (small box) shows your face
- If local works but remote doesn't = peer connection issue
- If neither works = media stream issue

#### C. Peer connection issue
**Signs:**
- You see "Connected" status
- Local video works (you see yourself)
- Remote video is black (can't see other person)

**Fix:**
- Check browser console for WebRTC errors
- Look for: `[VideoCall] Received remote stream`
- If you don't see this log, signals aren't being exchanged properly
- Try refreshing both pages and reconnecting

### 3. Quick Browser Console Commands

Open console (F12) and paste these to debug:

```javascript
// Check if video elements exist and have streams
document.querySelector('video').srcObject  // Should show MediaStream

// Check all video elements
Array.from(document.querySelectorAll('video')).forEach((v, i) => {
  console.log(`Video ${i}:`, {
    hasStream: !!v.srcObject,
    tracks: v.srcObject?.getTracks().length,
    paused: v.paused,
    readyState: v.readyState
  });
});

// Force play all videos
Array.from(document.querySelectorAll('video')).forEach(v => v.play());
```

### 4. Step-by-Step Check:

**On Caller's Screen:**
1. [ ] Click video icon
2. [ ] Allow camera/microphone
3. [ ] See yourself in small box (bottom-right) ✓
4. [ ] Wait 5-10 seconds
5. [ ] See other person in large box (center)

**On Receiver's Screen:**
1. [ ] See incoming call popup
2. [ ] Click "Accept"
3. [ ] Allow camera/microphone
4. [ ] See yourself in small box ✓
5. [ ] See other person in large box

### 5. Force Video Refresh

If videos aren't showing after "Connected":

1. Click the camera button twice (off then on)
2. Or paste in console:
```javascript
// Restart video tracks
const videos = document.querySelectorAll('video');
videos.forEach(v => {
  if (v.srcObject) {
    const stream = v.srcObject;
    v.srcObject = null;
    setTimeout(() => {
      v.srcObject = stream;
      v.play();
    }, 100);
  }
});
```

### 6. Check Network Tab (F12 → Network)

- Filter by "WS" (WebSocket)
- Should see active Convex WebSocket connection
- If disconnected = refresh page

### 7. Development Debug Panel

In development mode, you should see a debug panel in the top-left corner showing:
```
Local Stream: ✓
Remote Stream: ✓ (or ✗ if not received yet)
Peer: ✓
Connection: connected
```

If any show ✗, that's the problem area.

### 8. Most Common Fix:

**Try this first:**
1. Both users: Refresh the page
2. Start the call again
3. Make sure both users stay on the messages page
4. Wait 10-15 seconds after accepting

### 9. Browser-Specific Issues:

**Safari:**
- Make sure iOS is 14.1+ or macOS Big Sur+
- Safari sometimes needs explicit play() call
- Try: Settings → Safari → Camera → Allow

**Firefox:**
- Check: about:preferences → Privacy & Security → Permissions
- Make sure site has camera/mic access

**Chrome:**
- Check: chrome://settings/content/camera
- Site should be in "Allow" list

### 10. Still Not Working?

Try this nuclear option:
1. Close all browser tabs
2. Clear browser cache
3. Reopen browser
4. Login again
5. Start call

Or test with a different browser to isolate the issue.

---

## Expected Console Logs (Successful Call):

```
[ConversationView] Call request sent, opening video call modal
[VideoCall] Initializing peer connection as initiator
[VideoCall] Media stream initialized successfully
[VideoCall] Local stream tracks: {video: [...], audio: [...]}
[VideoCall] Setting local video stream
[VideoCall] Sending signal: offer
[VideoCall] Processing signal: answer
[VideoCall] Signaling peer with: answer
[VideoCall] Received remote stream
[VideoCall] Remote stream tracks: {video: [...], audio: [...]}
[VideoCall] Setting remote video stream
[VideoCall] Peer connected
```

If you see all these logs but still no video, the issue is with the video element rendering, not WebRTC.
