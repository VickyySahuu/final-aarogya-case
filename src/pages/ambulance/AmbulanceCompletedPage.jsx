import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AmbulanceLayout from '../../components/layout/AmbulanceLayout'
import { getAmbulanceRequest, updateAmbulanceStatus } from '../../data/patientMockData'
import { EmergencyApi } from '../../services/emergencyApi'

export default function AmbulanceCompletedPage() {
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)

  useEffect(() => {
    async function syncCompletion() {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const targetId = searchParams.get('id')
        const res = await EmergencyApi.getAmbulanceRequests()
        if (res.ok && res.data?.requests && res.data.requests.length > 0) {
          const r = (targetId ? res.data.requests.find(x => String(x.id) === String(targetId)) : null) || res.data.requests[0]
          if (r.status !== 'Completed') {
            await EmergencyApi.updateAmbulanceRequestStatus(r.id, 'Completed').catch(() => {})
          }

          let dest = null
          try {
            const destRes = await EmergencyApi.getReceivingDestination(r.id)
            if (destRes.ok && destRes.data?.destination?.receivingHospital) {
              dest = destRes.data.destination
            }
          } catch (e) {}

          setRequest({
            id: r.id,
            patientName: r.patient_name || 'Unidentified Citizen',
            status: 'Completed',
            patientId: r.patient_id ? `PAT-${String(r.patient_id).padStart(4, '0')}` : 'PAT-8841',
            patientUniqueCode: r.patient_unique_code || 'AC-7F42K9',
            requestNumber: r.request_number || 'EMG-2026-000001',
            pickupLocation: r.pickup_location || 'Sector 14 Dwarka',
            destination: dest?.receivingHospital || r.destination || 'District Civil Hospital Emergency Wing',
            destinationBay: dest ? `${dest.receivingBuilding || 'Main Emergency Block'} • ${dest.receivingFloor || 'Ground Floor'} • ${dest.receivingRoom || 'Trauma Bay 2'}` : (r.destination_bay || 'Main Emergency Block • Trauma Bay 2'),
            unit: r.ambulance_number || 'Ambulance Unit #08',
            operatorId: 'AMB-OP-104',
            eta: r.eta || '10 mins',
            distance: r.distance || '5.2 km',
            contactNumber: r.contact_number || '+91 98765 43210'
          })
          return
        }
      } catch (e) {}

      // Ensure request status is marked Completed locally
      const req = updateAmbulanceStatus('Completed')
      setRequest(req)
    }

    syncCompletion()
  }, [])

  if (!request) {
    return (
      <AmbulanceLayout activeNav="Completed">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500">Loading mission summary...</p>
        </div>
      </AmbulanceLayout>
    )
  }

  return (
    <AmbulanceLayout activeNav="Completed">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 max-w-6xl mx-auto pb-16">
        {/* Breadcrumb / Pipeline Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#5a4138]">
            <span className="font-bold uppercase tracking-widest text-[#5a4138]">EMERGENCY DISPATCH PIPELINE</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold uppercase tracking-wider text-[#006b25]">MISSION FINALIZED</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#006b25]/15 text-[#006b25] px-4 py-1.5 rounded-full self-start md:self-auto shadow-sm text-xs font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Encounter Successfully Closed</span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-100 overflow-hidden text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#99f89e] flex items-center justify-center text-[#002106] mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[44px]">check_circle</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Request Completed
          </h1>
          <p className="text-base sm:text-lg text-[#5a4138] max-w-xl mt-2 leading-relaxed">
            Emergency request completed successfully. Rapid handover protocol concluded with zero transmission errors.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-[#5a4138] font-semibold">
            <span className="flex items-center gap-1.5 bg-[#f2f4f6] px-4 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[16px]">schedule</span> Total Mission Duration: 28m 42s
            </span>
            <span className="flex items-center gap-1.5 bg-[#f2f4f6] px-4 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[16px]">shield</span> Audit Log Synced to NDHM Registry
            </span>
          </div>
        </div>

        {/* Clinical Continuity Record Dossier */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7c2800]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Clinical Continuity Record
              </span>
              <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Emergency Encounter Dossier
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-[#006b25] text-white px-4 py-1.5 rounded-full shadow-sm text-xs font-bold self-start sm:self-auto" style={{ fontFamily: 'Lexend, sans-serif' }}>
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>Status: Completed</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#f2f4f6] rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[#5a4138]">
                <span className="material-symbols-outlined text-[20px]">tag</span>
                <span className="text-xs uppercase font-bold tracking-wider">Request Number</span>
              </div>
              <span className="text-lg font-bold text-[#191c1e] font-mono mt-3">{request.requestNumber}</span>
              <span className="text-xs text-[#5a4138] mt-1">Cadence: High Priority Red</span>
            </div>

            <div className="bg-[#f2f4f6] rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[#5a4138]">
                <span className="material-symbols-outlined text-[20px]">person</span>
                <span className="text-xs uppercase font-bold tracking-wider">Patient Name</span>
              </div>
              <span className="text-lg font-bold text-[#191c1e] mt-3" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {request.patientName}
              </span>
              <span className="text-xs text-[#5a4138] mt-1">Age 54 • Male • Triage L1</span>
            </div>

            <div className="bg-[#f2f4f6] rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[#5a4138]">
                <span className="material-symbols-outlined text-[20px]">badge</span>
                <span className="text-xs uppercase font-bold tracking-wider">Patient ID</span>
              </div>
              <span className="text-lg font-bold text-[#191c1e] font-mono mt-3">{request.patientId}</span>
              <span className="text-xs text-[#5a4138] mt-1">Aarogya Master Registry</span>
            </div>

            <div className="bg-[#f2f4f6] rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[#5a4138]">
                <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                <span className="text-xs uppercase font-bold tracking-wider">Patient Unique Code</span>
              </div>
              <span className="text-lg font-bold text-[#7c2800] font-mono mt-3">{request.patientUniqueCode}</span>
              <span className="text-xs text-[#006b25] mt-1 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Verified Identity
              </span>
            </div>

            <div className="bg-[#f2f4f6] rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[#5a4138]">
                <span className="material-symbols-outlined text-[20px]">ambulance</span>
                <span className="text-xs uppercase font-bold tracking-wider">Responding Unit</span>
              </div>
              <span className="text-base font-bold text-[#191c1e] mt-3">{request.unit}</span>
              <span className="text-xs text-[#5a4138] mt-1">Operator: {request.operatorId}</span>
            </div>

            <div className="bg-[#f2f4f6] rounded-2xl p-5 flex flex-col justify-between lg:col-span-2">
              <div className="flex items-center gap-2 text-[#5a4138]">
                <span className="material-symbols-outlined text-[20px]">local_hospital</span>
                <span className="text-xs uppercase font-bold tracking-wider">Destination Hospital</span>
              </div>
              <span className="text-base font-bold text-[#191c1e] mt-3">{request.destination}</span>
              <span className="text-xs text-[#5a4138] mt-1">{request.destinationBay}</span>
            </div>

            <div className="bg-[#f2f4f6] rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[#5a4138]">
                <span className="material-symbols-outlined text-[20px]">update</span>
                <span className="text-xs uppercase font-bold tracking-wider">Handover Timestamp</span>
              </div>
              <span className="text-base font-bold text-[#006b25] mt-3">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} IST</span>
              <span className="text-xs text-[#5a4138] mt-1">Signed digitally via OTP token</span>
            </div>
          </div>

          {/* Sync status box */}
          <div className="bg-[#d6e3ff]/50 rounded-2xl p-5 flex items-center gap-4 border border-[#b2cdfe]">
            <div className="w-12 h-12 rounded-full bg-[#b2cdfe] flex items-center justify-center shrink-0 text-[#001b3d]">
              <span className="material-symbols-outlined text-[24px]">sync_saved_locally</span>
            </div>
            <div className="flex flex-col text-xs text-[#001b3d]">
              <span className="font-bold text-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Patient Telemetry &amp; EMR Synchronized
              </span>
              <p className="mt-1 leading-relaxed">
                The patient emergency case has been updated and handed over to Hospital OPD &amp; Emergency Triage. Encounter record synchronized across national 108 network.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
          <Link 
            to="/ambulance/dashboard" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-base px-10 h-14 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 btn-press"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span>BACK TO DASHBOARD</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>

          <button 
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#e7e8eb] hover:bg-[#e0e3e5] text-[#191c1e] font-semibold text-base px-8 h-14 rounded-full transition-all btn-press"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            <span>Print Mission Sheet</span>
          </button>
        </div>
      </div>
    </AmbulanceLayout>
  )
}
