export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div>
        <p className="font-display text-xl text-[#1C0F0A] mb-1">Could not load products</p>
        <p className="text-sm text-[#8B5E3C]">{message || 'Make sure the API server is running at localhost:3001'}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-full bg-[#C4602A] text-white text-sm font-medium hover:bg-[#A04E22] transition-colors active:scale-95"
        >
          Try again
        </button>
      )}
    </div>
  )
}
