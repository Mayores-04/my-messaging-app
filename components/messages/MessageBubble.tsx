import Image from "next/image";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  conversation: any;
  isLastRead: boolean;
}

export default function MessageBubble({
  message,
  isOwn,
  conversation,
  isLastRead,
}: MessageBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (message.images && currentImageIndex < message.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "Escape") setLightboxOpen(false);
  };

  return (
    <>
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwn
            ? "bg-[#e67919] text-white"
            : "bg-[#26211c] text-white border border-[#53473c]"
        }`}
      >
        {message.images && message.images.length > 0 ? (
          <div className="mb-2">
            {message.images.length === 1 ? (
              <img 
                src={message.images[0]} 
                alt="attachment" 
                className="w-full rounded object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity" 
                onClick={() => openLightbox(0)}
              />
            ) : message.images.length === 2 ? (
              <div className="grid grid-cols-2 gap-1">
                {message.images.map((img: string, index: number) => (
                  <img 
                    key={index} 
                    src={img} 
                    alt={`attachment ${index + 1}`} 
                    className="w-full rounded object-cover h-48 cursor-pointer hover:opacity-90 transition-opacity" 
                    onClick={() => openLightbox(index)}
                  />
                ))}
              </div>
            ) : message.images.length === 3 ? (
              <div className="grid grid-cols-2 gap-1">
                <img 
                  src={message.images[0]} 
                  alt="attachment 1" 
                  className="col-span-2 w-full rounded object-cover h-48 cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => openLightbox(0)}
                />
                <img 
                  src={message.images[1]} 
                  alt="attachment 2" 
                  className="w-full rounded object-cover h-32 cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => openLightbox(1)}
                />
                <img 
                  src={message.images[2]} 
                  alt="attachment 3" 
                  className="w-full rounded object-cover h-32 cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => openLightbox(2)}
                />
              </div>
            ) : message.images.length === 4 ? (
              <div className="grid grid-cols-2 gap-1">
                {message.images.map((img: string, index: number) => (
                  <img 
                    key={index} 
                    src={img} 
                    alt={`attachment ${index + 1}`} 
                    className="w-full rounded object-cover h-40 cursor-pointer hover:opacity-90 transition-opacity" 
                    onClick={() => openLightbox(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {message.images.slice(0, 4).map((img: string, index: number) => (
                  <div key={index} className="relative cursor-pointer" onClick={() => openLightbox(index)}>
                    <img 
                      src={img} 
                      alt={`attachment ${index + 1}`} 
                      className="w-full rounded object-cover h-40 hover:opacity-90 transition-opacity" 
                    />
                    {index === 3 && message.images.length > 4 && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 rounded flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">+{message.images.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
        {message.body && <p className="wrap-break-word">{message.body}</p>}
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
      {/* Show other user's avatar under the latest message they have read */}
      {isLastRead && message.readByOther && (
        <div className="relative -bottom-1 -right-1">
          <div className="w-4 h-4 rounded-full overflow-hidden bg-[#53473c]">
            {conversation.otherUserAvatar ? (
              <Image
                src={conversation.otherUserAvatar}
                alt={conversation.otherUserName}
                width={18}
                height={18}
              />
            ) : (
              <span className="text-xs text-white flex items-center justify-center h-6">
                {conversation.otherUserName[0]}
              </span>
            )}
          </div>
        </div>
      )}
    </div>

      {/* Lightbox Modal */}
      {lightboxOpen && message.images && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-[#e67919] transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
            {currentImageIndex + 1} / {message.images.length}
          </div>

          {/* Previous button */}
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 text-white hover:text-[#e67919] transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-12 h-12" />
            </button>
          )}

          {/* Image */}
          <img
            src={message.images[currentImageIndex]}
            alt={`Image ${currentImageIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {currentImageIndex < message.images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 text-white hover:text-[#e67919] transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-12 h-12" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
