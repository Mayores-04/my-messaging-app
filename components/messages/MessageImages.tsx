import { memo } from "react";
import { Eye, EyeOff } from "lucide-react";

interface MessageImagesProps {
  images: string[];
  isContentHidden: boolean;
  isContentBlurred: boolean;
  onViewLevelChange: (level: 0 | 1 | 2) => void;
  onImageClick: (index: number) => void;
  hasText: boolean;
}

function MessageImages({
  images,
  isContentHidden,
  isContentBlurred,
  onViewLevelChange,
  onImageClick,
  hasText,
}: MessageImagesProps) {
  if (isContentHidden) {
    return (
      <div className={`bg-[#26211c] border border-[#53473c] rounded p-4 flex flex-col items-center justify-center gap-3 min-w-[200px] ${hasText ? 'mb-2' : ''}`}>
        <EyeOff className="w-8 h-8 text-[#b8aa9d]" />
        <p className="text-[#b8aa9d] text-sm text-center">Message Request</p>
        <div className="flex gap-2">
          <button
            onClick={() => onViewLevelChange(1)}
            className="bg-[#53473c] hover:bg-[#3a332c] text-white text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            Peek
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${hasText ? 'mb-2' : ''}`}>
      {isContentBlurred && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onViewLevelChange(2);
          }}
        >
          <button className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all flex items-center gap-2 pointer-events-none">
            <Eye className="w-4 h-4" />
            Tap to View
          </button>
        </div>
      )}
      <div className={`${isContentBlurred ? "filter blur-md select-none" : ""}`}>
        {images.length === 1 ? (
          <img
            src={images[0]}
            alt="attachment"
            className="w-full rounded object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => !isContentBlurred && onImageClick(0)}
          />
        ) : images.length === 2 ? (
          <div className="grid grid-cols-2 gap-1">
            {images.map((img: string, index: number) => (
              <img
                key={index}
                src={img}
                alt={`attachment ${index + 1}`}
                className="w-full rounded object-cover h-48 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => !isContentBlurred && onImageClick(index)}
              />
            ))}
          </div>
        ) : images.length === 3 ? (
          <div className="grid grid-cols-2 gap-1">
            <img
              src={images[0]}
              alt="attachment 1"
              className="col-span-2 w-full rounded object-cover h-48 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => !isContentBlurred && onImageClick(0)}
            />
            <img
              src={images[1]}
              alt="attachment 2"
              className="w-full rounded object-cover h-32 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => !isContentBlurred && onImageClick(1)}
            />
            <img
              src={images[2]}
              alt="attachment 3"
              className="w-full rounded object-cover h-32 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => !isContentBlurred && onImageClick(2)}
            />
          </div>
        ) : images.length === 4 ? (
          <div className="grid grid-cols-2 gap-1">
            {images.map((img: string, index: number) => (
              <img
                key={index}
                src={img}
                alt={`attachment ${index + 1}`}
                className="w-full rounded object-cover h-40 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => !isContentBlurred && onImageClick(index)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {images.slice(0, 4).map((img: string, index: number) => (
              <div
                key={index}
                className="relative cursor-pointer"
                onClick={() => !isContentBlurred && onImageClick(index)}
              >
                <img
                  src={img}
                  alt={`attachment ${index + 1}`}
                  className="w-full rounded object-cover h-40 hover:opacity-90 transition-opacity"
                />
                {index === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/70 rounded flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      +{images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MessageImages);
