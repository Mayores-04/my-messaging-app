# Diagnostic Commands for Video Call Issues

## Run these in Browser Console (F12) to debug video issues

### 1. Check if videos are playing
```javascript
console.log("=== VIDEO ELEMENTS CHECK ===");
const videos = Array.from(document.querySelectorAll('video'));
videos.forEach((v, i) => {
  console.log(`Video ${i}:`, {
    hasStream: !!v.srcObject,
    paused: v.paused,
    muted: v.muted,
    readyState: v.readyState, // 4 = HAVE_ENOUGH_DATA
    videoWidth: v.videoWidth,
    videoHeight: v.videoHeight,
    currentTime: v.currentTime
  });
  
  if (v.srcObject) {
    const stream = v.srcObject;
    console.log(`  Stream ${i} tracks:`, {
      video: stream.getVideoTracks().map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted
      })),
      audio: stream.getAudioTracks().map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted
      }))
    });
  }
});
```

### 2. Force all videos to play
```javascript
console.log("=== FORCING VIDEOS TO PLAY ===");
document.querySelectorAll('video').forEach((v, i) => {
  console.log(`Attempting to play video ${i}...`);
  v.play()
    .then(() => console.log(`✓ Video ${i} playing`))
    .catch(e => console.error(`✗ Video ${i} error:`, e));
});
```

### 3. Check video dimensions
```javascript
console.log("=== VIDEO DIMENSIONS ===");
document.querySelectorAll('video').forEach((v, i) => {
  console.log(`Video ${i}:`, {
    element: `${v.clientWidth}x${v.clientHeight}`,
    video: `${v.videoWidth}x${v.videoHeight}`,
    displayed: v.videoWidth > 0 && v.videoHeight > 0
  });
});
```

### 4. Check media stream constraints
```javascript
console.log("=== STREAM SETTINGS ===");
document.querySelectorAll('video').forEach((v, i) => {
  if (v.srcObject) {
    const videoTrack = v.srcObject.getVideoTracks()[0];
    if (videoTrack) {
      console.log(`Video ${i} track settings:`, videoTrack.getSettings());
      console.log(`Video ${i} track constraints:`, videoTrack.getConstraints());
    }
  }
});
```

### 5. Test camera directly
```javascript
console.log("=== TESTING CAMERA DIRECTLY ===");
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    console.log("✓ Camera access successful!");
    console.log("Stream tracks:", {
      video: stream.getVideoTracks().map(t => t.label),
      audio: stream.getAudioTracks().map(t => t.label)
    });
    
    // Create a test video element
    const testVideo = document.createElement('video');
    testVideo.srcObject = stream;
    testVideo.autoplay = true;
    testVideo.muted = true;
    testVideo.style.position = 'fixed';
    testVideo.style.top = '10px';
    testVideo.style.right = '10px';
    testVideo.style.width = '300px';
    testVideo.style.border = '3px solid red';
    testVideo.style.zIndex = '9999';
    document.body.appendChild(testVideo);
    
    console.log("✓ Test video added to page (top-right corner, red border)");
    console.log("If you see yourself in the red box, camera works!");
    
    // Clean up after 10 seconds
    setTimeout(() => {
      stream.getTracks().forEach(t => t.stop());
      testVideo.remove();
      console.log("Test video removed");
    }, 10000);
  })
  .catch(err => {
    console.error("✗ Camera test failed:", err);
  });
```

### 6. Check WebRTC connection state
```javascript
console.log("=== PEER CONNECTION STATE ===");
// This will show in console if you have the debug panel visible
// Look for logs starting with [VideoCall]
```

### 7. Restart video streams
```javascript
console.log("=== RESTARTING VIDEO STREAMS ===");
document.querySelectorAll('video').forEach((v, i) => {
  if (v.srcObject) {
    const oldStream = v.srcObject;
    v.srcObject = null;
    setTimeout(() => {
      v.srcObject = oldStream;
      v.play()
        .then(() => console.log(`✓ Video ${i} restarted`))
        .catch(e => console.error(`✗ Video ${i} restart failed:`, e));
    }, 100);
  }
});
```

### 8. Full diagnostic report
```javascript
console.log("=== FULL DIAGNOSTIC REPORT ===");

// Browser info
console.log("Browser:", navigator.userAgent);

// Media devices
navigator.mediaDevices.enumerateDevices().then(devices => {
  console.log("Available devices:", {
    cameras: devices.filter(d => d.kind === 'videoinput').length,
    microphones: devices.filter(d => d.kind === 'audioinput').length,
    speakers: devices.filter(d => d.kind === 'audiooutput').length
  });
});

// Video elements
const videos = Array.from(document.querySelectorAll('video'));
console.log("Video elements found:", videos.length);
videos.forEach((v, i) => {
  console.log(`Video ${i}:`, {
    visible: v.offsetParent !== null,
    hasStream: !!v.srcObject,
    playing: !v.paused && !v.ended && v.readyState > 2,
    dimensions: `${v.videoWidth}x${v.videoHeight}`
  });
});

// Permissions
navigator.permissions.query({name: 'camera'}).then(result => {
  console.log("Camera permission:", result.state);
});
navigator.permissions.query({name: 'microphone'}).then(result => {
  console.log("Microphone permission:", result.state);
});
```

## Expected Output for Working Call

### Local video (small box):
```
Video 0: {
  hasStream: true,
  paused: false,
  readyState: 4,
  videoWidth: 640,  // or higher
  videoHeight: 480  // or higher
}
```

### Remote video (large box):
```
Video 1: {
  hasStream: true,
  paused: false,
  readyState: 4,
  videoWidth: 640,  // or higher
  videoHeight: 480  // or higher
}
```

## Common Issues

### Black screen but readyState = 4
- Video element has stream but might be rendering issue
- Try: Toggle video off/on
- Check: videoWidth and videoHeight should be > 0

### readyState = 0 or 1
- Video hasn't loaded yet
- Wait a few seconds
- Check network connection

### No stream (hasStream: false)
- WebRTC connection failed
- Check console for [VideoCall] logs
- Peer connection might not be established

### videoWidth = 0, videoHeight = 0
- Stream exists but no video data
- Camera might be blocked by another app
- Track might be disabled (check enabled: false)
