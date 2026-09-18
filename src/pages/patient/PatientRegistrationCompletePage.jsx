import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import PatientQrCode from '../../components/common/PatientQrCode'
import { AuthApi } from '../../services/authApi'

export default function PatientRegistrationCompletePage() {
  const location = useLocation()
  const profile = location.state?.patient || AuthApi.getStoredPatient() || getPatientProfile()
  const [copiedId, setCopiedId] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const patientId = profile.patientId || profile.patient_id || profile.id || '—'
  const patientCode = profile.patientUniqueCode || profile.patient_unique_code || profile.uniqueCode || '—'

  const copyPatientId = () => {
    navigator.clipboard.writeText(patientId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const copyPatientCode = () => {
    navigator.clipboard.writeText(patientCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient' },
        { label: 'Registration Complete' }
      ]}
      backTo="/patient"
      backLabel="Home"
    >
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col items-center">
        {/* Elevated Institutional Success Card */}
        <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10 md:p-12 flex flex-col items-center text-center relative overflow-hidden">
          {/* Top Brand Line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#166534]"></div>

          {/* Institutional Verification Badge */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <div className="w-18 h-18 rounded-full bg-emerald-100 flex items-center justify-center text-[#166534]">
                <span className="material-symbols-outlined text-5xl font-bold select-none" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                  check_circle
                </span>
              </div>
            </div>
          </div>

          {/* Typography Header */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] mb-2 tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Registration Complete
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mb-8 leading-relaxed">
            Your permanent patient record and identity QR have been successfully registered in the AAROGYA CASE public healthcare network.
          </p>

          {/* Patient Credential Summary Box */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-left mb-8 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-200 gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Registered Citizen
                </span>
                <div className="text-xl sm:text-2xl font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Welcome, {profile.name || profile.full_name || 'Citizen'}
                </div>
              </div>
              <div className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#166534] animate-ping"></span>
                <span>Active Patient Profile • Verified</span>
              </div>
            </div>

            {/* Credential Grid with QR & Permanent Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              {/* Patient ID */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between h-full">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  PATIENT ID
                </span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-lg font-bold text-[#166534] font-mono">
                    {patientId}
                  </span>
                  <button
                    type="button"
                    onClick={copyPatientId}
                    title="Copy Patient ID"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#166534] hover:bg-emerald-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {copiedId ? 'done' : 'content_copy'}
                    </span>
                  </button>
                </div>
                {copiedId && <span className="text-[11px] text-[#166534] font-semibold mt-1">Copied!</span>}
                <p className="text-[11px] text-slate-500 mt-2">Annual Registry Identifier</p>
              </div>

              {/* Patient Unique Code */}
              <div className="bg-white border-2 border-emerald-300 p-4 rounded-xl flex flex-col justify-between h-full shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    PATIENT UNIQUE CODE
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-[#166534]">PERMANENT</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-xl font-black text-[#0A2540] tracking-wider font-mono">
                    {patientCode}
                  </span>
                  <button
                    type="button"
                    onClick={copyPatientCode}
                    title="Copy Unique Code"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#166534] hover:bg-emerald-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {copiedCode ? 'done' : 'content_copy'}
                    </span>
                  </button>
                </div>
                {copiedCode && <span className="text-[11px] text-[#166534] font-semibold mt-1">Copied!</span>}
                <p className="text-[11px] text-slate-500 mt-2">Use for Doctor &amp; Hospital Lookups</p>
              </div>

              {/* Instant QR Code */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <PatientQrCode code={patientCode} size={110} allowEnlarge={true} />
                <span className="text-[10px] text-slate-500 mt-1">Click QR to Enlarge</span>
              </div>
            </div>
          </div>

          {/* Informational Prompt */}
          <div className="flex items-center gap-3 text-left w-full bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-slate-700 text-xs sm:text-sm">
            <span className="material-symbols-outlined text-blue-700 text-2xl shrink-0">info</span>
            <span>
              A digital copy of your unique Health Identifier (ID) and registration confirmation has been linked securely with your verified citizen credentials.
            </span>
          </div>

          {/* Primary Action Button */}
          <div className="w-full flex flex-col items-center">
            <Link
              to="/patient/home"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-[#166534] hover:bg-[#14532d] active:scale-[0.99] text-white text-base font-bold shadow-md hover:shadow-lg transition-all text-center uppercase tracking-wide"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span>GO TO PATIENT PORTAL</span>
              <span className="material-symbols-outlined text-2xl font-bold">arrow_forward</span>
            </Link>
            <span className="text-xs text-slate-500 mt-3">
              Session authenticated for ongoing patient care navigation
            </span>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
