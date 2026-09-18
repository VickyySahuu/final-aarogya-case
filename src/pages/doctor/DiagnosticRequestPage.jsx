import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import PatientQrCode from '../../components/common/PatientQrCode'
import { getPatientProfile } from '../../data/patientMockData'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'
import { DiagnosticApi } from '../../services/diagnosticApi'
import { saveDiagnosticRequest } from '../../data/patientMockData'

const AVAILABLE_TESTS = [
  { name: 'Complete Blood Count (CBC)', dept: 'Haematology', turnaround: '2 hours' },
  { name: 'MRI Brain (Plain + Contrast)', dept: 'Radiology / MRI', turnaround: '2 hours' },
  { name: 'MRI Lumbar Spine', dept: 'Radiology / MRI', turnaround: '2 hours' },
  { name: 'Throat Swab Culture & Sensitivity', dept: 'Microbiology', turnaround: '24–48 hours' },
  { name: 'C-Reactive Protein (CRP)', dept: 'Biochemistry', turnaround: '3 hours' },
  { name: 'ESR (Erythrocyte Sedimentation Rate)', dept: 'Haematology', turnaround: '2 hours' },
  { name: 'Chest X-Ray PA View', dept: 'Radiology', turnaround: '1 hour' },
  { name: 'Rapid Strep Test (RADT)', dept: 'Microbiology', turnaround: '30 mins' },
  { name: 'Liver Function Test (LFT)', dept: 'Biochemistry', turnaround: '4 hours' },
  { name: 'Blood Glucose (Fasting)', dept: 'Biochemistry', turnaround: '1 hour' },
]

