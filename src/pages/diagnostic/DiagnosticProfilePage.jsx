import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DiagnosticLayout from '../../components/layout/DiagnosticLayout'

export default function DiagnosticProfilePage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    sessionStorage.removeItem('aarogya_diagnostic_session_token')
    localStorage.removeItem('aarogya_diagnostic_session_token')
    navigate('/diagnostic/login')
  }

  return (
    <DiagnosticLayout activeNav="Profile">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link 
            to="/diagnostic/dashboard" 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:text-[#0A2540] transition-colors py-1 px-3 -ml-3 rounded-full hover:bg-slate-100"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[#166534] mb-1 font-semibold text-xs uppercase tracking-widest" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>Laboratory Workstation Identity</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Diagnostic Center Profile
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Institutional laboratory configuration and credentials for Central Diagnostic Node.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-[#166534] p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-3xl">biotechnology</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                  Active Modality Node
                </span>
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Diagnostic Lab #02
                </h2>
                <span className="text-xs text-emerald-100 font-mono mt-0.5">
                  CENTER ID: DIAG-CTR-02 • Central Diagnostic &amp; Imaging Center
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-950/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/15 self-start sm:self-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-100">Live Station Active</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Chief Radiographer / Pathologist
              </span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                Dr. S. Varma (Consultant Radiologist)
              </span>
              <span className="text-xs text-slate-500 font-mono block mt-0.5">
                License #DEL-RAD-884
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Center Jurisdiction
              </span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                Radiology &amp; Clinical Pathology Wing
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Basement 1, Diagnostic Complex
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Active Equipment Status
              </span>
              <span className="text-base font-bold text-[#166534] mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>X-Ray, CT, Ultrasound &amp; Hematology Online</span>
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                DICOM 3.0 / HL7 Compliant
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Integration Standard
              </span>
              <span className="text-base font-bold text-[#166534] mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
                <span>Doctor Portal Sync Enabled</span>
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Auto-reflects in Doctor Pending Work
              </span>
            </div>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="px-6 sm:px-8 pb-6">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#166534] text-xl shrink-0 mt-0.5">health_and_safety</span>
              <div>
                <p className="text-xs font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  AERB &amp; NABL Quality Assurance Standards
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  All radiology scans and pathological analyses are validated according to atomic energy regulatory guidelines and quality standards.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              STATION ID: DIAG-CTR-02
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Sign Out Station</span>
            </button>
          </div>
        </div>
      </div>
    </DiagnosticLayout>
  )
}
