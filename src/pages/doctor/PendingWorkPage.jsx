import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import { DiagnosticApi } from '../../services/diagnosticApi'

export default function PendingWorkPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL') // 'ALL' | 'READY' | 'PENDING'
  const [search, setSearch] = useState('')
  const [selectedPendingItem, setSelectedPendingItem] = useState(null)

  const loadRequests = async () => {
    try {
      setLoading(true)
      const res = await DiagnosticApi.getRequests()
      if (res.ok && Array.isArray(res.data?.requests)) {
        setRequests(res.data.requests)
      } else {
        setRequests([])
      }
    } catch (err) {
      console.warn('Failed to load pending diagnostic work:', err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const readyCount = requests.filter(r => (r.status || '').toLowerCase() === 'completed' || (r.status || '').toLowerCase() === 'report ready').length
  const pendingCount = requests.filter(r => (r.status || '').toLowerCase() === 'pending' || (r.status || '').toLowerCase() === 'in progress').length

  const filteredRequests = requests.filter((r) => {
    const isReady = (r.status || '').toLowerCase() === 'completed' || (r.status || '').toLowerCase() === 'report ready'
    const isPending = (r.status || '').toLowerCase() === 'pending' || (r.status || '').toLowerCase() === 'in progress'

    if (filter === 'READY' && !isReady) return false
    if (filter === 'PENDING' && !isPending) return false

    if (!search) return true
    const q = search.toLowerCase()
    return (
      (r.testScan && r.testScan.toLowerCase().includes(q)) ||
      (r.testName && r.testName.toLowerCase().includes(q)) ||
      (r.patientName && r.patientName.toLowerCase().includes(q)) ||
      (r.patientUniqueCode && r.patientUniqueCode.toLowerCase().includes(q)) ||
      (r.requestNumber && r.requestNumber.toLowerCase().includes(q))
    )
  })

  const handleOpenReport = (item) => {
    const patientContext = {
      name: item.patientName || `Patient #${item.patientId}`,
      id: item.patientId,
      patientId: item.patientId,
      uniqueCode: item.patientUniqueCode || '—',
      age: item.patientAge || '—',
      gender: item.patientGender || '—',
      token: item.tokenNumber || '#—',
      appointmentId: item.appointmentId
    }
    navigate('/doctor/diagnostic-report', {
      state: {
        patient: patientContext,
        selectedReport: item
      }
    })
  }

  const handleOpenPatientWorkspace = (item) => {
    const patientContext = {
      name: item.patientName || `Patient #${item.patientId}`,
      id: item.patientId,
      patientId: item.patientId,
      uniqueCode: item.patientUniqueCode || '—',
      age: item.patientAge || '—',
      gender: item.patientGender || '—',
      token: item.tokenNumber || '#—',
      appointmentId: item.appointmentId,
      status: 'Current'
    }
    navigate('/doctor/patient-case', {
      state: {
        patient: patientContext,
        appointmentId: item.appointmentId,
        initialTab: 'reports'
      }
    })
  }

  return (
    <DoctorLayout activeNav="Pending Work">
      {/* Subheader */}
      <div className="w-full px-4 sm:px-6 lg:px-10 pt-8 pb-6 bg-white shadow-xs border-b border-slate-200">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-y-2 text-[#58423a] text-xs font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <div className="flex items-center gap-2">
              <Link to="/doctor/dashboard" className="hover:underline text-slate-600">Doctor Portal</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#00501a] font-semibold">Pending Work</span>
            </div>
            <div className="flex items-center gap-3 bg-[#f2f4f6] px-4 py-1 rounded-full text-[#455f8a]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00501a] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00501a]"></span>
              </span>
              <span className="font-medium tracking-tight text-xs">Clinical Worklist Synchronized • Central Lab &amp; Imaging</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Pending Work
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>
                Active clinical worklist of ordered diagnostic scans, lab tests, and ready reports awaiting physician review.
              </p>
            </div>
            <button
              onClick={loadRequests}
              disabled={loading}
              className="h-11 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition shrink-0 self-start sm:self-auto cursor-pointer btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
              <span>Refresh Worklist</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>Total Work Items</span>
              <span className="text-3xl font-bold text-[#0A2540] mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>{requests.length}</span>
              <span className="text-xs text-slate-500 mt-0.5">Active diagnostic investigations</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">assignment</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800" style={{ fontFamily: 'Lexend, sans-serif' }}>Reports Ready for Review</span>
              <span className="text-3xl font-bold text-[#166534] mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>{readyCount}</span>
              <span className="text-xs text-emerald-700 mt-0.5">Results uploaded &amp; verified</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">fact_check</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800" style={{ fontFamily: 'Lexend, sans-serif' }}>Pending Requests</span>
              <span className="text-3xl font-bold text-amber-800 mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>{pendingCount}</span>
              <span className="text-xs text-amber-700 mt-0.5">In lab queue / sample processing</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">hourglass_top</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: `All Items (${requests.length})` },
              { id: 'READY', label: `Reports Ready (${readyCount})`, badgeColor: '#166534' },
              { id: 'PENDING', label: `Pending Lab / Scans (${pendingCount})`, badgeColor: '#b45309' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer btn-press ${
                  filter === tab.id
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                {tab.badgeColor && (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: filter === tab.id ? '#ffffff' : tab.badgeColor }}></span>
                )}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              type="text"
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-full text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#166534]"
              placeholder="Search by test, patient, code or ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Worklist Items */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">sync</span>
              <p className="text-sm text-slate-500 mt-2">Loading clinical worklist items...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                No Items Matching Filter
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {search ? `No diagnostic items match query "${search}".` : 'No diagnostic requests or reports currently require physician attention.'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="px-5 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredRequests.map((item, idx) => {
              const isReady = (item.status || '').toLowerCase() === 'completed' || (item.status || '').toLowerCase() === 'report ready'
              const isInProgress = (item.status || '').toLowerCase() === 'in progress'
              const testDisplay = item.testScan || item.testName || 'Diagnostic Investigation'
              const dateDisplay = item.createdAt || item.created_at
                ? new Date(item.createdAt || item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Today'

              return (
                <div
                  key={item.id || item.requestId || idx}
                  className={`bg-white rounded-2xl p-5 sm:p-6 border transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                    isReady ? 'border-emerald-200 hover:border-emerald-400' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Left: Investigation Details & Patient Info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isReady ? 'bg-emerald-100 text-[#166534]' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">
                        {testDisplay.toLowerCase().includes('mri') || testDisplay.toLowerCase().includes('x-ray') ? 'biotech' : 'science'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                          {testDisplay}
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          {item.requestNumber || item.requestId || 'REQ-DIAG'}
                        </span>
                        {item.priority === 'Urgent' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                        <span className="font-semibold text-slate-900">{item.patientName || 'Patient'}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-800 font-medium">{item.patientUniqueCode || '—'}</span>
                        <span>•</span>
                        <span>Ordered: {dateDisplay}</span>
                        {item.category && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{item.category}</span>
                          </>
                        )}
                      </div>

                      {item.clinicalNotes && (
                        <p className="text-xs text-slate-500 line-clamp-1 italic mt-0.5">
                          "{item.clinicalNotes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Badge & Actions */}
                  <div className="flex items-center gap-3 self-end md:self-center shrink-0 flex-wrap">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 ${
                        isReady
                          ? 'bg-emerald-100 text-[#166534] border border-emerald-200'
                          : isInProgress
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isReady ? 'bg-[#166534]' : isInProgress ? 'bg-blue-600 animate-pulse' : 'bg-amber-600'
                        }`}
                      ></span>
                      <span>{isReady ? 'REPORT READY' : isInProgress ? 'IN PROGRESS' : 'PENDING'}</span>
                    </span>

                    {isReady ? (
                      <button
                        type="button"
                        onClick={() => handleOpenReport(item)}
                        className="h-11 px-5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition cursor-pointer btn-press"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span className="material-symbols-outlined text-[18px]">fact_check</span>
                        <span>OPEN REPORT</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedPendingItem(item)}
                        className="h-11 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-press"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span className="material-symbols-outlined text-[18px]">info</span>
                        <span>VIEW DETAILS</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenPatientWorkspace(item)}
                      className="h-11 px-4 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-press"
                      title="Open patient consultation workspace"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      <span className="hidden sm:inline">WORKSPACE</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Pending Item Quick Detail Modal */}
      {selectedPendingItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPendingItem(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-[24px]">hourglass_top</span>
                <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Pending Diagnostic Request
                </h3>
              </div>
              <button
                onClick={() => setSelectedPendingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="py-5 space-y-3 text-xs sm:text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-xs uppercase font-bold text-slate-500">Investigation</span>
                <p className="text-base font-bold text-slate-900">{selectedPendingItem.testScan || selectedPendingItem.testName}</p>
                <p className="text-xs font-mono text-slate-600">Ref: {selectedPendingItem.requestNumber || selectedPendingItem.requestId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase">Patient</span>
                  <span className="font-bold text-slate-900">{selectedPendingItem.patientName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase">Citizen Code</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedPendingItem.patientUniqueCode}</span>
                </div>
              </div>

              {selectedPendingItem.clinicalNotes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-900 block uppercase">Clinical Notes for Laboratory</span>
                  <p className="text-xs text-amber-950 mt-1 leading-relaxed">{selectedPendingItem.clinicalNotes}</p>
                </div>
              )}

              <p className="text-xs text-slate-500 italic pt-1">
                This diagnostic order is currently queued in the Central Diagnostic Portal. Results will appear under "Reports Ready for Review" once uploaded and verified by laboratory staff.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedPendingItem(null)}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const item = selectedPendingItem
                  setSelectedPendingItem(null)
                  handleOpenPatientWorkspace(item)
                }}
                className="px-5 py-2.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <span>Go to Patient Workspace</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  )
}