export default function DiagnosticRequestPage() {
  const location = useLocation()
  let opdPatient = location.state?.patient || null
  if (!opdPatient) {
    try {
      const stored = sessionStorage.getItem('aarogya_doctor_active_patient')
      if (stored) opdPatient = JSON.parse(stored)
    } catch {}
  }

  const [step, setStep] = useState('select') // 'select' | 'details' | 'sent'
  const [selected, setSelected] = useState([])
  const [priority, setPriority] = useState('Routine')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [search, setSearch] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [createdRequest, setCreatedRequest] = useState(null)

  const fallbackRequestId = 'REQ-DIAG-2026-7890'
  const patientName = opdPatient?.name || 'Patient'
  const patientId = opdPatient?.patientId || opdPatient?.id || null
  const patientUniqueCode = opdPatient?.uniqueCode || opdPatient?.patientUniqueCode || '—'
  const doctorName = 'Dr. Ramanathan Venkatraman'
  const doctorId = 'DOC-1042'
  const hospitalName = 'District Civil Hospital'
  const roomNumber = 'Room 104'

  const requestId = createdRequest?.requestNumber || createdRequest?.request_number || createdRequest?.requestId || fallbackRequestId
  const requestDate = createdRequest?.created_at 
    ? new Date(createdRequest.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const toggleTest = (name) => {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  const handleSubmitRequest = async () => {
    if (selected.length === 0) {
      alert('Please select at least one diagnostic test or scan to create a request.')
      return
    }
    if (!clinicalNotes.trim()) {
      alert('Please enter clinical notes / instructions for the diagnostic laboratory.')
      return
    }
    if (isProcessing) return
    setIsProcessing(true)

    try {
      const payload = {
        patientId: opdPatient?.patientId || opdPatient?.id || 1,
        patientUniqueCode,
        appointmentId: opdPatient?.appointmentId || opdPatient?.id || null,
        caseId: opdPatient?.caseId || null,
        doctorId: 1,
        testScan: selected.join(', '),
        selectedTests: selected,
        category: 'Radiology & Imaging',
        clinicalNotes,
        requestNotes: clinicalNotes,
        priority
      }

      const res = await DiagnosticApi.createRequest(payload)
      if (res.ok && res.data?.request) {
        setCreatedRequest(res.data.request)
        // Keep local cache in sync
        saveDiagnosticRequest(res.data.request)
      } else {
        // Fallback for offline or local preview
        const localReq = {
          requestId: `REQ-DIAG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          requestNumber: `${selected[0]?.includes('MRI') ? 'MRI' : 'REQ'}-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          patientId: opdPatient?.id || 1,
          patientName,
          patientUniqueCode,
          doctorName,
          doctorId,
          testScan: selected.join(', '),
          testName: selected.join(', '),
          clinicalNotes,
          priority,
          status: 'Pending',
          created_at: new Date().toISOString()
        }
        setCreatedRequest(localReq)
        saveDiagnosticRequest(localReq)
      }
      setStep('sent')
    } catch (err) {
      console.warn('[DiagnosticRequestPage] API call failed, falling back:', err.message)
      setStep('sent')
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredTests = AVAILABLE_TESTS.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.dept.toLowerCase().includes(search.toLowerCase()))

  return (
    <DoctorLayout 
      activeNav="Patient Cases" 
      showPatientContext={Boolean(opdPatient)}
      patientName={patientName}
      patientId={patientId}
      patientAge={opdPatient?.age ? (typeof opdPatient.age === 'number' ? `${opdPatient.age}y` : opdPatient.age) : '—'}
      patientGender={opdPatient?.gender || '—'}
      patientToken={opdPatient?.token || opdPatient?.tokenNumber ? `#${opdPatient.token || opdPatient.tokenNumber}` : '—'}
      patientUniqueCode={patientUniqueCode}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 bg-white shadow-sm no-print">
        <nav className="flex items-center gap-2 text-xs text-[#58423a] font-semibold flex-wrap" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <Link to="/doctor/dashboard" className="hover:text-[#7c2800] flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">home</span>Doctor Portal</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <Link to="/doctor/patient-case" className="hover:text-[#7c2800]">Patient Case</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <span className="text-[#7c2800] font-bold">Diagnostic / Scan Request</span>
        </nav>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {step === 'sent' ? (
          <div className="flex flex-col gap-6">
            {/* Screen UI Confirmation */}
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm text-center no-print">
              <div className="w-20 h-20 rounded-full bg-[#9bf79f] flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[#00501a] text-4xl">send</span>
              </div>
              <h2 className="text-2xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>Request Sent Successfully</h2>
              <p className="text-base text-[#58423a] mb-6">Diagnostic request for {selected.length} test(s) has been submitted to the diagnostic lab.</p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-14 px-8 bg-[#166534] hover:bg-[#14532d] text-white rounded-full text-[15px] font-bold flex items-center gap-2 shadow-md cursor-pointer btn-press"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined">print</span>
                  <span>PRINT REQUEST SLIP</span>
                </button>
                <Link to="/doctor/pending-work" className="h-14 px-8 bg-amber-700 hover:bg-amber-800 text-white rounded-full text-[15px] font-semibold flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="material-symbols-outlined">pending_actions</span>View Pending Work
                </Link>
                <Link to="/doctor/patient-case" state={{ patient: opdPatient }} className="h-14 px-8 bg-[#166534] hover:bg-[#14532d] text-white rounded-full text-[15px] font-semibold flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="material-symbols-outlined">arrow_back</span>Back to Patient Workspace
                </Link>
              </div>
            </div>

            {/* Printable Diagnostic Slip (Clean A4 Document) */}
            <div className="printable-document bg-white border border-slate-300 rounded-2xl p-8 sm:p-10 shadow-sm text-left">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-[#166534] pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <img src={officialEmblem} alt="AAROGYA CASE Emblem" className="h-12 w-auto object-contain shrink-0" />
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      AAROGYA CASE
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Diagnostic &amp; Investigation Request Slip
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Request Number</span>
                  <span className="text-base font-mono font-bold text-[#166534]">{requestId}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Date: {requestDate}</span>
                </div>
              </div>

              {/* Patient and Doctor Demographics */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs sm:text-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient Details</span>
                  <p className="font-bold text-slate-900 text-base">{patientName}</p>
                  <p className="text-slate-600 font-mono">Patient ID: <strong>{patientId}</strong></p>
                  <p className="text-slate-700 font-mono text-xs">Unique Code: <strong className="text-[#166534]">{patientUniqueCode}</strong></p>
                  <p className="text-slate-500">Gender / Age: Male, 48 Yrs</p>
                </div>
                <div className="space-y-1 text-right sm:text-left">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Prescribing Medical Officer</span>
                  <p className="font-bold text-slate-900 text-base">{doctorName}</p>
                  <p className="text-slate-600 font-mono">Doctor ID: <strong>{doctorId}</strong></p>
                  <p className="text-slate-600 font-medium">{hospitalName}</p>
                  <p className="text-slate-600 font-semibold">{roomNumber}</p>
                </div>
              </div>

              {/* Requested Tests Table */}
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Requested Test(s) & Investigations
                </span>
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Test / Scan Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Estimated TAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {selected.map((name, i) => {
                      const testInfo = AVAILABLE_TESTS.find(t => t.name === name) || { dept: 'Diagnostics', turnaround: '2-4 hours' }
                      return (
                        <tr key={i}>
                          <td className="p-3 font-mono font-bold text-slate-400">0{i + 1}</td>
                          <td className="p-3 font-semibold text-slate-900">{name}</td>
                          <td className="p-3 text-slate-600">{testInfo.dept}</td>
                          <td className="p-3 font-bold text-[#166534]">{priority}</td>
                          <td className="p-3 text-slate-600">{testInfo.turnaround}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Clinical Notes & Instructions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Doctor Notes & Instructions</span>
                <p className="text-slate-800 leading-relaxed font-medium">{clinicalNotes}</p>
              </div>

              {/* Status, QR Code, and Signature Block */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
                  <span className="inline-block px-3 py-1 rounded bg-emerald-100 text-[#166534] font-bold text-xs mt-1">
                    Authorized & Submitted
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2">Sample collection at Central Diagnostic Laboratory</p>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-300 rounded-lg shrink-0">
                  <PatientQrCode code={patientUniqueCode} size={68} showLabel={false} />
                  <span className="text-[8px] font-mono text-[#166534] mt-1 font-bold">{patientUniqueCode}</span>
                </div>

                <div className="text-right">
                  <div className="w-44 border-b border-slate-400 mb-2 ml-auto"></div>
                  <p className="font-bold text-slate-900">{doctorName}</p>
                  <p className="text-slate-500">{doctorId} • {roomNumber}</p>
                  <p className="text-[10px] text-slate-400 italic mt-1">Authorized Medical Signature</p>
                </div>
              </div>

              {/* Authenticity Footer Note */}
              <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400">
                AAROGYA CASE Prototype Demonstration • Verified Clinical Diagnostic Request Slip • Single-Page Medical Record
              </div>
            </div>
          </div>
        ) : step === 'details' ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 pt-8 pb-4 bg-[#f2f4f6]">
              <h2 className="text-xl font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Request Details — Review & Submit</h2>
              <p className="text-sm text-[#58423a] mt-1">{selected.length} test(s) selected for {patientName} (Token #{opdPatient?.token || opdPatient?.tokenNumber || '1'})</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-lg font-semibold text-[#191c1e] block mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>Selected Tests</label>
                <div className="flex flex-wrap gap-2">
                  {selected.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-[#d6e3ff] text-[#2c4771] rounded-full text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {s}<button onClick={() => toggleTest(s)} className="text-[#2c4771] hover:text-[#ba1a1a]">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-lg font-semibold text-[#191c1e] block mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>Priority</label>
                <div className="flex gap-3">
                  {['Routine', 'Urgent', 'STAT'].map(p => (
                    <button key={p} onClick={() => setPriority(p)} className={`px-6 py-2.5 rounded-full text-xs font-semibold transition-all ${priority === p ? 'bg-[#00501a] text-white' : 'bg-[#eceef0] text-[#58423a]'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-lg font-semibold text-[#191c1e] block mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>Clinical Notes / Justification</label>
                <textarea className="w-full min-h-[100px] p-4 bg-[#f2f4f6] rounded-xl text-base focus:outline-none focus:bg-white focus:shadow-md transition-all resize-y" value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#eceef0]">
                <button onClick={() => setStep('select')} className="h-12 px-6 bg-[#eceef0] text-[#191c1e] rounded-full text-[15px] font-semibold btn-press" style={{ fontFamily: 'Lexend, sans-serif' }}>Back</button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleSubmitRequest}
                  className={`h-12 px-8 text-white rounded-full text-[15px] font-semibold shadow-md flex items-center gap-2 cursor-pointer btn-press ${
                    isProcessing ? 'bg-[#00501a]/70 cursor-wait' : 'bg-[#00501a] hover:bg-[#003812]'
                  }`}
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  {isProcessing ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>PROCESSING REQUEST...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      <span>SEND REQUEST</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 pt-8 pb-4 bg-[#f2f4f6] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Select Test / Scan</h2>
                <p className="text-sm text-[#58423a] mt-1">Choose from the hospital diagnostic catalog</p>
              </div>
              <span className="text-xs bg-white px-3 py-1 rounded-full font-semibold text-[#58423a]" style={{ fontFamily: 'Lexend, sans-serif' }}>{selected.length} selected</span>
            </div>
            <div className="p-8 space-y-4">
              <div className="relative w-full max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8f7066]">search</span>
                <input className="w-full h-11 pl-11 pr-4 bg-[#f2f4f6] rounded-full text-sm focus:outline-none focus:bg-white shadow-inner" placeholder="Search tests..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex flex-col gap-3">
                {filteredTests.map(t => (
                  <button key={t.name} onClick={() => toggleTest(t.name)} className={`p-4 rounded-xl text-left flex items-center justify-between transition-colors ${selected.includes(t.name) ? 'bg-[#d6e3ff] ring-2 ring-[#455f8a]' : 'bg-[#f2f4f6] hover:bg-[#eceef0]'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${selected.includes(t.name) ? 'bg-[#455f8a] text-white' : 'bg-white border border-[#8f7066]'}`}>
                        {selected.includes(t.name) && <span className="material-symbols-outlined text-[16px]">check</span>}
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>{t.name}</p>
                        <p className="text-sm text-[#58423a]">{t.dept} • TAT: {t.turnaround}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#eceef0]">
                <Link to="/doctor/patient-case" className="h-12 px-6 bg-[#eceef0] text-[#191c1e] rounded-full text-[15px] font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Cancel</Link>
                <button onClick={() => selected.length > 0 && setStep('details')} disabled={selected.length === 0} className={`h-12 px-8 rounded-full text-[15px] font-semibold shadow-md flex items-center gap-2 ${selected.length > 0 ? 'bg-[#455f8a] text-white' : 'bg-[#eceef0] text-[#8f7066] cursor-not-allowed'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span>CONTINUE</span><span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  )
}
