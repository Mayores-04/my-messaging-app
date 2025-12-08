export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#26211c] border border-[#53473c] rounded-lg px-4 py-3">
        <div className="flex gap-1 items-end h-6">
          <span className="w-2.5 h-2.5 bg-[#b8aa9d] rounded-full typing-dot-1"></span>
          <span className="w-2.5 h-2.5 bg-[#b8aa9d] rounded-full typing-dot-2"></span>
          <span className="w-2.5 h-2.5 bg-[#b8aa9d] rounded-full typing-dot-3"></span>
        </div>
      </div>
    </div>
  );
}
