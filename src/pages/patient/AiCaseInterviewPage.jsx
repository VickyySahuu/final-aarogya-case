import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { CaseApi } from '../../services/caseApi'

export default function AiCaseInterviewPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Phases: 'consent' | 'interview' | 'review'
  const [phase, setPhase] = useState('consent')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [caseItem, setCaseItem] = useState(null)
  const [conversation, setConversation] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [lastFailedMessage, setLastFailedMessage] = useState('')
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false)

  // Voice & Speech Synthesis States
  // voiceState: 'idle' | 'listening' | 'transcribing' | 'reviewing' | 'processing' | 'speaking'
  const [voiceState, setVoiceState] = useState('idle')
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState(null)
  const [touchOptions, setTouchOptions] = useState([])
  const [voiceLang, setVoiceLang] = useState('hi-IN') // 'hi-IN' | 'en-IN'
  const [speechSupported, setSpeechSupported] = useState(true)

  // Review editing state
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [editableFields, setEditableFields] = useState({
    duration: '',
    pastMedicalHistory: '',
    currentMedications: '',
    allergies: ''
  })

  // Multimodal Document Upload States
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [docUploadProgress, setDocUploadProgress] = useState(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)

  const chatBottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)
  const reviewFileInputRef = useRef(null)

  // Check Web Speech API availability and setup voices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setSpeechSupported(false)
      }
      if ('speechSynthesis' in window) {
        // Pre-load voices if supported
        window.speechSynthesis.getVoices()
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch (e) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel() } catch (e) {}
      }
    }
  }, [])

  // 1. Initialize or Resume Interview on Mount
  useEffect(() => {
    let isMounted = true
    async function initInterview() {
      try {
        setInitializing(true)
        setErrorMsg('')
        const res = await CaseApi.initOrResumeInterview()
        if (isMounted && res.success && res.case) {
          setCaseItem(res.case)
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('aarogya_active_case_id', String(res.case.id))
          }

          // Build conversation transcript
          const history = Array.isArray(res.conversationHistory) ? res.conversationHistory : []
          if (history.length > 0) {
            setConversation(history)
            // If already answered previously, patient already gave consent
            setPhase('interview')
          } else {
            // First time greeting
            const initialAI = res.initialQuestion || 'Hello. I am the Aarogya Case intake assistant. Please describe your health concern or main symptoms in your own words.'
            setConversation([
              { sender: 'ai', text: initialAI, languageStyle: 'english', timestamp: new Date().toISOString() }
            ])
          }
        } else if (isMounted) {
          setErrorMsg(res.message || 'Unable to connect to clinical case server.')
        }
      } catch (err) {
        if (isMounted) setErrorMsg(err.message || 'Error initializing clinical interview.')
      } finally {
        if (isMounted) setInitializing(false)
      }
    }

    initInterview()
    return () => { isMounted = false }
  }, [])

  // Synchronize editable fields when caseItem changes
  useEffect(() => {
    if (caseItem?.structuredHistory) {
      const sh = caseItem.structuredHistory
      setEditableFields({
        duration: sh.duration || '',
        pastMedicalHistory: sh.pastMedicalHistory || '',
        currentMedications: sh.currentMedications || '',
        allergies: sh.allergies || ''
      })
    }
  }, [caseItem])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation, isSubmittingTurn, voiceState])

  // Consent agreement handler
  const handleConsentAgree = () => {
    setPhase('interview')
  }

  // Text-To-Speech Synthesis function
  const speakMessage = (text, index = null, lang = 'hi-IN') => {
    if (!text || typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) return

    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)

      const voices = window.speechSynthesis.getVoices()
      // Select best matching voice
      const targetVoice = voices.find(v =>
        (lang.startsWith('hi') && (v.lang.includes('hi') || v.lang.includes('IN'))) ||
        (lang.startsWith('en') && (v.lang === 'en-IN' || v.lang.includes('en')))
      ) || voices.find(v => v.lang.includes('hi') || v.lang.includes('en')) || voices[0]

      if (targetVoice) utterance.voice = targetVoice
      utterance.rate = 0.95
      utterance.pitch = 1.0

      utterance.onstart = () => {
        setIsSpeaking(true)
        if (index !== null) setCurrentlySpeakingIndex(index)
      }
      utterance.onend = () => {
        setIsSpeaking(false)
        setCurrentlySpeakingIndex(null)
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        setCurrentlySpeakingIndex(null)
      }

      window.speechSynthesis.speak(utterance)
    } catch (err) {
      console.warn('Speech synthesis error:', err)
      setIsSpeaking(false)
      setCurrentlySpeakingIndex(null)
    }
  }

  // Stop speaking
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel() } catch (e) {}
    }
    setIsSpeaking(false)
    setCurrentlySpeakingIndex(null)
  }

  // Speech-to-Text Recognition handlers
  const handleStartListening = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMsg('Voice input is not supported in this browser. Please type your response.')
      return
    }

    stopSpeaking()
    setErrorMsg('')
    setVoiceTranscript('')
    setVoiceState('listening')

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch (e) {}
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = voiceLang || 'hi-IN'

      recognition.onstart = () => {
        setVoiceState('listening')
      }

      recognition.onresult = (event) => {
        let text = ''
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript
        }
        setVoiceTranscript(text)
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error)
        setVoiceState('idle')
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMsg('Microphone access was denied. You can continue by typing your response.')
        } else if (event.error === 'no-speech') {
          setErrorMsg('No speech detected. Please tap the microphone again or type your response.')
        } else {
          setErrorMsg(`Voice input error (${event.error}). Please type your response.`)
        }
      }

      recognition.onend = () => {
        setVoiceState(prev => {
          if (prev === 'listening') return 'idle'
          return prev
        })
        setVoiceTranscript(prevText => {
          if (prevText && prevText.trim()) {
            setVoiceState('reviewing')
          }
          return prevText
        })
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.warn('Failed to start speech recognition:', err)
      setVoiceState('idle')
      setErrorMsg('Could not access microphone. Please type your response.')
    }
  }

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
    }
  }

  const handleCancelVoice = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch (e) {}
    }
    setVoiceState('idle')
    setVoiceTranscript('')
  }

  // Unified send turn handler (text or voice)
  const handleSendTurn = async (textToSend, mode = 'text') => {
    if (!textToSend || !textToSend.trim() || isSubmittingTurn || !caseItem) return
    const cleanedText = textToSend.trim()

    stopSpeaking()
    setErrorMsg('')
    setLastFailedMessage('')
    setIsSubmittingTurn(true)
    setTouchOptions([])

    if (mode === 'voice') {
      setVoiceState('processing')
    }

    // Append patient message to local conversation immediately
    const updatedConversation = [
      ...conversation,
      {
        sender: 'patient',
        text: cleanedText,
        inputMode: mode,
        timestamp: new Date().toISOString()
      }
    ]
    setConversation(updatedConversation)
    setInputMessage('')
    setVoiceTranscript('')

    try {
      const res = await CaseApi.sendInterviewTurn(caseItem.id, cleanedText, updatedConversation, { inputMode: mode })
      if (res.success && res.turnResult) {
        const aiMsgIndex = updatedConversation.length
        const aiResponseText = res.turnResult.nextQuestion
        const aiLang = res.turnResult.languageStyle || 'english'

        // Append AI response
        setConversation([
          ...updatedConversation,
          {
            sender: 'ai',
            text: aiResponseText,
            languageStyle: aiLang,
            touchOptions: res.turnResult.touchOptions || null,
            nextStepGuidance: res.turnResult.nextStepGuidance || null,
            timestamp: new Date().toISOString()
          }
        ])

        if (res.case) {
          setCaseItem(res.case)
        }

        if (Array.isArray(res.turnResult.touchOptions) && res.turnResult.touchOptions.length > 0) {
          setTouchOptions(res.turnResult.touchOptions)
        }

        // Section 9: When patient uses voice mode:
        // The AI response must appear as TEXT AND the EXACT SAME response must be SPOKEN aloud!
        if (mode === 'voice') {
          setVoiceState('speaking')
          speakMessage(aiResponseText, aiMsgIndex, aiLang === 'english' ? 'en-IN' : 'hi-IN')
        } else {
          setVoiceState('idle')
        }

        // If interview reached complete condition, transition to review
        if (res.turnResult.isComplete) {
          setTimeout(() => {
            setPhase('review')
          }, 2200)
        }
      } else {
        setLastFailedMessage(cleanedText)
        setErrorMsg(res.message || 'Unable to process your response right now.')
        setVoiceState('idle')
      }
    } catch (err) {
      setLastFailedMessage(cleanedText)
      setErrorMsg(err.message || 'Unable to communicate with clinical assistant.')
      setVoiceState('idle')
    } finally {
      setIsSubmittingTurn(false)
    }
  }

  // Form submit for typed messages
  const handleSendMessage = (e) => {
    if (e) e.preventDefault()
    handleSendTurn(inputMessage, 'text')
  }

  // Retry sending last failed message
  const handleRetry = () => {
    if (lastFailedMessage) {
      setInputMessage(lastFailedMessage)
      handleSendTurn(lastFailedMessage, 'text')
    }
  }

  // Process uploaded document file (PDF or Image)
  const processUploadedFile = async (file) => {
    if (!file || !caseItem) return

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg(`File size exceeds 20MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller file.`)
      return
    }

    const ext = file.name.split('.').pop().toLowerCase()
    const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
    if (!allowed.includes(ext)) {
      setErrorMsg(`Unsupported file format (.${ext}). Please upload a PDF, JPG, PNG, or WEBP document.`)
      return
    }

    stopSpeaking()
    setErrorMsg('')
    setLastFailedMessage('')
    setIsUploadingDoc(true)
    setDocUploadProgress({
      fileName: file.name,
      status: 'uploading',
      step: 'Uploading document...'
    })

    try {
      // Read file as base64 data URL
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Failed reading file from device.'))
        reader.readAsDataURL(file)
      })

      setDocUploadProgress({
        fileName: file.name,
        status: 'analyzing',
        step: 'Analyzing clinical document...'
      })

      const lang = voiceLang === 'hi-IN' ? 'hinglish' : 'english'
      const res = await CaseApi.uploadCaseDocument(caseItem.id, {
        fileData,
        fileName: file.name,
        fileType: file.type || (ext === 'pdf' ? 'application/pdf' : `image/${ext}`),
        languageStyle: lang
      })

      if (res.success && res.document) {
        setDocUploadProgress({
          fileName: file.name,
          status: 'analyzed',
          step: 'Document analyzed',
          document: res.document,
          findings: res.findings
        })

        if (res.case) {
          setCaseItem(res.case)
        }

        const docTurn = {
          sender: 'patient',
          text: `[Uploaded Document: ${res.document.originalName}]`,
          inputMode: 'document',
          document: res.document,
          findings: res.findings,
          timestamp: new Date().toISOString()
        }

        const aiTurn = {
          sender: 'ai',
          text: res.turnResult.nextQuestion,
          languageStyle: res.turnResult.languageStyle || lang,
          touchOptions: res.turnResult.touchOptions || null,
          documentFindingsSummary: res.turnResult.summary || null,
          timestamp: new Date().toISOString()
        }

        const updatedConvo = [...conversation, docTurn, aiTurn]
        setConversation(updatedConvo)

        if (Array.isArray(res.turnResult.touchOptions) && res.turnResult.touchOptions.length > 0) {
          setTouchOptions(res.turnResult.touchOptions)
        }

        // Voice continuity: Speak the AI document response aloud
        if (voiceState === 'speaking' || isSpeaking || voiceState === 'listening') {
          speakMessage(res.turnResult.nextQuestion, updatedConvo.length - 1, lang === 'english' ? 'en-IN' : 'hi-IN')
        }
      } else {
        setErrorMsg(res.message || 'Failed to analyze uploaded document.')
        setDocUploadProgress(null)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error processing document upload.')
      setDocUploadProgress(null)
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target?.files?.[0]
    if (!file || !caseItem) return
    if (e.target) e.target.value = ''
    await processUploadedFile(file)
  }

  const handleDeleteDocument = async (docId) => {
    if (!caseItem || !docId) return
    try {
      const res = await CaseApi.deleteCaseDocument(caseItem.id, docId)
      if (res.success && res.case) {
        setCaseItem(res.case)
        if (previewDoc?.id === docId) {
          setPreviewDoc(null)
        }
      } else {
        setErrorMsg(res.message || 'Failed to remove document.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error removing document.')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      processUploadedFile(file)
    }
  }

  // Reset interview & start over with clean slate
  const handleResetInterview = async () => {
    try {
      setIsResetting(true)
      stopSpeaking()
      setErrorMsg('')
      const res = await CaseApi.resetInterview(caseItem?.id)
      if (res.success && res.case) {
        setCaseItem(res.case)
        const initialText = res.initialQuestion || 'Hello. I am the Aarogya Case intake assistant. Please describe your health concern or main symptoms in your own words.'
        setConversation([
          { sender: 'ai', text: initialText, languageStyle: 'english', timestamp: new Date().toISOString() }
        ])
        setInputMessage('')
        setVoiceTranscript('')
        setVoiceState('idle')
        setTouchOptions([])
        setLastFailedMessage('')
        setDocUploadProgress(null)
        setPreviewDoc(null)
        setIsEditingReview(false)
        setPhase('interview')
        setShowResetConfirm(false)
      } else {
        setErrorMsg(res.message || 'Failed to reset clinical interview.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error resetting clinical interview.')
    } finally {
      setIsResetting(false)
    }
  }

  // Continue manually fallback
  const handleContinueManually = () => {
    if (caseItem) {
      navigate('/patient/case-info', {
        state: {
          caseId: caseItem.id,
          caseData: caseItem,
          description: caseItem.originalPatientResponse || caseItem.problem,
          duration: caseItem.duration
        }
      })
    } else {
      navigate('/patient/new-problem')
    }
  }

  // Save edits made on review screen
  const handleSaveReviewEdits = async () => {
    if (!caseItem) return
    const updatedHistory = {
      ...(caseItem.structuredHistory || {}),
      duration: editableFields.duration || caseItem.structuredHistory?.duration || 'Unknown',
      pastMedicalHistory: editableFields.pastMedicalHistory || caseItem.structuredHistory?.pastMedicalHistory || 'Not provided',
      currentMedications: editableFields.currentMedications || caseItem.structuredHistory?.currentMedications || 'Not provided',
      allergies: editableFields.allergies || caseItem.structuredHistory?.allergies || 'Unknown'
    }
    const updatedCase = {
      ...caseItem,
      duration: updatedHistory.duration,
      structuredHistory: updatedHistory
    }
    setCaseItem(updatedCase)
    setIsEditingReview(false)
    try {
      await CaseApi.updateCase(caseItem.id, {
        structuredHistory: updatedHistory,
        duration: updatedHistory.duration
      })
    } catch (e) {
      console.warn('Error syncing review edits to backend:', e.message)
    }
  }

  // Confirm case and transition to next step
  const handleConfirmCase = async () => {
    if (!caseItem) return
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await CaseApi.confirmCase(caseItem.id, caseItem.structuredHistory)
      if (res.success && res.case) {
        navigate('/patient/next-step', {
          state: {
            caseId: res.case.id,
            caseNumber: res.case.caseNumber,
            caseData: res.case,
            description: res.case.problem,
            duration: res.case.duration
          }
        })
      } else {
        setErrorMsg(res.message || 'Failed to confirm case.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error confirming clinical case.')
    } finally {
      setLoading(false)
    }
  }

  const structured = caseItem?.structuredHistory || {
    chiefComplaint: caseItem?.problem || 'Not provided',
    duration: caseItem?.duration || 'Unknown',
    symptoms: caseItem?.symptoms || [],
    associatedSymptoms: [],
    pastMedicalHistory: 'Not provided',
    currentMedications: 'Not provided',
    allergies: 'Unknown',
    relevantNegatives: [],
    additionalInformation: 'Not provided'
  }

  const askedTopics = caseItem?.questionState?.askedTopics || []

  // Section 20 Field Semantics Formatter
  const renderFieldStatus = (fieldName, rawValue) => {
    if (rawValue === 'None reported' || rawValue === 'None') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
          None reported
        </span>
      )
    }
    if (rawValue === 'Declined' || rawValue === 'Skipped') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
          Declined / Skipped
        </span>
      )
    }
    if (rawValue === 'Unknown') {
      if (askedTopics.includes(fieldName)) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Unknown (Patient does not know)
          </span>
        )
      }
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal bg-slate-50 text-slate-500 italic border border-slate-200">
          Not assessed
        </span>
      )
    }
    if (!rawValue || rawValue === 'Not provided') {
      if (askedTopics.includes(fieldName)) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Not provided
          </span>
        )
      }
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal bg-slate-50 text-slate-500 italic border border-slate-200">
          Not assessed
        </span>
      )
    }

    return (
      <strong className="text-slate-900 font-bold text-sm block">
        {rawValue}
      </strong>
    )
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'AI Clinical Case Interview' }
      ]}
      backTo="/patient/home"
      backLabel="Exit to Home"
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                AAROGYA CASE • AI CLINICAL INTAKE
              </span>
              {caseItem?.caseNumber && (
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  {caseItem.caseNumber}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Let's understand your health concern.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Type or speak in English, Hindi, or Hinglish. Your responses prepare an authoritative structured case for your physician.
            </p>
          </div>

          {/* Right Action / Progress Tag */}
          <div className="flex items-center gap-2 shrink-0">
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="px-3.5 py-2 rounded-full border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs animate-pulse"
                title="Stop AI speech"
                id="btn-stop-speaking"
              >
                <span className="material-symbols-outlined text-[16px]">stop_circle</span>
                <span>Stop Speaking</span>
              </button>
            )}

            {phase === 'interview' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3.5 py-2 rounded-full border border-slate-300 text-slate-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                  title="Reset interview and start over"
                  id="btn-reset-interview-top"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('review')}
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                  id="btn-review-case-top"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Review Case</span>
                </button>
              </>
            )}
            {phase === 'review' && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-3.5 py-2 rounded-full border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                style={{ fontFamily: 'Lexend, sans-serif' }}
                title="Reset interview and start over"
                id="btn-reset-interview-top-review"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Reset &amp; Start Over</span>
              </button>
            )}
          </div>
        </div>

        {/* Medical Emergency Care Notice */}
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3 text-xs sm:text-sm text-amber-900 shadow-2xs">
          <span className="material-symbols-outlined text-amber-700 text-xl shrink-0 mt-0.5">warning</span>
          <div className="space-y-0.5">
            <strong className="font-bold block text-amber-950" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Medical Emergency Notice
            </strong>
            <p className="text-amber-900 text-xs sm:text-[13px] leading-relaxed">
              If you are experiencing severe chest pain, extreme breathlessness, or a medical emergency, contact emergency services immediately.
            </p>
          </div>
        </div>

        {/* Loading Spinner */}
        {initializing && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-[#166534] animate-spin">progress_activity</span>
            <p className="text-sm font-semibold text-slate-700">Connecting to clinical intake service...</p>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PHASE 1: CONSENT */}
        {/* ------------------------------------------------------------- */}
        {!initializing && phase === 'consent' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#166534] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Clinical Intake Consent &amp; Privacy
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Your responses will be used to prepare your medical history for review by a healthcare professional. You can respond by typing or speaking in English, Hindi, or Hinglish.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#166534] text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>The AI assistant only collects clinical details. It does not diagnose diseases or prescribe medications.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#166534] text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Your original wording is preserved verbatim and presented directly to your examining physician.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#166534] text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Voice input is transcribed on your device. You can review and edit your words before sending.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConsentAgree}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer btn-press uppercase tracking-wider"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>AGREE &amp; CONTINUE</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>

              <Link
                to="/patient/home"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 text-sm font-bold transition-all text-center"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                CANCEL
              </Link>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PHASE 2: AI CASE INTERVIEW CONVERSATION */}
        {/* ------------------------------------------------------------- */}
        {!initializing && phase === 'interview' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[520px]">
            {/* Safety & Provenance Strip */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[14px] text-[#166534]">shield</span>
                AI Clinical Intake • Type or speak naturally • Doctor makes final diagnosis
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  Voice: {voiceLang === 'hi-IN' ? 'Hindi / Hinglish' : 'English'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {caseItem?.questionState?.completionStatus === 'COMPLETED'
                    ? 'Key details collected'
                    : "Active conversation"}
                </span>
              </div>
            </div>

            {/* Conversation Container with Drag & Drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 sm:p-8 flex-1 overflow-y-auto space-y-4 max-h-[460px] transition-colors ${
                isDraggingFile ? 'bg-emerald-50/60 border-2 border-dashed border-emerald-400' : ''
              }`}
            >
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]`}>
                    {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      {/* Standard Text or Document Upload Card */}
                      {msg.inputMode === 'document' && msg.document ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-800 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-[#166534] flex items-center justify-center font-bold">
                                <span className="material-symbols-outlined text-base">description</span>
                              </span>
                              <div>
                                <span className="font-bold block text-slate-900">{msg.document.originalName}</span>
                                <span className="text-[10px] text-slate-500 uppercase">{msg.findings?.documentType || 'Medical Document'} • {msg.document.fileSize ? `${(msg.document.fileSize / 1024).toFixed(0)} KB` : 'Uploaded'}</span>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              DOCUMENT ANALYZED
                            </span>
                          </div>

                          {/* Source-based Summary */}
                          <div className="space-y-1.5">
                            <span className="font-bold text-[11px] text-[#166534] uppercase tracking-wider block">
                              Information found in your uploaded document:
                            </span>

                            {msg.findings?.importantFindings && msg.findings.importantFindings.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                                {msg.findings.importantFindings.map((f, fIdx) => (
                                  <li key={fIdx}>{f}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-slate-600 italic">Document attached to clinical record.</p>
                            )}

                            {/* Lab results pill list */}
                            {msg.findings?.labResults && msg.findings.labResults.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {msg.findings.labResults.map((lab, lIdx) => (
                                  <span key={lIdx} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800">
                                    <strong>{lab.testName}:</strong> {lab.value} {lab.unit || ''}
                                    {lab.flag === 'low' && <span className="ml-1 text-amber-700 font-bold">(Low)</span>}
                                    {lab.flag === 'high' && <span className="ml-1 text-rose-700 font-bold">(High)</span>}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Medications pill list */}
                            {msg.findings?.medications && msg.findings.medications.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {msg.findings.medications.map((med, mIdx) => (
                                  <span key={mIdx} className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-[11px] font-medium">
                                    💊 {med.name} {med.dosage ? `(${med.dosage})` : ''}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Uncertain items warning */}
                            {msg.findings?.uncertainItems && msg.findings.uncertainItems.length > 0 && (
                              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
                                <span className="material-symbols-outlined text-amber-700 text-sm shrink-0 mt-0.5">help</span>
                                <span>
                                  <strong>Uncertain Item:</strong> {msg.findings.uncertainItems.map(u => u.item).join(', ')} ({msg.findings.uncertainItems[0].reason}). Marked for doctor verification.
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quick Actions: View Document & Remove */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(msg.document)}
                              className="text-[#166534] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[13px]">visibility</span>
                              <span>View Document</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(msg.document.id)}
                              className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                              title="Remove document from case"
                            >
                              <span className="material-symbols-outlined text-[13px]">delete</span>
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.sender === 'patient'
                              ? 'bg-[#166534] text-white rounded-tr-none shadow-xs font-medium'
                              : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200/80'
                          }`}
                        >
                          {msg.text}
                        </div>
                      )}

                      {/* AI Bubble Action Bar (Speaker Replay) */}
                      {msg.sender === 'ai' && (
                        <div className="flex items-center gap-2 pt-0.5 px-1">
                          <button
                            type="button"
                            onClick={() => speakMessage(msg.text, idx, msg.languageStyle === 'english' ? 'en-IN' : 'hi-IN')}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#166534] transition cursor-pointer"
                            id={`btn-speak-message-${idx}`}
                            title="Play audio of this response"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {currentlySpeakingIndex === idx ? 'volume_up' : 'volume_mute'}
                            </span>
                            <span>{currentlySpeakingIndex === idx ? 'Speaking...' : 'Listen'}</span>
                          </button>
                          {msg.languageStyle && (
                            <span className="text-[10px] text-slate-400 capitalize">
                              ({msg.languageStyle})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Patient Voice Tag */}
                      {msg.sender === 'patient' && msg.inputMode === 'voice' && (
                        <div className="flex justify-end pr-1">
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-medium">
                            <span className="material-symbols-outlined text-[12px]">mic</span> Spoken
                          </span>
                        </div>
                      )}
                    </div>

                    {msg.sender === 'patient' && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <span className="material-symbols-outlined text-[18px]">person</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Document Uploading / Analyzing Banner */}
              {isUploadingDoc && docUploadProgress && (
                <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-950 shadow-2xs animate-pulse">
                  <span className="material-symbols-outlined text-2xl text-[#166534] animate-spin">sync</span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#166534]">upload_file</span>
                      <span>DOCUMENT UPLOADED: {docUploadProgress.fileName}</span>
                    </div>
                    <div className="text-emerald-800 text-[11px]">
                      Status: {docUploadProgress.step}
                    </div>
                  </div>
                </div>
              )}

              {/* Typing / Analysis Indicator */}
              {isSubmittingTurn && (
                <div className="flex justify-start items-center gap-2.5 text-slate-500 text-xs py-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  </div>
                  <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 italic">
                    {voiceState === 'processing'
                      ? 'Processing spoken response & formulating question...'
                      : 'Analyzing clinical response & preparing next question...'}
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Error Message & Recovery Controls */}
            {errorMsg && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-red-600">error</span>
                  <span>{errorMsg}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lastFailedMessage && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-bold hover:bg-red-800 cursor-pointer"
                    >
                      TRY AGAIN
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleContinueManually}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    CONTINUE MANUALLY
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 32: Touch-Ready Quick Options */}
            {touchOptions && touchOptions.length > 0 && !isSubmittingTurn && voiceState !== 'listening' && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Quick Select:</span>
                {touchOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendTurn(opt, 'text')}
                    className="px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">touch_app</span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* SECTION 8: Speech Transcript Review Card */}
            {voiceState === 'reviewing' && (
              <div className="p-4 bg-emerald-50/90 border-t border-emerald-200 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs text-emerald-950 font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-emerald-700">mic</span>
                    <span>You said:</span>
                  </div>
                  <span className="text-[11px] text-emerald-800 font-normal">Edit if needed before sending</span>
                </div>
                <textarea
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  className="w-full p-3 bg-white border border-emerald-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 shadow-inner resize-none min-h-[70px]"
                  placeholder="Your spoken words appear here..."
                  id="voice-transcript-editor"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelVoice}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                    id="btn-voice-cancel"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendTurn(voiceTranscript, 'voice')}
                    disabled={!voiceTranscript.trim() || isSubmittingTurn}
                    className="px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] disabled:bg-slate-300 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    id="btn-voice-send"
                  >
                    <span>SEND</span>
                    <span className="material-symbols-outlined text-base">send</span>
                  </button>
                </div>
              </div>
            )}

            {/* Listening Banner */}
            {voiceState === 'listening' && (
              <div className="px-6 py-3 bg-emerald-600 text-white flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="material-symbols-outlined text-lg animate-bounce">mic</span>
                  <span>Listening... Speak naturally in English, Hindi, or Hinglish</span>
                </div>
                <button
                  type="button"
                  onClick={handleStopListening}
                  className="px-3 py-1 bg-white text-emerald-900 rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer"
                  id="btn-stop-listening"
                >
                  Done Speaking
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center gap-2 sm:gap-3">
              {/* Voice Language Toggle */}
              <button
                type="button"
                onClick={() => setVoiceLang(prev => prev === 'hi-IN' ? 'en-IN' : 'hi-IN')}
                className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-600 transition shrink-0 cursor-pointer"
                title="Toggle speech recognition language"
                id="btn-voice-lang-toggle"
              >
                {voiceLang === 'hi-IN' ? '🇮🇳 HI/Hinglish' : '🇬🇧 English'}
              </button>

              {/* Hidden File Input for Documents */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
                className="hidden"
                id="input-document-upload"
              />

              {/* Document Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmittingTurn || isUploadingDoc || voiceState === 'listening'}
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#166534] border border-slate-300 hover:border-emerald-300 disabled:opacity-50"
                title="Upload Report, Prescription or Medical Image (PDF, JPG, PNG)"
                id="btn-upload-document"
              >
                <span className="material-symbols-outlined text-xl">attach_file</span>
              </button>

              {/* Microphone Button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={voiceState === 'listening' ? handleStopListening : handleStartListening}
                  disabled={isSubmittingTurn || isUploadingDoc}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs ${
                    voiceState === 'listening'
                      ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse'
                      : 'bg-emerald-50 text-[#166534] border border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title={voiceState === 'listening' ? 'Click to stop listening' : 'Click to speak your response'}
                  id="btn-voice-mic"
                >
                  <span className="material-symbols-outlined text-xl">
                    {voiceState === 'listening' ? 'mic' : 'mic_none'}
                  </span>
                </button>
              )}

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  voiceState === 'listening'
                    ? 'Listening to speech...'
                    : 'Type or speak... (e.g. 3 din se fever hai)'
                }
                disabled={isSubmittingTurn || voiceState === 'listening'}
                className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition shadow-inner disabled:bg-slate-100"
                style={{ fontFamily: 'Lexend, sans-serif' }}
                id="input-interview-message"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isSubmittingTurn || voiceState === 'listening'}
                className="px-6 py-3 rounded-2xl bg-[#166534] hover:bg-[#14532d] disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer btn-press disabled:cursor-not-allowed"
                style={{ fontFamily: 'Lexend, sans-serif' }}
                id="btn-send-interview-turn"
              >
                <span>SEND</span>
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PHASE 3: CASE REVIEW & CONFIRMATION */}
        {/* ------------------------------------------------------------- */}
        {!initializing && phase === 'review' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                    CASE REVIEW
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {caseItem?.caseNumber}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540] mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Review Your Clinical Summary
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Please verify the extracted information before submitting it to the doctor's queue.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isEditingReview ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingReview(true)}
                    className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    <span>Edit Details</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveReviewEdits}
                    className="px-4 py-2 rounded-full bg-[#166534] text-white hover:bg-[#14532d] text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>Save Changes</span>
                  </button>
                )}
              </div>
            </div>

            {/* Original Verbatim Response */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Original Patient Response (Verbatim)
              </span>
              <p className="text-sm font-medium text-slate-900 italic bg-white/80 p-3 rounded-xl border border-amber-200/60">
                "{caseItem?.originalPatientResponse || caseItem?.problem || 'No description provided'}"
              </p>
            </div>

            {/* Structured Clinical Matrix with Section 20 Field Semantics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Chief Complaint</span>
                {renderFieldStatus('chiefComplaint', structured.chiefComplaint)}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Duration</span>
                {isEditingReview ? (
                  <input
                    type="text"
                    value={editableFields.duration}
                    onChange={(e) => setEditableFields({ ...editableFields, duration: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#166534]"
                    placeholder="e.g. 3 days"
                  />
                ) : (
                  renderFieldStatus('duration', structured.duration)
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Reported Symptoms</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(structured.symptoms || []).length > 0 ? (
                    structured.symptoms.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#166534] font-medium text-xs">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">None reported</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Associated Symptoms</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(structured.associatedSymptoms || []).length > 0 ? (
                    structured.associatedSymptoms.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-medium text-xs border border-blue-200">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">None reported</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Past Medical History</span>
                {isEditingReview ? (
                  <input
                    type="text"
                    value={editableFields.pastMedicalHistory}
                    onChange={(e) => setEditableFields({ ...editableFields, pastMedicalHistory: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#166534]"
                    placeholder="e.g. None reported, Diabetes"
                  />
                ) : (
                  renderFieldStatus('pastMedicalHistory', structured.pastMedicalHistory)
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Current Medications</span>
                {isEditingReview ? (
                  <input
                    type="text"
                    value={editableFields.currentMedications}
                    onChange={(e) => setEditableFields({ ...editableFields, currentMedications: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#166534]"
                    placeholder="e.g. Paracetamol"
                  />
                ) : (
                  renderFieldStatus('currentMedications', structured.currentMedications)
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Known Allergies</span>
                {isEditingReview ? (
                  <input
                    type="text"
                    value={editableFields.allergies}
                    onChange={(e) => setEditableFields({ ...editableFields, allergies: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#166534]"
                    placeholder="e.g. None reported"
                  />
                ) : (
                  renderFieldStatus('allergies', structured.allergies)
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
                <span className="text-slate-500 block font-semibold">Relevant Negatives</span>
                <strong className="text-slate-800 font-semibold block">
                  {structured.relevantNegatives?.length > 0
                    ? structured.relevantNegatives.join(', ')
                    : 'None documented'}
                </strong>
              </div>
            </div>

            {/* UPLOADED DOCUMENTS & FINDINGS REVIEW SECTION */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#166534] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-lg">description</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Uploaded Medical Documents &amp; Clinical Findings
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Historical prescriptions, lab reports, and medical records attached to this case.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={reviewFileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
                    className="hidden"
                    id="input-document-upload-review"
                  />
                  <button
                    type="button"
                    onClick={() => reviewFileInputRef.current?.click()}
                    disabled={isUploadingDoc}
                    className="px-3 py-1.5 rounded-full bg-white border border-slate-300 hover:border-emerald-300 hover:bg-emerald-50 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    id="btn-upload-document-review"
                  >
                    <span className="material-symbols-outlined text-base text-emerald-600">upload_file</span>
                    <span>Upload Document</span>
                  </button>
                </div>
              </div>

              {/* Document list */}
              {(caseItem?.documents || caseItem?.structuredHistory?.documents || []).length > 0 ? (
                <div className="space-y-3">
                  {(caseItem?.documents || caseItem?.structuredHistory?.documents || []).map((doc, docIdx) => (
                    <div key={doc.id || docIdx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-xl text-[#166534]">
                            {doc.mimeType?.includes('pdf') ? 'picture_as_pdf' : 'image'}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{doc.originalName}</span>
                            <div className="text-[10px] text-slate-400">
                              <span className="uppercase font-semibold">{doc.findings?.documentType || 'Medical Document'}</span>
                              {doc.findings?.documentDate && ` • Date: ${doc.findings.documentDate}`}
                              {doc.findings?.facility && ` • Facility: ${doc.findings.facility}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[11px] font-semibold text-rose-700 flex items-center gap-1 cursor-pointer"
                            title="Discard document from case"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Extracted findings summary */}
                      {doc.findings && (
                        <div className="space-y-2 text-xs text-slate-700">
                          {doc.findings.importantFindings && doc.findings.importantFindings.length > 0 && (
                            <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1 text-[11px]">
                              {doc.findings.importantFindings.map((f, fIdx) => (
                                <li key={fIdx}>{f}</li>
                              ))}
                            </ul>
                          )}

                          {/* Lab results pill list */}
                          {doc.findings.labResults && doc.findings.labResults.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {doc.findings.labResults.map((lab, lIdx) => (
                                <span key={lIdx} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-800">
                                  <strong>{lab.testName}:</strong> {lab.value} {lab.unit || ''}
                                  {lab.flag === 'low' && <span className="ml-1 text-amber-700 font-bold">(Low)</span>}
                                  {lab.flag === 'high' && <span className="ml-1 text-rose-700 font-bold">(High)</span>}
                                  <span className="ml-1 text-[9px] text-slate-400 italic">• Source: Uploaded Document</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Medications pill list */}
                          {doc.findings.medications && doc.findings.medications.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {doc.findings.medications.map((m, mIdx) => (
                                <span key={mIdx} className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-medium text-blue-900">
                                  💊 {m.name} {m.dosage ? `(${m.dosage})` : ''}
                                  <span className="ml-1 text-[9px] text-blue-600 italic">• Source: Uploaded Prescription</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Uncertain items warning */}
                          {doc.findings.uncertainItems && doc.findings.uncertainItems.length > 0 && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5 mt-1">
                              <span className="material-symbols-outlined text-amber-700 text-sm shrink-0 mt-0.5">warning</span>
                              <span>
                                <strong>Uncertain / Unclear Item:</strong> {doc.findings.uncertainItems.map(u => u.item).join(', ')} ({doc.findings.uncertainItems[0].reason}). Marked for physician in-person verification.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl space-y-2 bg-white">
                  <span className="material-symbols-outlined text-3xl text-slate-400">upload_file</span>
                  <p className="text-xs text-slate-600 font-medium">
                    No medical documents attached yet. You can upload previous prescriptions, lab reports, or discharge summaries.
                  </p>
                  <button
                    type="button"
                    onClick={() => reviewFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#166534] border border-emerald-200 text-xs font-bold transition cursor-pointer"
                  >
                    Upload Report / Prescription
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            {/* Confirmation CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPhase('interview')}
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  BACK TO CONVERSATION
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-full border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                  id="btn-reset-interview-bottom-review"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>RESET &amp; START OVER</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmCase}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#166534] hover:bg-[#14532d] disabled:bg-slate-400 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer btn-press uppercase tracking-wider"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    <span>CONFIRMING CASE...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>CONFIRM CASE &amp; PROCEED</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">restart_alt</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Reset Clinical Interview?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  This will clear the active clinical conversation and start fresh. The AI assistant will ask for your health concern again from the beginning, and populate your case with the new details you provide.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-700 text-base shrink-0 mt-0.5">info</span>
                <span>Your case record will be retained, but all answered symptoms and structured history will be cleared for fresh entry.</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  disabled={isResetting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetInterview}
                  disabled={isResetting}
                  id="btn-confirm-reset-interview"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  {isResetting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                      <span>Yes, Reset &amp; Start Over</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">
                      {previewDoc.mimeType?.includes('pdf') ? 'picture_as_pdf' : 'image'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {previewDoc.originalName}
                    </h3>
                    <p className="text-xs text-slate-500 uppercase font-semibold">
                      {previewDoc.findings?.documentType || 'Medical Document'} • {previewDoc.fileSize ? `${(previewDoc.fileSize / 1024).toFixed(0)} KB` : 'Uploaded'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                  title="Close preview"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Document Display Canvas */}
              <div className="flex-1 overflow-auto p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center min-h-[260px]">
                {previewDoc.mimeType?.startsWith('image/') ? (
                  <img
                    src={CaseApi.getDocumentFileUrl(caseItem.id, previewDoc.id)}
                    alt={previewDoc.originalName}
                    className="max-h-[500px] max-w-full rounded-xl object-contain shadow-sm"
                  />
                ) : (
                  <div className="text-center space-y-3 p-6 bg-white rounded-xl border border-slate-300 max-w-md w-full shadow-xs">
                    <span className="material-symbols-outlined text-5xl text-[#166534]">picture_as_pdf</span>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{previewDoc.originalName}</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Secure medical PDF attached to case #{caseItem.caseNumber}
                      </p>
                    </div>
                    <a
                      href={CaseApi.getDocumentFileUrl(caseItem.id, previewDoc.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold transition shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      <span>Open Document in Full Viewer</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Detected findings quick recap */}
              {previewDoc.findings && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-[#166534] block uppercase tracking-wider text-[10px]">
                    Extracted Findings Recap:
                  </span>
                  <div className="text-slate-700 text-[11px]">
                    {previewDoc.findings.importantFindings?.join(' • ') || 'Document attached to patient record.'}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2 rounded-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  )
}
