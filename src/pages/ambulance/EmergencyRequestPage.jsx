import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AmbulanceLayout from '../../components/layout/AmbulanceLayout'
import { getAmbulanceRequest, updateAmbulanceStatus } from '../../data/patientMockData'
import PatientQrCode from '../../components/common/PatientQrCode'
import { EmergencyApi } from '../../services/emergencyApi'

export default function EmergencyRequestPage() {
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)

  useEffect(() => {
    async function loadRequest() {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const targetId = searchParams.get('id')
        const res = await EmergencyApi.getAmbulanceRequests({ activeOnly: true })
        if (res.ok && res.data?.requests && res.data.requests.length > 0) {
          const r = (targetId ? res.data.requests.find(x => String(x.id) === String(targetId)) : null) || res.data.requests[0]
          setRequest({
            id: r.id,
            patientName: r.patient_name || 'Unidentified Citizen (Pending Scene Assessment)',
            status: r.status || 'Requested',
            patientId: r.patient_id ? `PAT-${String(r.patient_id).padStart(4, '0')}` : 'PAT-8841',
            patientUniqueCode: r.patient_unique_code || 'AC-7F42K9',
            requestNumber: r.request_number || 'EMG-2026-000001',
            pickupLocation: r.pickup_location || 'Sector 14 Dwarka',
            destination: r.destination || 'District Civil Hospital Emergency Wing',
            eta: r.eta || '10 mins',
            distance: r.distance || '5.2 km',
            contactNumber: r.contact_number || '+91 98765 43210',
            landmark: r.landmark || 'Opposite City Metro Pillar 420'
          })
          if (r.status !== 'Requested' && r.status !== 'Pending Acceptance') {
            setIsAccepted(true)
          }
          return
        }
      } catch (e) {}

      const req = getAmbulanceRequest()
      setRequest(req)
      if (req.status !== 'Pending Acceptance') {
        setIsAccepted(true)
      }
    }

    loadRequest()
  }, [])

  const handleAccept = async () => {
    if (isAccepted) {
      navigate(request?.id ? `/ambulance/patient-location?id=${request.id}` : '/ambulance/patient-location')
      return
    }

    setIsAccepting(true)
    if (request?.id) {
      try {
        await EmergencyApi.assignAmbulance(request.id)
      } catch (e) {}
    }
    updateAmbulanceStatus('Accepted')
    setIsAccepting(false)
    setIsAccepted(true)
    setTimeout(() => {
      navigate(request?.id ? `/ambulance/patient-location?id=${request.id}` : '/ambulance/patient-location')
    }, 600)
  }

  if (!request) {
    return (
      <AmbulanceLayout activeNav="Emergency Requests">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500">Loading emergency requisition...</p>
        </div>
      </AmbulanceLayout>
    )
  }

  return (
    <AmbulanceLayout activeNav="Emergency Requests">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16 pt-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col gap-2 mb-8">
          <Link 
            to="/ambulance/dashboard" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#455f8a] hover:text-[#7c2800] transition-colors w-fit group"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Emergency Request
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffdbcf] text-[#380d00] text-xs font-bold shadow-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="w-2 h-2 rounded-full bg-[#7c2800] animate-pulse"></span>
                Received from Patient Emergency (02)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5a4138] bg-[#eceef0] px-3.5 py-1.5 rounded-full font-semibold">
              <span className="material-symbols-outlined text-[16px] text-[#006b25]">verified</span>
              <span>Encrypted NHA Tele-Triage Node</span>
            </div>
          </div>
          <p className="text-sm text-[#5a4138]">
            Incoming citizen SOS requisition requisitioned via AAROGYA CASE Emergency network.
          </p>
        </div>

        {/* Request Quick Strip */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#7c2800] shrink-0">
                <span className="material-symbols-outlined text-[26px]">tag</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5a4138]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Request Tracking No.
                </span>
                <span className="text-lg font-bold text-[#191c1e] font-mono truncate">{request.requestNumber}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-6">
              <div className="w-12 h-12 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#455f8a] shrink-0">
                <span className="material-symbols-outlined text-[26px]">schedule</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5a4138]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Request Time
                </span>
                <span className="text-base font-semibold text-[#191c1e] truncate">{request.requestTime}</span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-4 pt-4 sm:pt-0 sm:pl-6">
              <div className="w-12 h-12 rounded-2xl bg-[#d6e3ff] flex items-center justify-center text-[#001b3d] shrink-0">
                <span className="material-symbols-outlined text-[26px]">pending_actions</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5a4138]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Dispatch Status
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#d6e3ff] text-[#001b3d] font-bold text-xs w-fit" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="w-2 h-2 rounded-full bg-[#455f8a]"></span>
                  {request.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Patient Identification Dossier */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded-full bg-[#7c2800]"></span>
                  <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Patient Identification Dossier
                  </h2>
                </div>
                <span className="bg-[#f2f4f6] px-3 py-1 rounded-full text-[#5a4138] text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#006b25]">check_circle</span>
                  Citizen Verified
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#f2f4f6] p-4 rounded-xl">
                  <span className="text-xs uppercase tracking-wider text-[#5a4138] font-bold block mb-1">Full Legal Name</span>
                  <p className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>{request.patientName}</p>
                </div>
                <div className="bg-[#f2f4f6] p-4 rounded-xl">
                  <span className="text-xs uppercase tracking-wider text-[#5a4138] font-bold block mb-1">Age & Gender</span>
                  <p className="text-lg font-bold text-[#191c1e]">{request.patientAge} • {request.patientGender}</p>
                </div>
                <div className="bg-[#f2f4f6] p-4 rounded-xl">
                  <span className="text-xs uppercase tracking-wider text-[#5a4138] font-bold block mb-1">Patient Tracking ID</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#455f8a] text-[20px]">badge</span>
                    <p className="font-mono text-base font-bold text-[#455f8a]">{request.patientId}</p>
                  </div>
                </div>
                <div className="bg-[#f2f4f6] p-4 rounded-xl">
                  <span className="text-xs uppercase tracking-wider text-[#5a4138] font-bold block mb-1">Patient Unique Code</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#7c2800] text-[20px]">fingerprint</span>
                    <p className="font-mono text-base font-bold text-[#7c2800]">{request.patientUniqueCode}</p>
                  </div>
                </div>
                <div className="md:col-span-2 bg-[#f2f4f6] p-4 rounded-xl flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#5a4138] font-bold block mb-1">Registered Contact Reference</span>
                    <p className="font-mono text-base font-semibold text-[#191c1e]">{request.contactNumber}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#99f89e] text-[#002106] text-xs font-bold">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Caller Verified
                  </span>
                </div>
              </div>
            </section>

            {/* Route & Transit Details */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded-full bg-[#455f8a]"></span>
                  <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Route &amp; Transit Details
                  </h2>
                </div>
                <div className="flex items-center gap-1 text-[#7c2800] bg-[#ffdbcf] px-3 py-1 rounded-full text-xs font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="material-symbols-outlined text-[16px]">navigation</span>
                  Priority Green Corridor
                </div>
              </div>

              <div className="space-y-4">
                {/* Origin */}
                <div className="bg-[#f2f4f6] p-5 rounded-xl flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#7c2800] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs uppercase font-bold text-[#7c2800] tracking-wider block mb-1">
                      Pickup Point (Origin)
                    </span>
                    <p className="text-base font-bold text-[#191c1e]">{request.pickupLocation}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#5a4138] bg-white px-3 py-1 rounded-full border border-slate-200">
                      <span className="material-symbols-outlined text-[16px] text-[#7c2800]">signpost</span>
                      <span>Landmark: {request.landmark}</span>
                    </div>
                  </div>
                </div>

                {/* Destination */}
                <div className="bg-[#f2f4f6] p-5 rounded-xl flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#006b25] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs uppercase font-bold text-[#006b25] tracking-wider block mb-1">
                      Destination Emergency Center
                    </span>
                    <p className="text-base font-bold text-[#191c1e]">{request.destination}</p>
                    <p className="text-xs text-[#5a4138] mt-1">{request.destinationBay} • Pre-alert Transmitted</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#eceef0] rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#b2cdfe] flex items-center justify-center text-[#455f8a]">
                    <span className="material-symbols-outlined text-[22px]">route</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#5a4138] font-bold block">Est. Distance &amp; ETA</span>
                    <span className="text-base font-bold text-[#455f8a]">{request.distance} • ~{request.eta} travel time</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006b25] animate-ping"></span>
                  <span className="text-xs text-[#5a4138] font-semibold">Optimal Traffic Vector Active</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Check-In Token Card */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs uppercase tracking-wider text-[#5a4138] font-bold">Check-In Token</span>
                <span className="material-symbols-outlined text-[#455f8a] text-[20px]">qr_code_scanner</span>
              </div>
              <h3 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Patient Unique Code QR
              </h3>
              <p className="text-xs text-[#5a4138] mt-1 mb-4">
                Identifier link for emergency dispatch and hospital check-in
              </p>
              <div className="p-4 bg-[#f8f9fc] rounded-2xl border border-slate-200 shadow-sm mb-3">
                <PatientQrCode code={request.patientUniqueCode} size={160} />
              </div>
              <div className="bg-[#eceef0] px-4 py-1.5 rounded-full mb-2">
                <span className="font-mono text-xs font-bold text-[#191c1e]">{request.patientUniqueCode}</span>
              </div>
              <p className="text-[11px] text-[#5a4138]">
                Conforms to NDHM verified patient security protocols.
              </p>
            </section>

            {/* Designated Unit */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#b2cdfe] text-[#455f8a] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">ambulance</span>
                </div>
                <h3 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Designated Unit
                </h3>
              </div>
              <div className="space-y-3">
                <div className="bg-[#f2f4f6] p-3.5 rounded-xl">
                  <span className="text-[11px] uppercase tracking-wider text-[#5a4138] font-bold block mb-0.5">Assigned Vehicle</span>
                  <p className="text-base font-bold text-[#191c1e]">{request.unit}</p>
                  <span className="inline-flex items-center gap-1 text-[#7c2800] text-xs font-semibold mt-0.5">
                    <span className="material-symbols-outlined text-[15px]">medical_services</span>
                    Advanced Life Support (ALS)
                  </span>
                </div>
                <div className="bg-[#f2f4f6] p-3.5 rounded-xl">
                  <span className="text-[11px] uppercase tracking-wider text-[#5a4138] font-bold block mb-0.5">Station Base</span>
                  <p className="text-sm font-semibold text-[#191c1e]">South West Dispatch Node</p>
                  <span className="text-xs text-[#5a4138]">Dwarka Sub-City Station Cluster</span>
                </div>
                <div className="bg-[#f2f4f6] p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#5a4138] font-bold block mb-0.5">Operator ID</span>
                    <p className="font-mono text-sm font-semibold text-[#191c1e]">{request.operatorId}</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006b25]"></span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Action Bar */}
        <div className="w-full mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link 
            to="/ambulance/dashboard" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-full bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] font-semibold text-sm transition-colors btn-press"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back</span>
          </Link>

          <button 
            onClick={handleAccept}
            disabled={isAccepting}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 h-14 rounded-full text-white font-bold text-base shadow-md transition-all active:scale-[0.99] btn-press ${
              isAccepted 
                ? 'bg-[#455f8a] hover:bg-[#3b5175]' 
                : 'bg-[#166534] hover:bg-[#14532d]'
            }`}
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            {isAccepting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>DISPATCHING UNIT #08...</span>
              </>
            ) : isAccepted ? (
              <>
                <span className="material-symbols-outlined text-[22px]">verified</span>
                <span>ACCEPTED • PROCEED TO LOCATION</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
                <span>ACCEPT REQUEST</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </AmbulanceLayout>
  )
}
