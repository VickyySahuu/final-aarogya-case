import React from 'react'

export default function UtilityBar({ activeService = 'Healthcare Digital Platform' }) {
  return (
    <aside aria-label="Official Institutional Utility Bar" className="w-full bg-[#081C33] text-slate-300 text-xs border-b border-[#0F2C59] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between font-normal tracking-wide">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-white tracking-wider uppercase">AAROGYA CASE</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300 font-normal">{activeService}</span>
          <span className="hidden sm:inline-block text-slate-400 font-normal ml-2 text-[11px] bg-white/10 px-1.5 py-0.5 rounded">
            Prototype Version 1.0
          </span>
        </div>
        <div className="flex items-center space-x-6 text-slate-300 text-xs">
          <a href="#accessibility" className="hover:text-white transition-colors duration-150 flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-[15px] opacity-80">accessibility_new</span>
            <span>Accessibility</span>
          </a>
          <span className="text-slate-600">|</span>
          <a href="#help" className="hover:text-white transition-colors duration-150 flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-[15px] opacity-80">help</span>
            <span>Help</span>
          </a>
        </div>
      </div>
    </aside>
  )
}
