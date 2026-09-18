import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import UtilityBar from '../../components/layout/UtilityBar'
import Header from '../../components/layout/Header'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Footer from '../../components/layout/Footer'
import { EmergencyApi } from '../../services/emergencyApi'
import { buildGoogleMapsDirectionsUrl, isValidCoordinate } from '../../services/googleMapsUtils'

export default function AmbulanceLiveLocationPage() {
  const location = useLocation()
  const [request, setRequest] = useState(() => {
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

    async function loadTelemetry() {
      let activeReq = request
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const queryId = urlParams ? (urlParams.get('id') || urlParams.get('requestId') || urlParams.get('requestNumber')) : null

      try {
        const stored = localStorage.getItem('aarogya_active_emergency_request')
        if (stored && !activeReq) {
          activeReq = JSON.parse(stored)
        }
      } catch (e) {}

      const reqId = queryId || activeReq?.id || activeReq?.request_number || activeReq?.requestNumber ||
        (typeof window !== 'undefined' ? localStorage.getItem('aarogya_active_emergency_request_id') : null)

      try {
        if (reqId) {
          try {
            const res = await EmergencyApi.getEmergencyRequest(reqId)
            if (res.ok && res.data?.request) {
              activeReq = res.data.request
              if (isMounted) setRequest(activeReq)
              try {
                localStorage.setItem('aarogya_active_emergency_request', JSON.stringify(activeReq))
                localStorage.setItem('aarogya_active_emergency_request_id', String(activeReq.id))
              } catch (e) {}
            }
          } catch (err) {
            console.warn('[AmbulanceLiveLocationPage] Backend request fetch fallback:', err)
          }
        }

        // If no active request in backend or storage, check emergency location stored
        if (!activeReq || (!activeReq.latitude && !activeReq.incidentLatitude)) {
          try {
            const locStored = localStorage.getItem('aarogya_emergency_location')
            if (locStored) {
              const parsedLoc = JSON.parse(locStored)
              activeReq = {
                ...activeReq,
                latitude: parsedLoc.latitude,
                longitude: parsedLoc.longitude,
                pickup_location: parsedLoc.formatted || 'Live GPS Coordinates',
                status: activeReq?.status || 'En Route'
              }
            }
          } catch (e) {}
        }

        if (!isMounted) return
        setRequest(activeReq)
      } catch (err) {
        console.error('[AmbulanceLiveLocationPage] Telemetry error:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadTelemetry()

    // Poll every 6 seconds for live ambulance GPS and status updates
    const pollInterval = setInterval(() => {
      loadTelemetry()
    }, 6000)

    return () => {
      isMounted = false
      clearInterval(pollInterval)
    }
  }, [])

  // Extract coordinates with multi-tier preservation:
  let savedCoords = null
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('aarogya_emergency_location') : null
    if (raw) savedCoords = JSON.parse(raw)
  } catch (e) {}

  const navLocation = location.state?.location || null

  const incidentLat = request?.latitude !== undefined && request?.latitude !== null
    ? Number(request.latitude)
    : (request?.incidentLatitude !== undefined && request?.incidentLatitude !== null
      ? Number(request.incidentLatitude)
      : (navLocation?.latitude !== undefined && navLocation?.latitude !== null
        ? Number(navLocation.latitude)
        : (savedCoords?.latitude !== undefined && savedCoords?.latitude !== null
          ? Number(savedCoords.latitude)
          : null)))

  const incidentLng = request?.longitude !== undefined && request?.longitude !== null
    ? Number(request.longitude)
    : (request?.incidentLongitude !== undefined && request?.incidentLongitude !== null
      ? Number(request.incidentLongitude)
      : (navLocation?.longitude !== undefined && navLocation?.longitude !== null
        ? Number(navLocation.longitude)
        : (savedCoords?.longitude !== undefined && savedCoords?.longitude !== null
          ? Number(savedCoords.longitude)
          : null)))

  const ambLat = request?.ambulanceLatitude !== undefined && request?.ambulanceLatitude !== null
    ? Number(request.ambulanceLatitude)
    : (request?.ambulance_latitude !== undefined && request?.ambulance_latitude !== null ? Number(request.ambulance_latitude) : null)
  const ambLng = request?.ambulanceLongitude !== undefined && request?.ambulanceLongitude !== null
    ? Number(request.ambulanceLongitude)
    : (request?.ambulance_longitude !== undefined && request?.ambulance_longitude !== null ? Number(request.ambulance_longitude) : null)

  const hospLat = request?.hospitalLatitude ?? request?.hospital_latitude ?? null
  const hospLng = request?.hospitalLongitude ?? request?.hospital_longitude ?? null

  // Google Maps links
  const patientLocationUrl = buildGoogleMapsDirectionsUrl(incidentLat, incidentLng)
  const ambulanceLocationUrl = isValidCoordinate(ambLat, ambLng) ? buildGoogleMapsDirectionsUrl(ambLat, ambLng) : null
  const hospitalLocationUrl = buildGoogleMapsDirectionsUrl(hospLat, hospLng)

  // Status determination
  const rawStatus = (request?.status || '').trim().toLowerCase()
  const isArrived = ['arrived', 'at scene', 'on site', 'on scene'].includes(rawStatus)
  const isTransporting = ['transporting', 'transporting patient', 'in transit to hospital', 'hospital transit'].includes(rawStatus)

  const statusLabel = isArrived
    ? 'Ambulance Arrived at Scene'
    : isTransporting
    ? 'In Transit • En Route to Hospital'
    : isValidCoordinate(ambLat, ambLng)
    ? 'In Transit • En Route to Patient'
    : 'Awaiting Ambulance Location'

  return (
    <div className="bg-[#f4f6f8] text-[#191c1e] antialiased min-h-screen flex flex-col">
      <UtilityBar activeService="Emergency Live Status" />
      <Header portalBadge="Emergency Portal" activeNav="EMERGENCY" />
      <Breadcrumbs 
        items={[
          { label: 'Emergency', to: '/emergency' },
          { label: 'Live Status' }
        ]} 
        backTo="/emergency/ambulance-assigned" 
        backLabel="Back" 
      />

      <main className="w-full flex-grow py-6">
        <div className="max-w-3xl mx-auto px-4 md:px-8 flex flex-col gap-6">
          {/* STEPPER: 4-Step Progress Tracker */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative">
              {/* Step 1 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Step 1</span>
                  <span className="text-xs font-semibold text-slate-800">SOS Triggered</span>
                </div>
              </div>
              {/* Step 2 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Step 2</span>
                  <span className="text-xs font-semibold text-slate-800">Dispatch Queued</span>
                </div>
              </div>
              {/* Step 3 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Step 3</span>
                  <span className="text-xs font-semibold text-slate-800">Ambulance Assigned</span>
                </div>
              </div>
              {/* Step 4 (Active) */}
              <div className="flex items-center gap-3 bg-[#166534]/5 -m-1.5 p-1.5 rounded-lg border border-[#166534]/30">
                <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-md ring-4 ring-[#166534]/20">
                  <span>4</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">Active Now</span>
                  <span className="text-xs font-bold text-[#166534]">Live Status</span>
                </div>
              </div>
            </div>
          </div>

          {/* HEADER TITLE & STATUS BANNER */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl text-[#0A2540] font-bold tracking-tight">Ambulance Status</h1>
                <span className="bg-[#166534] text-white text-sm font-bold px-3.5 py-1 rounded-full shadow-sm tracking-wide">
                  {request?.ambulanceNumber || request?.ambulance_number || 'Ambulance Unit #08'}
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-600">
                Civic Emergency Medical Response Network • Request #{request?.requestNumber || request?.request_number || 'EMG-ACTIVE'}
              </p>
            </div>
            {/* Status Chip */}
            <div className="inline-flex items-center gap-2.5 bg-emerald-50 text-[#166534] border border-emerald-200 px-4 py-2 rounded-full self-start md:self-center shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#166534] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#166534]"></span>
              </span>
              <span className="text-sm font-semibold">{statusLabel}</span>
            </div>
          </div>

          {/* EMERGENCY STATUS CARD */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col gap-5">
            {/* Status Banner */}
            {isArrived && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#166534] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[30px]">check_circle</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-[#166534]">Arrived at Scene</span>
                  <span className="text-sm text-emerald-800">The ambulance has arrived at the incident location.</span>
                </div>
              </div>
            )}

            {isTransporting && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[30px]">local_hospital</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-blue-800">Transporting Patient</span>
                  <span className="text-sm text-blue-700">
                    Destination: {request?.receivingHospital || request?.receiving_hospital || 'District Civil Hospital'}
                  </span>
                </div>
              </div>
            )}

            {/* PATIENT LOCATION */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-red-600">location_on</span>
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Patient Location</span>
              </div>

              {isValidCoordinate(incidentLat, incidentLng) ? (
                <>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-[#166534]">check_circle</span>
                    <span className="text-sm font-mono text-slate-700">
                      {Number(incidentLat).toFixed(4)}° N, {Number(incidentLng).toFixed(4)}° E
                    </span>
                  </div>
                  <a
                    href={patientLocationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-14 rounded-full bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 btn-press"
                  >
                    <span className="material-symbols-outlined text-[22px]">map</span>
                    <span>OPEN IN GOOGLE MAPS</span>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </a>
                </>
              ) : (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-700 text-[22px]">location_off</span>
                  <span className="text-sm font-semibold text-amber-800">Location unavailable</span>
                </div>
              )}
            </div>

            {/* AMBULANCE LOCATION (if telemetry exists) */}
            {isValidCoordinate(ambLat, ambLng) && (
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-blue-600">ambulance</span>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ambulance Location</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">AVAILABLE</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">my_location</span>
                  <span className="text-sm font-mono text-slate-700">
                    {Number(ambLat).toFixed(4)}° N, {Number(ambLng).toFixed(4)}° E
                  </span>
                </div>
                <a
                  href={ambulanceLocationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 btn-press"
                >
                  <span className="material-symbols-outlined text-[20px]">ambulance</span>
                  <span>OPEN CURRENT AMBULANCE LOCATION</span>
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
              </div>
            )}

            {/* HOSPITAL LOCATION (during transport) */}
            {isTransporting && (
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-emerald-700">local_hospital</span>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Hospital Destination</span>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <span className="text-base font-bold text-slate-900 block">
                    {request?.receivingHospital || request?.receiving_hospital || 'District Civil Hospital'}
                  </span>
                  <span className="text-xs text-emerald-800 mt-0.5 block">
                    {request?.receivingRoom || request?.receiving_room || 'Emergency Department'}
                  </span>
                </div>
                {hospitalLocationUrl ? (
                  <a
                    href={hospitalLocationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 btn-press"
                  >
                    <span className="material-symbols-outlined text-[20px]">local_hospital</span>
                    <span>OPEN HOSPITAL IN GOOGLE MAPS</span>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </a>
                ) : (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-700 text-[20px]">location_off</span>
                    <span className="text-sm font-semibold text-amber-800">Hospital location unavailable</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-200">
              <Link 
                className="w-full sm:w-auto px-8 py-3.5 inline-flex items-center justify-center gap-2 rounded-full bg-[#166534] hover:bg-[#12532a] text-white text-sm font-semibold shadow-md transition-all" 
                to={`/emergency/ambulance-assigned${request?.id ? `?id=${request.id}` : ''}`}
                state={{ request }}
              >
                <span className="material-symbols-outlined text-[20px]">keyboard_return</span>
                <span>BACK TO AMBULANCE DETAILS</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
