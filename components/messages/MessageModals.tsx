import { memo } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmAction: () => void;
  cancelAction: () => void;
  isLoading?: boolean;
  isDanger?: boolean;
}

export const ConfirmModal = memo(function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  confirmAction,
  cancelAction,
  isLoading = false,
  isDanger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={cancelAction}
    >
      <div
        className="bg-[#26211c] border border-[#53473c] rounded-lg p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
        <p className="text-[#b8aa9d] text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={cancelAction}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-[#53473c] text-white hover:bg-[#6a5a4a] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmAction}
            disabled={isLoading}
            className={`px-4 py-2 rounded text-white transition-colors flex items-center gap-2 disabled:opacity-50 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#e67919] hover:bg-[#d56f15]"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

interface LightboxModalProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const LightboxModal = memo(function LightboxModal({
  isOpen,
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onKeyDown,
}: LightboxModalProps) {
  if (!isOpen || !images) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-[#e67919] transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 text-white hover:text-[#e67919] transition-colors z-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-12 h-12" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[currentIndex]}
        alt={`Image ${currentIndex + 1}`}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next button */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 text-white hover:text-[#e67919] transition-colors z-10"
          aria-label="Next image"
        >
          <ChevronRight className="w-12 h-12" />
        </button>
      )}
    </div>
  );
});
