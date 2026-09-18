import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import { getPatientProfile } from '../../data/patientMockData'
import { DiagnosticApi } from '../../services/diagnosticApi'

const INITIAL_REPORTS = [
  { id: 'mock-1', name: 'Complete Blood Count (CBC)', date: '09 Jun 2025', lab: 'District Central Lab', status: 'Available', requestNumber: 'REQ-DIAG-2025-7890', results: [
    { param: 'Haemoglobin', value: '13.2 g/dL', range: '13.0–17.0', flag: '' },
    { param: 'WBC Count', value: '14,200 /µL', range: '4,000–11,000', flag: 'HIGH' },
    { param: 'Platelet Count', value: '2,10,000 /µL', range: '1,50,000–4,00,000', flag: '' },
    { param: 'Neutrophils', value: '78%', range: '40–70%', flag: 'HIGH' },
    { param: 'Lymphocytes', value: '18%', range: '20–40%', flag: 'LOW' },
  ]},
  { id: 'mock-2', name: 'MRI Brain (Plain + Contrast)', date: '10 Jun 2025', lab: 'Radiology / MRI Diagnostic Suite', status: 'Available', requestNumber: 'REQ-DIAG-2025-7890', results: [
    { param: 'Brain Parenchyma', value: 'Normal signal intensity throughout cerebral hemispheres', range: 'Normal', flag: '' },
    { param: 'Ventricular System', value: 'Symmetrical, normal caliber', range: 'Normal', flag: '' },
    { param: 'Vascular Architecture', value: 'No acute hemorrhage or focal lesion', range: 'Normal', flag: '' },
  ]}
]

