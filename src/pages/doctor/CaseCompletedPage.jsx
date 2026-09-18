import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import { getPatientProfile } from '../../data/patientMockData'

export default function CaseCompletedPage() {
  const location = useLocation()
  let patient = location.state?.patient || null
  if (!patient) {
    try {
      const stored = sessionStorage.getItem('aarogya_doctor_active_patient')
      if (stored) patient = JSON.parse(stored)
    } catch {}
  }

  const patientName = patient?.patientName || patient?.name || 'Patient'
  const tokenNumber = patient?.token || patient?.tokenNumber || '—'
  const patientId = patient?.patientId || patient?.id || '—'
  const patientUniqueCode = patient?.patientUniqueCode || patient?.uniqueCode || '—'
  const diagnosis = patient?.chiefComplaint || patient?.problem || 'Consultation Completed'

  return (
    <DoctorLayout 
      activeNav="Patient Cases"
      showPatientContext={Boolean(patient)}
      patientName={patientName}
      patientId={patientId}
      patientAge={patient?.age ? (typeof patient.age === 'number' ? `${patient.age}y` : patient.age) : '—'}
      patientGender={patient?.gender || '—'}
      patientToken={tokenNumber ? `#${tokenNumber}` : '—'}
      patientUniqueCode={patientUniqueCode}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 py-12 sm:py-16 flex flex-col items-center max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center w-full">
          <div className="w-24 h-24 rounded-full bg-[#9bf79f] flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[#00501a] text-5xl">task_alt</span>
          </div>
          <h1 className="text-3xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>Case Completed</h1>
          <p className="text-lg text-[#58423a] mb-8" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>
            Consultation for <strong className="text-[#191c1e]">{patientName}</strong> (Token #{tokenNumber}) has been successfully completed and signed off.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-[#f2f4f6] rounded-xl text-left">
              <span className="text-xs text-[#58423a] uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Patient Code</span>
              <p className="text-[15px] font-bold text-[#166534] font-mono mt-1">{patientUniqueCode}</p>
              <span className="text-[11px] text-slate-400 font-mono">ID: {patientId}</span>
            </div>
            <div className="p-4 bg-[#f2f4f6] rounded-xl text-left">
              <span className="text-xs text-[#58423a] uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Diagnosis</span>
              <p className="text-[15px] font-bold text-[#191c1e] mt-1 truncate" title={diagnosis}>{diagnosis}</p>
            </div>
            <div className="p-4 bg-[#f2f4f6] rounded-xl text-left">
              <span className="text-xs text-[#58423a] uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Prescription</span>
              <p className="text-[15px] font-bold text-[#00501a] mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span>Issued</p>
            </div>
            <div className="p-4 bg-[#f2f4f6] rounded-xl text-left">
              <span className="text-xs text-[#58423a] uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Follow-up</span>
              <p className="text-[15px] font-bold text-[#191c1e] mt-1">3–5 days</p>
            </div>
          </div>

          <div className="p-4 bg-[#9bf79f]/20 rounded-xl mb-8 flex items-start gap-3 text-left">
            <span className="material-symbols-outlined text-[#00501a]">cloud_done</span>
            <div>
              <p className="text-[15px] font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>ABDM Health Record Synced</p>
              <p className="text-sm text-[#58423a] mt-1">Clinical notes, prescription, and diagnostic reports have been linked to the patient's record with permanent code {patientUniqueCode}.</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link to="/doctor/opd-queue" className="h-14 px-8 bg-[#00501a] text-white rounded-full text-lg font-semibold shadow-md flex items-center gap-2 btn-press" style={{ fontFamily: 'Lexend, sans-serif' }}>
              <span className="material-symbols-outlined">group</span>Back to OPD Queue
            </Link>
            <Link to="/doctor/dashboard" className="h-14 px-8 bg-[#eceef0] text-[#191c1e] rounded-full text-lg font-semibold flex items-center gap-2 btn-press" style={{ fontFamily: 'Lexend, sans-serif' }}>
              <span className="material-symbols-outlined">dashboard</span>Dashboard
            </Link>
          </div>

          <div className="mt-8 text-xs text-[#8f7066]" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Case closed by Dr. Ramanathan Venkatraman • Doctor ID: DOC-1042 • Room 104
          </div>
        </div>
      </div>
    </DoctorLayout>
  )
}
