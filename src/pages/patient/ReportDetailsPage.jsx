import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { getPatientProfile, DEFAULT_REPORTS } from '../../data/patientMockData'

export default function ReportDetailsPage() {
  const location = useLocation()
  const profile = getPatientProfile()
  const rep = location.state?.report || DEFAULT_REPORTS[0]

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Reports', to: '/patient/reports' },
        { label: 'Report Details' }
      ]}
      backTo="/patient/reports"
      backLabel="Back to Reports"
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  {rep.id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {rep.status}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {rep.testName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{rep.category} • Specimen Collected: {rep.date}</p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Download / Print PDF</span>
            </button>
          </div>

          {/* Demographics & Lab Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient Name</span>
              <span className="font-bold text-slate-800 text-sm">{profile.name}</span>
              <span className="text-slate-500 font-mono block">{profile.patientId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Sample ID</span>
              <span className="font-bold text-slate-800 text-sm font-mono">{rep.sampleId}</span>
              <span className="text-slate-500 block">Blood Specimen</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Testing Laboratory</span>
              <span className="font-bold text-slate-800 text-sm">{rep.laboratory}</span>
              <span className="text-slate-500 block">Central Diagnostics Wing</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Verified Signatory</span>
              <span className="font-bold text-slate-800 text-sm">{rep.verifiedBy}</span>
              <span className="text-[#166534] font-semibold block">Digital Sign-off</span>
            </div>
          </div>

          {/* Test Parameters Table */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Investigation Findings & Quantitative Values
            </h2>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
                  <tr>
                    <th className="p-3">Parameter Description</th>
                    <th className="p-3">Observed Value</th>
                    <th className="p-3">Reference Unit</th>
                    <th className="p-3">Normal Biological Range</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {rep.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{item.parameter}</td>
                      <td className="p-3 font-mono font-bold text-sm text-[#166534]">{item.result}</td>
                      <td className="p-3 text-slate-500 font-mono">{item.unit}</td>
                      <td className="p-3 text-slate-600 font-mono">{item.normalRange}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#166534] border border-emerald-200">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pathologist Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Clinical Impression / Pathologist Remarks
            </span>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {rep.summary}
            </p>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
