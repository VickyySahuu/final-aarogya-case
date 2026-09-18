import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { getPatientProfile, DEFAULT_CASES } from '../../data/patientMockData'

export default function CaseDetailsPage() {
  const location = useLocation()
  const profile = getPatientProfile()
  const caseItem = location.state?.caseItem || DEFAULT_CASES[0]

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'History', to: '/patient/history' },
        { label: 'Case Details' }
      ]}
      backTo="/patient/history"
      backLabel="Back to History"
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        {/* Case Top Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[#166534] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {caseItem.caseNumber}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${caseItem.statusColor}`}>
                  {caseItem.status}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {caseItem.title}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Recorded on: {caseItem.date}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-base">print</span>
                <span>Print Case Slip</span>
              </button>
            </div>
          </div>

          {/* Demographics & Clinical Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Citizen</span>
              <span className="font-bold text-slate-800 text-sm">{profile.name}</span>
              <span className="text-slate-500 font-mono block">{profile.patientId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Treating Doctor</span>
              <span className="font-bold text-slate-800 text-sm">{caseItem.doctor}</span>
              <span className="text-slate-500 block">{caseItem.department}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Facility</span>
              <span className="font-bold text-slate-800 text-sm">{caseItem.hospital}</span>
              <span className="text-slate-500 block">Public Outpatient Wing</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Consultation Date</span>
              <span className="font-bold text-slate-800 text-sm">{caseItem.date}</span>
              <span className="text-[#166534] font-semibold block">Record Signed</span>
            </div>
          </div>

          {/* Clinical Findings & Case Summary */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Doctor Clinical Findings & Treatment Plan
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
              <p>{caseItem.summary}</p>
              <p className="text-slate-500 text-xs">
                Clinical observations and preliminary diagnostic evaluations verified under the National Health Data Protocol.
              </p>
            </div>
          </div>

          {/* Connected Modules Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Link
              to="/patient/prescription-details"
              className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#166534] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">prescriptions</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#166534] uppercase block" style={{ fontFamily: 'Lexend, sans-serif' }}>Prescription Linked</span>
                  <span className="text-sm font-bold text-slate-900 group-hover:text-[#166534] transition-colors">
                    {caseItem.prescriptionId || 'RX-2025-DC-004817'}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-[#166534] group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
            </Link>

            <Link
              to="/patient/reports"
              className="p-4 rounded-xl border border-sky-300 bg-sky-50/50 hover:bg-sky-50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">biotech</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-sky-800 uppercase block" style={{ fontFamily: 'Lexend, sans-serif' }}>Lab Investigation</span>
                  <span className="text-sm font-bold text-slate-900 group-hover:text-sky-800 transition-colors">
                    Complete Blood Count (CBC)
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-sky-800 group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
