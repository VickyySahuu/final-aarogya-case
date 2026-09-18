import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { DoctorApi } from '../../services/doctorApi'

export default function DoctorLogoutPage() {
  const [loggedOut, setLoggedOut] = useState(false)

  const handleConfirmLogout = () => {
    DoctorApi.logoutDoctor()
    setLoggedOut(true)
  }

  if (loggedOut) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 lg:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#9bf79f] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[#00501a] text-3xl">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>You are Logged Out</h1>
          <p className="text-base text-[#58423a] mb-2">Your clinical session has been securely terminated.</p>
          <p className="text-sm text-[#8f7066] mb-8">All patient data access has been revoked and the session token invalidated per ABDM compliance mandates.</p>
          <Link to="/doctor/login" className="inline-flex h-14 px-8 bg-[#00501a] text-white rounded-full text-lg font-semibold shadow-md items-center justify-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <span className="material-symbols-outlined">login</span>
            <span>SIGN IN AGAIN</span>
          </Link>
          <div className="mt-4">
            <Link to="/" className="text-[15px] font-semibold text-[#455f8a] hover:underline" style={{ fontFamily: 'Lexend, sans-serif' }}>Return to Main Portal</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 lg:p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#ffdbcf] flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[#7c2800] text-3xl">logout</span>
        </div>
        <h1 className="text-2xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>Logout</h1>
        <p className="text-base text-[#58423a] mb-6">Are you sure you want to end your clinical session? Any unsaved changes will be auto-recovered on next login.</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/doctor/dashboard" className="h-14 px-6 bg-[#eceef0] text-[#191c1e] rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#e1e2e5] transition-colors" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <span>CANCEL</span>
          </Link>
          <button onClick={handleConfirmLogout} className="h-14 px-8 bg-[#7c2800] text-white rounded-full text-[15px] font-semibold shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <span className="material-symbols-outlined">logout</span>
            <span>CONFIRM LOGOUT</span>
          </button>
        </div>
      </div>
    </div>
  )
}
