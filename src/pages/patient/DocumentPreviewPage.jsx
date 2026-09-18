import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { getPatientProfile } from '../../data/patientMockData'

export default function DocumentPreviewPage() {
  const location = useLocation()
  const fileName = location.state?.fileName || 'Previous_Lab_Prescription_2024.pdf'
  const profile = getPatientProfile()
  const [zoom, setZoom] = useState(100)

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Upload Documents', to: '/patient/upload-documents' },
        { label: 'Document Preview' }
      ]}
      backTo="/patient/upload-documents"
      backLabel="Back to Uploads"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        {/* Header */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#166534] text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <span className="material-symbols-outlined text-sm">fact_check</span>
            Verification Step
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Document Preview
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Please check the document below before continuing. Ensure all doctor notes, dates, and prescription details are clearly legible.
          </p>
        </div>

        {/* File Info Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-100 text-[#166534] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">description</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 break-all" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {fileName}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">File size: 1.8 MB • Clinical Record PDF • Attached to Patient ID: {profile.patientId}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold border border-emerald-300">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Ready for Review
          </span>
        </div>

        {/* Document Inspection Preview Canvas */}
        <div className="w-full bg-slate-100 border border-slate-300 rounded-2xl overflow-hidden shadow-inner flex flex-col">
          {/* Document Viewer Toolbar */}
          <div className="bg-slate-200/90 px-4 py-2 border-b border-slate-300 flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-slate-600">picture_as_pdf</span>
              <span>Page 1 of 1</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 font-mono">Scale: {zoom}%</span>
            </div>
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-300 shadow-xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 10, 150))}
                className="p-1 rounded hover:bg-slate-100 text-slate-700"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-base">zoom_in</span>
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - 10, 80))}
                className="p-1 rounded hover:bg-slate-100 text-slate-700"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-base">zoom_out</span>
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="p-1 rounded hover:bg-slate-100 text-slate-700 text-[10px] font-bold"
                title="Reset Zoom"
              >
                100%
              </button>
            </div>
          </div>

          {/* Document Sheet Render Body */}
          <div className="p-4 sm:p-8 bg-slate-200/50 overflow-x-auto flex justify-center">
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-3xl bg-white border border-slate-300 shadow-md rounded-xl p-6 sm:p-8 flex flex-col gap-6 text-slate-800 transition-transform"
            >
              {/* Document Header */}
              <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-[#166534] flex items-center justify-center text-[#166534]">
                    <span className="material-symbols-outlined text-3xl">local_hospital</span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      DISTRICT CIVIL HOSPITAL
                    </h2>
                    <p className="text-xs text-slate-600 font-medium">Department of General Medicine & Integrated Care</p>
                    <p className="text-[11px] text-slate-500">Hospital Healthcare Network • Civil Lines</p>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                  <div>Ref ID: <strong className="text-slate-900">MED-2024-8841A</strong></div>
                  <div>Date: <strong className="text-slate-900">14 Oct 2024</strong></div>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Patient Name</span>
                  <span className="font-bold text-slate-800">{profile.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Age / Gender</span>
                  <span className="font-semibold text-slate-800">{profile.age} Yrs / {profile.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">ABHA / Patient ID</span>
                  <span className="font-mono text-slate-800 font-semibold">{profile.patientId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Attending Doctor</span>
                  <span className="font-semibold text-slate-800">Dr. Ramanathan V.</span>
                </div>
              </div>

              {/* Clinical Notes & Rx */}
              <div className="space-y-3 text-xs sm:text-sm">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b pb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Clinical Evaluation Summary
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  Patient presented with complaints of episodic pharyngeal irritation and mild pyrexia. Chest clear bilaterally on auscultation. Vitals stable. Advised rest, hydration, and completion of outpatient symptomatic therapy.
                </p>
              </div>

              {/* Prescribed Medications */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Prescribed Therapy
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2">Dosage</th>
                        <th className="p-2">Frequency</th>
                        <th className="p-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      <tr>
                        <td className="p-2 font-semibold">Paracetamol 500mg</td>
                        <td className="p-2">1 Tablet</td>
                        <td className="p-2">SOS / Post-meal</td>
                        <td className="p-2">3 Days</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Cetirizine 10mg</td>
                        <td className="p-2">1 Tablet</td>
                        <td className="p-2">Once at bedtime</td>
                        <td className="p-2">5 Days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Stamp */}
              <div className="pt-4 flex justify-between items-end text-xs text-slate-500 border-t border-slate-200">
                <span>Verified digitally via ABDM Registry</span>
                <div className="text-right">
                  <div className="w-24 h-10 border border-emerald-400 bg-emerald-50/50 rounded flex items-center justify-center text-[10px] font-bold text-[#166534] uppercase tracking-wider">
                    Verified OPD
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Civic Hospital Triage</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Link
            to="/patient/upload-documents"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back to Uploads</span>
          </Link>

          <Link
            to="/patient/select-hospital"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span>PROCEED TO SELECT HOSPITAL</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>
    </PatientLayout>
  )
}
