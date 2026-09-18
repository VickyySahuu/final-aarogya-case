import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import { DoctorApi } from '../../services/doctorApi'

export default function FinalApprovalPage() {
  const navigate = useNavigate()
  const location = useLocation()
  let patient = location.state?.patient || null
  if (!patient) {
    try {
      const stored = sessionStorage.getItem('aarogya_doctor_active_patient')
      if (stored) patient = JSON.parse(stored)
    } catch {}
  }
  const patientName = patient?.patientName || patient?.name || 'Active OPD Patient'
  const tokenNumber = patient?.token || patient?.tokenNumber || '—'

  const [checks, setChecks] = useState({ vitals: false, notes: false, diagnostics: false, prescription: false, consent: false })
  const [submitting, setSubmitting] = useState(false)
  const allChecked = Object.values(checks).every(Boolean)

  const toggle = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }))

  const handleSelectAll = () => {
    const nextState = !allChecked
    setChecks({
      vitals: nextState,
      notes: nextState,
      diagnostics: nextState,
      prescription: nextState,
      consent: nextState
    })
  }

  const handleApproveAndComplete = async () => {
    if (!allChecked || submitting) return
    setSubmitting(true)
    try {
      const apptId = patient?.appointmentId || patient?.id
      if (apptId) {
        await DoctorApi.updateQueueStatus(apptId, 'Completed')
      }
    } catch (err) {
      console.warn('Failed completing consultation in backend:', err)
    } finally {
      setSubmitting(false)
      navigate('/doctor/case-completed', { state: { patient } })
    }
  }

  const CHECKLIST = [
    { key: 'vitals', icon: 'vital_signs', label: 'Vitals Recorded & Reviewed', desc: 'Blood pressure, heart rate, SpO2, temperature have been documented.' },
    { key: 'notes', icon: 'edit_note', label: 'Clinical Notes Completed', desc: 'Chief complaint, examination findings, and provisional diagnosis documented.' },
    { key: 'diagnostics', icon: 'biotech', label: 'Diagnostic Reports Reviewed', desc: 'All pending lab and imaging reports have been reviewed and signed.' },
    { key: 'prescription', icon: 'medication', label: 'e-Prescription Issued', desc: 'Prescription has been digitally signed and sent to pharmacy.' },
    { key: 'consent', icon: 'handshake', label: 'Patient Counselled & Consent', desc: 'Patient has been informed about diagnosis, treatment plan, and follow-up.' },
  ]

  return (
    <DoctorLayout 
      activeNav="OPD Queue" 
      showPatientContext={Boolean(patient)}
      patientName={patientName}
      patientId={patient?.patientId || patient?.id || '—'}
      patientAge={patient?.age ? (typeof patient.age === 'number' ? `${patient.age}y` : patient.age) : '—'}
      patientGender={patient?.gender || '—'}
      patientToken={tokenNumber ? `#${tokenNumber}` : '—'}
      patientUniqueCode={patient?.patientUniqueCode || patient?.uniqueCode || '—'}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 bg-white shadow-sm">
        <nav className="flex items-center gap-2 text-xs text-[#58423a] font-semibold flex-wrap" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <Link to="/doctor/dashboard" className="hover:text-[#7c2800] flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">home</span>Doctor Portal</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <Link to="/doctor/patient-case" state={{ patient }} className="hover:text-[#7c2800]">Patient Workspace</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <span className="text-[#7c2800] font-bold">Final Approval</span>
        </nav>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-8 pt-8 pb-4 bg-[#f2f4f6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Final Case Approval — Sign-Off Checklist</h2>
              <p className="text-sm text-[#58423a] mt-1">Complete all items below to finalize consultation for {patientName} (Token #{tokenNumber})</p>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs self-start sm:self-auto ${
                allChecked 
                  ? 'bg-[#00501a] text-white ring-2 ring-[#9bf79f]' 
                  : 'bg-white hover:bg-emerald-50 text-[#00501a] border border-[#00501a]/30'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[18px]">
                {allChecked ? 'check_box' : 'select_all'}
              </span>
              <span>{allChecked ? 'Deselect All' : 'Select All'}</span>
            </button>
          </div>
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-[#58423a] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Checklist ({Object.values(checks).filter(Boolean).length}/{CHECKLIST.length} Completed)
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-[#00501a] hover:text-[#003812] flex items-center gap-1 cursor-pointer"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {allChecked ? 'check_box' : 'check_box_outline_blank'}
                </span>
                <span>{allChecked ? 'Deselect All' : 'Select All'}</span>
              </button>
            </div>
            {CHECKLIST.map(item => (
              <button key={item.key} onClick={() => toggle(item.key)} className={`w-full p-4 rounded-xl text-left flex items-start gap-4 transition-colors ${checks[item.key] ? 'bg-[#9bf79f]/20 ring-2 ring-[#00501a]' : 'bg-[#f2f4f6] hover:bg-[#eceef0]'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${checks[item.key] ? 'bg-[#00501a] text-white' : 'bg-white border-2 border-[#8f7066]'}`}>
                  {checks[item.key] && <span className="material-symbols-outlined text-[18px]">check</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]" style={{ color: checks[item.key] ? '#00501a' : '#455f8a' }}>{item.icon}</span>
                    <span className={`text-[15px] font-semibold ${checks[item.key] ? 'text-[#00501a]' : 'text-[#191c1e]'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>{item.label}</span>
                  </div>
                  <p className="text-sm text-[#58423a] mt-1">{item.desc}</p>
                </div>
              </button>
            ))}

            <div className="pt-6 border-t border-[#eceef0]">
              <div className="p-4 bg-[#f2f4f6] rounded-xl mb-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#455f8a]">info</span>
                <p className="text-sm text-[#58423a]">By approving, you confirm that all clinical information is accurate and the outpatient consultation has been completed. This action will close the active consultation session.</p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Link to="/doctor/patient-case" state={{ patient }} className="h-12 px-6 bg-[#eceef0] hover:bg-slate-200 text-[#191c1e] rounded-full text-sm sm:text-[15px] font-semibold btn-press flex items-center justify-center transition-colors text-center" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Back to Patient Workspace
                </Link>
                <button 
                  type="button"
                  onClick={handleApproveAndComplete} 
                  disabled={!allChecked || submitting} 
                  className={`h-12 px-8 rounded-full text-sm sm:text-[15px] font-semibold shadow-md flex items-center justify-center gap-2 btn-press transition-all ${
                    allChecked && !submitting
                      ? 'bg-[#00501a] text-white hover:opacity-95 cursor-pointer active:scale-95' 
                      : 'bg-[#eceef0] text-[#8f7066] cursor-not-allowed'
                  }`} 
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {submitting ? 'hourglass_top' : 'verified'}
                  </span>
                  <span>{submitting ? 'COMPLETING...' : 'APPROVE & COMPLETE CASE'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  )
}
