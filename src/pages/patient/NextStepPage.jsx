import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { CaseApi } from '../../services/caseApi'
import { AuthApi } from '../../services/authApi'

export default function NextStepPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}

  const caseId = state.caseId || (typeof window !== 'undefined' ? sessionStorage.getItem('aarogya_active_case_id') : null)
  const [caseItem, setCaseItem] = useState(state.caseData || null)
  const [patient, setPatient] = useState(AuthApi.getStoredPatient())

  useEffect(() => {
    async function loadData() {
      if (!patient) {
        const stored = AuthApi.getStoredPatient()
        if (stored) setPatient(stored)
      }
      if (!caseItem && caseId) {
        try {
          const res = await CaseApi.getCaseById(caseId)
          if (res.success && res.case) {
            setCaseItem(res.case)
          }
        } catch (e) {
          console.warn('Error fetching case in NextStepPage:', e)
        }
      }
    }
    loadData()
  }, [caseId, caseItem, patient])

  const navState = {
    ...state,
    caseId: caseItem?.id || caseId,
    caseNumber: caseItem?.caseNumber,
    caseData: caseItem
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Assessment Result', to: '/patient/assessment-result' },
        { label: 'Next Step' }
      ]}
      backTo="/patient/assessment-result"
      backLabel="Back"
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                RECOMMENDED CLINICAL ACTION
              </span>
              {caseItem?.caseNumber && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  <span className="material-symbols-outlined text-[14px]">folder</span>
                  <span>{caseItem.caseNumber}</span>
                </span>
              )}
              {patient?.patientCode && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  <span className="material-symbols-outlined text-[14px]">badge</span>
                  <span>{patient.patientCode}</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Next Step: Consultation Scheduling
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Your reported symptoms indicate outpatient evaluation. Please select your preferred civic hospital facility and doctor to book an OPD token.
            </p>
          </div>

          {/* Case Association Summary Strip */}
          {caseItem && (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#166534] flex items-center justify-center font-bold shrink-0">
                  <span className="material-symbols-outlined text-lg">medical_information</span>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{caseItem.problem || 'Registered Case Problem'}</div>
                  <div className="text-slate-500">Duration: {caseItem.duration || 'Not specified'} • Severity: {caseItem.severity || 'Not specified'}</div>
                </div>
              </div>
              <div className="text-right sm:border-l sm:border-emerald-200/80 sm:pl-4">
                <div className="font-semibold text-emerald-800 uppercase tracking-wider text-[11px]">Case Status</div>
                <div className="font-bold text-emerald-900 text-sm">{caseItem.caseStatus || 'Active'}</div>
              </div>
            </div>
          )}

          {/* Structured Pathway Key Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#166534] text-2xl mt-0.5">schedule</span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>Recommended Timeframe</p>
                <p className="font-bold text-sm text-[#0A2540] mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>Within 24 to 48 Hours</p>
                <p className="text-xs text-slate-500 mt-0.5">Non-critical regular hours slot</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#166534] text-2xl mt-0.5">local_hospital</span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>Facility Level</p>
                <p className="font-bold text-sm text-[#0A2540] mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>Community Health Center (CHC)</p>
                <p className="text-xs text-slate-500 mt-0.5">Or District Civil Hospital (PHC)</p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-4">
            {/* Primary Action Button */}
            <Link
              to="/patient/select-hospital"
              state={navState}
              className="w-full min-h-[3.5rem] bg-[#166534] hover:bg-[#14532d] active:scale-[0.99] text-white rounded-xl px-6 py-4 text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-center uppercase tracking-wide"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-2xl">event_available</span>
              <span>BOOK DOCTOR APPOINTMENT</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>

            <p className="text-xs text-slate-500 text-center">
              Proceed directly to facility selection, doctor consultation schedule, or attach prior records.
            </p>

            {/* Optional Secondary Action: File Upload */}
            <Link
              to="/patient/upload-documents"
              state={navState}
              className="w-full min-h-[3rem] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl px-5 py-3 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-xl text-slate-600">upload_file</span>
              <span>Upload Previous Documents / Prescriptions (Optional)</span>
            </Link>
          </div>

          {/* Red Emergency Warning Callout */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-red-950" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Experiencing sudden acute distress or worsening symptoms?
                </h3>
                <p className="text-xs text-red-800/90 mt-0.5 leading-relaxed">
                  If breathing difficulty, severe chest pain, or sudden collapse occurs, request emergency ambulance dispatch immediately.
                </p>
              </div>
            </div>
            <Link
              to="/emergency"
              className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all uppercase tracking-wider"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-lg">emergency_share</span>
              <span>EMERGENCY</span>
            </Link>
          </div>

          {/* Return Anchor */}
          <div className="flex items-center justify-center pt-2">
            <Link
              to="/patient/assessment-result"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-xs font-semibold py-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Return to Assessment Result</span>
            </Link>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
