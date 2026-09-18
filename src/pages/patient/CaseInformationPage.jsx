import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { CaseApi } from '../../services/caseApi'

export default function CaseInformationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const symptomDescription = state.description || state.caseData?.problem || 'Health concern reported by patient'

  const [severity, setSeverity] = useState(state.severity || '')
  const [selectedSymptoms, setSelectedSymptoms] = useState(state.symptoms || [])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const symptomsList = ['Headache', 'Body Ache', 'Cough', 'Fatigue', 'Chills']

  const toggleSymptom = (sym) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym))
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym])
    }
  }

  const handleContinue = async () => {
    if (!severity) {
      setErrorMsg('Please select a symptom severity level to proceed.')
      return
    }

    setErrorMsg('')
    setLoading(true)

    try {
      const caseId = state.caseId || (typeof window !== 'undefined' ? sessionStorage.getItem('aarogya_active_case_id') : null)

      let updatedCase = state.caseData || null
      if (caseId) {
        const prevStructured = updatedCase?.structuredHistory || updatedCase?.structured_history || {}
        const updatedStructured = {
          chiefComplaint: updatedCase?.problem || symptomDescription,
          duration: updatedCase?.duration || 'Unknown',
          pastMedicalHistory: 'Not provided',
          currentMedications: 'Not provided',
          allergies: 'Unknown',
          relevantNegatives: [],
          additionalInformation: 'Not provided',
          ...prevStructured,
          symptoms: selectedSymptoms,
          associatedSymptoms: prevStructured.associatedSymptoms || []
        }

        const res = await CaseApi.updateCase(caseId, {
          severity,
          symptoms: selectedSymptoms,
          structuredHistory: updatedStructured,
          lifecycleStage: 'IN PROGRESS'
        })
        if (res.success && res.case) {
          updatedCase = res.case
        }
      }

      navigate('/patient/ai-assessment', {
        state: {
          ...state,
          caseId: caseId || updatedCase?.id,
          caseData: updatedCase,
          severity,
          symptoms: selectedSymptoms
        }
      })
    } catch (err) {
      setErrorMsg(err.message || 'Error updating case information.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'New Problem', to: '/patient/new-problem' },
        { label: 'Case Information' }
      ]}
      backTo="/patient/new-problem"
      backLabel="Back"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                CLINICAL INTAKE • STEP 2
              </span>
              <span className="text-xs text-slate-500 font-medium">Triage Parameter Assessment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Case Information
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Provide clinical details to assist on-duty medical triage officers with prioritizing your outpatient care.
            </p>
          </div>

          {/* Description Review Preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Reported Symptoms Description
            </span>
            <p className="text-sm font-medium text-slate-800 italic">
              "{symptomDescription}"
            </p>
          </div>

          {/* Severity Selection */}
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Severity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">How severe is your condition right now?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="radiogroup">
              {/* Mild */}
              <div
                onClick={() => setSeverity('mild')}
                className={`cursor-pointer p-5 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  severity === 'mild'
                    ? 'border-[#166534] bg-emerald-50/70 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>Mild</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${severity === 'mild' ? 'bg-[#166534] text-white' : 'border border-slate-300 bg-white'}`}>
                    {severity === 'mild' && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">Noticeable discomfort, normal daily routine and work unaffected.</p>
              </div>

              {/* Moderate */}
              <div
                onClick={() => setSeverity('moderate')}
                className={`cursor-pointer p-5 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  severity === 'moderate'
                    ? 'border-[#166534] bg-emerald-50/70 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#166534] text-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>Moderate</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${severity === 'moderate' ? 'bg-[#166534] text-white' : 'border border-slate-300 bg-white'}`}>
                    {severity === 'moderate' && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </div>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">Impacts daily routine, noticeable weakness, fever or persistent body pain.</p>
              </div>

              {/* Severe */}
              <div
                onClick={() => setSeverity('severe')}
                className={`cursor-pointer p-5 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  severity === 'severe'
                    ? 'border-[#166534] bg-emerald-50/70 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>Severe</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${severity === 'severe' ? 'bg-[#166534] text-white' : 'border border-slate-300 bg-white'}`}>
                    {severity === 'severe' && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">Intense discomfort, high fever, unable to perform basic routine activities.</p>
              </div>
            </div>
          </div>

          {/* Relevant Symptoms */}
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Relevant Symptoms
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Select any accompanying symptoms that apply to you (optional):</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {symptomsList.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym)
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#166534] bg-[#166534] text-white shadow-xs'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isSelected ? 'check' : 'add'}
                    </span>
                    <span>{sym}</span>
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => setSelectedSymptoms([])}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-400">block</span>
                <span>None of these</span>
              </button>
            </div>
          </div>

          {/* Institutional Reassurance Banner */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#166534] text-2xl shrink-0 mt-0.5">verified_user</span>
            <div className="text-xs leading-relaxed text-slate-700">
              <strong className="text-slate-900">Digital Health Security Protocol:</strong> All responses are encrypted and directly linked to your consultation token for the on-duty examining physician.
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            <Link
              to="/patient/new-problem"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back</span>
            </Link>
            <button
              type="button"
              disabled={loading}
              onClick={handleContinue}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md hover:shadow-lg ${loading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  <span>SAVING CLINICAL DETAILS...</span>
                </>
              ) : (
                <>
                  <span>CONTINUE TO AI ASSESSMENT</span>
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
