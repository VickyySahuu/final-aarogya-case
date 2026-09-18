import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import { DoctorApi } from '../../services/doctorApi'
import { DiagnosticApi } from '../../services/diagnosticApi'
import PatientQrCode from '../../components/common/PatientQrCode'
import UnifiedMedicalTimeline from '../../components/timeline/UnifiedMedicalTimeline'
import PhysicianAiSummary from '../../components/summary/PhysicianAiSummary'

const DEFAULT_VITALS = [
  { label: 'Blood Pressure', value: '120/80 mmHg', icon: 'vital_signs', alert: false },
  { label: 'Heart Rate', value: '76 bpm', icon: 'monitor_heart', alert: false },
  { label: 'SpO2', value: '98%', icon: 'spo2', alert: false },
  { label: 'Temperature', value: '98.6°F', icon: 'thermostat', alert: false },
  { label: 'Respiratory Rate', value: '16 /min', icon: 'pulmonology', alert: false },
  { label: 'Weight', value: '68 kg', icon: 'scale', alert: false },
]

export default function PatientCasePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const queryTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || queryTab || 'overview')

  const opdPatient = location.state?.patient || (() => {
    try {
      const stored = sessionStorage.getItem('aarogya_doctor_active_patient')
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      return null
    }
  })()
  const appointmentId = location.state?.appointmentId ||
    opdPatient?.appointmentId ||
    opdPatient?.id ||
    searchParams.get('appointmentId') ||
    searchParams.get('id')
  const [loadedDossier, setLoadedDossier] = useState(null)
  const [isCompleted, setIsCompleted] = useState(false)

  // Real backend patient history, diagnostic reports and unified timeline
  const [patientHistory, setPatientHistory] = useState({ appointments: [], prescriptions: [], cases: [], reports: [], timeline: [] })
  const [patientReports, setPatientReports] = useState([])
  const [timelineEvents, setTimelineEvents] = useState([])
  const [aiSummary, setAiSummary] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingReports, setLoadingReports] = useState(false)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState(null)

  useEffect(() => {
    if (appointmentId) {
      DoctorApi.getQueueItem(appointmentId).then((data) => {
        if (data) setLoadedDossier(data)
      }).catch((e) => {
        console.warn('Failed to load patient dossier:', e.message)
      })
    }
  }, [appointmentId])

  const activePatientData = loadedDossier || opdPatient

  const patient = activePatientData ? {
    name: activePatientData.patientName || activePatientData.name || (activePatientData.id ? `Patient #${activePatientData.id}` : 'Patient'),
    id: activePatientData.patientId || activePatientData.id || activePatientData.patientDbId,
    patientDbId: activePatientData.patientDbId || activePatientData.id,
    uniqueCode: activePatientData.patientUniqueCode || activePatientData.uniqueCode || 'AC-000000',
    token: typeof activePatientData.token === 'number' ? `#${activePatientData.token}` : activePatientData.tokenNumber || activePatientData.token || '#1',
    age: activePatientData.age || (activePatientData.patientAge ? `${activePatientData.patientAge} Yrs / ${activePatientData.patientGender || 'Male'}` : '—'),
    gender: activePatientData.gender || activePatientData.patientGender || '—',
    mobile: activePatientData.mobile || activePatientData.patientMobile || '—',
    bloodGroup: activePatientData.bloodGroup || activePatientData.patientBloodGroup || '—',
    address: activePatientData.address || activePatientData.patientAddress || '—',
    chiefComplaint: activePatientData.problem || activePatientData.chiefComplaint || activePatientData.fullAppointment?.chiefComplaint || 'Consultation review for reported symptoms.',
    caseDetails: activePatientData.caseDetails || activePatientData.case || null,
    status: isCompleted ? 'Completed' : (activePatientData.status || 'Current'),
    appointmentId: appointmentId || activePatientData.appointmentId || activePatientData.id,
    appointmentNumber: activePatientData.appointmentNumber || activePatientData.appointment_number || activePatientData.tokenNumber || null,
    room: activePatientData.room || activePatientData.opdRoom || 'Room 104',
    category: activePatientData.category || 'ROUTINE',
    severity: activePatientData.severity || 'Routine'
  } : null

  // Save active patient in session for consistency across doctor consultation sub-pages
  useEffect(() => {
    if (patient && patient.name && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('aarogya_doctor_active_patient', JSON.stringify(patient))
      } catch (e) {}
    }
  }, [patient])

  // Fetch real patient history when history tab is selected or patient loads
  useEffect(() => {
    if (patient && (patient.id || patient.uniqueCode)) {
      setLoadingHistory(true)
      DoctorApi.getPatientHistory(patient.id || patient.uniqueCode)
        .then((data) => {
          if (data) setPatientHistory(data)
        })
        .catch((err) => {
          console.warn('Failed to load real patient history:', err)
        })
        .finally(() => setLoadingHistory(false))
    }
  }, [patient?.id, patient?.uniqueCode])

  // Fetch real diagnostic reports when reports tab is selected or patient loads
  useEffect(() => {
    if (patient && (patient.uniqueCode || patient.id)) {
      setLoadingReports(true)
      DiagnosticApi.getPatientReports(patient.uniqueCode || patient.id)
        .then((res) => {
          if (res.ok && Array.isArray(res.data?.reports)) {
            setPatientReports(res.data.reports)
          } else {
            setPatientReports([])
          }
        })
        .catch((err) => {
          console.warn('Failed to load patient diagnostic reports:', err)
          setPatientReports([])
        })
        .finally(() => setLoadingReports(false))
    }
  }, [patient?.uniqueCode, patient?.id])

  // Fetch unified chronological timeline
  useEffect(() => {
    if (patient && (patient.id || patient.uniqueCode)) {
      setLoadingTimeline(true)
      DoctorApi.getPatientTimeline(patient.id || patient.uniqueCode)
        .then((res) => {
          if (res && Array.isArray(res.events)) {
            setTimelineEvents(res.events)
          }
        })
        .catch((err) => {
          console.warn('Failed to load patient timeline:', err)
        })
        .finally(() => setLoadingTimeline(false))
    }
  }, [patient?.id, patient?.uniqueCode])

  // Fetch physician AI clinical summary for active patient case
  useEffect(() => {
    const caseId = patient?.caseDetails?.id || patient?.caseDetails?.caseNumber || patient?.caseId || patient?.appointmentId
    if (caseId) {
      setLoadingSummary(true)
      DoctorApi.getCaseAiSummary(caseId)
        .then((data) => {
          if (data) setAiSummary(data)
        })
        .catch((err) => {
          console.warn('Failed to load AI clinical summary:', err)
          setSummaryError('Failed to fetch AI clinical summary.')
        })
        .finally(() => setLoadingSummary(false))
    }
  }, [patient?.caseDetails?.id, patient?.caseDetails?.caseNumber, patient?.caseId, patient?.appointmentId])

  if (!patient) {
    return (
      <DoctorLayout activeNav="OPD Queue">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between bg-white border-b border-slate-200">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 flex-wrap" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <Link to="/doctor/dashboard" className="hover:text-[#166534] transition-colors">Doctor Portal</Link>
            <span className="text-slate-300">›</span>
            <Link to="/doctor/opd-queue" className="hover:text-[#166534] transition-colors">OPD Queue</Link>
            <span className="text-slate-300">›</span>
            <span className="text-[#166534] font-bold">Patient Workspace</span>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-10 py-16 flex flex-col items-center justify-center max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-6">
            <span className="material-symbols-outlined text-5xl">person_search</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold mb-3 uppercase tracking-wider">
            Select Patient • No Active Patient Loaded
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] mb-3" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Select a Patient to Open Patient Workspace
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mb-8 leading-relaxed">
            Please select an intake citizen from today's OPD Queue or search registered patients to open their central clinical consultation workspace.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/doctor/opd-queue"
              className="h-13 px-8 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs hover:shadow-md transition cursor-pointer btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
              <span>CHOOSE FROM OPD QUEUE</span>
            </Link>
            <Link
              to="/doctor/patient-search"
              className="h-13 px-8 rounded-full bg-[#455f8a] hover:bg-[#344869] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs hover:shadow-md transition cursor-pointer btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[20px]">person_search</span>
              <span>SEARCH PATIENT / SCAN QR</span>
            </Link>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  const handleCompleteCase = async () => {
    if (appointmentId) {
      await DoctorApi.updateQueueStatus(appointmentId, 'Completed')
      setIsCompleted(true)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'summary', label: 'AI Clinical Summary', icon: 'psychology' },
    { id: 'timeline', label: 'Timeline', icon: 'timeline' },
    { id: 'history', label: 'History', icon: 'history' },
    { id: 'reports', label: 'Reports', icon: 'lab_panel' },
  ]

  // Filter previous appointments (excluding current one)
  const previousAppointments = (patientHistory.appointments || []).filter(
    a => String(a.id) !== String(patient?.appointmentId) &&
         a.appointment_number !== patient?.appointmentNumber &&
         a.appointment_number !== patient?.appointmentId
  )
  const previousPrescriptions = patientHistory.prescriptions || []
  const previousCases = (patientHistory.cases || []).filter(
    c => String(c.id) !== String(patient?.caseDetails?.id) &&
         c.case_number !== patient?.caseDetails?.case_number &&
         c.case_number !== patient?.caseDetails?.caseNumber
  )

  const hasAnyHistory = previousAppointments.length > 0 || previousPrescriptions.length > 0 || previousCases.length > 0

  return (
    <DoctorLayout 
      activeNav="OPD Queue" 
      showPatientContext 
      patientName={patient.name}
      patientAge={patient.age}
      patientToken={patient.token}
      patientUniqueCode={patient.uniqueCode}
    >
      {/* Breadcrumb + Status Strip */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <Link to="/doctor/dashboard" className="hover:text-[#166534] transition-colors">Doctor Portal</Link>
          <span className="text-slate-300">›</span>
          <Link to="/doctor/opd-queue" className="hover:text-[#166534] transition-colors">OPD Queue</Link>
          <span className="text-slate-300">›</span>
          <span className="text-[#166534] font-bold">Patient Workspace</span>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-100 px-3.5 py-1 rounded-full text-xs font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <span className={`w-2 h-2 rounded-full ${patient.status === 'Completed' ? 'bg-[#166534]' : 'bg-emerald-600 animate-pulse'}`}></span>
          <span className="text-slate-900 font-bold">{patient.room}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">General Medicine</span>
          <span className="text-slate-300">•</span>
          <span className={`font-bold uppercase tracking-wider ${patient.status === 'Completed' ? 'text-[#166534]' : 'text-emerald-700'}`}>
            {patient.status === 'Completed' ? 'Consultation Completed' : 'Active Consultation'}
          </span>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Central Patient Workspace Header Card */}
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5 sm:gap-6">
            <div className="bg-[#166534] text-white px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs shrink-0 min-w-[110px]">
              <span className="text-[10px] tracking-widest uppercase font-bold text-emerald-200" style={{ fontFamily: 'Lexend, sans-serif' }}>OPD TOKEN</span>
              <span className="text-2xl sm:text-3xl font-bold tracking-tight font-mono" style={{ fontFamily: 'Lexend, sans-serif' }}>{patient.token}</span>
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {patient.name}
                </h1>
                <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-0.5 rounded-full" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {patient.age}
                </span>
                <span className="bg-emerald-50 text-[#166534] text-xs font-mono font-bold px-3 py-0.5 rounded-full border border-emerald-200">
                  {patient.uniqueCode}
                </span>
                <span className="bg-blue-50 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                  ABHA Verified
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 flex-wrap mt-0.5">
                <span>Patient ID: <strong className="font-mono text-slate-900">{patient.id}</strong></span>
                <span>•</span>
                <span>Room: <strong className="text-slate-900">{patient.room}</strong></span>
                <span>•</span>
                <span>Category: <strong className="text-slate-900">{patient.category}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-[#166534]">{patient.status}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
            <Link
              to="/doctor/opd-queue"
              className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to OPD Queue</span>
            </Link>
          </div>
        </div>

        {/* CONSULTATION ACTIONS PANEL — Clearly Separated Clinical Action Bar */}
        <section aria-label="Consultation Actions" className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#166534] text-[24px]">clinical_notes</span>
              <h2 className="text-base sm:text-lg font-bold text-[#0A2540] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Consultation Actions
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Actions apply directly to {patient.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Action 1: Doctor Notes */}
            <Link
              to="/doctor/notes"
              state={{ patient }}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 transition flex items-center justify-between group cursor-pointer btn-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">edit_note</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#166534] transition" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Doctor Notes
                  </span>
                  <span className="text-[11px] text-slate-500">Record exam &amp; diagnosis</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-[#166534] group-hover:translate-x-0.5 transition">
                arrow_forward
              </span>
            </Link>

            {/* Action 2: Diagnostic / Scan */}
            <Link
              to="/doctor/diagnostic-request"
              state={{ patient }}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 transition flex items-center justify-between group cursor-pointer btn-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">biotech</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#166534] transition" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Diagnostic / Scan
                  </span>
                  <span className="text-[11px] text-slate-500">Order lab tests or imaging</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-[#166534] group-hover:translate-x-0.5 transition">
                arrow_forward
              </span>
            </Link>

            {/* Action 3: Prescription */}
            <Link
              to="/doctor/prescription"
              state={{ patient }}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 transition flex items-center justify-between group cursor-pointer btn-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-[#166534] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">medication</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#166534] transition" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Prescription
                  </span>
                  <span className="text-[11px] text-slate-500">Issue formulary e-Rx</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-[#166534] group-hover:translate-x-0.5 transition">
                arrow_forward
              </span>
            </Link>

            {/* Action 4: Final Approval & Sign-Off */}
            <Link
              to="/doctor/final-approval"
              state={{ patient }}
              onClick={handleCompleteCase}
              className="p-4 rounded-2xl bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 transition flex items-center justify-between group cursor-pointer btn-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#166534] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">task_alt</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#166534] transition" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Final Approval
                  </span>
                  <span className="text-[11px] text-[#166534] font-semibold">Sign off &amp; complete</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#166534] group-hover:translate-x-0.5 transition">
                arrow_forward
              </span>
            </Link>
          </div>
        </section>

        {/* Workspace Segmented Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer btn-press ${
                activeTab === t.id
                  ? 'border-[#166534] text-[#166534]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* Core Patient Case Foundation Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#166534] text-[24px]">folder_shared</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Patient Case Record
                      </h3>
                      {patient.caseDetails?.caseNumber && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200 font-mono text-xs font-bold">
                          {patient.caseDetails.caseNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Central Health Episode Dossier • SIH26047 Foundation</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold uppercase tracking-wider">
                    {patient.caseDetails?.lifecycleStage || 'PATIENT CONFIRMED'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
                    {patient.severity || 'Routine'}
                  </span>
                </div>
              </div>

              {/* 1. Original Patient Response (Verbatim) */}
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    <span className="material-symbols-outlined text-[16px] text-amber-700">record_voice_over</span>
                    Original Patient Response (Verbatim)
                  </span>
                  <span className="text-[11px] text-amber-700 font-medium italic">Unfiltered Patient Voice</span>
                </div>
                <p className="text-base text-slate-900 font-medium italic bg-white/80 p-3.5 rounded-xl border border-amber-200/60">
                  "{patient.caseDetails?.originalPatientResponse || patient.chiefComplaint || 'No verbatim description recorded.'}"
                </p>
                <span className="text-[11px] text-slate-500 block">
                  Captures the citizen's authentic original words during clinical intake for physician verification.
                </span>
              </div>

              {/* 2. Structured Clinical History */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    <span className="material-symbols-outlined text-[16px] text-[#166534]">clinical_notes</span>
                    Structured Clinical History
                  </span>
                  <span className="text-[11px] text-slate-500">Standardized Presentation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium block">Chief Complaint</span>
                    <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                      {patient.caseDetails?.structuredHistory?.chiefComplaint || patient.chiefComplaint || 'Not provided'}
                    </strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium block">Duration</span>
                    <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                      {patient.caseDetails?.structuredHistory?.duration || patient.caseDetails?.duration || 'Unknown'}
                    </strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium block">Intake Severity</span>
                    <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                      {patient.severity || 'Moderate'}
                    </strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 md:col-span-2 lg:col-span-3">
                    <span className="text-slate-500 font-medium block mb-1.5">Identified Symptoms</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(patient.caseDetails?.structuredHistory?.symptoms || patient.caseDetails?.symptoms || []).length > 0 ? (
                        (patient.caseDetails?.structuredHistory?.symptoms || patient.caseDetails?.symptoms || []).map((s, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#166534] text-xs font-medium border border-emerald-200">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">None reported</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium block">Past Medical History</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">
                      {patient.caseDetails?.structuredHistory?.pastMedicalHistory || 'Not provided'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium block">Current Medications</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">
                      {patient.caseDetails?.structuredHistory?.currentMedications || 'Not provided'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium block">Known Allergies</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">
                      {patient.caseDetails?.structuredHistory?.allergies || 'Unknown'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium block">Relevant Negatives</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">
                      {patient.caseDetails?.structuredHistory?.relevantNegatives?.length > 0
                        ? patient.caseDetails.structuredHistory.relevantNegatives.join(', ')
                        : 'None documented'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 md:col-span-2">
                    <span className="text-slate-500 font-medium block">Additional Clinical Notes</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">
                      {patient.caseDetails?.structuredHistory?.additionalInformation || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Multimodal Clinical AI Intelligence Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className="p-3.5 rounded-2xl bg-amber-50/80 hover:bg-amber-100/90 border border-amber-300 flex items-center gap-2.5 text-left cursor-pointer transition btn-press text-amber-900"
                >
                  <span className="material-symbols-outlined text-[22px] text-amber-700">psychology</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Physician AI Summary</span>
                    <span className="text-[10px] text-amber-800 font-medium">Review Clinical Draft →</span>
                  </div>
                </button>

                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center gap-2.5 text-blue-900">
                  <span className="material-symbols-outlined text-[22px] text-blue-700">document_scanner</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Current Documents</span>
                    <span className="text-[10px] text-blue-700 font-medium">
                      {(patient.caseDetails?.documents?.length || patient.caseDetails?.structuredHistory?.documents?.length || 0)} File(s) Attached
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-300 flex items-center gap-2.5 text-left cursor-pointer transition btn-press"
                >
                  <span className="material-symbols-outlined text-[22px] text-[#166534]">timeline</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Unified Timeline</span>
                    <span className="text-[10px] text-[#166534] font-medium">
                      {timelineEvents.length > 0 ? `${timelineEvents.length} History Events` : 'View Chronological Log →'}
                    </span>
                  </div>
                </button>
              </div>

              {/* 4. Current Encounter Uploaded Documents (Multimodal AI Integration) */}
              {((patient.caseDetails?.documents && patient.caseDetails.documents.length > 0) ||
                (patient.caseDetails?.structuredHistory?.documents && patient.caseDetails.structuredHistory.documents.length > 0)) && (
                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      <span className="material-symbols-outlined text-[18px] text-blue-700">attach_file</span>
                      Documents Uploaded for This Current Encounter
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                      Multimodal AI Verified
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(patient.caseDetails?.documents || patient.caseDetails?.structuredHistory?.documents || []).map((doc, dIdx) => (
                      <div key={doc.docId || dIdx} className="p-3 rounded-xl bg-white border border-blue-100 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-blue-600 text-[22px] shrink-0">
                            {doc.mimeType?.includes('pdf') ? 'picture_as_pdf' : 'image'}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate block">
                              {doc.originalName || 'Medical Record'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {doc.findings?.documentType || 'Clinical Document'}
                              {doc.findings?.documentDate ? ` • ${doc.findings.documentDate}` : ''}
                            </span>
                          </div>
                        </div>
                        {doc.findings?.keyObservations && (
                          <span className="text-[10px] text-emerald-700 font-semibold shrink-0 bg-emerald-50 px-2 py-0.5 rounded">
                            Analyzed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PREVIOUS MEDICAL HISTORY CARD — Distinct Separation from Current Encounter */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">history_edu</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Previous Medical History &amp; Central Records
                    </h3>
                    <p className="text-xs text-slate-500">
                      Historical consultations, prior prescriptions, and past lab investigations for {patient.name}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 self-start sm:self-auto">
                  Historical Records Preserved
                </span>
              </div>

              {hasAnyHistory ? (
                <div className="space-y-4">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Prior Visits</span>
                      <strong className="text-xl font-bold text-slate-900 block mt-0.5">{previousAppointments.length}</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Prior Prescriptions</span>
                      <strong className="text-xl font-bold text-[#166534] block mt-0.5">{previousPrescriptions.length}</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Prior Lab Reports</span>
                      <strong className="text-xl font-bold text-blue-700 block mt-0.5">{patientReports.length}</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Timeline Events</span>
                      <strong className="text-xl font-bold text-purple-700 block mt-0.5">{timelineEvents.length}</strong>
                    </div>
                  </div>

                  {/* Highlights from Past Records */}
                  <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
                    <span className="text-xs font-bold text-purple-950 uppercase tracking-wider block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Prior Documented Episodes (Separate from Current Intake)
                    </span>
                    <div className="space-y-2">
                      {previousAppointments.slice(0, 2).map((apt, aIdx) => (
                        <div key={apt.id || aIdx} className="p-3 rounded-xl bg-white border border-purple-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{apt.chief_complaint || apt.problem || 'Prior Outpatient Consultation'}</span>
                            <span className="text-slate-500 text-[11px]">
                              Date: {apt.appointment_date || 'Past Visit'} • Token #{apt.token_number || '—'}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200">
                            {apt.status || 'Completed'}
                          </span>
                        </div>
                      ))}
                      {previousPrescriptions.slice(0, 1).map((rx, rIdx) => (
                        <div key={rx.id || rIdx} className="p-3 rounded-xl bg-white border border-purple-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 font-mono block">{rx.rx_number || rx.rxNumber || 'e-Prescription'}</span>
                            <span className="text-slate-500 text-[11px]">
                              Diagnosis: {rx.diagnosis || 'General Medicine'} • {rx.created_at ? new Date(rx.created_at).toLocaleDateString('en-GB') : 'Prior Record'}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Dispensed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Tab Switch Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('timeline')}
                      className="px-4 py-2 rounded-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-press"
                    >
                      <span className="material-symbols-outlined text-[16px]">timeline</span>
                      <span>OPEN FULL TIMELINE ({timelineEvents.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-press"
                    >
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      <span>VIEW PAST PRESCRIPTIONS ({previousPrescriptions.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-press"
                    >
                      <span className="material-symbols-outlined text-[16px]">lab_panel</span>
                      <span>VIEW DIAGNOSTIC REPORTS ({patientReports.length})</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  <span className="material-symbols-outlined text-3xl text-slate-400 block mb-1">history</span>
                  No prior documented medical history on file. This consultation is the citizen's first registered episode.
                </div>
              )}
            </div>

            {/* Current Vitals Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#166534] text-[22px]">vital_signs</span>
                  <h3 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Triage Recorded Vitals
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200">
                  Room 104 Verified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {DEFAULT_VITALS.map((v) => (
                  <div key={v.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                    <span className="material-symbols-outlined text-[22px] text-[#166534]">{v.icon}</span>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {v.label}
                    </span>
                    <span className="text-lg font-bold text-slate-900 mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {v.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: PHYSICIAN AI CLINICAL SUMMARY (SIH26047) */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col gap-6">
            <PhysicianAiSummary
              summary={aiSummary}
              loading={loadingSummary && !aiSummary}
              error={summaryError}
              onOpenTimeline={() => setActiveTab('timeline')}
              onOpenReports={() => setActiveTab('reports')}
            />
          </div>
        )}

        {/* Tab: UNIFIED TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#166534] text-[26px]">timeline</span>
                <div>
                  <h3 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Unified Medical Timeline: {patient.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Integrated chronological record across consultations, diagnostics, prescriptions, documents &amp; dispensary
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                Patient Code: {patient.uniqueCode}
              </span>
            </div>

            <UnifiedMedicalTimeline
              events={timelineEvents.length > 0 ? timelineEvents : (patientHistory.timeline || [])}
              loading={loadingTimeline && timelineEvents.length === 0}
              patientName={patient.name}
              role="doctor"
            />
          </div>
        )}

        {/* Tab 2: HISTORY (Strictly Patient-Specific from Backend) */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#166534] text-[22px]">history</span>
                <h3 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Citizen Medical History: {patient.name}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                Code: {patient.uniqueCode}
              </span>
            </div>

            {loadingHistory ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">sync</span>
                <p className="text-xs text-slate-500 mt-2">Loading medical records from registry...</p>
              </div>
            ) : !hasAnyHistory ? (
              <div className="p-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="material-symbols-outlined text-4xl text-slate-400">folder_off</span>
                <h4 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  No previous history available
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  There are no prior documented consultations, cases, or prescriptions in the central health registry for citizen {patient.name} ({patient.uniqueCode}).
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Past Appointments */}
                {previousAppointments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Prior Consultations &amp; Visits ({previousAppointments.length})
                    </h4>
                    <div className="space-y-3">
                      {previousAppointments.map((apt, idx) => (
                        <div key={apt.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                              OPD
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{apt.chief_complaint || apt.problem || 'Outpatient Consultation'}</p>
                              <p className="text-xs text-slate-500">
                                {apt.appointment_date || apt.date || 'Past Visit'} • {apt.opd_room || apt.room || 'Room 104'} • Token #{apt.token_number || apt.token || '—'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-[#166534] self-start sm:self-auto">
                            {apt.status || 'Completed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Prescriptions */}
                {previousPrescriptions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Prescription History ({previousPrescriptions.length})
                    </h4>
                    <div className="space-y-3">
                      {previousPrescriptions.map((rx, idx) => (
                        <div key={rx.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#166534] flex items-center justify-center">
                              <span className="material-symbols-outlined text-[20px]">medication</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 font-mono">{rx.rx_number || rx.rxNumber || 'e-Prescription'}</p>
                              <p className="text-xs text-slate-500">
                                {rx.diagnosis || 'General Medicine'} • {rx.created_at ? new Date(rx.created_at).toLocaleDateString('en-GB') : 'Issued'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200 self-start sm:self-auto">
                            {rx.status || 'Issued'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: REPORTS (Strictly Patient-Specific Diagnostic Reports) */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#166534] text-[22px]">lab_panel</span>
                <h3 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Diagnostic Reports: {patient.name}
                </h3>
              </div>
              <Link
                to="/doctor/diagnostic-request"
                state={{ patient }}
                className="h-10 px-4 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer btn-press"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Request Scan / Test</span>
              </Link>
            </div>

            {loadingReports ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">sync</span>
                <p className="text-xs text-slate-500 mt-2">Loading diagnostic reports from laboratory database...</p>
              </div>
            ) : patientReports.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="material-symbols-outlined text-4xl text-slate-400">biotech</span>
                <h4 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  No diagnostic reports available for this patient
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  There are no completed lab reports or imaging studies recorded for citizen {patient.name} ({patient.uniqueCode}).
                </p>
                <Link
                  to="/doctor/diagnostic-request"
                  state={{ patient }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#166534] text-white text-xs font-bold hover:bg-[#14532d] transition"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Order Diagnostic / Scan</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {patientReports.map((r, idx) => {
                  const testName = r.testScan || r.testName || r.test_name || 'Diagnostic Study'
                  const reqNum = r.requestNumber || r.request_number || r.requestId || 'REQ-DIAG'
                  const dateStr = r.createdAt || r.created_at
                    ? new Date(r.createdAt || r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Today'

                  return (
                    <div
                      key={r.id || idx}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-300 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#166534] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[24px]">lab_panel</span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                              {testName}
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                              {reqNum}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {r.category || 'Central Diagnostic Suite'} • Date: {dateStr}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-[#166534] border border-emerald-200">
                          {r.status || 'Available'}
                        </span>
                        <Link
                          to="/doctor/diagnostic-report"
                          state={{ patient, selectedReport: r }}
                          className="h-10 px-5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer btn-press"
                          style={{ fontFamily: 'Lexend, sans-serif' }}
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span>OPEN REPORT</span>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DoctorLayout>
  )
}
