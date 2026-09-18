import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function DoctorForgotPasswordPage() {
  const [step, setStep] = useState('forgot') // 'forgot' | 'reset' | 'done'
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>
      <div className="flex flex-col w-full px-4 md:px-6 lg:px-10 py-8 items-center justify-center relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#00501a]/5 blur-3xl pointer-events-none"></div>
        <div className="w-full max-w-xl mb-6">
          <Link to="/doctor/login" className="inline-flex items-center gap-2 text-[#58423a] hover:text-[#191c1e] py-2 px-3 rounded-2xl hover:bg-[#eceef0] transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            <span className="font-semibold text-[15px]" style={{ fontFamily: 'Lexend, sans-serif' }}>Back to Doctor Login</span>
          </Link>
        </div>
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          {step === 'forgot' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#455f8a] flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-2xl">lock_reset</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>Forgot Password</h1>
                  <p className="text-sm text-[#58423a]">Doctor Portal Account Recovery</p>
                </div>
              </div>
              <p className="text-base text-[#58423a] mb-6 leading-relaxed">
                Enter your registered Doctor ID or hospital email address. A secure password reset link will be sent to your registered email or mobile.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); setStep('reset') }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-lg font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Doctor ID / Email <span className="text-[#7c2800]">*</span></label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#58423a]">badge</span>
                    <input className="w-full h-14 pl-14 pr-4 bg-[#f2f4f6] rounded-2xl text-base focus:outline-none focus:bg-white focus:shadow-md transition-all shadow-sm" placeholder="e.g. DOC-1042 or doctor@hospital.org" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="w-full h-14 bg-[#455f8a] text-white rounded-full text-lg font-semibold shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="material-symbols-outlined">send</span>
                  <span>SEND RESET LINK</span>
                </button>
              </form>
            </>
          )}
          {step === 'reset' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#00501a] flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-2xl">lock_open</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>Reset Password</h1>
                  <p className="text-sm text-[#58423a]">Create a new secure password</p>
                </div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setStep('done') }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-lg font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>New Password <span className="text-[#7c2800]">*</span></label>
                  <input className="w-full h-14 pl-4 pr-4 bg-[#f2f4f6] rounded-2xl text-base focus:outline-none focus:bg-white focus:shadow-md transition-all shadow-sm" type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <label className="text-lg font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Confirm Password <span className="text-[#7c2800]">*</span></label>
                  <input className="w-full h-14 pl-4 pr-4 bg-[#f2f4f6] rounded-2xl text-base focus:outline-none focus:bg-white focus:shadow-md transition-all shadow-sm" type="password" placeholder="Confirm new password" />
                </div>
                <button type="submit" className="w-full h-14 bg-[#00501a] text-white rounded-full text-lg font-semibold shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>RESET PASSWORD</span>
                </button>
              </form>
            </>
          )}
          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#9bf79f] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[#00501a] text-3xl">check</span>
              </div>
              <h2 className="text-2xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>Password Reset Successful</h2>
              <p className="text-base text-[#58423a] mb-6">Your password has been updated. You can now sign in with your new credentials.</p>
              <Link to="/doctor/login" className="inline-flex h-14 px-8 bg-[#00501a] text-white rounded-full text-lg font-semibold shadow-md items-center justify-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined">login</span>
                <span>BACK TO LOGIN</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
