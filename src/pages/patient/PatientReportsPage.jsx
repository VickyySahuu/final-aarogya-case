import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { getReports, getPatientProfile } from '../../data/patientMockData'
import { DiagnosticApi } from '../../services/diagnosticApi'
import { AuthApi } from '../../services/authApi'

export default function PatientReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadReports() {
      const patient = AuthApi.getStoredPatient() || getPatientProfile()
      const code = patient.patientUniqueCode || patient.patientId || ''
      try {
        const res = await DiagnosticApi.getPatientReports(code)
        if (mounted && res.ok && Array.isArray(res.data?.reports)) {
          const mapped = res.data.reports.map(r => ({
            id: r.reportId || r.report_id || `REP-${r.id}`,
            testName: r.testScan || r.testName || r.test_name || 'Diagnostic Investigation',
            category: r.category || 'Pathology & Radiology',
            date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
            laboratory: r.category ? `${r.category} Central Laboratory` : 'District Hospital Central Lab',
            status: r.status || 'Verified & Completed',
            summary: r.findings || r.impression || 'Diagnostic test completed and verified.',
            verifiedBy: r.verifiedBy || r.verified_by || 'Verified Pathologist',
            items: r.reportData && typeof r.reportData === 'object' && !Array.isArray(r.reportData)
              ? Object.entries(r.reportData).map(([k, v]) => ({ parameter: k, result: String(v), unit: '', normalRange: '', status: 'Normal' }))
              : []
          }))
          setReports(mapped)
        }
      } catch (err) {
        console.warn('Failed loading diagnostic reports from API:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadReports()
    return () => { mounted = false }
  }, [])

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Diagnostic Reports' }
      ]}
      backTo="/patient/home"
      backLabel="Home"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Diagnostic Reports &amp; Results
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Verified lab results, medical imaging scans, and pathology evaluations linked directly to your patient identity.
          </p>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">biotech</span>
              <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                No Diagnostic Reports Yet
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Lab tests, imaging scans, and diagnostic evaluations requested by your doctor will automatically appear here once finalized.
              </p>
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#166534]/50 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#166534] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl">biotech</span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {rep.id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {rep.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">• {rep.category}</span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {rep.testName}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <span className="material-symbols-outlined text-sm text-[#166534]">calendar_today</span>
                        {rep.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-slate-400">domain</span>
                        {rep.laboratory}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {rep.summary}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center md:pl-4">
                  <Link
                    to="/patient/report-details"
                    state={{ report: rep }}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span>VIEW FULL REPORT</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PatientLayout>
  )
}
