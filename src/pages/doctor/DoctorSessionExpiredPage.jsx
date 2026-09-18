import React from 'react'
import { Link } from 'react-router-dom'
import { DoctorApi } from '../../services/doctorApi'

export default function DoctorSessionExpiredPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 lg:p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#ffdbcf] flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[#7c2800] text-3xl">timer_off</span>
        </div>
        <h1 className="text-2xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>Session Expired</h1>
        <p className="text-base text-[#58423a] mb-2">Your clinical session has timed out due to inactivity.</p>
        <p className="text-sm text-[#8f7066] mb-8">For the security of patient records and compliance with ABDM protocols, sessions are automatically terminated after 15 minutes of inactivity.</p>
        <div className="p-4 bg-[#f2f4f6] rounded-2xl mb-6 flex items-start gap-3 text-left">
          <span className="material-symbols-outlined text-[#455f8a] flex-shrink-0 mt-0.5">info</span>
          <p className="text-sm text-[#58423a]">Any unsaved clinical notes or prescription drafts may have been preserved as auto-recovery data. They will be available upon re-login.</p>
        </div>
        <Link 
          to="/doctor/login" 
          onClick={() => DoctorApi.logoutDoctor()}
          className="inline-flex h-14 px-8 bg-[#455f8a] text-white rounded-full text-lg font-semibold shadow-md items-center justify-center gap-2" 
          style={{ fontFamily: 'Lexend, sans-serif' }}
        >
          <span className="material-symbols-outlined">login</span>
          <span>SIGN IN AGAIN</span>
        </Link>
        <div className="mt-6 text-xs text-[#8f7066] font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
          Session ID: AUTH-M-7719 • Expired at 11:42 AM IST
        </div>
      </div>
    </div>
  )
}
