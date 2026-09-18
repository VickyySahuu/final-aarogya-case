import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import UtilityBar from './UtilityBar'
import Footer from './Footer'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'

export default function AmbulanceLayout({
  children,
  activeNav = 'Dashboard'
}) {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fc] text-[#191c1e] antialiased selection:bg-[#b2cdfe] selection:text-[#3c5781]" style={{ fontFamily: "'Atkinson Hyperlegible Next', 'Lexend', sans-serif" }}>
      {/* 1. Official Institutional Utility Bar */}
      <div className="no-print">
        <UtilityBar activeService="Emergency Response & Ambulance Dispatch" />
      </div>

      {/* 2. Ambulance Portal Header */}
      <header className="w-full bg-white/95 backdrop-blur-xl border-b border-[#eceef0] sticky top-0 z-40 shadow-[0_1px_8px_rgba(25,28,30,0.05)] no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Branding */}
          <Link to="/ambulance/dashboard" className="flex items-center gap-3.5 group">
            <img 
              src={officialEmblem} 
              alt="AAROGYA CASE Official Emblem" 
              className="h-12 w-auto object-contain shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" 
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#7c2800]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  AAROGYA CASE
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] rounded-full" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Ambulance Portal
                </span>
              </div>
              <span className="text-xs font-medium text-[#5a4138] mt-0.5">
                Emergency Response Network • Healthcare Operations Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#f2f4f6] p-1.5 rounded-full shadow-[0_1px_4px_rgba(25,28,30,0.04)]">
            <Link 
              to="/ambulance/dashboard" 
              className={`text-sm font-semibold rounded-full px-5 py-1.5 transition-all ${
                activeNav === 'Dashboard' 
                  ? 'bg-[#7c2800] text-white shadow-sm' 
                  : 'text-[#5a4138] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Dashboard
            </Link>
            <Link 
              to="/ambulance/request" 
              className={`text-sm font-semibold rounded-full px-5 py-1.5 transition-all ${
                activeNav === 'Emergency Requests' 
                  ? 'bg-[#7c2800] text-white shadow-sm' 
                  : 'text-[#5a4138] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Emergency Requests
            </Link>
            <Link 
              to="/ambulance/completed" 
              className={`text-sm font-semibold rounded-full px-5 py-1.5 transition-all ${
                activeNav === 'Completed' 
                  ? 'bg-[#7c2800] text-white shadow-sm' 
                  : 'text-[#5a4138] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Completed
            </Link>
          </nav>

          {/* Unit Status Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#006b25]/10 border border-[#006b25]/20 text-[#006b25] text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006b25] animate-pulse"></span>
              <span>Unit #08 • Central Base</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#7c2800] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden w-full bg-[#f2f4f6] border-t border-[#e0e3e5] px-4 py-2 overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
          <nav className="flex items-center gap-2">
            <Link 
              to="/ambulance/dashboard" 
              className={`text-xs font-semibold rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all shrink-0 ${
                activeNav === 'Dashboard' 
                  ? 'bg-[#7c2800] text-white shadow-sm' 
                  : 'text-[#5a4138] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Dashboard
            </Link>
            <Link 
              to="/ambulance/request" 
              className={`text-xs font-semibold rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all shrink-0 ${
                activeNav === 'Emergency Requests' 
                  ? 'bg-[#7c2800] text-white shadow-sm' 
                  : 'text-[#5a4138] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Emergency Requests
            </Link>
            <Link 
              to="/ambulance/completed" 
              className={`text-xs font-semibold rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all shrink-0 ${
                activeNav === 'Completed' 
                  ? 'bg-[#7c2800] text-white shadow-sm' 
                  : 'text-[#5a4138] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Completed
            </Link>
          </nav>
        </div>
      </header>

      {/* 3. Page Content */}
      <main className="flex-1 w-full bg-[#f8f9fc]">
        {children}
      </main>

      {/* 4. Footer */}
      <div className="no-print">
        <Footer />
      </div>
    </div>
  )
}
