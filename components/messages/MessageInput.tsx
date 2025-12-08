import {
  CameraIcon,
  Gift,
  GitFork,
  ImageIcon,
  LinkIcon,
  PlusCircle,
  PlusCircleIcon,
  Scan,
  ScanFace,
  Send,
  SmileIcon,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { RefObject, useRef, useEffect, useState } from "react";
import React from "react";
import EmojiPicker from "emoji-picker-react";
import Webcam from "react-webcam";


interface MessageInputProps {
  messageText: string;
  sending: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onTyping: (text: string) => void;
  onSend: (e?: React.FormEvent) => void;
  onToggleEmojiPicker: () => void;
  showEmojiPicker: boolean;
  onEmojiClick: (emojiData: any) => void;
  images: string[];
  onImagesChange: (images: string[]) => void;
  replyTo?: any;
  onCancelReply?: () => void;
}

export default function MessageInput({
  messageText,
  sending,
  inputRef,
  onTyping,
  onSend,
  onToggleEmojiPicker,
  showEmojiPicker,
  onEmojiClick,
  images,
  onImagesChange,
  replyTo,
  onCancelReply,
}: MessageInputProps) {
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [webCamOpen, setWebCamOpen] = React.useState(false);

  // Sync local state with parent
  useEffect(() => {
    setImagePreviews(images);
  }, [images]);

  // Close emoji picker when clicking outside of both emoji picker and input container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        containerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onToggleEmojiPicker();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker, onToggleEmojiPicker]);

  // Handle Ctrl+E to toggle emoji picker
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        onToggleEmojiPicker();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onToggleEmojiPicker]);

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
              const result = reader.result as string;
              if (result) {
                // Compress image before sending
                const compressed = await compressImage(result);
                const newImages = [...imagePreviews, compressed];
                setImagePreviews(newImages);
                onImagesChange(newImages);
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onTyping, onSend]);

  const handleEmojiSelect = (emojiData: any) => {
    onEmojiClick(emojiData);
    // Keep focus on input after selecting emoji
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Webcam refs & state
  const webcamRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Compress image to stay under 1MB
  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate max dimensions to keep under ~800KB (leaving room for base64 encoding overhead)
        const maxSize = 1200; // Max width or height in pixels
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels until under 1MB
        let quality = 0.8;
        let compressed = canvas.toDataURL('image/jpeg', quality);
        
        // Base64 size is roughly dataUrl.length * 0.75 bytes
        while (compressed.length * 0.75 > 1024 * 1024 && quality > 0.1) {
          quality -= 0.1;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(compressed);
      };
      img.src = dataUrl;
    });
  };

  const captureSnapshot = async () => {
    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        // Compress image before sending
        const compressed = await compressImage(imageSrc);
        const newImages = [...imagePreviews, compressed];
        setImagePreviews(newImages);
        onImagesChange(newImages);
        setWebCamOpen(false);
        // Keep focus in input so user can continue typing or send
        if (inputRef.current) inputRef.current.focus();
        // Auto-send after state flush (small timeout to allow parent state update)
        setTimeout(() => onSend(), 50);
      } else {
        alert("Unable to capture image. Make sure camera permissions are allowed.");
      }
    } catch (err) {
      console.error("Capture error:", err);
      alert("Failed to capture image from webcam.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const compressedImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const result = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      if (result) {
        const compressed = await compressImage(result);
        compressedImages.push(compressed);
      }
    }
    
    const newImages = [...imagePreviews, ...compressedImages];
    setImagePreviews(newImages);
    onImagesChange(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newImages);
    onImagesChange(newImages);
  };

  const clearAllImages = () => {
    setImagePreviews([]);
    onImagesChange([]);
    onTyping("");
  };

  const [countDown, setCountDown] = useState(0);

  const startCountdownCapture = () => {
    setCountDown(3);
    const interval = setInterval(() => {
      setCountDown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          captureSnapshot();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  return (
    <div className="relative">
      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 pt-3 pb-1 bg-[#181411] border-t border-[#53473c]">
          <div className="p-3 bg-[#1a1612] border-l-4 border-[#e67919] rounded flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-[#b8aa9d] mb-1">Replying to:</p>
              {replyTo.images && replyTo.images.length > 0 && (
                <img
                  src={replyTo.images[0]}
                  alt="Reply preview"
                  className="w-12 h-12 rounded object-cover mb-1"
                />
              )}
              <p className="text-sm text-white truncate">{replyTo.body || "Image"}</p>
            </div>
            {onCancelReply && (
              <button
                type="button"
                onClick={onCancelReply}
                className="text-[#b8aa9d] hover:text-white transition-colors ml-2"
                aria-label="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full right-4 mb-2 z-50"
        >
          <EmojiPicker onEmojiClick={handleEmojiSelect} />
        </div>
      )}
      {webCamOpen && (
        <div className="absolute bottom-full left-4 mb-2 z-50 w-xl bg-[#181411] rounded shadow-lg p-2">
          <div className="flex justify-end space-x-2 mb-2">
            <button
              type="button"
              onClick={startCountdownCapture}
              className="text-sm px-2 py-1 rounded bg-[#2b241f] hover:bg-[#3a2f28] text-white"
            >
              3s Timer
            </button>
            <button
              type="button"
              onClick={() => setWebCamOpen(false)}
              className="text-sm px-2 py-1 rounded bg-[#2b241f] hover:bg-[#3a2f28] text-white"
            >
              Close
            </button>
            <button
              type="button"
              onClick={captureSnapshot}
              className="text-sm px-2 py-1 rounded bg-[#e67919] hover:bg-[#cf6213] text-white"
            >
              Capture
            </button>
          </div>
          <div className="w-full h-96 bg-black rounded overflow-hidden relative">
            <Webcam
              audio={false}
              mirrored
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
            />
            {countDown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center  bg-opacity-50">
                <span className="text-white text-6xl font-bold animate-pulse">{countDown}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <form
        onSubmit={onSend}
        className="p-4 border-t border-[#53473c] bg-[#181411]"
      >
        {imagePreviews.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#b8aa9d]">{imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''}</span>
              <button 
                type="button" 
                onClick={clearAllImages}
                className="text-xs text-[#e67919] hover:text-[#cf6213]"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((img, index) => (
                <div key={index} className="relative inline-block">
                  <img src={img} alt={`preview ${index + 1}`} className="w-24 h-24 rounded-lg border-2 border-[#e67919] object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-[#e67919] hover:bg-[#cf6213] text-white rounded-full flex items-center justify-center text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          aria-label="Upload image"
          className="hidden"
        />
        <div ref={containerRef} className="flex gap-2 items-center">
          <PlusCircle onClick={onToggleEmojiPicker} className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer" />
          <div className="flex-1 px-2 flex items-center bg-[#211811] text-white placeholder-[#b8aa9d] rounded-lg focus-within:ring-2 focus-within:ring-[#e67919]">
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={messageText}
              onChange={(e) => onTyping(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-2 py-2 bg-transparent outline-none rounded-lg"
              disabled={sending}
            />
            <SmileIcon
              onClick={onToggleEmojiPicker}
              className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer"
            />
          </div>
          <ImageIcon
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer"
          />
          <CameraIcon onClick={() => setWebCamOpen(!webCamOpen)} className="w-6 h-6 text-white hover:text-[#e67919] cursor-pointer" />
          <Button
            type="submit"
            disabled={(!messageText.trim() && imagePreviews.length === 0) || sending}
            className="bg-[#e67919] hover:bg-[#cf6213] disabled:bg-[#53473c] text-white rounded-lg px-4 py-2 transition-colors"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
