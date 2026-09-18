import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import DiagnosticLayout from '../../components/layout/DiagnosticLayout'
import { getDiagnosticRequests } from '../../data/patientMockData'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'
import PatientQrCode from '../../components/common/PatientQrCode'
import { DiagnosticApi } from '../../services/diagnosticApi'

export default function TestScanRequestPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [requestsList, setRequestsList] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(location.state?.request || null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL') // 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  const [errorMessage, setErrorMessage] = useState('')

  const loadRequests = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await DiagnosticApi.getRequests()
      if (res.ok && Array.isArray(res.data?.requests)) {
        setRequestsList(res.data.requests)
        if (location.state?.request) {
          const fresh = res.data.requests.find(r => 
            (r.requestId && r.requestId === location.state.request.requestId) ||
            (r.requestNumber && r.requestNumber === location.state.request.requestNumber) ||
            (r.id && r.id === location.state.request.id)
          )
          if (fresh) setSelectedRequest(fresh)
        }
      } else {
        const fallback = getDiagnosticRequests()
        setRequestsList(fallback)
      }
    } catch (err) {
      console.warn('[TestScanRequestPage] API fetch failed, using fallback:', err)
      const fallback = getDiagnosticRequests()
      setRequestsList(fallback)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [location.state])

  // Filter and Search Logic
  const filteredRequests = requestsList.filter(req => {
    const q = searchQuery.toLowerCase().trim()
    const reqNum = String(req.requestNumber || req.requestId || req.id || '').toLowerCase()
    const patientName = String(req.patientName || req.patient?.name || '').toLowerCase()
    const patientId = String(req.patientId || req.patient?.id || '').toLowerCase()
    const uniqueCode = String(req.patientUniqueCode || req.patient?.uniqueCode || '').toLowerCase()
    const testName = String(req.testScan || req.testName || '').toLowerCase()

    const matchesQuery = !q ||
      reqNum.includes(q) ||
      patientName.includes(q) ||
      patientId.includes(q) ||
      uniqueCode.includes(q) ||
      testName.includes(q)

    if (!matchesQuery) return false

    const status = (req.status || 'Pending').toLowerCase()
    if (activeFilter === 'PENDING') return status === 'pending' || status === 'scheduled'
    if (activeFilter === 'IN_PROGRESS') return status === 'in progress'
    if (activeFilter === 'COMPLETED') return status === 'completed' || status === 'report ready'
    return true
  })

  const handleStartScan = (targetReq) => {
    const req = targetReq || selectedRequest
    navigate('/diagnostic/perform', { state: { request: req } })
  }

  const request = selectedRequest

  // ==========================================
  // VIEW 1: REQUEST DETAILS VIEW
  // ==========================================
  if (request) {
    const reqNum = request.requestNumber || request.requestId || request.id || 'REQ-01'
    const patientName = request.patientName || request.patient?.name || 'Patient'
    const patientId = request.patientId || request.patient?.id || '—'
    const patientUniqueCode = request.patientUniqueCode || request.patient?.uniqueCode || '—'
    const patientAge = request.patientAge || request.patient?.age || '54 Yrs'
    const patientGender = request.patientGender || request.patient?.gender || 'Male'
    const doctorName = request.doctorName || 'Dr. Ramanathan Venkatraman'
    const appointment = request.appointmentId || (request.appointment?.tokenNumber ? `Token #${request.appointment.tokenNumber}` : 'OPD Consultation')
    const testName = request.testScan || request.testName || 'Chest X-Ray (PA View)'
    const priority = request.priority || 'Routine Outpatient'
    const clinicalReason = request.clinicalReason || request.clinicalNotes || 'Persistent cough. Rule out lower respiratory infection.'
    const date = request.date || request.requestDate || (request.createdAt ? request.createdAt.split('T')[0] : 'Today')
    const status = request.status || 'Pending'

    return (
      <DiagnosticLayout activeNav="Requests">
        <div className="w-full">
          {/* Print Only CSS */}
          <style>{`
            @media print {
              header, footer, nav, .no-print, .utility-bar, .site-header {
                display: none !important;
              }
              main {
                padding-top: 0 !important;
              }
              .print-only-slip {
                display: block !important;
                background: #ffffff !important;
                color: #000000 !important;
                padding: 20px !important;
                border: 2px solid #000000 !important;
              }
              .screen-only-view {
                display: none !important;
              }
              body {
                background-color: #ffffff !important;
                color: #000000 !important;
              }
            }
            .print-only-slip {
              display: none;
            }
          `}</style>

          {/* PRINT ONLY CLEAN SINGLE-PAGE SLIP */}
          <div className="print-only-slip text-black font-sans">
            <div className="flex items-center justify-between pb-4 border-b-2 border-black">
              <div className="flex items-center gap-3">
                <img src={officialEmblem} alt="Aarogya Case Emblem" className="h-14 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">AAROGYA CASE</h1>
                  <p className="text-xs font-semibold text-slate-700">Central Diagnostic &amp; Radiology Services • Hospital Diagnostic Wing</p>
                  <p className="text-xs text-slate-600">Clinical Investigation Requisition Slip</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold">Patient Requisition Copy</p>
                <p>Date: {date}</p>
                <p className="font-mono text-[10px]">AUTH-DIAG-VALIDATED</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 border border-slate-300 rounded">
              <div>
                <span className="text-xs uppercase text-slate-600 block">Request Number</span>
                <strong className="text-lg font-mono text-black">#{reqNum}</strong>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase text-slate-600 block">Status</span>
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-xs">
                  {status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-300">
              <div className="col-span-2 space-y-2 text-sm">
                <h2 className="font-bold text-base border-b pb-1 text-slate-900">Patient Identification</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-slate-500 block">Patient Legal Name</span>
                    <span className="font-bold text-base">{patientName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Age / Gender</span>
                    <span>{patientAge} / {patientGender}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Patient ID</span>
                    <span className="font-mono font-bold">{patientId}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Patient Unique Code</span>
                    <span className="font-mono font-bold text-[#166534]">{patientUniqueCode}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center border-l pl-4">
                <PatientQrCode code={patientUniqueCode !== '—' ? patientUniqueCode : reqNum} size={110} />
                <span className="text-[10px] font-mono mt-1 font-bold">{patientUniqueCode}</span>
              </div>
            </div>

            <div className="my-4 space-y-2 text-sm">
              <h2 className="font-bold text-base border-b pb-1 text-slate-900">Ordered Clinical Investigation</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-slate-500 block">Test / Scan</span>
                  <strong className="text-base text-[#166534]">{testName}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Priority</span>
                  <span>{priority}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Consulting Doctor</span>
                  <span>{doctorName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Appointment</span>
                  <span>{appointment}</span>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-xs text-slate-500 block">Clinical Reason / Notes</span>
                <p className="italic text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">{clinicalReason}</p>
              </div>
            </div>
          </div>

          {/* SCREEN VIEW */}
          <div className="screen-only-view max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
            {/* Top Navigation & Breadcrumb */}
            <div className="flex items-center justify-between">
              <button 
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#166534] hover:text-[#0A2540] transition-colors py-1 px-3 -ml-3 rounded-full hover:bg-slate-100 cursor-pointer"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                <span>Back to Requests Worklist</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Connected to Central Diagnostic Complex</span>
              </div>
            </div>

            {/* Header Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#166534]">
                  <span className="material-symbols-outlined text-[26px]">assignment</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Diagnostic Request Details
                    </h1>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                      Status: {status}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Official doctor-ordered diagnostic order received from outpatient consultation desk.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start lg:self-center">
                <button 
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>Print Slip</span>
                </button>
              </div>
            </div>

            {/* Request Overview Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col gap-6 overflow-hidden">
              {/* Top Meta Strip */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 gap-4 bg-slate-50 -mx-6 -mt-6 p-6 sm:-mx-8 sm:-mt-8 sm:p-8 rounded-t-2xl border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Request Number
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-[#0A2540] tracking-tight font-mono">
                      #{reqNum}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Order Date
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {date}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                    {priority}
                  </span>
                </div>
              </div>

              {/* Main Data Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left 8 Columns */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Patient Info Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Patient Name</span>
                      <span className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        {patientName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {patientGender}, {patientAge}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Patient ID</span>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {patientId}
                      </span>
                      <span className="text-[11px] text-slate-400">Civil Registry Record</span>
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2 pt-3 border-t border-slate-200">
                      <span className="text-xs text-[#166534] font-bold uppercase">Patient Unique Code</span>
                      <span className="font-mono text-base font-extrabold text-[#166534] tracking-wider">
                        {patientUniqueCode}
                      </span>
                    </div>
                  </div>

                  {/* Clinician & Appointment Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Consulting Doctor</span>
                      <span className="text-base font-bold text-slate-900">
                        {doctorName}
                      </span>
                      <span className="text-xs text-slate-500">Department of General Medicine</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Appointment Reference</span>
                      <span className="text-sm font-bold text-slate-900">
                        {appointment}
                      </span>
                      <span className="text-xs text-slate-500">Civil Hospital Outpatient Ward</span>
                    </div>
                  </div>

                  {/* Investigation Details Block */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs text-slate-500 uppercase font-bold">Ordered Test / Scan</span>
                        <h3 className="text-xl font-bold text-[#166534] mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                          {testName}
                        </h3>
                      </div>
                      <span className="px-3 py-1 bg-white rounded-full border border-slate-200 text-xs font-semibold text-slate-700 self-start sm:self-auto">
                        Priority: {priority}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-1">
                      <span className="text-xs text-slate-500 uppercase font-bold">Clinical Reason / Indication</span>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
                        "{clinicalReason}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right 4 Columns: QR Code & Verification */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center gap-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Patient Identity QR
                    </span>
                    <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                      <PatientQrCode code={patientUniqueCode !== '—' ? patientUniqueCode : reqNum} size={130} />
                      <span className="mt-2 font-mono text-xs font-bold text-slate-700">
                        {patientUniqueCode}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Scan to link test equipment with patient record
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-2 text-xs">
                    <span className="font-bold text-slate-800 uppercase tracking-wider">Assigned Lab Bay</span>
                    <span className="text-sm font-bold text-slate-900">Lab Suite 02 • Imaging Complex</span>
                    <span className="text-slate-500">Technician: Radiographer S. Varma</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Primary Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button 
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="w-full sm:w-auto h-12 px-6 rounded-full bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold border border-slate-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>BACK TO WORKLIST</span>
              </button>

              <button 
                type="button"
                onClick={() => handleStartScan(request)}
                className="w-full sm:w-auto h-12 px-8 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                <span>START TEST</span>
              </button>
            </div>
          </div>
        </div>
      </DiagnosticLayout>
    )
  }

  // ==========================================
  // VIEW 2: REQUESTS WORKLIST VIEW
  // ==========================================
  const pendingCount = requestsList.filter(r => (r.status || '').toLowerCase() === 'pending' || (r.status || '').toLowerCase() === 'scheduled' || !r.status).length
  const inProgressCount = requestsList.filter(r => (r.status || '').toLowerCase() === 'in progress').length
  const completedCount = requestsList.filter(r => (r.status || '').toLowerCase() === 'completed' || (r.status || '').toLowerCase() === 'report ready').length

  return (
    <DiagnosticLayout activeNav="Requests">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/diagnostic/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:text-[#0A2540] transition-colors py-1 px-3 -ml-3 rounded-full hover:bg-slate-100"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={loadRequests}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin text-[#166534]' : ''}`}>
              refresh
            </span>
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#166534] mb-1 font-semibold text-xs uppercase tracking-widest" style={{ fontFamily: 'Lexend, sans-serif' }}>
              <span className="material-symbols-outlined text-[18px]">science</span>
              <span>Central Laboratory Requisitions</span>
            </div>
            <h1 className="text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Test &amp; Scan Requests
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Active diagnostic orders received from hospital outpatient and inpatient wards.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-semibold text-slate-600">Pending:</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{pendingCount}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-xs font-semibold text-slate-600">In Progress:</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{inProgressCount}</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box: Search by Request Number, Patient Name, Patient ID, Patient Unique Code, Test / Scan */}
          <div className="relative flex-grow max-w-lg">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Request #, Patient Name, ID, Unique Code, or Test/Scan..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534] transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-[#166534] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              All Orders ({requestsList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('PENDING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'PENDING'
                  ? 'bg-[#166534] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('IN_PROGRESS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'IN_PROGRESS'
                  ? 'bg-[#166534] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('COMPLETED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'COMPLETED'
                  ? 'bg-[#166534] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[#166534] text-4xl animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-slate-700">Loading Diagnostic Requisitions...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-3xl">science</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
              No Diagnostic Requests Found
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              {searchQuery
                ? `No orders match your search query "${searchQuery}".`
                : 'All diagnostic requests for this workstation have been processed.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRequests.map((req, idx) => {
              const reqNum = req.requestNumber || req.requestId || req.id || `REQ-${idx + 1}`
              const patientName = req.patientName || req.patient?.name || 'Patient'
              const patientId = req.patientId || req.patient?.id || '—'
              const uniqueCode = req.patientUniqueCode || req.patient?.uniqueCode || '—'
              const doctorName = req.doctorName || 'Attending Physician'
              const testName = req.testScan || req.testName || 'Diagnostic Investigation'
              const priority = req.priority || 'Routine Outpatient'
              const clinicalReason = req.clinicalReason || req.clinicalNotes || 'Clinical evaluation requested.'
              const date = req.date || req.requestDate || (req.createdAt ? req.createdAt.split('T')[0] : 'Today')
              const status = req.status || 'Pending'

              const isInProgress = (status || '').toLowerCase() === 'in progress'
              const isCompleted = (status || '').toLowerCase() === 'completed' || (status || '').toLowerCase() === 'report ready'

              return (
                <div
                  key={req.id || reqNum || idx}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#166534] border border-emerald-200 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">science</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-base text-[#0A2540]">
                          #{reqNum}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-50 text-[#166534] border border-emerald-200'
                              : isInProgress
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {status}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {priority}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="font-bold text-slate-900 text-sm">
                          {patientName}
                        </span>
                        <span className="font-mono text-slate-500">
                          ID: <strong className="text-slate-700">{patientId}</strong>
                        </span>
                        <span className="font-mono text-[#166534] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Code: {uniqueCode}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-[#166534]">biotechnology</span>
                          <span>{testName}</span>
                        </span>
                        <span>•</span>
                        <span>Dr. {doctorName}</span>
                        <span>•</span>
                        <span>{date}</span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 italic">
                        "{clinicalReason.slice(0, 100)}{clinicalReason.length > 100 ? '...' : ''}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleStartScan(req)}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        <span>{isInProgress ? 'RESUME TEST' : 'START TEST'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedRequest(req)}
                      className="inline-flex items-center gap-1 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
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
    </DiagnosticLayout>
  )
}
