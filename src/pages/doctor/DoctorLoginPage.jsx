import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'
import { DoctorApi } from '../../services/doctorApi'

export default function DoctorLoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [doctorId, setDoctorId] = useState('DOC-1042')
  const [password, setPassword] = useState('doctor123')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!doctorId.trim()) {
      setError(true)
      setErrorMessage('Please enter your Doctor ID or registered email.')
      return
    }
    setError(false)
    setErrorMessage('')
    setLoading(true)

    try {
      const res = await DoctorApi.loginDoctor(doctorId.trim(), password)
      if (res && res.success && res.token) {
        navigate('/doctor/dashboard')
      } else {
        setError(true)
        setErrorMessage(res?.message || 'Invalid Doctor ID or credentials. Please check and try again.')
      }
    } catch (err) {
      setError(true)
      setErrorMessage(err.message || 'Error connecting to authentication service.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>
      <main className="w-full min-h-screen flex items-center justify-center">
        <div className="flex flex-col w-full px-4 md:px-6 lg:px-10 py-8 items-center justify-center relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#00501a]/5 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#7c2800]/5 blur-3xl pointer-events-none"></div>

          {/* Top bar */}
          <div className="w-full max-w-5xl mb-6 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-[#58423a] hover:text-[#191c1e] py-2 px-3 rounded-2xl hover:bg-[#eceef0] transition-all">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              <span className="font-semibold text-[15px]" style={{ fontFamily: 'Lexend, sans-serif' }}>Back to Main Portal Entry</span>
            </Link>
            <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-[#eceef0] text-[#58423a] text-xs font-semibold tracking-wider uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>
              <span className="inline-block w-2 h-2 rounded-full bg-[#00501a]"></span>
              ABDM Gateway Compliant
            </div>
          </div>

          {/* Main Card */}
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
            {/* Left Panel */}
            <div className="lg:col-span-5 bg-[#f2f4f6] p-8 lg:p-12 flex flex-col justify-between relative">
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#00501a] flex items-center justify-center text-white shadow-md">
                    <span className="material-symbols-outlined text-2xl fill">local_hospital</span>
                  </div>
                  <div>
                    <span className="block text-xl font-semibold tracking-tight text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>AAROGYA CASE</span>
                    <span className="text-xs text-[#58423a] uppercase tracking-widest font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Doctor Portal</span>
                  </div>
                </div>
                <div className="pt-4">
                  <span className="text-xs text-[#00501a] font-bold tracking-widest uppercase block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>Authorized Medical Officer Access</span>
                  <p className="text-base text-[#58423a] leading-relaxed">
                    Unified digital touchpoint for outpatient queue orchestration, real-time diagnostic reports, and encrypted ABDM health locker synchronizations.
                  </p>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white shadow-sm">
                    <span className="material-symbols-outlined text-[#00501a] mt-0.5">verified_user</span>
                    <div>
                      <p className="font-semibold text-[15px] text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Hospital Pre-Enrolled</p>
                      <p className="text-sm text-[#58423a]">Credentials are issued and verified via Hospital Staff Directory.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white shadow-sm">
                    <span className="material-symbols-outlined text-[#455f8a] mt-0.5">security_update_good</span>
                    <div>
                      <p className="font-semibold text-[15px] text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Hardware Key &amp; OTP Ready</p>
                      <p className="text-sm text-[#58423a]">Session access adheres to Tier-3 clinical encryption mandates.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 relative z-10">
                <div className="p-4 rounded-2xl bg-[#eceef0] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#58423a]">hub</span>
                    <span className="text-xs text-[#58423a] font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Central Registry Sync Status</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#9bf79f] text-[#00531b]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className="lg:col-span-7 p-8 lg:p-16 flex flex-col justify-center">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#191c1e] tracking-tight mb-2" style={{ fontFamily: 'Lexend, sans-serif', letterSpacing: '-0.02em' }}>Doctor Login</h1>
                <p className="text-lg text-[#58423a]">
                  Sign in to access your outpatient clinic queue, patient health records, and clinical consultation tools.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-[#ffdad6] text-[#93000a] flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5">error</span>
                  <div>
                    <p className="font-semibold text-[15px]" style={{ fontFamily: 'Lexend, sans-serif' }}>Unable to Sign In</p>
                    <p className="text-sm">{errorMessage || 'Please check your Doctor ID and Password. If the issue persists, contact the IT Help Desk or use Forgot Password.'}</p>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-lg font-semibold text-[#191c1e]" htmlFor="doctor-id" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    <span>Doctor ID / Email <span className="text-[#7c2800]">*</span></span>
                    <span className="text-xs text-[#58423a] font-normal" style={{ fontFamily: 'Lexend, sans-serif' }}>Official Medical ID</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-[#58423a] pointer-events-none">badge</span>
                    <input
                      className="w-full h-14 pl-14 pr-4 bg-[#f2f4f6] text-[#191c1e] placeholder:text-[#58423a]/60 rounded-2xl text-base focus:outline-none focus:bg-white focus:shadow-md transition-all shadow-sm"
                      id="doctor-id"
                      placeholder="Enter Doctor ID or registered hospital email (e.g. DOC-1042)"
                      type="text"
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-lg font-semibold text-[#191c1e]" htmlFor="doctor-password" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Password <span className="text-[#7c2800]">*</span>
                    </label>
                    <Link to="/doctor/forgot-password" className="text-[15px] font-semibold text-[#455f8a] hover:underline" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-[#58423a] pointer-events-none">lock</span>
                    <input
                      className="w-full h-14 pl-14 pr-14 bg-[#f2f4f6] text-[#191c1e] placeholder:text-[#58423a]/60 rounded-2xl text-base focus:outline-none focus:bg-white focus:shadow-md transition-all shadow-sm"
                      id="doctor-password"
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 p-2 text-[#58423a] hover:text-[#191c1e] flex items-center justify-center rounded-full hover:bg-[#eceef0] transition-all"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-[#00501a] text-white rounded-full text-lg font-semibold shadow-md hover:shadow-xl hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span className="material-symbols-outlined">{loading ? 'sync' : 'login'}</span>
                    <span>{loading ? 'AUTHENTICATING...' : 'LOGIN'}</span>
                  </button>
                </div>
              </form>

              <div className="mt-8 p-4 bg-[#f2f4f6] rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-[#00501a] flex-shrink-0 mt-0.5">policy</span>
                <p className="text-sm text-[#58423a] leading-relaxed">
                  <strong className="text-[#191c1e] font-semibold">Clinical Data Protection:</strong> Unauthorized access to patient health records is strictly prohibited under Digital Personal Data Protection standards and ABDM protocols.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between text-[#58423a] text-xs font-semibold pt-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span>Session ID: <span className="font-mono text-[#191c1e]">AUTH-M-7719</span></span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#00501a]">lock</span>
                  256-Bit SSL Encrypted
                </span>
              </div>
            </div>
          </div>

          {/* Bottom text */}
          <div className="w-full max-w-5xl mt-6 flex flex-col sm:flex-row items-center justify-between text-[#58423a] text-sm gap-3 px-1">
            <p>AAROGYA CASE Healthcare Digital Platform • Clinical Operations Console</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-[#191c1e] transition-colors">Compliance Norms</a>
              <span className="inline-block w-1 h-1 rounded-full bg-[#dfc0b5]"></span>
              <a href="#" className="hover:text-[#191c1e] transition-colors">Institutional Helpdesk</a>
              <span className="inline-block w-1 h-1 rounded-full bg-[#dfc0b5]"></span>
              <a href="#" className="hover:text-[#191c1e] transition-colors">Tele-Consult Protocol</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
