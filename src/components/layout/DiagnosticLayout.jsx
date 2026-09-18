import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import UtilityBar from './UtilityBar'
import Footer from './Footer'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'

export default function DiagnosticLayout({
  children,
  activeNav = 'Dashboard'
}) {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e] antialiased selection:bg-[#b2cdfe] selection:text-[#3c5781]" style={{ fontFamily: "'Atkinson Hyperlegible Next', 'Lexend', sans-serif" }}>
      {/* 1. Official Institutional Utility Bar */}
      <div className="no-print">
        <UtilityBar activeService="Diagnostic, Laboratory & Imaging Services" />
      </div>

      {/* 2. Diagnostic Portal Header */}
      <header className="w-full bg-white/95 backdrop-blur-xl border-b border-[#eceef0] sticky top-0 z-40 shadow-[0_1px_8px_rgba(25,28,30,0.05)] no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Branding */}
          <Link to="/diagnostic/dashboard" className="flex items-center gap-3.5 group">
            <img 
              src={officialEmblem} 
              alt="AAROGYA CASE Official Emblem" 
              className="h-12 w-auto object-contain shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" 
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  AAROGYA CASE
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#ffdbcf] text-[#380d00] border border-[#ffb59a] rounded-full" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Diagnostic &amp; Scan Portal
                </span>
              </div>
              <span className="text-xs font-medium text-[#58423a] mt-0.5">
                Healthcare Diagnostic &amp; Imaging System
              </span>
            </div>
          </Link>

          {/* Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#f2f4f6] p-1.5 rounded-full shadow-[0_1px_4px_rgba(25,28,30,0.04)]">
            <Link 
              to="/diagnostic/dashboard" 
              className={`text-sm font-semibold rounded-full px-5 py-1.5 transition-all ${
                activeNav === 'Dashboard' 
                  ? 'bg-[#00501a] text-white shadow-sm' 
                  : 'text-[#58423a] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Dashboard
            </Link>
            <Link 
              to="/diagnostic/requests" 
              className={`text-sm font-semibold rounded-full px-5 py-1.5 transition-all ${
                activeNav === 'Requests' 
                  ? 'bg-[#00501a] text-white shadow-sm' 
                  : 'text-[#58423a] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Requests
            </Link>
            <Link 
              to="/diagnostic/completed-reports" 
              className={`text-sm font-semibold rounded-full px-5 py-1.5 transition-all ${
                activeNav === 'Reports' || activeNav === 'Completed Reports' || activeNav === 'Reports / History'
                  ? 'bg-[#00501a] text-white shadow-sm' 
                  : 'text-[#58423a] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Reports / History
            </Link>
            <Link 
              to="/diagnostic/profile" 
              className={`text-sm font-semibold rounded-full px-5 py-1.5 transition-all ${
                activeNav === 'Profile' 
                  ? 'bg-[#00501a] text-white shadow-sm' 
                  : 'text-[#58423a] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Profile
            </Link>
          </nav>

          {/* Workstation Node & Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#f2f4f6] text-[#191c1e] text-xs font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Diagnostic Lab #02
              </span>
              <span className="text-[11px] text-[#58423a]">Central Diagnostic Node</span>
            </div>
            <Link to="/diagnostic/profile" className="w-9 h-9 rounded-full bg-[#7c2800] text-white flex items-center justify-center hover:opacity-90 shadow-sm" title="Technician Station Profile">
              <span className="material-symbols-outlined text-[19px]">person</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden w-full bg-[#f2f4f6] border-t border-[#e0e3e5] px-4 py-2 overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
          <nav className="flex items-center gap-2">
            <Link 
              to="/diagnostic/dashboard" 
              className={`text-xs font-semibold rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all shrink-0 ${
                activeNav === 'Dashboard' 
                  ? 'bg-[#00501a] text-white shadow-sm' 
                  : 'text-[#58423a] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Dashboard
            </Link>
            <Link 
              to="/diagnostic/requests" 
              className={`text-xs font-semibold rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all shrink-0 ${
                activeNav === 'Requests' 
                  ? 'bg-[#00501a] text-white shadow-sm' 
                  : 'text-[#58423a] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Requests
            </Link>
            <Link 
              to="/diagnostic/completed-reports" 
              className={`text-xs font-semibold rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all shrink-0 ${
                activeNav === 'Reports' || activeNav === 'Completed Reports' || activeNav === 'Reports / History'
                  ? 'bg-[#00501a] text-white shadow-sm' 
                  : 'text-[#58423a] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Reports / History
            </Link>
            <Link 
              to="/diagnostic/profile" 
              className={`text-xs font-semibold rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all shrink-0 ${
                activeNav === 'Profile' 
                  ? 'bg-[#00501a] text-white shadow-sm' 
                  : 'text-[#58423a] hover:text-[#191c1e] hover:bg-white/60'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Profile
            </Link>
          </nav>
        </div>
      </header>

      {/* 3. Main Content */}
      <main className="flex-grow w-full">
        {children}
      </main>

      {/* 4. Institutional Footer */}
      <div className="no-print">
        <Footer />
      </div>
    </div>
  )
}