export default function DiagnosticReportPage() {
  const location = useLocation()
  let opdPatient = location.state?.patient || null
  if (!opdPatient) {
    try {
      const stored = sessionStorage.getItem('aarogya_doctor_active_patient')
      if (stored) opdPatient = JSON.parse(stored)
    } catch {}
  }

  const incomingReport = location.state?.selectedReport || null
  const [selectedReport, setSelectedReport] = useState(
    incomingReport
      ? {
          id: incomingReport.id || incomingReport.reportId || incomingReport.requestId || '1',
          name: incomingReport.testScan || incomingReport.testName || incomingReport.name || 'Diagnostic Investigation',
          date: incomingReport.createdAt || incomingReport.created_at ? new Date(incomingReport.createdAt || incomingReport.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (incomingReport.date || 'Today'),
          lab: incomingReport.category ? `${incomingReport.category} Suite` : (incomingReport.lab || 'Central Diagnostic Lab'),
          status: incomingReport.status || 'Available',
          requestNumber: incomingReport.requestNumber || incomingReport.request_number || incomingReport.requestId || 'REQ-DIAG',
          results: incomingReport.results || (incomingReport.findings ? [{ param: 'Clinical Impression', value: incomingReport.findings, range: 'Normal', flag: '' }] : [
            { param: 'Study Status', value: 'Verified study complete without contraindications.', range: 'Normal', flag: '' }
          ])
        }
      : null
  )
  const [reviewed, setReviewed] = useState({})
  const [reportsList, setReportsList] = useState([])

  const patientName = opdPatient?.name || 'Patient'
  const patientId = opdPatient?.id || opdPatient?.patientId || null
  const patientUniqueCode = opdPatient?.uniqueCode || opdPatient?.patientUniqueCode || '—'
  const doctorName = 'Dr. Ramanathan Venkatraman'
  const doctorId = 'DOC-1042'
  const roomNumber = 'Room 104'

  useEffect(() => {
    async function loadReports() {
      try {
        if (!patientUniqueCode && !patientId) return
        const res = await DiagnosticApi.getPatientReports(patientUniqueCode || patientId)
        if (res.ok && res.data?.reports && res.data.reports.length > 0) {
          const backendItems = res.data.reports.map(rep => ({
            id: rep.id || rep.reportId || rep.report_id,
            name: rep.testScan || rep.testName || rep.test_name || 'Diagnostic Investigation',
            date: rep.created_at ? new Date(rep.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            lab: rep.category ? `${rep.category} Suite` : 'Central Diagnostic Lab',
            status: rep.status || 'Available',
            requestNumber: rep.requestNumber || rep.request_number || rep.requestId,
            results: rep.reportData && typeof rep.reportData === 'object' && !Array.isArray(rep.reportData)
              ? Object.entries(rep.reportData).map(([param, value]) => ({ param, value: String(value), range: 'Normal', flag: '' }))
              : (rep.findings ? [{ param: 'Clinical Impression', value: rep.findings, range: 'Normal', flag: '' }] : [])
          }))
          setReportsList(backendItems)
        }
      } catch (err) {
        console.error('Failed to load patient diagnostic reports:', err)
      }
    }
    loadReports()
  }, [patientUniqueCode, patientId])

  const handleReview = (id) => {
    setReviewed(prev => ({ ...prev, [id]: true }))
  }

  const patientAgeStr = opdPatient?.age
    ? `${typeof opdPatient.age === 'number' ? `${opdPatient.age} Yrs` : opdPatient.age}${opdPatient?.gender ? ` / ${opdPatient.gender}` : ''}`
    : (opdPatient?.gender || '—')

  return (
    <DoctorLayout 
      activeNav="Patient Cases" 
      showPatientContext={Boolean(opdPatient)} 
      patientName={patientName}
      patientAge={patientAgeStr}
      patientToken={opdPatient?.token || opdPatient?.tokenNumber ? `#${opdPatient.token || opdPatient.tokenNumber}` : '—'}
      patientUniqueCode={patientUniqueCode}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 bg-white shadow-sm">
        <nav className="flex items-center gap-2 text-xs text-[#58423a] font-semibold flex-wrap" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <Link to="/doctor/dashboard" className="hover:text-[#7c2800] flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">home</span>Doctor Portal</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <Link to="/doctor/patient-case" className="hover:text-[#7c2800]">Patient Case</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <span className="text-[#7c2800] font-bold">Diagnostic / Scan Report</span>
        </nav>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {selectedReport ? (
          /* Report Details View */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 pt-8 pb-4 bg-[#f2f4f6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Report Record</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
                    Patient: {patientUniqueCode}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-200">
                    Req: {selectedReport.requestNumber}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>{selectedReport.name}</h2>
                <p className="text-sm text-[#58423a] mt-0.5">{selectedReport.lab} • {selectedReport.date} • Attending: {doctorName} ({doctorId})</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 bg-white rounded-full text-[15px] font-semibold text-[#191c1e] flex items-center gap-2 self-start sm:self-auto shadow-xs" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>All Reports
              </button>
            </div>
            <div className="p-8">
              {selectedReport.results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#f2f4f6] text-xs text-[#58423a] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <th className="py-3 px-4">Parameter</th>
                        <th className="py-3 px-4">Value</th>
                        <th className="py-3 px-4">Reference Range</th>
                        <th className="py-3 px-4">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.results.map((r, i) => (
                        <tr key={i} className={`border-b border-[#eceef0] ${r.flag ? 'bg-[#ffdad6]/30' : ''}`}>
                          <td className="py-3 px-4 text-[15px] font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>{r.param}</td>
                          <td className={`py-3 px-4 text-base font-semibold ${r.flag ? 'text-[#ba1a1a]' : 'text-[#191c1e]'}`}>{r.value}</td>
                          <td className="py-3 px-4 text-sm text-[#58423a]">{r.range}</td>
                          <td className="py-3 px-4">{r.flag && <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.flag === 'HIGH' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#d6e3ff] text-[#2c4771]'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>{r.flag}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-[#8f7066] text-4xl">radiology</span>
                  <p className="text-base text-[#58423a] mt-4">Imaging report pending radiologist interpretation. Results will appear here once available.</p>
                </div>
              )}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#eceef0]">
                <span className="text-xs text-[#8f7066]" style={{ fontFamily: 'Lexend, sans-serif' }}>Report ID: RPT-{selectedReport.id}-2025-{String(selectedReport.id).padStart(4, '0')}</span>
                <div className="flex items-center gap-3">
                  <Link to="/doctor/patient-case" state={{ patient: opdPatient }} className="h-12 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    <span className="material-symbols-outlined text-[18px]">person</span>Back to Workspace
                  </Link>
                  {!reviewed[selectedReport.id] ? (
                    <button onClick={() => handleReview(selectedReport.id)} className="h-12 px-8 bg-[#455f8a] text-white rounded-full text-[15px] font-semibold shadow-md flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      <span className="material-symbols-outlined">check</span>MARK AS REVIEWED
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-2 text-[#00501a] text-sm font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span className="material-symbols-outlined">check_circle</span>Reviewed &amp; Signed
                      </span>
                      <Link to="/doctor/prescription" state={{ patient: opdPatient }} className="h-12 px-6 bg-[#00501a] text-white rounded-full text-[15px] font-semibold flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span className="material-symbols-outlined">medication</span>Prescribe
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Report List */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 pt-8 pb-4 bg-[#f2f4f6] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Diagnostic / Scan Reports</h2>
                <p className="text-sm text-[#58423a] mt-1">Review and sign-off diagnostic results for {patientName}{opdPatient?.token || opdPatient?.tokenNumber ? ` (Token #${opdPatient.token || opdPatient.tokenNumber})` : ''}</p>
              </div>
              <Link to="/doctor/diagnostic-request" className="px-4 py-2 bg-[#455f8a] text-white rounded-full text-xs font-semibold flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined text-[16px]">add</span>New Request
              </Link>
            </div>
            <div className="p-8 flex flex-col gap-4">
              {reportsList.map(r => {
                const isReviewed = reviewed[r.id] || r.status === 'Reviewed'
                return (
                  <div key={r.id} className="p-4 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-[#455f8a] text-[24px]">{r.name.includes('X-Ray') ? 'radiology' : 'lab_panel'}</span>
                      <div>
                        <p className="text-[15px] font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>{r.name}</p>
                        <p className="text-sm text-[#58423a]">{r.lab} • {r.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isReviewed ? 'bg-[#9bf79f] text-[#00531b]' : r.status === 'Available' ? 'bg-[#d6e3ff] text-[#2c4771]' : 'bg-[#ffdbcf] text-[#380d00]'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>{isReviewed ? 'Reviewed' : r.status}</span>
                      <button onClick={() => setSelectedReport(r)} className="h-10 px-4 rounded-full bg-[#e6e8ea] text-[#455f8a] text-xs font-semibold hover:bg-[#e1e2e5] transition-colors" style={{ fontFamily: 'Lexend, sans-serif' }}>VIEW DETAILS</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  )
}
