import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import { DOCTOR_DATA } from '../../data/patientMockData'
import { DoctorApi } from '../../services/doctorApi'
import { DiagnosticApi } from '../../services/diagnosticApi'

export default function DoctorDashboardPage() {
  const navigate = useNavigate()
  const [queue, setQueue] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      try {
        setLoading(true)
        const [queueRes, diagRes] = await Promise.allSettled([
          DoctorApi.getOpdQueue(),
          DiagnosticApi.getRequests()
        ])

        if (isMounted) {
          if (queueRes.status === 'fulfilled' && Array.isArray(queueRes.value)) {
            setQueue(queueRes.value)
          }
          if (diagRes.status === 'fulfilled' && diagRes.value?.ok && Array.isArray(diagRes.value.data?.requests)) {
            setRequests(diagRes.value.data.requests)
          }
        }
      } catch (err) {
        console.warn('Dashboard data fetch error:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  // Read active consultation from session if available
  let cachedPatient = null
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('aarogya_doctor_active_patient')
      if (raw) cachedPatient = JSON.parse(raw)
    } catch (e) {}
  }

  const waitingPatients = queue.filter(p => p.status === 'Waiting')
  const inConsultationQueue = queue.find(p => p.status === 'Current')
  const completedPatients = queue.filter(p => p.status === 'Completed')

  // Active patient prioritizes current queue item, then valid uncompleted cached session
  const activePatient = inConsultationQueue || (cachedPatient && cachedPatient.status !== 'Completed' ? cachedPatient : null)
  const nextWaiting = waitingPatients[0] || null

  // Diagnostic counts
  const readyReportsCount = requests.filter(r => (r.status || '').toLowerCase() === 'completed' || (r.status || '').toLowerCase() === 'report ready').length
  const pendingRequestsCount = requests.filter(r => (r.status || '').toLowerCase() === 'pending' || (r.status || '').toLowerCase() === 'in progress').length

  const handleStartConsultation = async (patient) => {
    if (!patient) return
    const id = patient.appointmentId || patient.id
    if (id) {
      await DoctorApi.updateQueueStatus(id, 'Current')
    }
    const targetPatient = {
      ...patient,
      status: 'Current'
    }
    try {
      sessionStorage.setItem('aarogya_doctor_active_patient', JSON.stringify(targetPatient))
    } catch (e) {}

    navigate('/doctor/patient-case', {
      state: {
        patient: targetPatient,
        appointmentId: id
      }
    })
  }

  return (
    <DoctorLayout activeNav="Dashboard">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Work-Control Desk Header */}
        <div className="relative w-full rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 z-10">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-[#166534] text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Clinical Work-Control Center
              </span>
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#166534] border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse"></span>
                <span>OPD Active • Session Live</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Good morning, {DOCTOR_DATA.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-xs sm:text-sm" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>
              <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                <span className="material-symbols-outlined text-[18px] text-[#166534]">medical_services</span>
                {DOCTOR_DATA.specialization}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-slate-500">domain</span>
                {DOCTOR_DATA.hospital}
              </span>
              <span>•</span>
              <span className="font-bold text-[#166534]">{DOCTOR_DATA.room}</span>
              <span>•</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-700">
                ID: {DOCTOR_DATA.doctorId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
            <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#166534] shadow-2xs">
                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>Shift &amp; Date</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>Today • Morning OPD</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Workflow Control Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* 1. TODAY'S OPD */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between gap-6 hover:border-slate-300 transition">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">format_list_numbered</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>Today's OPD</h2>
                    <span className="text-xs text-slate-500 font-medium">Outpatient Queue Status</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {queue.length} Total
                </span>
              </div>

              {/* Triage Count Strip */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700" style={{ fontFamily: 'Lexend, sans-serif' }}>Waiting</span>
                  <span className="text-2xl font-bold text-blue-900 mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>{waitingPatients.length}</span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>Current</span>
                  <span className="text-2xl font-bold text-[#166534] mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>{activePatient ? '1' : '0'}</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600" style={{ fontFamily: 'Lexend, sans-serif' }}>Completed</span>
                  <span className="text-2xl font-bold text-slate-800 mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>{completedPatients.length}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {waitingPatients.length > 0 
                  ? `${waitingPatients.length} citizen(s) currently waiting in Room 104 intake lounge.`
                  : 'All queued consultations for this session are currently attended.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/doctor/opd-queue"
                className="w-full h-12 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs transition cursor-pointer btn-press"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>VIEW OPD QUEUE</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* 2. CURRENT PATIENT */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200 shadow-xs flex flex-col justify-between gap-6 hover:border-emerald-300 transition relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#166534]"></div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#166534] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">person</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>Current Patient</h2>
                    <span className="text-xs text-slate-500 font-medium">Active Consultation Desk</span>
                  </div>
                </div>
                {activePatient && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#166534] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse"></span>
                    Active
                  </span>
                )}
              </div>

              {activePatient ? (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {activePatient.patientName || activePatient.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#166534] text-white text-xs font-bold font-mono">
                      Token {typeof activePatient.token === 'number' ? `#${activePatient.token}` : (activePatient.token || '#14')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                    <span className="font-mono text-[#166534] font-bold">
                      {activePatient.patientUniqueCode || activePatient.uniqueCode || 'AC-000000'}
                    </span>
                    <span>•</span>
                    <span>{activePatient.patientAge || activePatient.age || '—'}</span>
                  </div>

                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] uppercase font-bold text-slate-500 block">Chief Complaint</span>
                    <p className="text-xs text-slate-800 font-medium line-clamp-2 mt-0.5">
                      "{activePatient.chiefComplaint || activePatient.problem || 'Consultation review for reported symptoms.'}"
                    </p>
                  </div>
                </div>
              ) : nextWaiting ? (
                <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-900">Next Waiting: {nextWaiting.name}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-xs font-bold">Token #{nextWaiting.token}</span>
                  </div>
                  <p className="text-xs text-blue-800 line-clamp-1">"{nextWaiting.chiefComplaint}"</p>
                  <span className="text-[11px] text-blue-700">Ready for intake examination</span>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-center flex flex-col items-center justify-center gap-1.5 py-6">
                  <span className="material-symbols-outlined text-3xl text-slate-400">chair</span>
                  <span className="text-xs font-bold text-slate-700">No Patient in Exam Room</span>
                  <span className="text-[11px] text-slate-500">Select an intake appointment from the OPD queue</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {activePatient ? (
                <button
                  type="button"
                  onClick={() => handleStartConsultation(activePatient)}
                  className="w-full h-12 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs transition cursor-pointer btn-press"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span>CONTINUE CONSULTATION</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : nextWaiting ? (
                <button
                  type="button"
                  onClick={() => handleStartConsultation(nextWaiting)}
                  className="w-full h-12 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs transition cursor-pointer btn-press"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span>CALL PATIENT #{nextWaiting.token}</span>
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                </button>
              ) : (
                <Link
                  to="/doctor/opd-queue"
                  className="w-full h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span>SELECT PATIENT FROM QUEUE</span>
                </Link>
              )}
            </div>
          </div>

          {/* 3. PENDING WORK */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between gap-6 hover:border-slate-300 transition">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">pending_actions</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>Pending Work</h2>
                    <span className="text-xs text-slate-500 font-medium">Diagnostics &amp; Investigations</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {readyReportsCount + pendingRequestsCount} Items
                </span>
              </div>

              {/* Status Breakdown Rows */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#166534] text-[20px]">fact_check</span>
                    <span className="text-xs font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Diagnostic Reports Ready
                    </span>
                  </div>
                  <span className="text-lg font-bold text-[#166534] font-mono px-2 py-0.5 bg-white rounded-md border border-emerald-200 shadow-2xs">
                    {readyReportsCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-amber-800 text-[20px]">hourglass_top</span>
                    <span className="text-xs font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Pending Diagnostic Requests
                    </span>
                  </div>
                  <span className="text-lg font-bold text-amber-800 font-mono px-2 py-0.5 bg-white rounded-md border border-amber-200 shadow-2xs">
                    {pendingRequestsCount}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {readyReportsCount > 0 
                  ? `${readyReportsCount} verified report(s) ready for clinical review and decision.`
                  : 'Diagnostic requests in progress will notify here when verified by radiology & lab.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/doctor/pending-work"
                className="w-full h-12 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs transition cursor-pointer btn-press"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>VIEW PENDING WORK</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4. Daily Status & Facility Summary */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">health_and_safety</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Clinic Operation &amp; System Telemetry
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Central Registry, Prescription Gateway, and Diagnostic Suite connections verified operational.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
            <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-[#166534]"></span>
              ABDM Interoperable
            </span>
            <span className="flex items-center gap-1.5 text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              e-Rx Formulary Active
            </span>
          </div>
        </div>
      </div>
    </DoctorLayout>
  )
}
