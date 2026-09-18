import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import UtilityBar from '../../components/layout/UtilityBar'
import Header from '../../components/layout/Header'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Footer from '../../components/layout/Footer'
import { EmergencyApi } from '../../services/emergencyApi'
import { buildGoogleMapsDirectionsUrl, isValidCoordinate } from '../../services/googleMapsUtils'

export default function AmbulanceAssignedPage() {
  const location = useLocation()
  const [requestData, setRequestData] = useState(() => {
    if (location.state?.request) return location.state.request
    try {
      const stored = localStorage.getItem('aarogya_active_emergency_request')
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadRequest() {
      setIsLoading(true)
      let activeReq = requestData
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const queryId = urlParams ? (urlParams.get('id') || urlParams.get('requestId') || urlParams.get('requestNumber')) : null

      try {
        const reqId = queryId || activeReq?.id || activeReq?.request_number || activeReq?.requestNumber ||
          (typeof window !== 'undefined' ? localStorage.getItem('aarogya_active_emergency_request_id') : null)

        if (reqId) {
          try {
            const res = await EmergencyApi.getEmergencyRequest(reqId)
            if (res.ok && res.data?.request) {
              activeReq = res.data.request
              if (isMounted) setRequestData(activeReq)
              try {
                localStorage.setItem('aarogya_active_emergency_request', JSON.stringify(activeReq))
                localStorage.setItem('aarogya_active_emergency_request_id', String(activeReq.id))
              } catch (e) {}
            }
          } catch (err) {
            console.warn('[AmbulanceAssignedPage] Backend request fetch fallback:', err)
          }
        }
      } catch (err) {
        console.error('[AmbulanceAssignedPage] Load error:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadRequest()
    return () => { isMounted = false }
  }, [])

  // Extract coordinates with multi-tier preservation:
  // Tier 1: backend requestData (latitude, incidentLatitude)
  // Tier 2: router location.state.location (real browser coordinates from dispatch step)
  // Tier 3: localStorage 'aarogya_emergency_location' (persisted real browser coordinates)
  let savedCoords = null
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('aarogya_emergency_location') : null
    if (raw) savedCoords = JSON.parse(raw)
  } catch (e) {}

  const navLocation = location.state?.location || null

  const incidentLat = requestData?.latitude !== undefined && requestData?.latitude !== null
    ? Number(requestData.latitude)
    : (requestData?.incidentLatitude !== undefined && requestData?.incidentLatitude !== null
      ? Number(requestData.incidentLatitude)
      : (navLocation?.latitude !== undefined && navLocation?.latitude !== null
        ? Number(navLocation.latitude)
        : (savedCoords?.latitude !== undefined && savedCoords?.latitude !== null
          ? Number(savedCoords.latitude)
          : null)))

  const incidentLng = requestData?.longitude !== undefined && requestData?.longitude !== null
    ? Number(requestData.longitude)
    : (requestData?.incidentLongitude !== undefined && requestData?.incidentLongitude !== null
      ? Number(requestData.incidentLongitude)
      : (navLocation?.longitude !== undefined && navLocation?.longitude !== null
        ? Number(navLocation.longitude)
        : (savedCoords?.longitude !== undefined && savedCoords?.longitude !== null
          ? Number(savedCoords.longitude)
          : null)))

  const ambLat = requestData?.ambulanceLatitude !== undefined && requestData?.ambulanceLatitude !== null
    ? Number(requestData.ambulanceLatitude)
    : (requestData?.ambulance_latitude !== undefined && requestData?.ambulance_latitude !== null ? Number(requestData.ambulance_latitude) : null)
  const ambLng = requestData?.ambulanceLongitude !== undefined && requestData?.ambulanceLongitude !== null
    ? Number(requestData.ambulanceLongitude)
    : (requestData?.ambulance_longitude !== undefined && requestData?.ambulance_longitude !== null ? Number(requestData.ambulance_longitude) : null)

  const hospLat = requestData?.hospitalLatitude ?? requestData?.hospital_latitude ?? null
  const hospLng = requestData?.hospitalLongitude ?? requestData?.hospital_longitude ?? null

  // Google Maps links
  const patientLocationUrl = buildGoogleMapsDirectionsUrl(incidentLat, incidentLng)
  const ambulanceLocationUrl = isValidCoordinate(ambLat, ambLng) ? buildGoogleMapsDirectionsUrl(ambLat, ambLng) : null
  const hospitalLocationUrl = buildGoogleMapsDirectionsUrl(hospLat, hospLng)

  const currentStatus = requestData?.status || 'Assigned'
  const isArrived = ['Arrived', 'At Scene', 'On Site', 'On Scene'].includes(currentStatus)
  const isTransporting = ['Transporting', 'Transporting Patient', 'In Transit to Hospital'].includes(currentStatus)

  return (
    <div className="bg-[#f8f9fc] text-[#191c1e] antialiased flex flex-col min-h-screen">
      <UtilityBar activeService="Emergency Dispatch" />
      <Header portalBadge="Patient Portal" activeNav="EMERGENCY" />
      <Breadcrumbs 
        items={[
          { label: 'Emergency', to: '/emergency' },
          { label: 'Ambulance Assigned' }
        ]} 
        backTo="/emergency/request-ambulance" 
        backLabel="Back to Request" 
      />

      <main className="flex-1 w-full py-6 md:py-8 px-4 md:px-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {/* STEPPER: 4-Step Progress Tracker */}
          <section aria-label="Dispatch Progress" className="w-full bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
              {/* Step 1: Completed */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#166534] whitespace-nowrap">Step 1</span>
                  <span className="text-xs text-gray-600 whitespace-nowrap">Location Shared</span>
                </div>
              </div>
              <div className="h-0.5 flex-1 bg-[#166534] min-w-[20px] max-w-[80px]"></div>

              {/* Step 2: Completed */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#166534] whitespace-nowrap">Step 2</span>
                  <span className="text-xs text-gray-600 whitespace-nowrap">Request Confirmed</span>
                </div>
              </div>
              <div className="h-0.5 flex-1 bg-[#166534] min-w-[20px] max-w-[80px]"></div>

              {/* Step 3: Active */}
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full shrink-0">
                <div className="w-7 h-7 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  3
                </div>
                <div className="flex flex-col pr-1">
                  <span className="text-xs font-bold text-[#166534] whitespace-nowrap">Ambulance Assigned</span>
                  <span className="text-[10px] text-green-800 font-medium">In Progress</span>
                </div>
              </div>
              <div className="h-0.5 flex-1 bg-gray-200 min-w-[20px] max-w-[80px]"></div>

              {/* Step 4: Upcoming */}
              <div className="flex items-center gap-2 opacity-50 shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Step 4</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">Status Updates</span>
                </div>
              </div>
            </div>
          </section>

          {/* DISPATCH CONFIRMATION BANNER */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-start gap-4 z-10">
              <div className="w-14 h-14 rounded-full bg-green-100 text-[#166534] flex items-center justify-center shrink-0 border border-green-200 shadow-sm">
                <span className="material-symbols-outlined text-[32px] fill">check_circle</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-[#166534] font-bold">Dispatch Confirmed</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                  <span className="text-xs text-gray-500">Emergency Dispatch Unit</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-[#166534] border border-emerald-200">ACTIVE</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mt-1">Ambulance Assigned</h1>
                <p className="text-base text-gray-600 mt-1">Emergency vehicle is dispatched and en route to your location.</p>
              </div>
            </div>

            {/* Token Number Display Card */}
            <div className="flex flex-col items-start md:items-end bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-xl shrink-0 z-10 w-full md:w-auto">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs uppercase tracking-wider text-gray-600 font-semibold">Request Number</span>
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-green-100 text-green-800">ACTIVE</span>
              </div>
              <span className="text-xl md:text-2xl font-bold tracking-tight text-[#166534]">
                {requestData?.requestNumber || requestData?.request_number || 'EMG-2026-000001'}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">Show this reference to responder on arrival</span>
            </div>
          </section>

          {/* ASSIGNED VEHICLE CARD */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Assigned Vehicle Details</h2>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-[#166534] border border-emerald-200">
                  {currentStatus}
                </span>
              </div>
              <span className="text-xs text-[#166534] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#166534] animate-ping"></span>
                Active Dispatch
              </span>
            </div>

            {/* Vehicle Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ambulance Number */}
              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-[#166534] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[26px]">ambulance</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Ambulance Number</span>
                  </div>
                  <div className="text-2xl font-bold text-[#166534] tracking-tight mt-0.5">
                    {requestData?.ambulanceNumber || requestData?.ambulance_number || 'Ambulance Unit #08'}
                  </div>
                </div>
              </div>

              {/* Vehicle Plate Number */}
              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-gray-200 text-gray-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">directions_car</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Vehicle Number</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 tracking-wider mt-0.5">
                    {requestData?.vehicleNumber || requestData?.vehicle_number || 'DL-01-EQ-9041'}
                  </div>
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#166534] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">local_hospital</span>
              </div>
              <div className="flex-1">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Receiving Destination</span>
                <div className="text-lg font-bold text-gray-900 mt-0.5">
                  {requestData?.receivingHospital || requestData?.receiving_hospital || requestData?.destination || 'District Civil Hospital'}
                </div>
                <span className="text-[11px] bg-green-100 text-[#166534] px-2 py-0.5 rounded font-semibold border border-green-200 inline-block mt-1">
                  {requestData?.receivingRoom || requestData?.receiving_room || requestData?.destinationBay || 'Triage Receiving Active'}
                </span>
              </div>
            </div>
          </section>

          {/* PATIENT LOCATION — Google Maps Link */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <span className="material-symbols-outlined text-[22px] text-[#166534]">location_on</span>
              <h2 className="text-base font-bold text-gray-900">Patient / Incident Location</h2>
            </div>

            {isValidCoordinate(incidentLat, incidentLng) ? (
              <div className="flex flex-col gap-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#166534] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[26px]">my_location</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-bold text-[#166534] flex items-center gap-1.5">
                      GPS Location Verified
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    </span>
                    <span className="text-sm font-mono text-slate-700 mt-0.5">
                      {Number(incidentLat).toFixed(4)}° N, {Number(incidentLng).toFixed(4)}° E
                    </span>
                  </div>
                </div>

                <a
                  href={patientLocationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 rounded-full bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 btn-press"
                >
                  <span className="material-symbols-outlined text-[22px]">map</span>
                  <span>OPEN PATIENT LOCATION IN GOOGLE MAPS</span>
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-700 text-[22px]">location_off</span>
                <span className="text-sm font-semibold text-amber-800">Location unavailable</span>
              </div>
            )}

            {/* Ambulance Location (if telemetry exists) */}
            {ambulanceLocationUrl && (
              <a
                href={ambulanceLocationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 btn-press"
              >
                <span className="material-symbols-outlined text-[20px]">ambulance</span>
                <span>OPEN AMBULANCE LOCATION</span>
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </a>
            )}

            {/* Hospital Location (during transport) */}
            {isTransporting && hospitalLocationUrl && (
              <a
                href={hospitalLocationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 btn-press"
              >
                <span className="material-symbols-outlined text-[20px]">local_hospital</span>
                <span>OPEN HOSPITAL ROUTE IN GOOGLE MAPS</span>
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </a>
            )}
          </section>

          {/* Arrival Advisory */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-gray-600 block font-bold mb-3">
              Arrival Instructions for Patient
            </span>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#166534] text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Keep phone line clear in case the ambulance crew calls for landmark directions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#166534] text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Have Token Number <strong className="text-gray-900 font-semibold">{requestData?.requestNumber || requestData?.request_number || 'EMG-REF'}</strong> ready to verify responder arrival.</span>
              </li>
            </ul>
          </section>

          {/* ACTION BUTTONS */}
          <section className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-8">
            <Link 
              className="w-full sm:w-auto px-5 py-2 rounded-full bg-white text-gray-700 border border-gray-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-xs order-2 sm:order-1" 
              to="/emergency/request-ambulance"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back</span>
            </Link>
            <Link 
              className="w-full sm:w-auto rounded-full bg-[#166534] text-white font-bold text-sm tracking-wide px-8 py-3.5 flex items-center justify-center gap-2.5 hover:bg-[#12532b] transition-all shadow-md hover:shadow-lg order-1 sm:order-2 group" 
              to={`/emergency/live-location${requestData?.id ? `?id=${requestData.id}` : ''}`}
              state={{ request: requestData }}
            >
              <span className="material-symbols-outlined text-[20px]">info</span>
              <span>VIEW LIVE STATUS</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
