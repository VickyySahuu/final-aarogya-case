import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'

export default function UploadDocumentsPage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([
    { name: 'Clinical_Diagnostic_Summary_2024.pdf', size: '2.4 MB', type: 'PDF' }
  ])

  const handleFileUpload = (e) => {
    const uploaded = Array.from(e.target.files)
    if (uploaded.length > 0) {
      const newItems = uploaded.map((f) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: f.name.endsWith('.pdf') ? 'PDF' : 'IMAGE'
      }))
      setFiles((prev) => [...prev, ...newItems])
    }
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Upload Documents' }
      ]}
      backTo="/patient/next-step"
      backLabel="Back"
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                INTAKE STEP 3 OF 4
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Upload Medical Documents
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Upload prior discharge summaries, test findings, or doctor prescriptions to help the examining physician review your clinical background.
            </p>
          </div>

          {/* Optional notice callout */}
          <div className="w-full bg-emerald-50 border-l-4 border-[#166534] rounded-r-xl p-4 sm:p-5 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-lg">info</span>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-slate-900 text-sm mb-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Documents are completely optional
              </h2>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                You can continue directly to appointment facility selection without uploading files. Your consulting medical officer will examine you and take your clinical history in person during the visit.
              </p>
            </div>
          </div>

          {/* Clean Dropzone Area */}
          <div className="relative group w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#166534] bg-slate-50/60 hover:bg-emerald-50/20 transition-all p-8 md:p-10 flex flex-col items-center justify-center text-center cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-3 text-slate-500 group-hover:text-[#166534] group-hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-4xl">cloud_upload</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Select or drag & drop medical files
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-4 leading-normal">
              Attach prior prescriptions, lab findings, scan reports, or diagnostic slips from your device.
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#166534] text-white text-xs font-bold shadow-xs group-hover:bg-[#14532d] transition-colors" style={{ fontFamily: 'Lexend, sans-serif' }}>
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>SELECT DOCUMENT</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
              <span>Allowed: PDF, JPG, PNG</span>
              <span>•</span>
              <span>Up to 10MB per file</span>
              <span>•</span>
              <span>256-bit Encrypted</span>
            </div>
          </div>

          {/* Staged / Uploaded Files List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Attached Documents ({files.length})
              </h4>
              <span className="text-xs text-slate-400">Files attached to your appointment record</span>
            </div>

            <div className="space-y-2.5">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#166534] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate" style={{ fontFamily: 'Lexend, sans-serif' }}>
                          {file.name}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#166534] border border-emerald-200">
                          Ready
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{file.size} • Attached for Doctor Review</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      to="/patient/document-preview"
                      state={{ fileName: file.name }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-[#166534] hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      <span className="hidden sm:inline">Preview</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link
              to="/patient/next-step"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors order-3 md:order-1"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back</span>
            </Link>

            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 order-1 md:order-2">
              <Link
                to="/patient/select-hospital"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-xs font-bold transition-all shadow-xs"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>SKIP FOR NOW</span>
                <span className="material-symbols-outlined text-base text-slate-500">skip_next</span>
              </Link>
              <Link
                to="/patient/select-hospital"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>CONTINUE</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
