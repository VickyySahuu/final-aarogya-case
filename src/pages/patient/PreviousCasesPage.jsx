import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { getCases } from '../../data/patientMockData'
import { CaseApi } from '../../services/caseApi'

export default function PreviousCasesPage() {
  const [allCases, setAllCases] = useState([])
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    let mounted = true
    async function loadCases() {
      try {
        const res = await CaseApi.getCases()
        if (mounted && res.success && Array.isArray(res.cases)) {
          const mapped = res.cases.map(c => ({
            id: c.caseNumber || c.case_number || `CASE-${c.id}`,
            caseNumber: c.caseNumber || c.case_number || `CASE-${c.id}`,
            title: c.problem || 'Outpatient Consultation',
            date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
            hospital: 'District Civil Hospital, Sector 4',
            doctor: 'Dr. Ramanathan V., MD',
            status: c.status || 'Completed',
            statusColor: c.status === 'Active' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
            department: 'General Medicine',
            summary: c.ai_assessment?.summary || c.problem || 'Vital parameters recorded and clinical consultation completed.',
            prescriptionId: c.prescription_id || ''
          }))
          setAllCases(mapped)
        }
      } catch (e) {
        console.warn('Failed loading cases from API:', e)
      }
    }
    loadCases()
    return () => { mounted = false }
  }, [])

  const filtered = allCases.filter((c) => filter === 'All' || c.status === filter)

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'History', to: '/patient/history' },
        { label: 'Previous Cases' }
      ]}
      backTo="/patient/history"
      backLabel="Back to Timeline"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Previous Health Cases
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Comprehensive clinical record of previously resolved and active consultations.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['All', 'Active', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filter === tab
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cases Grid */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">folder_open</span>
              <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                No Cases Found
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No past consultations recorded for your citizen profile under this filter.
              </p>
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#166534] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {c.caseNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.statusColor}`}>
                      {c.status}
                    </span>
                    <span className="text-xs text-slate-500">• {c.date}</span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {c.title}
                  </h2>

                  <p className="text-xs text-slate-600">
                    {c.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span><strong>Facility:</strong> {c.hospital}</span>
                    <span>•</span>
                    <span><strong>Physician:</strong> {c.doctor}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <Link
                    to="/patient/case-details"
                    state={{ caseItem: c }}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-[#166534] text-[#166534] hover:bg-[#166534] hover:text-white text-xs font-bold transition-colors"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span>CASE DETAILS</span>
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
