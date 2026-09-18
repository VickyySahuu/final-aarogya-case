import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { CaseApi } from '../../services/caseApi'

export default function AssessmentResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const [caseItem, setCaseItem] = useState(state.caseData || null)

  const caseId = state.caseId || (typeof window !== 'undefined' ? sessionStorage.getItem('aarogya_active_case_id') : null)

  useEffect(() => {
    async function loadCase() {
      if (!caseItem && caseId) {
        try {
          const res = await CaseApi.getCaseById(caseId)
          if (res.success && res.case) {
            setCaseItem(res.case)
          }
        } catch (e) {
          console.warn('Error loading case for assessment result:', e)
        }
      }
    }
    loadCase()
  }, [caseId, caseItem])

  const problemText = caseItem?.problem || state.description || 'Reported health concern'
  const durationText = caseItem?.duration || state.duration || 'Recent duration'
  const severityText = caseItem?.severity || state.severity || 'Moderate'
  const triageRecommendation = caseItem?.aiAssessment?.recommendation || state.aiAssessment?.recommendation || 'Standard Outpatient (OPD) Recommended'

  const handlePrint = () => {
    window.print()
  }

  const handleNextStep = () => {
    navigate('/patient/next-step', {
      state: {
        ...state,
        caseId: caseId || caseItem?.id,
        caseData: caseItem
      }
    })
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Assessment Result' }
      ]}
      backTo="/patient/ai-assessment"
      backLabel="Back"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Main Recommendation Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#166534] text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                AI Intake Guidance Result
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Assessment Result
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 bg-white text-[#166534] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm self-start md:self-auto" style={{ fontFamily: 'Lexend, sans-serif' }}>
              <span className="material-symbols-outlined text-lg">local_hospital</span>
              <span>{triageRecommendation}</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col gap-6">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5">
              <p className="text-slate-800 text-sm sm:text-base leading-relaxed">
                Based on your reported symptoms of <strong className="text-slate-900">{problemText} with {severityText.toLowerCase()} severity</strong>, an in-person physical consultation with a registered medical officer or general physician at your local outpatient clinic is recommended for formal clinical evaluation and temperature diagnosis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="material-symbols-outlined text-[#166534] text-2xl shrink-0">domain</span>
                <div>
                  <p className="font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>Primary Health Centre (PHC) & CHC</p>
                  <p className="text-slate-500 text-xs mt-0.5">Walk-in OPD consultation available Monday through Saturday (8:00 AM – 2:00 PM).</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="material-symbols-outlined text-[#166534] text-2xl shrink-0">schedule</span>
                <div>
                  <p className="font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>Priority Window</p>
                  <p className="text-slate-500 text-xs mt-0.5">Recommended clinical examination within 24–48 hours for symptom alleviation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary of Reported Symptoms */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#166534] text-2xl">clinical_notes</span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Summary of Reported Symptoms
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Patient Self-Report
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>Primary Symptom</span>
              <span className="text-base font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>{problemText}</span>
              <span className="text-xs text-slate-500 mt-0.5">{Array.isArray(caseItem?.symptoms) && caseItem.symptoms.length > 0 ? caseItem.symptoms.join(', ') : 'Reported health concern'}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>Symptom Duration</span>
              <span className="text-base font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>{durationText}</span>
              <span className="text-xs text-slate-500 mt-0.5">Recorded timeline</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>Severity Assessment</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${String(severityText).toLowerCase().includes('severe') || String(severityText).toLowerCase().includes('high') ? 'bg-red-500' : String(severityText).toLowerCase().includes('mild') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className="text-base font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>{severityText}</span>
              </div>
              <span className="text-xs text-slate-500 mt-0.5">Assessed preliminary priority</span>
            </div>
          </div>
        </div>

        {/* IMPORTANT MEDICAL SAFETY NOTICE - EXPLICIT PROMPT REQUIREMENT */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
            <span className="material-symbols-outlined text-2xl">gavel</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Important Medical Safety Notice
              </h4>
              <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                Official Notice
              </span>
            </div>
            <p className="text-slate-800 font-bold text-xs sm:text-sm">
              AI-assisted assessment. Doctor makes the final clinical decision.
            </p>
            <p className="text-slate-600 text-xs leading-relaxed mt-0.5">
              This digital triage assessment assists with institutional intake routing and preliminary priority queue guidance. It does not provide medical diagnoses, prescriptions, or therapeutic instructions. Always obtain a clinical physical examination from a certified practitioner. If you experience emergency red flags (severe breathlessness, chest heaviness, or sudden collapse), proceed to the nearest Emergency Casualty department immediately.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <Link
            to="/patient/ai-assessment"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back</span>
          </Link>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span>NEXT STEP</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
