export default function Badge({ label }) {
  const colors = {
    'Best Seller': 'bg-[#C4602A] text-white',
    'New': 'bg-[#2C5F2E] text-white',
  }
  return (
    <span className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full z-10 ${colors[label] || 'bg-gray-200 text-gray-700'}`}>
      {label}
    </span>
  )
}
