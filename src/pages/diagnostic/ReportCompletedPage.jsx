import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DiagnosticLayout from '../../components/layout/DiagnosticLayout'
import { getDiagnosticCompletedReports, getDiagnosticRequests } from '../../data/patientMockData'

export default function ReportCompletedPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isTransmitted, setIsTransmitted] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (location.state?.report) {
      setReport(location.state.report)
    } else {
      const completed = getDiagnosticCompletedReports()
      if (completed.length > 0) {
        setReport(completed[0])
      } else {
        const reqs = getDiagnosticRequests()
        const first = reqs[0]
        setReport({
          reportId: 'REP-2025-992014',
          requestId: first?.requestId || 'REQ-2025-992014',
          patientId: first?.patientId || '—',
          patientName: first?.patientName || 'Patient',
          patientUniqueCode: first?.patientUniqueCode || '—',
          doctorName: first?.doctorName || 'Dr. Ramanathan Venkatraman',
          testName: first?.testName || 'Chest X-Ray (PA View)',
          category: first?.category || 'Radiology',
          date: 'Today, 12:15 PM',
          status: 'Completed',
          fileName: 'chest_xray_pa_view_ac884920.pdf',
          fileSize: '4.2 MB',
          findings: 'Normal study. Clear lung fields, normal cardiothoracic index.',
          verifiedBy: 'Technician T. N. Rao (ID: LR-104)'
        })
      }
    }
  }, [location.state])

  const handleTransmit = () => {
    if (isTransmitted) return
    setIsTransmitting(true)
    setTimeout(() => {
      setIsTransmitting(false)
      setIsTransmitted(true)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000)
    }, 1200)
  }

  if (!report) {
    return (
      <DiagnosticLayout activeNav="Completed Reports">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500">Loading completed report details...</p>
        </div>
      </DiagnosticLayout>
    )
  }

  return (
    <DiagnosticLayout activeNav="Completed Reports">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 mb-16">
        {/* Flow Status Top Marker */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 text-xs text-[#5a4138]">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#99f89e] text-[#002106] font-bold">
              6
            </span>
            <span className="uppercase tracking-wider font-semibold">Diagnostic Pipeline</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#006b25] font-bold">Transmission Ready</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#e7e8eb] text-[#5a4138] text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#006b25] animate-pulse"></span>
            <span>Secure NDHM Node #AIIMS-DELHI-02</span>
          </div>
        </div>

        {/* Success Feedback Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col items-start gap-3">
              {/* Green Success Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#99f89e] text-[#002106] font-bold text-sm shadow-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span className="tracking-wide">✓ REPORT UPLOADED</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Report Completed
              </h1>
              <p className="text-base text-[#5a4138] max-w-2xl">
                Diagnostic scan report and clinical observations have been successfully registered into AAROGYA CASE.
              </p>
            </div>

            {/* Quick Status Cardlet */}
            <div className="flex flex-col items-start md:items-end bg-[#f2f4f6] p-5 rounded-xl min-w-[240px] border border-slate-100">
              <span className="text-xs uppercase tracking-wider text-[#5a4138] font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Current Pipeline State
              </span>
              <span className="text-lg font-bold text-[#006b25] mt-1 flex items-center gap-1.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined text-[22px]">verified</span>
                Validated & Signed
              </span>
              <span className="text-xs text-[#5a4138] mt-1 font-mono">SHA-256 Checksum Verified</span>
            </div>
          </div>
        </div>

        {/* Summary Confirmation Card & Clinical Route Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Primary Summary Card */}
          <div className="lg:col-span-8 flex flex-col bg-[#f2f4f6] rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between pb-4 mb-6 bg-white -mx-6 -mt-6 px-6 pt-6 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8 rounded-t-2xl border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#d6e3ff] flex items-center justify-center text-[#001b3d]">
                  <span className="material-symbols-outlined text-[22px]">badge</span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#5a4138] font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Confirmed Diagnostic Entry
                  </span>
                  <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {report.patientName}
                  </h2>
                </div>
              </div>
              <span className="px-4 py-1 rounded-full bg-[#99f89e] text-[#002106] text-xs font-bold">
                {isTransmitted ? 'Transmitted to Doctor' : 'Ready to Transmit'}
              </span>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <span className="text-xs text-[#5a4138] uppercase tracking-wider font-bold">Patient Health ID</span>
                <span className="text-base font-bold text-[#191c1e] mt-1 font-mono">{report.patientId}</span>
                <span className="text-xs text-[#006b25] mt-1 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">check</span> ABHA Linked ({report.patientUniqueCode || 'AC-7F42K9'})
                </span>
              </div>

              <div className="flex flex-col bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <span className="text-xs text-[#5a4138] uppercase tracking-wider font-bold">Request Number</span>
                <span className="text-base font-bold text-[#455f8a] mt-1 font-mono">{report.requestNumber || report.request_number || report.requestId}</span>
                <span className="text-xs text-[#5a4138] mt-1">OPD Referral • Dept. Medicine</span>
              </div>

              <div className="flex flex-col bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <span className="text-xs text-[#5a4138] uppercase tracking-wider font-bold">Test / Scan Ordered</span>
                <span className="text-base font-bold text-[#191c1e] mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {report.testName}
                </span>
                <span className="text-xs text-[#5a4138] mt-1">Digital Radiography (Room #4)</span>
              </div>

              <div className="flex flex-col bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <span className="text-xs text-[#5a4138] uppercase tracking-wider font-bold">Upload Timestamp</span>
                <span className="text-base font-semibold text-[#191c1e] mt-1">{report.date || 'Today, 12:15 PM'}</span>
                <span className="text-xs text-[#5a4138] mt-1">{report.verifiedBy || 'Technician T. N. Rao (ID: LR-104)'}</span>
              </div>
            </div>

            {/* Findings Preview */}
            {report.findings && (
              <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                <span className="text-xs text-[#455f8a] uppercase tracking-wider font-bold block mb-1">
                  Recorded Clinical Observations
                </span>
                <p className="text-sm text-[#191c1e] italic leading-relaxed">
                  "{report.findings}"
                </p>
              </div>
            )}

            {/* Attached File Row */}
            <div className="mt-4 p-4 bg-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#ffdbcf] flex items-center justify-center text-[#7c2800] shrink-0">
                  <span className="material-symbols-outlined text-[26px]">picture_as_pdf</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm text-[#191c1e] truncate">{report.fileName || 'chest_xray_pa_view_ac884920.pdf'}</span>
                  <span className="text-xs text-[#5a4138]">{report.fileSize || '4.2 MB'} • Standard DICOM Render • 300 DPI Clear View</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => alert(`Inspecting verified scan file: ${report.fileName || 'chest_xray_pa_view_ac884920.pdf'}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e7e8eb] hover:bg-[#e0e3e5] text-[#191c1e] font-semibold text-xs transition-colors shrink-0 btn-press"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span>Inspect File</span>
              </button>
            </div>

            {/* Status Bar */}
            <div className="mt-4 p-3.5 bg-[#99f89e]/20 rounded-xl flex items-center justify-between border border-[#99f89e]/40">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#00531b]">
                <span className="material-symbols-outlined text-[20px] text-[#006b25]">task_alt</span>
                <span>Status: Completed • Synchronized with Patient EHR</span>
              </div>
              <span className="text-xs text-[#006b25] font-bold">100% Encrypted</span>
            </div>
          </div>

          {/* Quick Route Side Panel / Context */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6">
            {/* Clinical Node Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#455f8a]">
                <span className="material-symbols-outlined text-[22px]">stethoscope</span>
                <span className="font-bold text-sm text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Target Clinical Recipient
                </span>
              </div>

              <div className="p-4 bg-[#f2f4f6] rounded-xl border border-slate-200">
                <span className="text-xs text-[#5a4138] uppercase tracking-wider font-bold">Attending Clinician</span>
                <div className="text-lg font-bold text-[#191c1e] mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {report.doctorName || 'Dr. Arvind Mukherjee'}
                </div>
                <div className="text-xs text-[#5a4138]">Senior Consultant, General / Respiratory Medicine</div>
                <div className="text-xs text-[#455f8a] mt-1 font-semibold">OPD Room 104 • AIIMS Central</div>
              </div>

              <div className="flex flex-col gap-2 text-xs text-[#5a4138]">
                <div className="flex items-center justify-between">
                  <span>Doctor Portal Status:</span>
                  <span className="font-semibold text-[#006b25]">Active Session</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Expected Latency:</span>
                  <span className="font-semibold text-[#191c1e]">&lt; 1.5 seconds</span>
                </div>
              </div>
            </div>

            {/* System Integrity Micro-card */}
            <div className="bg-[#f2f4f6] p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#191c1e] font-semibold text-xs">
                <span className="material-symbols-outlined text-[20px] text-[#006b25]">cloud_done</span>
                <span>Audit Trail Timestamped</span>
              </div>
              <p className="text-xs text-[#5a4138] leading-relaxed">
                Registered on National Digital Health Registry with unique token ID: <span className="font-mono text-[#191c1e] font-bold">NDHM-TX-8849-09</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Connection Notification Banner */}
        <div className="w-full bg-[#d6e3ff] text-[#001b3d] p-6 rounded-2xl shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-blue-200">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#455f8a] shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[24px]">sync_alt</span>
          </div>
          <div className="flex flex-col flex-1 text-sm">
            <span className="font-bold text-xs uppercase tracking-wider text-[#2c4770]" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Clinical Synchronization Notice
            </span>
            <p className="text-[#001b3d] mt-1 leading-relaxed">
              This completed report is now linked in the Doctor Portal under 
              <strong className="underline underline-offset-2 mx-1">Patient Reports (04.16)</strong> and 
              <strong className="underline underline-offset-2 mx-1">Diagnostic / Scan Report (04.24)</strong>.
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          {/* Left: Utility Options (Print Slip & Return) */}
          <div className="flex flex-wrap items-center gap-3 order-2 sm:order-1">
            <button 
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-white text-[#455f8a] shadow-sm hover:bg-slate-50 transition-all font-semibold text-sm border border-slate-100 btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              <span>Print Final Slip</span>
            </button>
            <Link 
              to="/diagnostic/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-[#f2f4f6] hover:bg-[#e7e8eb] text-[#191c1e] transition-all font-semibold text-sm border border-slate-200 btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Back to Dashboard</span>
            </Link>
          </div>

          {/* Right: Main Forward Call to Action */}
          <div className="order-1 sm:order-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button 
              type="button"
              onClick={handleTransmit}
              disabled={isTransmitting || isTransmitted}
              className={`inline-flex items-center justify-center gap-3 px-8 h-14 rounded-full font-bold text-base shadow-md transition-all active:scale-95 tracking-wide btn-press ${
                isTransmitted 
                  ? 'bg-[#006b25] text-white cursor-default'
                  : 'bg-[#166534] hover:bg-[#14532d] text-white hover:shadow-lg'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {isTransmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[24px]">hourglass_top</span>
                  <span>TRANSMITTING FILE...</span>
                </>
              ) : isTransmitted ? (
                <>
                  <span className="material-symbols-outlined text-[24px]">check</span>
                  <span>TRANSMITTED TO DOCTOR ✓</span>
                </>
              ) : (
                <>
                  <span>TRANSMIT TO DOCTOR CLINICAL FILE</span>
                  <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toast Confirmation for Transmission */}
        {showToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-full bg-[#006b25] text-white shadow-2xl animate-bounce">
            <span className="material-symbols-outlined text-[24px]">verified</span>
            <span className="font-semibold text-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Transmitted successfully to {report.doctorName || 'Dr. Arvind Mukherjee'}'s clinical file!
            </span>
          </div>
        )}
      </div>
    </DiagnosticLayout>
  )
}
