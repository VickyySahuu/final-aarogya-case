import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import UtilityBar from './UtilityBar'
import Footer from './Footer'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'

export default function AdminLayout({
  children,
  activeNav = 'Dashboard'
}) {
  const location = useLocation()

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Doctors', path: '/admin/doctors' },
    { label: 'Hospitals', path: '/admin/hospitals' },
    { label: 'Medicines', path: '/admin/medicines' },
    { label: 'Diagnostics', path: '/admin/diagnostics' },
    { label: 'Ambulances', path: '/admin/ambulances' },
    { label: 'Profile', path: '/admin/profile' }
  ]

  const isNavActive = (item) => {
    if (activeNav.toLowerCase() === item.label.toLowerCase()) return true
    if (location.pathname === item.path) return true
    if (item.label === 'Doctors' && location.pathname.includes('/admin/manage-doctor')) return true
    if (item.label === 'Hospitals' && location.pathname.includes('/admin/manage-hospital')) return true
    if (item.label === 'Medicines' && location.pathname.includes('/admin/manage-medicine')) return true
    if (item.label === 'Diagnostics' && location.pathname.includes('/admin/manage-diagnostic')) return true
    if (item.label === 'Ambulances' && location.pathname.includes('/admin/manage-ambulance')) return true
    if (item.label === 'Profile' && location.pathname.includes('/admin/profile')) return true
    return false
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-[#f8f9fc] text-[#191c1e] antialiased selection:bg-[#ffdbcf] selection:text-[#380d00]" 
      style={{ fontFamily: "'Atkinson Hyperlegible Next', 'Lexend', sans-serif" }}
    >
      {/* 1. Official Institutional Utility Bar */}
      <div className="no-print">
        <UtilityBar activeService="Central Administration Console" />
      </div>

      {/* 2. Admin Portal Header */}
      <header className="w-full bg-[#f7f9fb]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] sticky top-0 z-40 no-print border-b border-[#eceef0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Branding */}
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <img 
              src={officialEmblem} 
              alt="AAROGYA CASE Official Emblem" 
              className="h-10 sm:h-12 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform" 
            />
            <div className="flex flex-col">
              <span className="font-bold text-lg sm:text-xl text-[#191c1e] tracking-tight leading-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                AAROGYA CASE — ADMIN PORTAL
              </span>
              <span className="text-[11px] text-[#58423a] uppercase tracking-wider font-semibold">
                Healthcare Digital Platform • Central Administration Console
              </span>
            </div>
          </Link>

          {/* Admin User Telemetry */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-[#f2f4f6] rounded-full border border-[#e6e8ea]">
              <span className="material-symbols-outlined text-[#00501a] text-[18px]">verified_user</span>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-[#191c1e] leading-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>System Admin</span>
                <span className="text-[10px] text-[#58423a]">Central Operations Node</span>
              </div>
            </div>
            <Link to="/admin/profile" className="w-9 h-9 rounded-full bg-[#7c2800] text-white flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity" title="System Administrator Profile">
              <span className="material-symbols-outlined text-white text-[18px]">person</span>
            </Link>
          </div>
        </div>

        {/* Navigation Strip */}
        <div className="w-full bg-[#f2f4f6] border-t border-[#e0e3e5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
              {navItems.map((item) => {
                const active = isNavActive(item)
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#00501a] text-white shadow-sm'
                        : 'text-[#58423a] hover:bg-[#e6e8ea] hover:text-[#191c1e]'
                    }`}
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* 3. Page Main Content */}
      <main className="flex-1 w-full bg-[#f8f9fc]">
        {children}
      </main>

      {/* 4. Official Footer */}
      <div className="no-print">
        <Footer />
      </div>
    </div>
  )
}
