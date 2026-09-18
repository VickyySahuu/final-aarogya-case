import React from 'react'
import { Link } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'

export default function PatientPortalEntryPage() {
  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[{ label: 'Patient Portal' }]}
      backTo="/"
      backLabel="Back to Home"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Centered Core Card Canvas */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
            {/* Subtle Institutional Top Accent Strip */}
            <div className="h-2 w-full bg-[#166534]"></div>

            <div className="p-6 sm:p-10 md:p-12 flex flex-col items-center text-center">
              {/* Institutional Insignia Icon */}
              <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#166534] mb-6 shadow-inner">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_hospital
                </span>
              </div>

              {/* Header & Identity */}
              <p className="text-xs font-bold tracking-wider uppercase text-[#166534] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Central Health Services Digital Directory
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight mb-4" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Patient Portal
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-lg mb-10 leading-relaxed">
                Access healthcare services, consultations, and digital records securely through verified citizen credentials.
              </p>

              {/* Primary Actions Block */}
              <div className="w-full flex flex-col gap-4 mb-10">
                {/* Main Login CTA */}
                <Link
                  to="/patient/login"
                  className="w-full flex items-center justify-center gap-3 bg-[#166534] hover:bg-[#124d27] active:scale-[0.99] text-white min-h-[4rem] px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200 group select-none text-base font-bold uppercase tracking-wide"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">lock</span>
                  <span>LOGIN</span>
                  <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform ml-1">arrow_forward</span>
                </Link>

                {/* Registration Action CTA */}
                <Link
                  to="/patient/register"
                  className="w-full flex items-center justify-center gap-3 bg-slate-100 hover:bg-emerald-50 active:scale-[0.99] text-[#166534] min-h-[4rem] px-8 rounded-full border border-slate-200 hover:border-[#166534]/30 transition-all duration-200 group select-none shadow-sm text-base font-bold uppercase tracking-wide"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">person_add</span>
                  <span>NEW REGISTRATION</span>
                </Link>
              </div>

              {/* Security & Privacy Baseline Indicators */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-slate-200 text-left mb-10">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="material-symbols-outlined text-[#166534] text-2xl">verified_user</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>Encrypted Access</p>
                    <p className="text-xs text-slate-500 truncate">Official digital health ledger</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="material-symbols-outlined text-[#166534] text-2xl">fingerprint</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>Citizen Identity</p>
                    <p className="text-xs text-slate-500 truncate">Fast OTP & Aadhaar sync</p>
                  </div>
                </div>
              </div>

              {/* Emergency Response Section */}
              <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#dc2626] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      emergency
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-900">Need immediate medical help?</p>
                    <p className="text-xs text-slate-600">Immediate triage and ambulance dispatch</p>
                  </div>
                </div>
                <Link
                  to="/emergency"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md transition-all duration-200 select-none shrink-0"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-lg">emergency_share</span>
                  <span>EMERGENCY</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Public Portal Information Footnote */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              Authorized public access system. For telephone support dial <span className="font-bold text-[#0A2540]">1075</span> (Toll Free).
            </p>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
