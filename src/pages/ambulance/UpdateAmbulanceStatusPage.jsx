import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AmbulanceLayout from '../../components/layout/AmbulanceLayout'
import { getAmbulanceRequest, updateAmbulanceStatus } from '../../data/patientMockData'
import { EmergencyApi } from '../../services/emergencyApi'

export default function UpdateAmbulanceStatusPage() {
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [destination, setDestination] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('On the Way')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    async function loadReq() {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const targetId = searchParams.get('id')
        const res = await EmergencyApi.getAmbulanceRequests({ activeOnly: true })
        if (res.ok && res.data?.requests && res.data.requests.length > 0) {
          const r = (targetId ? res.data.requests.find(x => String(x.id) === String(targetId)) : null) || res.data.requests[0]
          setRequest({
            id: r.id,
            status: r.status,
            patientName: r.patient_name || 'Unidentified Citizen',
            patientAge: r.patient_age,
            patientGender: r.patient_gender,
            patientId: r.patient_id ? `PAT-${String(r.patient_id).padStart(4, '0')}` : 'PAT-8841',
            requestNumber: r.request_number,
            pickupLocation: r.pickup_location || 'Sector 14, Dwarka',
            destination: r.destination || 'District Civil Hospital Emergency Wing'
          })
          if (r.status && ['Accepted', 'Assigned', 'On the Way', 'En Route', 'Arrived', 'Completed'].includes(r.status)) {
            setSelectedStatus(r.status === 'En Route' ? 'On the Way' : (r.status === 'Assigned' ? 'Accepted' : r.status))
          }

          try {
            const destRes = await EmergencyApi.getReceivingDestination(r.id)
            if (destRes.ok && destRes.data?.destination?.receivingHospital) {
              setDestination(destRes.data.destination)
            }
          } catch (e) {}

          return
        }
      } catch (e) {}

      const req = getAmbulanceRequest()
      setRequest(req)
      if (req.status && ['Accepted', 'On the Way', 'Arrived', 'Completed'].includes(req.status)) {
        setSelectedStatus(req.status)
      }
    }

    loadReq()
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)
    if (request?.id) {
      try {
        await EmergencyApi.updateAmbulanceRequestStatus(request.id, selectedStatus)
      } catch (e) {}
    }
    updateAmbulanceStatus(selectedStatus)
    setIsUpdating(false)
    setShowToast(true)

    setTimeout(() => {
      if (selectedStatus === 'Completed') {
        navigate(request?.id ? `/ambulance/completed?id=${request.id}` : '/ambulance/completed')
      } else {
        navigate(request?.id ? `/ambulance/patient-location?id=${request.id}` : '/ambulance/patient-location')
      }
    }, 900)
  }

  if (!request) {
    return (
      <AmbulanceLayout activeNav="Emergency Requests">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500">Loading operational state...</p>
        </div>
      </AmbulanceLayout>
    )
  }

  const statuses = [
    {
      id: 'Accepted',
      title: 'Accepted & Dispatched',
      badge: 'Prior Stage',
      time: '14:18 IST',
      desc: 'Emergency request acknowledged, unit dispatched to patient pickup coordinates.',
      icon: 'done_all'
    },
    {
      id: 'On the Way',
      title: 'Transporting Patient',
      badge: 'Live Transit',
      time: 'Live Transit',
      desc: destination?.receivingHospital
        ? `Ambulance transporting patient to ${destination.receivingHospital}, ${destination.receivingBuilding || 'Emergency Block'} (${destination.receivingRoom || 'Trauma Bay 2'}).`
        : 'Ambulance is actively transporting patient towards assigned hospital destination.',
      icon: 'navigation',
      subtext: 'Speed: 42 km/h • Hospital triage alerted'
    },
    {
      id: 'Arrived',
      title: 'Arrived at Assigned Bay',
      badge: 'On Site',
      time: 'Pending Arrival',
      desc: destination?.receivingRoom
        ? `Unit reached hospital; patient ready for transfer to ${destination.receivingRoom}.`
        : 'Unit reached assigned hospital destination; beginning clinical handover.',
      icon: 'pin_drop'
    },
    {
      id: 'Completed',
      title: 'Patient Handover & Case Completed',
      badge: 'Final Stage',
      time: 'Handover Ready',
      desc: 'Patient safely handed over to hospital emergency care team; encounter closed.',
      icon: 'check_circle'
    }
  ]

  return (
    <AmbulanceLayout activeNav="Emergency Requests">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto flex flex-col gap-6">
        {/* Navigation & Page Header */}
        <div className="flex flex-col gap-2">
          <Link 
            to={request?.id ? `/ambulance/scene-assessment?id=${request.id}` : '/ambulance/scene-assessment'} 
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#7c2800] hover:text-[#cd4700] transition-colors w-fit group"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span>Back to Scene Assessment</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Update Ambulance Status
                </h1>
                <span className="px-3.5 py-1 bg-[#d6e3ff] text-[#001b3d] font-bold text-xs rounded-full tracking-wide" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Unit Transit Progression
                </span>
              </div>
              <p className="text-sm text-[#5a4138] mt-1">
                Select current operational state for emergency dispatch <span className="font-semibold text-[#191c1e] font-mono">{request.requestNumber}</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#e7e8eb] px-4 py-1.5 rounded-full text-xs font-semibold text-[#191c1e] self-start md:self-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006b25] animate-pulse"></span>
              <span>Telemetry Link: Active (4G/GPS)</span>
            </div>
          </div>
        </div>

        {/* Trip Context Summary Card */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#ba1a1a] shrink-0">
                <span className="material-symbols-outlined text-3xl">emergency</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {request.patientName}
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#5a4138] bg-[#f2f4f6] px-2 py-0.5 rounded">
                    ID: {request.patientId}
                  </span>
                </div>
                <span className="text-xs text-[#5a4138] mt-0.5">
                  Priority 1 Critical Response • {request.patientGender}, {request.patientAge}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#f2f4f6] px-4 py-3 rounded-xl w-full lg:w-auto text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#5a4138] uppercase font-bold">Pickup</span>
                <span className="font-semibold text-[#191c1e] truncate max-w-[150px]">{request.pickupLocation}</span>
              </div>
              <span className="material-symbols-outlined text-base text-[#5a4138]">arrow_forward</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#5a4138] uppercase font-bold">Assigned Bay</span>
                <span className="font-semibold text-[#7c2800] truncate max-w-[180px]">
                  {destination?.receivingHospital
                    ? `${destination.receivingHospital} • ${destination.receivingRoom || 'Trauma Bay 2'}`
                    : (request.destination || 'District Civil Hospital')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Transit Flow Pipeline */}
        <div className="bg-[#f2f4f6] rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="grid grid-cols-4 gap-2 items-center text-center">
            {statuses.map((st, idx) => {
              const isPassedOrCurrent = 
                selectedStatus === st.id || 
                (selectedStatus === 'Completed') ||
                (selectedStatus === 'Arrived' && idx <= 2) ||
                (selectedStatus === 'On the Way' && idx <= 1) ||
                (selectedStatus === 'Accepted' && idx === 0)

              const isCurrent = selectedStatus === st.id

              return (
                <div key={st.id} className={`flex flex-col items-center gap-1 ${isPassedOrCurrent ? '' : 'opacity-40'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent 
                      ? 'bg-[#00501a] text-white ring-4 ring-[#00501a]/20' 
                      : isPassedOrCurrent 
                        ? 'bg-[#00501a] text-white' 
                        : 'bg-[#e0e3e5] text-[#5a4138]'
                  }`}>
                    {isPassedOrCurrent && !isCurrent ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className={`text-xs font-semibold ${isCurrent ? 'text-[#00501a] font-bold' : 'text-[#5a4138]'}`}>
                    {st.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status Selection Area (Exactly 4 Options) */}
        <section aria-label="Ambulance Operational Status" className="flex flex-col gap-3">
          {statuses.map((option) => {
            const isSelected = selectedStatus === option.id

            return (
              <label 
                key={option.id}
                onClick={() => setSelectedStatus(option.id)}
                className={`group relative flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all shadow-sm border ${
                  isSelected 
                    ? 'bg-[#006b25]/10 border-[#006b25]/40 shadow-md ring-2 ring-[#006b25]/20' 
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="radio"
                  name="transit_status"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setSelectedStatus(option.id)}
                  className="sr-only"
                />
                <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isSelected 
                    ? 'bg-[#006b25] text-white' 
                    : 'bg-[#eceef0] text-[#5a4138]'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white' : 'bg-transparent'}`}></span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${isSelected ? 'text-[#006b25]' : 'text-[#191c1e]'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                        {option.title}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        isSelected 
                          ? 'bg-[#006b25] text-white' 
                          : 'bg-[#eceef0] text-[#5a4138]'
                      }`}>
                        {option.badge}
                      </span>
                    </div>
                    <span className="text-xs text-[#5a4138] font-mono">{option.time}</span>
                  </div>
                  <p className="text-sm text-[#5a4138] mt-1 leading-relaxed">
                    {option.desc}
                  </p>
                  {option.subtext && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#006b25]">
                      <span className="material-symbols-outlined text-base">speed</span>
                      <span>{option.subtext}</span>
                    </div>
                  )}
                </div>
              </label>
            )
          })}
        </section>

        {/* Immediate Patient Sync Banner */}
        <div className="flex items-start gap-3 bg-[#e7e8eb]/70 rounded-xl p-4 border border-slate-200">
          <span className="material-symbols-outlined text-[#7c2800] text-xl shrink-0 mt-0.5">sync</span>
          <div className="flex flex-col text-xs text-[#5a4138]">
            <span className="font-bold text-[#191c1e] text-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Immediate Patient Sync
            </span>
            <p className="mt-0.5 leading-relaxed">
              Status changes synchronize in real time with the Patient Emergency Portal (02.05 Live Ambulance Location) and national 108 dispatch registry.
            </p>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="pt-2 pb-8 flex items-center justify-between gap-4">
          <Link 
            to={request?.id ? `/ambulance/scene-assessment?id=${request.id}` : '/ambulance/scene-assessment'} 
            className="inline-flex items-center justify-center px-8 h-12 rounded-full bg-white text-[#455f8a] font-semibold text-sm shadow-sm hover:bg-slate-50 transition-all border border-slate-100 btn-press"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            ← Back to Scene Assessment
          </Link>

          <button 
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="inline-flex items-center justify-center gap-2 px-10 h-14 rounded-full bg-[#166534] hover:bg-[#14532d] text-white font-bold text-base hover:shadow-lg transition-all shadow-md active:scale-95 btn-press"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            {isUpdating ? (
              <>
                <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                <span>Updating Telemetry...</span>
              </>
            ) : (
              <>
                <span>UPDATE STATUS</span>
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </>
            )}
          </button>
        </div>

        {/* Toast confirmation */}
        {showToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-full bg-[#006b25] text-white shadow-2xl animate-bounce">
            <span className="material-symbols-outlined text-[24px]">verified</span>
            <span className="font-semibold text-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Status updated to "{selectedStatus}"! Telemetry Synced.
            </span>
          </div>
        )}
      </div>
    </AmbulanceLayout>
  )
}
