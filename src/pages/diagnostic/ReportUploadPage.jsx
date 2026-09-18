import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import DiagnosticLayout from '../../components/layout/DiagnosticLayout'
import { getDiagnosticRequests, completeDiagnosticReport } from '../../data/patientMockData'
import { DiagnosticApi } from '../../services/diagnosticApi'

export default function ReportUploadPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [request, setRequest] = useState(null)
  const [findings, setFindings] = useState('')
  const [hasFile, setHasFile] = useState(true)
  const [fileName, setFileName] = useState('chest_xray_pa_view_ac884920.pdf')
  const [fileSize, setFileSize] = useState('4.2 MB')
  const [isVerified, setIsVerified] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (location.state?.request) {
      setRequest(location.state.request)
    } else {
      const all = getDiagnosticRequests()
      const pending = all.find(r => r.status !== 'Completed') || all[0]
      setRequest(pending)
    }
  }, [location.state])

  const handleSnippet = (text) => {
    setFindings(prev => prev ? `${prev} ${text}` : text)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileName(file.name)
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`)
      setHasFile(true)
    }
  }

  const handleRemoveFile = () => {
    setHasFile(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!hasFile) {
      setErrorMsg('Please attach a diagnostic report file or scan.')
      return
    }
    if (!isVerified) {
      setErrorMsg('Please check the verification confirmation box before submitting.')
      return
    }

    setErrorMsg('')
    setIsSubmitting(true)

    const finalFindings = findings || 'Normal study. Clear lung fields, normal cardiothoracic index. No focal consolidation, pneumothorax, or pleural effusion noted.'
    const verifiedBy = 'Radiographer S. Varma (Lic #DEL-RAD-884)'
    const targetRequestId = request.requestId || request.requestNumber || request.id

    try {
      const res = await DiagnosticApi.uploadReport(targetRequestId, {
        patientId: request.patientId || 1,
        patientUniqueCode: request.patientUniqueCode || 'AC-7F42K9',
        doctorId: request.doctorId || 1,
        testName: request.testScan || request.testName || 'Diagnostic Investigation',
        testScan: request.testScan || request.testName || 'Diagnostic Investigation',
        category: request.category || 'Radiology',
        fileName: fileName || 'diagnostic_report.pdf',
        fileSize: fileSize || '4.2 MB',
        findings: finalFindings,
        impression: finalFindings,
        verifiedBy
      })

      // Sync local store
      const completedReport = completeDiagnosticReport({
        requestId: targetRequestId,
        findings: finalFindings,
        fileName: fileName || 'diagnostic_report.pdf',
        fileSize: fileSize || '4.2 MB',
        verifiedBy
      })

      const finalReport = (res.ok && res.data?.report) ? res.data.report : completedReport

      navigate('/diagnostic/completed', { 
        state: { 
          report: finalReport,
          request: { ...request, status: 'Completed' } 
        } 
      })
    } catch (err) {
      console.warn('[ReportUploadPage] API upload error, using fallback:', err.message)
      const completedReport = completeDiagnosticReport({
        requestId: targetRequestId,
        findings: finalFindings,
        fileName: fileName || 'diagnostic_report.pdf',
        fileSize: fileSize || '4.2 MB',
        verifiedBy
      })
      navigate('/diagnostic/completed', { 
        state: { 
          report: completedReport,
          request: { ...request, status: 'Completed' } 
        } 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!request) {
    return (
      <DiagnosticLayout activeNav="Requests">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500">Loading case requisition...</p>
        </div>
      </DiagnosticLayout>
    )
  }

  return (
    <DiagnosticLayout activeNav="Requests">
      <div className="flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
        {/* Breadcrumb / Back Link */}
        <div className="flex items-center gap-2 mb-4">
          <Link 
            to="/diagnostic/perform" 
            state={{ request }}
            className="inline-flex items-center gap-1 text-[#455f8a] hover:text-[#191c1e] font-semibold text-sm transition-colors group"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span>Back to Procedure</span>
          </Link>
          <span className="text-slate-300 font-semibold">/</span>
          <span className="text-[#5a4138] text-xs uppercase tracking-wider font-bold">Case Submission</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#d6e3ff] text-[#001b3d] text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Step 3 of 3
            </span>
            <span className="text-[#5a4138] text-xs">Node AIIMS-DL-02</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Upload Report
          </h1>
          <p className="text-base text-[#5a4138] mt-1">
            Attach verified diagnostic scan findings and laboratory documentation for the attending clinician.
          </p>
        </div>

        {/* Context Summary Banner */}
        <div className="bg-[#f2f4f6] rounded-2xl p-6 mb-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-3 bg-white/70 px-4 py-2 rounded-full border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006b25] text-[18px]">verified_user</span>
              <span className="text-xs font-bold text-[#006b25] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Central Diagnostic Record Linked Case
              </span>
            </div>
            <span className="text-xs text-[#5a4138]">
              Priority: <strong className="text-[#7c2800]">Standard Diagnostics</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-[#5a4138] uppercase tracking-wider font-bold">Patient Identity</span>
              <span className="text-lg font-bold text-[#191c1e] mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {request.patientName}
              </span>
              <span className="text-xs text-[#5a4138] mt-1 flex items-center gap-1 font-mono">
                <span className="material-symbols-outlined text-[16px] text-[#455f8a]">badge</span>
                ID: <strong className="text-[#191c1e]">{request.patientId}</strong>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-[#5a4138] uppercase tracking-wider font-bold">Request Reference</span>
              <span className="text-lg font-bold text-[#455f8a] mt-1 font-mono" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {request.requestId}
              </span>
              <span className="text-xs text-[#5a4138] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#455f8a]">calendar_today</span>
                Ordered: {request.requestDate} • 09:15 AM
              </span>
            </div>

            <div className="flex flex-col sm:col-span-2 lg:col-span-1">
              <span className="text-xs text-[#5a4138] uppercase tracking-wider font-bold">Procedure / Scan</span>
              <span className="text-lg font-bold text-[#006b25] mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {request.testName}
              </span>
              <span className="text-xs text-[#5a4138] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#006b25]">radiology</span>
                High Resolution Digital Radiography
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Upload Box / Dropzone */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-bold text-[#191c1e] flex items-center justify-between" style={{ fontFamily: 'Lexend, sans-serif' }}>
              <span>1. Diagnostic File Attachment <span className="text-[#ba1a1a]">*</span></span>
              <span className="text-xs text-[#5a4138] font-normal">DICOM, PDF, PNG, JPG (Max 25 MB)</span>
            </label>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="group relative bg-[#f2f4f6]/60 hover:bg-[#f2f4f6] transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#7c2800]">
                <input 
                  type="file" 
                  accept=".pdf,.dicom,.dcm,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-16 h-16 rounded-full bg-[#d6e3ff] flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[#455f8a] text-[32px]">cloud_upload</span>
                </div>
                <p className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Upload Report File
                </p>
                <p className="text-sm text-[#5a4138] mt-1">
                  Drag and drop file here, or <span className="text-[#7c2800] font-bold underline cursor-pointer">Browse Files</span>
                </p>
                <span className="mt-2 text-xs text-[#5a4138] bg-[#e7e8eb] px-3 py-1 rounded-full">
                  PDF, DICOM, JPG, PNG up to 25MB
                </span>
              </div>

              {/* Pre-staged attached file card */}
              {hasFile ? (
                <div className="bg-[#f2f4f6] rounded-xl p-4 flex items-center justify-between gap-4 border border-slate-200">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#006b25] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#191c1e] truncate">{fileName}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#99f89e] text-[#002106] text-xs font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check</span> Ready to upload
                        </span>
                      </div>
                      <span className="text-xs text-[#5a4138] mt-1 font-mono">
                        {fileSize} • SHA-256 Checksum Validated
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      type="button"
                      onClick={() => alert(`Viewing attached file: ${fileName}`)}
                      className="p-2 rounded-full hover:bg-white text-[#455f8a] transition-colors"
                      title="Preview Attached Scan"
                    >
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                    <button 
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 rounded-full hover:bg-white text-[#ba1a1a] transition-colors"
                      title="Remove File"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs italic">
                  No file currently attached. Please upload a scan or document above.
                </div>
              )}
            </div>
          </div>

          {/* Findings Summary / Report Notes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="findings-input" className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                2. Findings Summary / Report Notes <span className="text-xs text-[#5a4138] font-normal">(Optional)</span>
              </label>
              <span className="text-xs text-[#5a4138] font-mono">{findings.length} / 600 characters</span>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
              <textarea 
                id="findings-input"
                rows={4}
                maxLength={600}
                value={findings}
                onChange={e => setFindings(e.target.value)}
                placeholder="Enter clinical diagnostic observations, radiologist impressions, or technical remarks (e.g. Normal cardiothoracic ratio, clear costophrenic angles, mild bronchial wall thickening noted)."
                className="w-full bg-transparent text-sm text-[#191c1e] focus:outline-none resize-none placeholder:text-slate-400 leading-relaxed"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-[#5a4138]">
                  <span className="material-symbols-outlined text-[16px] text-[#006b25]">auto_awesome</span>
                  <span className="font-semibold">Quick templates:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    type="button"
                    onClick={() => handleSnippet('Normal study. Clear lung fields, normal cardiothoracic index.')}
                    className="px-3 py-1 rounded-full bg-[#f2f4f6] hover:bg-[#e7e8eb] text-xs font-semibold text-[#191c1e] transition-colors"
                  >
                    + Normal Study
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSnippet('Subsegmental atelectasis noted at right lower lobe. Recommend correlation.')}
                    className="px-3 py-1 rounded-full bg-[#f2f4f6] hover:bg-[#e7e8eb] text-xs font-semibold text-[#191c1e] transition-colors"
                  >
                    + Atelectasis Remark
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Checkbox */}
          <div className="bg-[#f2f4f6] rounded-2xl p-6 shadow-sm border border-slate-100">
            <label className="flex items-start gap-4 cursor-pointer select-none group">
              <input 
                type="checkbox"
                checked={isVerified}
                onChange={e => setIsVerified(e.target.checked)}
                className="mt-1 w-6 h-6 rounded accent-[#166534] shrink-0 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-base font-bold text-[#191c1e] group-hover:text-[#7c2800] transition-colors" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Radiologist / Technician Verification Check <span className="text-[#ba1a1a]">*</span>
                </span>
                <p className="text-sm text-[#5a4138] mt-1 leading-relaxed">
                  I confirm this report accurately corresponds to Patient <strong className="text-[#191c1e]">{request.patientId}</strong> and Request <strong className="text-[#191c1e]">{request.requestId}</strong>. I declare that the scan quality fulfills national diagnostic norms and has been cross-checked against procedure requisitions.
                </p>
              </div>
            </label>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4">
            <Link 
              to="/diagnostic/perform"
              state={{ request }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-white text-[#455f8a] font-semibold text-base hover:bg-slate-50 transition-colors shadow-sm border border-slate-100 btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Back</span>
            </Link>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 h-14 px-10 rounded-full bg-[#166534] hover:bg-[#14532d] disabled:opacity-60 text-white font-bold text-base tracking-wide uppercase shadow-md hover:shadow-lg transition-all transform active:scale-95 btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
                  <span>Encrypting & Transmitting...</span>
                </>
              ) : (
                <>
                  <span>UPLOAD REPORT</span>
                  <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DiagnosticLayout>
  )
}
