# Quick Video Call Test Instructions

## Testing Locally

### Step 1: Start the Development Server
```bash
cd "c:\OneDrive\Desktop\PROGRAMMING THINGS\ALPHA\messaging-app"
npm run dev
```

### Step 2: Open Two Browser Windows

**Window 1 (User A):**
1. Open http://localhost:3000
2. Sign in as User A
3. Go to Messages
4. Select a conversation with User B

**Window 2 (User B):**
1. Open http://localhost:3000 in **Incognito/Private mode**
2. Sign in as User B
3. Go to Messages
4. Wait on the conversation page

### Step 3: Make a Call

**From Window 1 (User A):**
1. Click the video camera icon in the conversation header
2. Allow camera/microphone when prompted
3. You should see your own video in the small box

**In Window 2 (User B):**
1. You should see an incoming call popup
2. Click "Accept"
3. Allow camera/microphone when prompted

**Result:** Both users should now see each other!

---

## Testing on Vercel (Production)

### Your Deployed Site
https://jm-messaging-app.vercel.app

### Test Steps:

1. **Device 1 (Phone/Laptop):**
   - Go to https://jm-messaging-app.vercel.app
   - Sign in as User A
   - Navigate to a conversation

2. **Device 2 (Another Phone/Laptop):**
   - Go to https://jm-messaging-app.vercel.app
   - Sign in as User B (different account)
   - Navigate to the same conversation

3. **Start Call:**
   - User A clicks video icon
   - User B accepts the call
   - Both should connect within 10 seconds

---

## What to Check

### Visual Indicators:
- ✅ **"Setting up..."** - Getting camera/mic access
- ✅ **"Connecting..."** - Establishing WebRTC connection
- ✅ **"✓ Connected"** - Call is active!

### Controls:
- 📹 **Video toggle** - Turn camera on/off
- 🎤 **Audio toggle** - Turn microphone on/off  
- 📞 **End call** - Hang up

### Browser Console:
Press F12 and look for logs like:
```
[VideoCall] Initializing peer connection...
[VideoCall] Sending signal: offer
[VideoCall] Received remote stream
[VideoCall] Peer connected
```

---

## Troubleshooting Quick Fixes

### "Permission Denied"
- Click the camera icon in browser address bar
- Select "Allow" for camera and microphone
- Refresh the page and try again

### "Not Connecting"
- Check browser console (F12) for errors
- Make sure both users are on the messages page
- Try refreshing both pages
- Wait 10-15 seconds for connection

### "Can't See Video"
- Check if camera is covered/disabled
- Make sure video toggle button is not red
- Try turning video off and on again
- Check if other apps are using the camera

### Still Issues?
See VIDEO_CALL_DEBUG.md for detailed troubleshooting!

---

## Expected Behavior

✅ **What Should Work:**
- Call initiation (clicking video icon)
- Incoming call notification
- Accepting/rejecting calls
- Video streaming both ways
- Audio streaming both ways
- Toggling video/audio on/off
- Ending calls cleanly

✅ **HTTPS Requirement:**
- Works on `localhost` (development) ✓
- Works on `https://jm-messaging-app.vercel.app` (production) ✓
- Will NOT work on plain HTTP in production

---

## Browser Support

**Desktop:**
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Edge 80+
- ✅ Safari 14.1+

**Mobile:**
- ✅ Chrome Android
- ✅ Safari iOS 14.1+
- ✅ Firefox Android

---

## Quick Test Checklist

Before reporting issues, verify:
- [ ] Using supported browser (Chrome/Firefox/Edge/Safari)
- [ ] On HTTPS or localhost
- [ ] Camera/microphone permissions granted
- [ ] No other app using camera/microphone
- [ ] Both users are online and on messages page
- [ ] Waited at least 10 seconds for connection
- [ ] Checked browser console for errors (F12)
- [ ] Convex backend is running (`npx convex dev` if local)

---

**Ready to test!** 🎥 📞
