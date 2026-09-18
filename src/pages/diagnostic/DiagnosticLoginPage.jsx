import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'

export default function DiagnosticLoginPage() {
  const navigate = useNavigate()
  const [centerId, setCenterId] = useState('DIAG-CTR-02')
  const [password, setPassword] = useState('••••••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    if (!centerId.trim()) {
      alert('Please enter Diagnostic Center ID')
      return
    }
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      navigate('/diagnostic/dashboard')
    }, 800)
  }

  return (
    <main className="w-full min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4 selection:bg-[#b2cdfe] selection:text-[#3c5781]" style={{ fontFamily: "'Atkinson Hyperlegible Next', 'Lexend', sans-serif" }}>
      <div className="w-full max-w-md mx-auto py-8">
        <div className="w-full bg-white rounded-2xl shadow-md p-8 sm:p-10 flex flex-col items-center text-center border border-slate-100">
          {/* Official Emblem */}
          <div className="w-20 h-20 mb-5 rounded-full bg-[#f2f4f6] flex items-center justify-center overflow-hidden shadow-xs">
            <img 
              src={officialEmblem} 
              alt="AAROGYA CASE Official Emblem" 
              className="w-full h-full object-contain" 
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] mb-1 tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Diagnostic Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#5a4138] max-w-xs mb-8 leading-relaxed">
            Enter laboratory / center credentials to access diagnostic queue.
          </p>

          <form className="w-full flex flex-col gap-5 text-left" onSubmit={handleLogin}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#191c1e] uppercase tracking-wider" htmlFor="center-id" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Diagnostic Center ID
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-[#8f7066] select-none pointer-events-none text-[20px]">
                  domain
                </span>
                <input 
                  id="center-id" 
                  type="text" 
                  required
                  placeholder="e.g. DIAG-CTR-02"
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value)}
                  className="w-full min-h-[3.25rem] pl-12 pr-4 bg-[#f2f4f6] rounded-xl text-sm text-[#191c1e] shadow-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7c2800] border border-transparent transition-colors" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#191c1e] uppercase tracking-wider" htmlFor="password" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Password
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-[#8f7066] select-none pointer-events-none text-[20px]">
                  lock
                </span>
                <input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[3.25rem] pl-12 pr-12 bg-[#f2f4f6] rounded-xl text-sm text-[#191c1e] shadow-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7c2800] border border-transparent transition-colors" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility" 
                  className="absolute right-3 p-2 text-[#8f7066] hover:text-[#191c1e] focus:outline-none flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined select-none text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              className="w-full min-h-[3.25rem] mt-2 rounded-full bg-[#006b25] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#00501a] active:scale-[0.99] transition-all cursor-pointer btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>LOGIN</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>

            <div className="flex justify-center mt-2">
              <Link 
                to="/" 
                className="text-xs font-semibold text-[#455f8a] hover:text-[#191c1e] flex items-center gap-1.5 transition-colors py-2 px-4 rounded-full"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Back to Main Portal</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
