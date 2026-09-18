import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import DiagnosticLayout from '../../components/layout/DiagnosticLayout'
import { getDiagnosticRequests } from '../../data/patientMockData'
import { DiagnosticApi } from '../../services/diagnosticApi'

export default function PerformTestScanPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [request, setRequest] = useState(null)
  const [seconds, setSeconds] = useState(272) // 04:32 initial
  const [isPaused, setIsPaused] = useState(false)
  const [checks, setChecks] = useState({
    idVerified: true,
    shieldProvided: true,
    cassettePositioned: true
  })

  useEffect(() => {
    async function initRequest() {
      let targetReq = location.state?.request
      if (!targetReq) {
        try {
          const res = await DiagnosticApi.getRequests('Pending')
          if (res.ok && res.data?.requests && res.data.requests.length > 0) {
            targetReq = res.data.requests[0]
          }
        } catch (e) {
          // fallback
        }
      }

      if (!targetReq) {
        const all = getDiagnosticRequests()
        targetReq = all.find(r => r.status !== 'Completed') || all[0]
      }

      if (targetReq) {
        const reqId = targetReq.requestId || targetReq.requestNumber || targetReq.id
        // Transition to In Progress on backend
        if (targetReq.status !== 'In Progress' && targetReq.status !== 'Completed') {
          try {
            await DiagnosticApi.updateStatus(reqId, 'In Progress')
          } catch (e) {
            // ignore network error
          }
          targetReq = { ...targetReq, status: 'In Progress' }
        }
        setRequest(targetReq)
      }
    }
    initRequest()
  }, [location.state])

  // Procedure timer
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isPaused])

  const formatTimer = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleComplete = () => {
    navigate('/diagnostic/upload', { state: { request } })
  }

  const handlePauseToggle = () => {
    setIsPaused(prev => !prev)
  }

  if (!request) {
    return (
      <DiagnosticLayout activeNav="Requests">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500">Loading scan parameters...</p>
        </div>
      </DiagnosticLayout>
    )
  }

  return (
    <DiagnosticLayout activeNav="Requests">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-8">
        {/* Top Nav Utility */}
        <div className="flex items-center justify-between">
          <Link 
            to="/diagnostic/request" 
            state={{ request }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#455f8a] hover:text-[#7c2800] transition-colors"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Request Details</span>
          </Link>
          <div className="flex items-center gap-2 bg-[#eceef0] px-4 py-1 rounded-full text-xs font-semibold text-[#5a4138]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006b25] animate-ping"></span>
            <span>Bay 01 Terminal Online</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Perform Test / Scan
              </h1>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdbcf] text-[#380d00] text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="w-2 h-2 rounded-full bg-[#7c2800] animate-pulse"></span>
                Procedure In Progress
              </span>
            </div>
            <p className="text-sm text-[#5a4138]">
              Verify safety protocol checkpoints, position radiography sensor, and confirm radiological capture.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#f2f4f6] px-5 py-3 rounded-2xl self-start md:self-auto border border-slate-100 shadow-sm">
            <span className="material-symbols-outlined text-[#455f8a] text-[28px]">timer</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider">
                {isPaused ? 'Timer Paused' : 'Elapsed Time'}
              </span>
              <span className="text-2xl font-bold text-[#191c1e] tabular-nums font-mono">
                {formatTimer(seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Patient & Reference Card (Left 5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-[#455f8a] font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Verified Case Record
                  </span>
                  <span className="text-xl font-bold text-[#191c1e] mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {request.patientName}
                  </span>
                  <span className="text-xs text-[#5a4138]">
                    {request.patientAge || '54 Yrs'} • {request.patientGender || 'Male'} • ABHA linked
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#e7e8eb] flex items-center justify-center text-[#455f8a]">
                  <span className="material-symbols-outlined text-[26px]">person</span>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full"></div>

              {/* Metadata List */}
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#8f7066] text-[20px] mt-0.5">badge</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-[#5a4138]">Patient ID</span>
                    <span className="font-semibold text-[#191c1e] font-mono">{request.patientId}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#8f7066] text-[20px] mt-0.5">tag</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-[#5a4138]">Request Number</span>
                    <span className="font-semibold text-[#191c1e] font-mono">{request.requestId}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#7c2800] text-[20px] mt-0.5">radiology</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-[#5a4138]">Test / Scan Ordered</span>
                    <span className="font-bold text-[#7c2800] text-base" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {request.testName}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#8f7066] text-[20px] mt-0.5">meeting_room</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-[#5a4138]">Room / Equipment Node</span>
                    <span className="text-sm text-[#191c1e]">Radiology Bay 01 • High Frequency Digital X-Ray</span>
                  </div>
                </div>
              </div>

              {/* Live Diagnostic Equipment Feed Preview */}
              <div className="relative rounded-xl overflow-hidden bg-slate-900 h-44 w-full flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950 flex items-center justify-center">
                  <div className="text-center p-4">
                    <span className="material-symbols-outlined text-cyan-400 text-5xl opacity-80 animate-pulse">radiology</span>
                    <p className="text-cyan-200 text-xs font-mono mt-2 tracking-wide">DIGITAL CASSETTE FEED ACTIVE</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded font-mono text-[11px]">DETECTOR SYNCED</span>
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 75 kVp / 12 mAs
                    </span>
                  </div>
                  <span className="text-white text-xs tracking-wide font-mono">
                    Live Sensor: Digital Plate Array 43x43cm
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Help Alert */}
            <div className="bg-[#f2f4f6] rounded-xl p-4 flex items-center gap-3 text-[#5a4138] border border-slate-100">
              <span className="material-symbols-outlined text-[#455f8a] text-[22px] shrink-0">info</span>
              <span className="text-xs leading-relaxed">
                Lead shields & thyroid collars must remain aligned before radiation exposure shutter is released.
              </span>
            </div>
          </div>

          {/* Simple Procedure Control Panel (Right 7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
              {/* Stepper Indicator */}
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider text-[#5a4138] font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Procedure Execution State
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {/* Step 1: Done */}
                  <div className="bg-[#f2f4f6] rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#99f89e] text-[#002106] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-[#006b25] font-bold">Step 1: Done</span>
                      <span className="text-sm font-semibold text-[#191c1e] truncate">Patient Positioning</span>
                    </div>
                  </div>
                  {/* Step 2: Active */}
                  <div className="bg-[#ffdbcf] rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7c2800] text-white flex items-center justify-center shrink-0 font-bold text-sm">
                      2
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-[#7c2800] font-bold">Step 2: Active</span>
                      <span className="text-sm font-semibold text-[#191c1e] truncate">Exposure / Acquisition</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Protocol Checklist */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Mandatory Safety Checkpoints
                  </span>
                  <span className="text-xs text-[#006b25] font-bold">
                    All 3 Items Verified
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={checks.idVerified}
                      onChange={e => setChecks({ ...checks, idVerified: e.target.checked })}
                      className="w-5 h-5 rounded accent-[#7c2800] cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-[#191c1e]">Patient ID & Unique Code confirmed</span>
                      <span className="text-xs text-[#5a4138]">Matched biometric slip {request.patientId} and verbal confirmation</span>
                    </div>
                    <span className="material-symbols-outlined text-[#006b25] ml-auto text-[20px]">verified</span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={checks.shieldProvided}
                      onChange={e => setChecks({ ...checks, shieldProvided: e.target.checked })}
                      className="w-5 h-5 rounded accent-[#7c2800] cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-[#191c1e]">Protective lead apron provided</span>
                      <span className="text-xs text-[#5a4138]">Gonadal shielding positioned properly as per AERB safe practices</span>
                    </div>
                    <span className="material-symbols-outlined text-[#006b25] ml-auto text-[20px]">verified</span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={checks.cassettePositioned}
                      onChange={e => setChecks({ ...checks, cassettePositioned: e.target.checked })}
                      className="w-5 h-5 rounded accent-[#7c2800] cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-[#191c1e]">Digital imaging cassette positioned (PA Erect)</span>
                      <span className="text-xs text-[#5a4138]">Full scapulae retracted, chin elevated, full inspiration hold verified</span>
                    </div>
                    <span className="material-symbols-outlined text-[#006b25] ml-auto text-[20px]">verified</span>
                  </label>
                </div>
              </div>

              {/* Tube Status & Exposure Confirmation Visualizer */}
              <div className="bg-[#f2f4f6] rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#191c1e]">Radiation Exposure Cycle</span>
                  <span className="text-xs text-[#006b25] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#006b25]"></span> ACQUIRED • DICOM READY
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-[#e0e3e5] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#006b25] h-full rounded-full w-full transition-all duration-500"></div>
                </div>
                <div className="flex items-center justify-between text-xs text-[#5a4138] font-mono">
                  <span>Primary Exposure: 0.12 sec</span>
                  <span>Dose Area Product: 0.14 Gy·cm²</span>
                </div>
              </div>

              {/* Main Actions */}
              <div className="flex flex-col gap-4 pt-2">
                {/* Large Primary Action Button: #166534 Green */}
                <button 
                  onClick={handleComplete}
                  className="w-full bg-[#166534] hover:bg-[#14532d] active:scale-[0.99] text-white font-bold text-base sm:text-lg rounded-full h-14 sm:h-16 px-8 flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all btn-press"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-[26px]">task_alt</span>
                  <span>COMPLETE TEST / SCAN →</span>
                </button>

                {/* Secondary & Back Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={handlePauseToggle}
                    className="w-full bg-[#f2f4f6] hover:bg-[#e7e8eb] text-[#455f8a] font-semibold text-sm rounded-full h-12 px-6 flex items-center justify-center gap-2 shadow-sm transition-colors btn-press"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isPaused ? 'play_arrow' : 'pause_circle'}
                    </span>
                    <span>{isPaused ? 'RESUME SCAN' : 'PAUSE / HOLD'}</span>
                  </button>
                  <Link 
                    to="/diagnostic/request"
                    state={{ request }}
                    className="w-full bg-[#e7e8eb] hover:bg-[#e0e3e5] text-[#191c1e] font-semibold text-sm rounded-full h-12 px-6 flex items-center justify-center gap-2 transition-colors text-center btn-press"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span>← Back</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technician Compliance Note */}
        <div className="w-full text-center py-2">
          <span className="text-xs text-[#5a4138]">
            AERB Safety Protocol Code: RP-2024-X49 • Operator Sign-off: Radiographer S. Varma (Lic #DEL-RAD-884)
          </span>
        </div>
      </div>
    </DiagnosticLayout>
  )
}
