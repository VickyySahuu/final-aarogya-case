import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'
import { PrescriptionApi } from '../../services/prescriptionApi'

export default function PharmacyLoginPage() {
  const navigate = useNavigate()
  const [pharmacyId, setPharmacyId] = useState('PHARM-01')
  const [password, setPassword] = useState('demo123')
  const [showPassword, setShowPassword] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const trimmedId = pharmacyId.trim()
    if (!trimmedId) {
      setErrorMessage('Please enter your Pharmacy Counter ID.')
      return
    }

    setIsProcessing(true)
    try {
      const res = await PrescriptionApi.loginPharmacy(trimmedId, password)
      if (res && res.ok) {
        setIsProcessing(false)
        navigate('/pharmacy/dashboard')
      } else {
        setIsProcessing(false)
        setErrorMessage(res?.message || 'Unable to authenticate pharmacy counter. Please check credentials.')
      }
    } catch (err) {
      console.error('Pharmacy login error:', err)
      setIsProcessing(false)
      setErrorMessage('Network connection error. Unable to reach authentication server.')
    }
  }

  return (
    <main className="w-full min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4 selection:bg-[#b2cdfe] selection:text-[#3c5781]" style={{ fontFamily: "'Atkinson Hyperlegible Next', 'Lexend', sans-serif" }}>
      <div className="flex flex-col w-full items-center justify-center py-8 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 sm:p-10 shadow-lg border border-slate-200 flex flex-col items-center">
          {/* Institutional Emblem & Title */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-16 h-16 mb-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 shadow-xs">
              <img 
                src={officialEmblem} 
                alt="AAROGYA CASE Official Emblem" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
              AAROGYA CASE
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Pharmacy Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
              District Civil Hospital Dispensary • Outpatient Medication Dispensing &amp; Verification
            </p>
          </div>

          {/* Quick Demo Credentials Helper */}
          <div className="w-full mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#166534] text-[18px]">badge</span>
              <span className="text-slate-700">Counter #01: <strong className="font-mono text-[#166534]">PHARM-01</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPharmacyId('PHARM-01')
                setPassword('demo123')
                setErrorMessage('')
              }}
              className="px-2.5 py-1 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white text-[11px] font-bold transition-colors cursor-pointer"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Auto-Fill
            </button>
          </div>

          {/* Error State Banner */}
          {errorMessage && (
            <div className="w-full mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs text-left animate-shake">
              <span className="material-symbols-outlined text-red-500 text-lg shrink-0 mt-0.5">error</span>
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="w-full flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-[#0A2540] uppercase tracking-wider" htmlFor="pharmacy-id" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Pharmacy Counter ID
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                  domain
                </span>
                <input 
                  id="pharmacy-id" 
                  name="pharmacy-id" 
                  type="text"
                  value={pharmacyId}
                  onChange={(e) => {
                    setPharmacyId(e.target.value)
                    if (errorMessage) setErrorMessage('')
                  }}
                  placeholder="e.g. PHARM-01" 
                  required
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm font-medium rounded-xl transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#166534] border border-slate-200 focus:border-transparent font-mono" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-[#0A2540] uppercase tracking-wider" htmlFor="password" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Counter Password
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                  lock
                </span>
                <input 
                  id="password" 
                  name="password" 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errorMessage) setErrorMessage('')
                  }}
                  placeholder="Enter counter password" 
                  required
                  className="w-full h-12 pl-11 pr-11 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm rounded-xl transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#166534] border border-slate-200 focus:border-transparent" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility" 
                  className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3 items-center">
              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full h-12 rounded-full bg-[#166534] hover:bg-[#14532d] disabled:opacity-60 text-white text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer btn-press"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>LOGIN TO DISPENSARY</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>

              <Link 
                to="/" 
                className="text-xs font-semibold text-slate-500 hover:text-[#0A2540] transition-colors flex items-center justify-center gap-1.5 py-1"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Main Portal</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
