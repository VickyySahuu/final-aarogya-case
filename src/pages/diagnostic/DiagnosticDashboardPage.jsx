import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DiagnosticLayout from '../../components/layout/DiagnosticLayout'
import { getDiagnosticRequests } from '../../data/patientMockData'
import { DiagnosticApi } from '../../services/diagnosticApi'

export default function DiagnosticDashboardPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadRequests = async () => {
    setIsLoading(true)
    try {
      const res = await DiagnosticApi.getRequests()
      if (res.ok && res.data?.requests) {
        setAllOrders(res.data.requests)
        const pending = res.data.requests.filter(r => r.status !== 'Completed')
        setRequests(pending)
        setIsLoading(false)
        return
      }
    } catch (err) {
      console.warn('[DiagnosticDashboardPage] Failed fetching from API:', err.message)
    }
    // Fallback
    const list = getDiagnosticRequests()
    setAllOrders(list)
    const pending = list.filter(r => r.status !== 'Completed')
    setRequests(pending)
    setIsLoading(false)
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const pendingCount = allOrders.filter(r => (r.status || '').toLowerCase() === 'pending' || (r.status || '').toLowerCase() === 'scheduled' || !r.status).length
  const inProgressCount = allOrders.filter(r => (r.status || '').toLowerCase() === 'in progress').length
  const reportsReadyCount = allOrders.filter(r => (r.status || '').toLowerCase() === 'report ready' || (r.status || '').toLowerCase() === 'ready').length
  const completedCount = allOrders.filter(r => (r.status || '').toLowerCase() === 'completed').length

  return (
    <DiagnosticLayout activeNav="Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#166534] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Lab Workstation 02 • Central Diagnostic Complex
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Diagnostic Dashboard
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Operational work-control center for outpatient pathology orders, radiology scans, and laboratory telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              to="/diagnostic/requests"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[18px]">biotechnology</span>
              <span>VIEW REQUESTS</span>
            </Link>
          </div>
        </div>

        {/* 4 Operational Status Cards (Required: Pending, In Progress, Reports Ready, Completed) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Pending Requests */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">pending_actions</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Triage
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Pending Requests
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#0A2540] font-mono">
                  {isLoading ? '—' : pendingCount}
                </span>
                <span className="text-xs text-slate-500">orders awaiting triage</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Doctor-ordered tests scheduled for specimen collection or imaging.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100">
              <Link
                to="/diagnostic/requests"
                className="inline-flex items-center justify-between w-full text-xs font-bold text-[#166534] hover:text-[#0A2540] transition-colors"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>OPEN WORKLIST</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* 2. In Progress */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">autorenew</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Testing
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>
                In Progress
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#0A2540] font-mono">
                  {isLoading ? '—' : inProgressCount}
                </span>
                <span className="text-xs text-slate-500">active diagnostic runs</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Scans currently being conducted in laboratory or imaging suites.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100">
              <Link
                to="/diagnostic/requests"
                className="inline-flex items-center justify-between w-full text-xs font-bold text-blue-700 hover:text-[#0A2540] transition-colors"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>MONITOR RUNS</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* 3. Reports Ready */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">upload_file</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Ready
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Reports Ready
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#0A2540] font-mono">
                  {isLoading ? '—' : reportsReadyCount}
                </span>
                <span className="text-xs text-slate-500">awaiting physician sign-off</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Completed lab assays with verified telemetry uploaded to central portal.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100">
              <Link
                to="/diagnostic/completed-reports"
                className="inline-flex items-center justify-between w-full text-xs font-bold text-purple-700 hover:text-[#0A2540] transition-colors"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>VIEW READY REPORTS</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* 4. Completed */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#166534] border border-emerald-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Finalized
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Completed
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#0A2540] font-mono">
                  {isLoading ? '—' : completedCount}
                </span>
                <span className="text-xs text-slate-500">archived investigations</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Archived clinical investigation findings delivered to attending doctors.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100">
              <Link
                to="/diagnostic/completed-reports"
                className="inline-flex items-center justify-between w-full text-xs font-bold text-[#166534] hover:text-[#0A2540] transition-colors"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>VIEW ARCHIVE</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Immediate Pending Worklist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Active Diagnostic Requests Needing Action
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Priority outpatient diagnostic orders received from clinical consultation rooms.
              </p>
            </div>
            <Link
              to="/diagnostic/requests"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#166534] hover:underline self-start sm:self-auto"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span>VIEW ALL ({allOrders.length})</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[#166534] text-4xl animate-spin">
                progress_activity
              </span>
              <span className="text-xs text-slate-500">Loading diagnostic queue...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-4xl">
                check_circle
              </span>
              <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                All Diagnostic Orders Handled
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                There are no pending diagnostic requisitions waiting for specimen collection or scan processing.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((req, idx) => {
                const reqNum = req.requestNumber || req.requestId || req.id
                const patientName = req.patientName || req.patient?.name || 'Patient'
                const patientId = req.patientId || req.patient?.id || '—'
                const uniqueCode = req.patientUniqueCode || req.patient?.uniqueCode || '—'
                const doctorName = req.doctorName || 'Attending Physician'
                const testName = req.testScan || req.testName || 'Diagnostic Investigation'
                const priority = req.priority || 'Routine Outpatient'
                const date = req.date || req.requestDate || (req.createdAt ? req.createdAt.split('T')[0] : 'Today')
                const status = req.status || 'Pending'

                return (
                  <div
                    key={req.id || reqNum || idx}
                    className="p-5 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#166534] border border-emerald-200 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">biotechnology</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#0A2540]">
                            #{reqNum}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {patientName}
                          </span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            {status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="font-mono text-slate-700">ID: {patientId}</span>
                          <span>•</span>
                          <span className="font-mono text-[#166534] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Code: {uniqueCode}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-800">{testName}</span>
                          <span>•</span>
                          <span>{priority}</span>
                          <span>•</span>
                          <span>Dr. {doctorName}</span>
                          <span>•</span>
                          <span>{date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate('/diagnostic/request', { state: { request: req } })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span>OPEN REQUEST</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DiagnosticLayout>
  )
}
