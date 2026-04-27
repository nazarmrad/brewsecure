export default function RoastBar({ level }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-[#8B5E3C] mb-2">
        <span>Light</span><span>Medium</span><span>Dark</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-[#F0EAE0] overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#D4A574] to-[#C4602A] transition-all duration-700"
          style={{ width: `${(level / 10) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= level ? 'bg-[#C4602A]' : 'bg-[#E8DDD5]'}`} />
        ))}
      </div>
    </div>
  )
}
