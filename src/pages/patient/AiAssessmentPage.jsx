import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { CaseApi } from '../../services/caseApi'

export default function AiAssessmentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}

  const [selectedOption, setSelectedOption] = useState(state.breathingResponse || '')
  const [additionalNotes, setAdditionalNotes] = useState(state.additionalNotes || '')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const options = [
    {
      id: 'none',
      title: 'No difficulty breathing',
      description: 'Breathing normally at rest and during typical daily tasks with no discomfort.'
    },
    {
      id: 'mild',
      title: 'Mild difficulty when walking or climbing stairs',
      description: 'Noticeable shortness of breath only upon physical exertion, relieved by resting.'
    },
    {
      id: 'significant',
      title: 'Significant tightness or shortness of breath',
      description: 'Present even while resting quietly, difficulty speaking full sentences without gasping.'
    }
  ]

  const handleContinue = async () => {
    if (!selectedOption) {
      setErrorMsg('Please select an option that best describes your breathing status to proceed.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const caseId = state.caseId || (typeof window !== 'undefined' ? sessionStorage.getItem('aarogya_active_case_id') : null)

      const assessmentAnswers = [
        { question: 'breathingResponse', answer: selectedOption },
        { question: 'additionalNotes', answer: additionalNotes }
      ]

      const isUrgent = state.severity === 'severe' || selectedOption === 'significant'
      const aiAssessment = {
        triageLevel: isUrgent ? 'Priority Outpatient / Urgent' : 'Standard Outpatient (OPD)',
        recommendation: isUrgent ? 'Priority Outpatient (OPD) Recommended' : 'Standard Outpatient (OPD) Recommended',
        priorityWindow: isUrgent ? 'Recommended clinical examination within 12–24 hours' : 'Recommended clinical examination within 24–48 hours for symptom alleviation',
        facilityLevel: 'Primary Health Centre (PHC) & Community Health Centre (CHC)',
        reportedProblem: state.description || state.caseData?.problem || 'Acute Health Concern',
        duration: state.duration || state.caseData?.duration || '1-3 days',
        severity: state.severity || state.caseData?.severity || 'moderate',
        symptoms: state.symptoms || state.caseData?.symptoms || [],
        disclaimer: 'AI-assisted assessment. Doctor makes the final clinical decision.'
      }

      let updatedCase = state.caseData || null
      if (caseId) {
        const res = await CaseApi.updateCase(caseId, {
          assessmentAnswers,
          aiAssessment
        })
        if (res.success && res.case) {
          updatedCase = res.case
        }
      }

      navigate('/patient/assessment-result', {
        state: {
          ...state,
          caseId: caseId || updatedCase?.id,
          caseData: updatedCase,
          breathingResponse: selectedOption,
          additionalNotes,
          aiAssessment
        }
      })
    } catch (err) {
      setErrorMsg(err.message || 'Error saving AI assessment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'AI Case Assessment' }
      ]}
      backTo="/patient/case-info"
      backLabel="Back"
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-200">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-[#166534] mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                AI-ASSISTED TRIAGE INTAKE
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                AI Case Assessment
              </h1>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Triage Step 3 of 4</span>
          </div>

          {/* Clinical Safety Protocol Disclaimer - CRITICAL REQUIREMENT */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-800 text-2xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              health_and_safety
            </span>
            <div className="text-xs sm:text-sm leading-relaxed text-slate-800">
              <strong className="font-bold text-slate-900">Clinical Safety Protocol:</strong> AI-assisted assessment. Doctor makes the final clinical decision. All responses are verified by the triage physician.
            </div>
          </div>

          {/* Question Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Respiratory & Chest Assessment
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534] hover:text-[#14532d] bg-emerald-50 px-3 py-1 rounded-full"
              >
                <span className="material-symbols-outlined text-sm">volume_up</span>
                <span>Audio Guide</span>
              </button>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Are you experiencing any difficulty in breathing or chest tightness?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Please choose the option that most accurately represents your current condition right now.
            </p>
          </div>

          {/* Wide Interactive Options */}
          <div className="space-y-3.5 my-6" role="radiogroup">
            {options.map((opt) => {
              const isSelected = selectedOption === opt.id
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left rounded-xl p-5 transition-all border-2 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#166534] bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                      isSelected ? 'bg-[#166534] text-white' : 'border-2 border-slate-300 bg-white'
                    }`}>
                      {isSelected && <span className="material-symbols-outlined text-sm">check</span>}
                    </div>
                    <div>
                      <div className={`text-sm sm:text-base font-bold ${isSelected ? 'text-[#166534]' : 'text-slate-900'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                        {opt.title}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 leading-normal">
                        {opt.description}
                      </div>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-2xl shrink-0 ml-3 ${isSelected ? 'text-[#166534]' : 'text-slate-300'}`}>
                    {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Notes Support */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700" htmlFor="additional-notes" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Additional clarification or observations (Optional)
            </label>
            <input
              id="additional-notes"
              type="text"
              maxLength={140}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Sensation started 2 hours ago after coughing"
              className="w-full text-sm bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534] transition-all"
            />
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Navigation */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            <Link
              to="/patient/case-info"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back</span>
            </Link>
            <button
              type="button"
              disabled={loading}
              onClick={handleContinue}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all ${loading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  <span>COMPUTING CLINICAL ASSESSMENT...</span>
                </>
              ) : (
                <>
                  <span>VIEW ASSESSMENT RESULT</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
