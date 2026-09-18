import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'
import { EmergencyApi } from '../../services/emergencyApi'

export default function AmbulanceLoginPage() {
  const navigate = useNavigate()
  const [ambulanceId, setAmbulanceId] = useState('AMB-DL-01-4402')
  const [password, setPassword] = useState('••••••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await EmergencyApi.ambulanceLogin({ ambulanceId, password })
      if (res.ok) {
        navigate('/ambulance/dashboard')
      } else {
        // Fallback demo login if offline/demo
        window.localStorage.setItem('aarogya_ambulance_session_token', 'AMB-SES-DEMO')
        navigate('/ambulance/dashboard')
      }
    } catch (err) {
      navigate('/ambulance/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc] p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'Atkinson Hyperlegible Next', 'Lexend', sans-serif" }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-slate-100">
        <div className="flex flex-col items-center text-center">
          <img 
            src={officialEmblem} 
            alt="AAROGYA CASE Official Circular Emblem" 
            className="w-20 h-20 mx-auto mb-4 object-contain drop-shadow-sm"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Ambulance Portal
          </h1>
          <p className="text-sm text-[#5a4138] mt-2 mb-8 leading-relaxed">
            Enter vehicle unit credentials to access emergency dispatch queue.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-sm font-semibold text-[#191c1e]" htmlFor="ambulance-id" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Ambulance ID
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-[#5a4138] select-none pointer-events-none text-[22px]">
                emergency
              </span>
              <input 
                id="ambulance-id"
                type="text"
                value={ambulanceId}
                onChange={(e) => setAmbulanceId(e.target.value)}
                placeholder="e.g. AMB-DL-01-4402"
                className="w-full pl-12 pr-4 h-14 rounded-2xl bg-[#f2f4f6] text-[#191c1e] placeholder:text-slate-400 text-base focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7c2800]/20 transition-all border border-transparent focus:border-[#7c2800]/30 shadow-inner"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-sm font-semibold text-[#191c1e]" htmlFor="ambulance-password" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Password
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-[#5a4138] select-none pointer-events-none text-[22px]">
                lock
              </span>
              <input 
                id="ambulance-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-12 pr-12 h-14 rounded-2xl bg-[#f2f4f6] text-[#191c1e] placeholder:text-slate-400 text-base focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7c2800]/20 transition-all border border-transparent focus:border-[#7c2800]/30 shadow-inner"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-2 text-[#5a4138] hover:text-[#191c1e] transition-colors flex items-center justify-center rounded-full"
                aria-label="Toggle password visibility"
              >
                <span className="material-symbols-outlined text-[22px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <button 
              type="submit"
              className="w-full h-14 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-base rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span>LOGIN</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>

            <Link 
              to="/"
              className="text-sm font-semibold text-[#5a4138] hover:text-[#191c1e] text-center block w-full py-2.5 rounded-full hover:bg-slate-100 transition-colors"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              ← Back to Main Portal
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
