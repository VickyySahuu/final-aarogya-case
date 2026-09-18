import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'
import Footer from './Footer'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/doctor/dashboard' },
  { label: 'OPD Queue', path: '/doctor/opd-queue' },
  { label: 'Patient Search', path: '/doctor/patient-search' },
  { label: 'Pending Work', path: '/doctor/pending-work' },
  { label: 'Profile', path: '/doctor/profile' },
]

export default function DoctorLayout({ 
  children, 
  activeNav = 'Dashboard',
  showPatientContext = false,
  patientName: propPatientName,
  patientAge: propPatientAge,
  patientToken: propPatientToken,
  patientAbha: propPatientAbha,
  patientUniqueCode: propPatientUniqueCode,
}) {
  const location = useLocation()

  let cachedPatient = null
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('aarogya_doctor_active_patient')
      if (stored) cachedPatient = JSON.parse(stored)
    } catch (e) {}
  }

  const patientName = propPatientName || cachedPatient?.name || ''
  const patientAge = propPatientAge || cachedPatient?.age || ''
  const patientToken = propPatientToken || cachedPatient?.token || ''
  const patientAbha = propPatientAbha || cachedPatient?.abha || '91-8273-1092-4410'
  const patientUniqueCode = propPatientUniqueCode || cachedPatient?.uniqueCode || ''

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e] antialiased" style={{ fontFamily: "'Atkinson Hyperlegible Next', 'Lexend', sans-serif" }}>
      {/* Top Utility Bar */}
      <div className="w-full bg-[#455f8a] text-white h-10 flex items-center justify-between px-4 sm:px-10 text-xs no-print" style={{ fontFamily: 'Lexend, sans-serif' }}>
        <div className="flex items-center gap-2 sm:gap-3 font-medium tracking-wide min-w-0">
          <span className="material-symbols-outlined text-[16px] shrink-0">verified</span>
          <span className="truncate">AAROGYA CASE</span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span className="text-[#d6e3ff] hidden sm:inline">Healthcare Digital Platform</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <a href="#" className="hover:underline flex items-center gap-1 text-white hidden sm:flex">
            <span className="material-symbols-outlined text-[16px]">accessibility_new</span>Accessibility
          </a>
          <a href="#" className="hover:underline flex items-center gap-1 text-white">
            <span className="material-symbols-outlined text-[16px]">help</span>Help
          </a>
        </div>
      </div>

      {/* Main Header */}
      <div className="min-h-[56px] sm:h-20 w-full px-4 sm:px-10 flex items-center justify-between bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] sticky top-0 z-50 no-print py-2 sm:py-0">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link to="/" className="shrink-0">
            <img src={officialEmblem} alt="AAROGYA CASE Official Emblem" className="h-9 sm:h-12 w-auto object-contain" />
          </Link>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-xl font-bold tracking-tight text-[#00501a]" style={{ fontFamily: 'Lexend, sans-serif' }}>AAROGYA CASE</span>
              <span className="text-[#dfc0b5] hidden sm:inline">—</span>
              <span className="text-[15px] font-semibold text-[#58423a] hidden sm:inline" style={{ fontFamily: 'Lexend, sans-serif' }}>Healthcare Digital Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-[#d6e3ff] text-[#2c4771] px-2 py-0.5 rounded text-xs font-semibold tracking-wide uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>Doctor Portal</span>
              <span className="text-sm text-[#8f7066] hidden md:inline" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>District Civil Hospital • Outpatient Department</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex-col text-right hidden sm:flex">
            <span className="text-[15px] font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Dr. Ramanathan Venkatraman</span>
            <span className="text-sm text-[#58423a]" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>Doctor ID: DOC-1042</span>
          </div>
          <Link to="/doctor/profile" className="w-10 h-10 rounded-full bg-[#00501a] flex items-center justify-center shadow-sm shrink-0" title="Doctor Profile">
            <span className="material-symbols-outlined text-white text-[22px]">person</span>
          </Link>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="w-full px-4 sm:px-10 bg-[#f2f4f6] border-b border-[#dfc0b5] no-print">
        <nav className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.label === activeNav || location.pathname === item.path
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`px-4 py-2 rounded-full text-[15px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'bg-[#27853a] text-white'
                    : 'text-[#58423a] hover:text-[#191c1e] hover:bg-[#e6e8ea]'
                }`}
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Optional Patient Context Bar */}
      {showPatientContext && patientName && (
        <div className="w-full px-4 sm:px-10 bg-[#f2f4f6] py-2 shadow-[0_1px_4px_rgba(0,0,0,0.02)] border-b border-[#dfc0b5] no-print">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1 bg-[#a43700] text-white px-3 py-1 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" style={{ animationDuration: '2s' }}></span>
                <span className="uppercase tracking-wider">Active Consultation</span>
              </div>
              <div className="flex items-center gap-2 text-[#191c1e] text-[15px] font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span>{patientName}</span>
                <span className="text-[#58423a] font-normal text-sm" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>({patientAge})</span>
                <span className="px-2 py-0.5 rounded bg-[#e1e2e5] text-[#58423a] text-xs font-semibold">Token {patientToken}</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-mono font-bold border border-blue-200">
                  {patientUniqueCode}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[#58423a]">
              <span>ABHA ID: {patientAbha}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow w-full">
        {children}
      </main>

      {/* Shared Unified Footer */}
      <div className="no-print mt-auto">
        <Footer />
      </div>
    </div>
  )
}

