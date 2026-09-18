import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { CaseApi } from '../../services/caseApi'

export default function NewProblemPage() {
  const location = useLocation()
  const state = location.state || {}
  const [description, setDescription] = useState(state.description || '')
  const [duration, setDuration] = useState(state.duration || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [speechMsg, setSpeechMsg] = useState('')
  const recognitionRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) {
      setSpeechSupported(false)
      setSpeechMsg('Speech recognition is not supported in this browser. Please type your symptoms above.')
    }
    // If starting a fresh problem without explicit state.caseId, clear any stale session case id
    if (!state?.caseId && typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('aarogya_active_case_id')
      } catch (e) {}
    }
  }, [state?.caseId])

  const startListening = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) {
      setSpeechSupported(false)
      setSpeechMsg('Speech recognition is not supported in this browser.')
      return
    }

    try {
      const recognition = new SpeechRec()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-IN'

      recognition.onstart = () => {
        setIsRecording(true)
        setSpeechMsg('Listening to your microphone... speak clearly.')
      }

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' '
          }
        }
        if (transcript) {
          setDescription((prev) => (prev ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()))
          setSpeechMsg('Speech transcribed successfully.')
        }
      }

      recognition.onerror = (event) => {
        setIsRecording(false)
        if (event.error === 'not-allowed') {
          setSpeechMsg('Microphone access denied. Please grant permission in browser.')
        } else {
          setSpeechMsg(`Microphone note: ${event.error}. You can continue typing.`)
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      setIsRecording(false)
      setSpeechMsg('Unable to access microphone. Please type manually.')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
    }
    setIsRecording(false)
    setSpeechMsg('Dictation stopped. Captured speech populated.')
  }

  const handleTryAgain = () => {
    stopListening()
    startListening()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) {
      setSubmitError('Please describe your symptoms or health issue before proceeding.')
      return
    }
    if (!duration) {
      setSubmitError('Please select the duration of your problem before proceeding.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const existingCaseId = state?.caseId || null
      let targetCase = null

      const rawText = description.trim()
      const structuredInit = {
        chiefComplaint: rawText,
        duration: duration || 'Unknown',
        symptoms: [],
        associatedSymptoms: [],
        pastMedicalHistory: 'Not provided',
        currentMedications: 'Not provided',
        allergies: 'Unknown',
        relevantNegatives: [],
        additionalInformation: 'Not provided'
      }

      if (existingCaseId) {
        const updateRes = await CaseApi.updateCase(existingCaseId, {
          problem: rawText,
          duration,
          originalPatientResponse: rawText,
          structuredHistory: structuredInit,
          lifecycleStage: 'IN PROGRESS'
        })
        if (updateRes.success && updateRes.case) {
          targetCase = updateRes.case
        }
      }

      if (!targetCase) {
        const createRes = await CaseApi.createCase({
          problem: rawText,
          duration,
          originalPatientResponse: rawText,
          structuredHistory: structuredInit,
          lifecycleStage: 'IN PROGRESS',
          status: 'Active'
        })
        if (createRes.success && createRes.case) {
          targetCase = createRes.case
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('aarogya_active_case_id', String(targetCase.id))
          }
        } else {
          setSubmitError(createRes.message || 'Failed to initialize patient case.')
          setSubmitting(false)
          return
        }
      }

      navigate('/patient/case-info', {
        state: {
          caseId: targetCase.id,
          caseData: targetCase,
          description: targetCase.problem,
          duration: targetCase.duration
        }
      })
    } catch (err) {
      setSubmitError(err.message || 'Error communicating with healthcare server.')
    } finally {
      setSubmitting(false)
    }
  }

  const durationOptions = [
    { id: 'today', label: 'Today (< 24 hrs)', sub: 'Sudden or recent', icon: 'today' },
    { id: '1-3-days', label: '1–3 days', sub: 'Few days', icon: 'date_range' },
    { id: '4-7-days', label: '4–7 days', sub: 'Around a week', icon: 'calendar_view_week' },
    { id: 'more-than-a-week', label: 'More than a week', sub: 'Ongoing condition', icon: 'update' },
    { id: 'not-sure', label: 'Not sure', sub: 'Intermittent / variable', icon: 'help_outline' },
  ]

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'New Problem' }
      ]}
      backTo="/patient/home"
      backLabel="Back to Home"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {/* Panel Header */}
          <div className="max-w-4xl mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                CLINICAL INTAKE • STEP 1
              </span>
              <span className="text-xs text-slate-500 font-medium">Estimated time: 2 mins</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              New Problem
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
              Describe what you are experiencing to begin your clinical triage and guidance. This information will be reviewed by on-duty medical officers.
            </p>
          </div>

          {/* AI Intake Callout */}
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#166534] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">smart_toy</span>
              </div>
              <div>
                <strong className="text-sm font-bold text-[#0A2540] block">Prefer an interactive conversation?</strong>
                <span className="text-xs text-slate-600">Use our AI-assisted case intake to answer questions naturally in your own words.</span>
              </div>
            </div>
            <Link
              to="/patient/ai-interview"
              className="px-5 py-2.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shrink-0 transition-all text-center"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Start AI Interview
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Field 1: Description + Voice Input */}
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <label className="font-bold text-base sm:text-lg text-[#0A2540] flex items-center space-x-1.5" htmlFor="symptom-description" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span>1. What is your problem?</span>
                  <span className="text-red-600 text-sm">*</span>
                </label>
                <span className="text-xs font-medium text-slate-400 font-mono">{description.length} / 500 characters</span>
              </div>
              <div className="relative">
                <textarea
                  id="symptom-description"
                  rows={5}
                  maxLength={500}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your symptoms, pains, or health issue in detail... (e.g. continuous throbbing headache with mild fever and dizziness since yesterday evening)"
                  className="w-full rounded-xl border border-slate-300 p-4 text-slate-800 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-[#166534] transition leading-relaxed bg-slate-50/50"
                />
              </div>

              {/* Voice Input Control Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startListening}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer bg-white text-[#166534] border border-[#166534]/40 hover:bg-[#166534] hover:text-white btn-press"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span className="material-symbols-outlined text-[18px]">mic</span>
                        <span>VOICE INPUT / LISTEN</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={stopListening}
                          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer bg-red-600 text-white border border-red-700 hover:bg-red-700 btn-press animate-pulse"
                          style={{ fontFamily: 'Lexend, sans-serif' }}
                        >
                          <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                          <span>STOP LISTENING</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleTryAgain}
                          className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 btn-press"
                          style={{ fontFamily: 'Lexend, sans-serif' }}
                        >
                          <span className="material-symbols-outlined text-[18px]">replay</span>
                          <span>TRY AGAIN</span>
                        </button>
                      </>
                    )}

                    <div className="text-xs text-slate-600 flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${isRecording ? 'bg-red-600 animate-ping' : 'bg-emerald-600'}`}></span>
                      <span className="font-medium">
                        {isRecording ? 'Listening... Speak into your microphone' : 'Browser Web Speech supported'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 hidden md:inline">Speech will populate the text box above</span>
                </div>

                {speechMsg && (
                  <div className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <span>{speechMsg}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Field 2: Duration Selector Cards */}
            <section className="space-y-3">
              <div>
                <label className="font-bold text-base sm:text-lg text-[#0A2540] flex items-center space-x-1.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span>2. How long have you had this problem?</span>
                  <span className="text-red-600 text-sm">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">Select the approximate timeframe since symptoms first appeared.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 pt-1">
                {durationOptions.map((opt, idx) => {
                  const isSelected = duration === opt.id
                  const isLast = idx === durationOptions.length - 1
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setDuration(opt.id)}
                      className={`p-3.5 sm:p-4 rounded-xl border-2 transition flex flex-col items-center justify-center text-center cursor-pointer min-h-[5.5rem] sm:min-h-[6.5rem] ${isLast ? 'col-span-2 sm:col-span-1' : ''} ${
                        isSelected
                          ? 'border-[#166534] bg-emerald-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[28px] mb-1.5 ${isSelected ? 'text-[#166534]' : 'text-slate-400'}`}>
                        {opt.icon}
                      </span>
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#166534]' : 'text-slate-800'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">{opt.sub}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Soft Emergency Advisory Callout */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-slate-800 flex items-start space-x-3">
              <span className="material-symbols-outlined text-red-700 text-2xl shrink-0 mt-0.5">report</span>
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-bold text-red-950" style={{ fontFamily: 'Lexend, sans-serif' }}>Important Emergency Notice:</span>
                <span className="text-slate-700 ml-1">
                  If you or the person you are assisting experiences severe chest pressure, acute shortness of breath, loss of consciousness, or uncontrollable bleeding, immediately use the red Emergency button or dial emergency helpline 108.
                </span>
              </div>
            </div>

            {/* Error Message Notice */}
            {submitError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{submitError}</span>
              </div>
            )}

            {/* Action Navigation Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
              <Link
                to="/patient/home"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-xs font-bold transition shadow-xs"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Back to Home</span>
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-98 ${submitting ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    <span>CREATING CASE IN REGISTRY...</span>
                  </>
                ) : (
                  <>
                    <span>CONTINUE</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PatientLayout>
  )
}
