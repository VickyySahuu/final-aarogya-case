import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AmbulanceLayout from '../../components/layout/AmbulanceLayout'
import { EmergencyApi } from '../../services/emergencyApi'
import { buildGoogleMapsDirectionsUrl, isValidCoordinate } from '../../services/googleMapsUtils'

export default function PatientLocationPage() {
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [destination, setDestination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBroadcastingLocation, setIsBroadcastingLocation] = useState(false)
  const [ambulanceGpsStatus, setAmbulanceGpsStatus] = useState('Standby') // 'Standby' | 'Active' | 'Error'

  useEffect(() => {
    let isMounted = true

    async function loadTelemetry() {
      setIsLoading(true)
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const targetId = searchParams.get('id')
        const res = await EmergencyApi.getAmbulanceRequests({ activeOnly: true })
        if (res.ok && res.data?.requests && res.data.requests.length > 0) {
          const r = (targetId ? res.data.requests.find(x => String(x.id) === String(targetId)) : null) || res.data.requests[0]
          
          let loc = null
          try {
            const locRes = await EmergencyApi.getPatientLocation(r.id)
            if (locRes.ok && locRes.data?.location) {
              loc = locRes.data.location
            }
          } catch (e) {}

          let dest = null
          try {
            const destRes = await EmergencyApi.getReceivingDestination(r.id)
            if (destRes.ok && destRes.data?.destination) {
              dest = destRes.data.destination
            }
          } catch (e) {}

          if (!isMounted) return

          setDestination(dest)

          let savedCoords = null
          try {
            const raw = localStorage.getItem('aarogya_emergency_location')
            if (raw) savedCoords = JSON.parse(raw)
          } catch (e) {}

          const effectiveLat = loc?.latitude !== undefined && loc?.latitude !== null
            ? Number(loc.latitude)
            : (r.latitude !== undefined && r.latitude !== null
              ? Number(r.latitude)
              : (savedCoords?.latitude !== undefined && savedCoords?.latitude !== null ? Number(savedCoords.latitude) : null))

          const effectiveLng = loc?.longitude !== undefined && loc?.longitude !== null
            ? Number(loc.longitude)
            : (r.longitude !== undefined && r.longitude !== null
              ? Number(r.longitude)
              : (savedCoords?.longitude !== undefined && savedCoords?.longitude !== null ? Number(savedCoords.longitude) : null))

          const reqData = {
            id: r.id,
            patientName: r.patient_name || 'Unidentified (Scene Assessment Pending)',
            status: r.status || 'Assigned',
            patientId: r.patient_id ? `PAT-${String(r.patient_id).padStart(4, '0')}` : 'PAT-8841',
            patientUniqueCode: r.patient_unique_code || 'AC-7F42K9',
            requestNumber: r.request_number || 'EMG-2026-000001',
            pickupLocation: loc?.pickupLocation || r.pickup_location || 'Live Telemetry Point',
            landmark: loc?.landmark || r.landmark || 'Incident Location',
            destination: dest?.receivingHospital || loc?.destination || r.destination || 'District Civil Hospital',
            destinationBay: dest?.receivingRoom || loc?.destinationBay || r.destination_bay || 'Trauma Bay 2',
            contactNumber: loc?.contactNumber || r.contact_number || '+91 98765 43210',
            latitude: effectiveLat,
            longitude: effectiveLng,
            ambulanceLatitude: loc?.ambulanceLatitude !== undefined && loc?.ambulanceLatitude !== null ? Number(loc.ambulanceLatitude) : (r.ambulance_latitude !== undefined && r.ambulance_latitude !== null ? Number(r.ambulance_latitude) : null),
            ambulanceLongitude: loc?.ambulanceLongitude !== undefined && loc?.ambulanceLongitude !== null ? Number(loc.ambulanceLongitude) : (r.ambulance_longitude !== undefined && r.ambulance_longitude !== null ? Number(r.ambulance_longitude) : null),
            hospitalLatitude: loc?.hospitalLatitude || r.hospital_latitude || 28.6790,
            hospitalLongitude: loc?.hospitalLongitude || r.hospital_longitude || 77.2227,
            unit: r.ambulance_number || 'Ambulance Unit #08'
          }

          setRequest(reqData)
          return
        }

        // Fallback: active emergency request from local storage
        const storedReqRaw = localStorage.getItem('aarogya_active_emergency_request')
        if (storedReqRaw) {
          const r = JSON.parse(storedReqRaw)
          let savedCoords = null
          try {
            const raw = localStorage.getItem('aarogya_emergency_location')
            if (raw) savedCoords = JSON.parse(raw)
          } catch (e) {}

          const effectiveLat = r.latitude !== undefined && r.latitude !== null
            ? Number(r.latitude)
            : (savedCoords?.latitude !== undefined && savedCoords?.latitude !== null ? Number(savedCoords.latitude) : null)
          const effectiveLng = r.longitude !== undefined && r.longitude !== null
            ? Number(r.longitude)
            : (savedCoords?.longitude !== undefined && savedCoords?.longitude !== null ? Number(savedCoords.longitude) : null)

          const reqData = {
            id: r.id || 1,
            patientName: r.patient_name || r.patientName || 'Emergency Incident Patient',
            status: r.status || 'Assigned',
            patientId: r.patient_id || r.patientId || 'Pending',
            patientUniqueCode: r.patient_unique_code || r.patientUniqueCode || 'Emergency Transit',
            requestNumber: r.request_number || r.requestNumber || 'EMG-2026-000001',
            pickupLocation: r.pickup_location || r.pickupLocation || savedCoords?.formatted || 'Live Telemetry Point',
            landmark: r.landmark || 'Incident Location',
            destination: r.destination || 'District Civil Hospital',
            destinationBay: r.destination_bay || r.destinationBay || 'Trauma Bay 2',
            contactNumber: r.contact_number || r.contactNumber || '+91 98765 43210',
            latitude: effectiveLat,
            longitude: effectiveLng,
            ambulanceLatitude: 28.5823,
            ambulanceLongitude: 77.0500,
            hospitalLatitude: 28.6790,
            hospitalLongitude: 77.2227,
            unit: r.ambulance_number || 'Ambulance Unit #08'
          }
          if (isMounted) setRequest(reqData)
          return
        }
      } catch (e) {
        console.warn('Telemetry load failed:', e)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadTelemetry()

    return () => {
      isMounted = false
    }
  }, [])

  // Broadcast real device location
  const handleBroadcastDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser geolocation is unavailable on this device.')
      return
    }

    setIsBroadcastingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          await EmergencyApi.updateAmbulanceLocation({
            latitude,
            longitude,
            id: request?.id
          })
          const updatedReq = {
            ...request,
            ambulanceLatitude: latitude,
            ambulanceLongitude: longitude
          }
          setRequest(updatedReq)
          setAmbulanceGpsStatus('Active')
        } catch (e) {
          console.warn('Ambulance location update error:', e)
        } finally {
          setIsBroadcastingLocation(false)
        }
      },
      (err) => {
        console.warn('Ambulance geolocation error:', err.message)
        setIsBroadcastingLocation(false)
        setAmbulanceGpsStatus('Error')
        alert('Could not capture browser geolocation: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  if (!request) {
    return (
      <AmbulanceLayout activeNav="Emergency Requests">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500">Loading emergency request data...</p>
        </div>
      </AmbulanceLayout>
    )
  }

  const isTransporting = request.status === 'On the Way' && (destination?.receivingHospital || request.destination?.includes('Hospital'))
  const isAtScene = request.status === 'Arrived'

  // Google Maps links
  const patientLocationUrl = buildGoogleMapsDirectionsUrl(request.latitude, request.longitude)
  const hospitalLocationUrl = buildGoogleMapsDirectionsUrl(request.hospitalLatitude, request.hospitalLongitude)

  return (
    <AmbulanceLayout activeNav="Emergency Requests">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Top Navigation & Action Context */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link 
              to={request?.id ? `/ambulance/request?id=${request.id}` : '/ambulance/request'} 
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#7c2800] hover:text-[#cd4700] transition-colors w-fit group"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span>Back to Request</span>
            </Link>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Emergency Navigation
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#006b25]/15 text-[#006b25] text-xs font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="w-2 h-2 rounded-full bg-[#006b25] animate-pulse"></span>
                <span>
                  {isAtScene ? 'ON SCENE WITH PATIENT' : isTransporting ? 'TRANSPORTING TO HOSPITAL' : 'DISPATCH ROUTE ACTIVE'}
                </span>
              </div>
            </div>
            <p className="text-sm text-[#5a4138]">
              {isTransporting 
                ? 'Navigate to receiving hospital using Google Maps.'
                : 'Navigate to patient incident location using Google Maps.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <button
              onClick={handleBroadcastDeviceLocation}
              disabled={isBroadcastingLocation}
              type="button"
              className="px-4 py-2 rounded-full bg-[#7c2800] hover:bg-[#5a1e00] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer btn-press"
            >
              <span className={`material-symbols-outlined text-[16px] ${isBroadcastingLocation ? 'animate-spin' : ''}`}>
                {isBroadcastingLocation ? 'sync' : 'my_location'}
              </span>
              <span>{isBroadcastingLocation ? 'Updating GPS...' : 'Broadcast Device GPS'}</span>
            </button>
            <div className="bg-[#e7e8eb] rounded-full px-4 py-2 flex items-center gap-2 text-xs font-semibold text-[#5a4138]">
              <span className={`w-2 h-2 rounded-full ${ambulanceGpsStatus === 'Active' ? 'bg-emerald-600 animate-pulse' : 'bg-blue-600'}`}></span>
              <span>GPS: {ambulanceGpsStatus === 'Active' ? 'Device Synced' : 'Base Station'}</span>
            </div>
          </div>
        </div>

        {/* 1. Key Trip Summary Strip */}
        <section className="w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#5a4138] uppercase font-bold tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-[#7c2800]">person</span>
                <span>Patient</span>
              </div>
              <span className="text-lg font-bold text-[#191c1e] truncate" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {request.patientName}
              </span>
              <span className="text-xs text-[#5a4138] font-mono">Ref: {request.requestNumber}</span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#5a4138] uppercase font-bold tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-[#7c2800]">my_location</span>
                <span>Incident Location</span>
              </div>
              <span className="text-base font-bold text-[#191c1e] truncate" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {request.pickupLocation}
              </span>
              <span className="text-xs text-[#5a4138]">
                {request.latitude ? `${request.latitude.toFixed(4)}° N, ${request.longitude.toFixed(4)}° E` : 'GPS Point'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#5a4138] uppercase font-bold tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-[#006b25]">local_hospital</span>
                <span>Destination</span>
              </div>
              <span className="text-base font-bold text-[#191c1e] truncate" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {destination?.receivingHospital || request.destination || 'District Civil Hospital'}
              </span>
              <span className="text-xs text-[#5a4138]">
                {destination?.receivingRoom || request.destinationBay || 'Main Emergency Block'}
              </span>
            </div>

            <div className="flex flex-col sm:items-end justify-center">
              <div className="flex items-center gap-2 bg-[#006b25]/10 text-[#006b25] px-4 py-1.5 rounded-full text-xs font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="w-2.5 h-2.5 rounded-full bg-[#006b25] animate-ping"></span>
                <span>{request.status}</span>
              </div>
              <span className="text-xs text-[#5a4138] mt-1">{request.unit}</span>
            </div>
          </div>
        </section>

        {/* 2. GOOGLE MAPS NAVIGATION SECTION */}
        <section className="relative w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200 p-5 sm:p-6 flex flex-col gap-5">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px] text-[#7c2800]">navigation</span>
              <h2 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {isAtScene ? 'On Scene' : isTransporting ? 'Transport Navigation' : 'Navigate to Patient'}
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Google Maps Navigation</span>
            </span>
          </div>

          {/* Arrived at Scene */}
          {isAtScene && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#166534] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <div>
                <span className="text-xl font-bold text-[#166534]">ARRIVED AT SCENE</span>
                <p className="text-sm text-emerald-800 mt-1">Ambulance has reached the patient's location.</p>
              </div>
            </div>
          )}

          {/* Patient Location — Google Maps Link */}
          {!isAtScene && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-red-600">location_on</span>
                <span className="text-sm font-bold text-[#191c1e] uppercase tracking-wider">Patient / Incident Location</span>
              </div>

              {isValidCoordinate(request.latitude, request.longitude) ? (
                <>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[#006b25]">check_circle</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#191c1e]">{request.pickupLocation}</span>
                      <span className="text-xs font-mono text-slate-600 mt-0.5">
                        {request.latitude.toFixed(4)}° N, {request.longitude.toFixed(4)}° E
                      </span>
                    </div>
                  </div>

                  <a
                    href={patientLocationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-14 rounded-full bg-[#7c2800] hover:bg-[#5a1e00] text-white font-bold text-base tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 btn-press"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span className="material-symbols-outlined text-[24px]">map</span>
                    <span>OPEN PATIENT LOCATION IN GOOGLE MAPS</span>
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                  </a>
                </>
              ) : (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-700 text-[22px]">location_off</span>
                  <span className="text-sm font-semibold text-amber-800">Patient location unavailable</span>
                </div>
              )}
            </div>
          )}

          {/* Hospital Location — when transporting or destination assigned */}
          {(isTransporting || destination?.receivingHospital) && (
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006b25]">local_hospital</span>
                <span className="text-sm font-bold text-[#191c1e] uppercase tracking-wider">Receiving Destination</span>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex flex-col gap-1">
                  <span className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {destination?.receivingHospital || request.destination || 'District Civil Hospital'}
                  </span>
                  {destination?.receivingBuilding && (
                    <span className="text-sm text-slate-700">{destination.receivingBuilding}</span>
                  )}
                  <span className="text-xs text-emerald-800">
                    {destination?.receivingRoom || request.destinationBay || 'Emergency Department'}
                  </span>
                </div>
              </div>

              {hospitalLocationUrl ? (
                <a
                  href={hospitalLocationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 rounded-full bg-[#006b25] hover:bg-[#005520] text-white font-bold text-base tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 btn-press"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-[24px]">local_hospital</span>
                  <span>OPEN HOSPITAL LOCATION IN GOOGLE MAPS</span>
                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                </a>
              ) : (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-700 text-[22px]">location_off</span>
                  <span className="text-sm font-semibold text-amber-800">Hospital location unavailable</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 3. Location Verification Details Card */}
        <section className="w-full bg-[#f2f4f6] rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7c2800] text-[24px]">verified</span>
                <h2 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Location Verification Details
                </h2>
              </div>
              <span className="text-xs text-[#5a4138] uppercase font-bold tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200">
                GPS Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Pickup Address */}
              <div className="bg-white rounded-xl p-4 flex flex-col gap-1 shadow-sm border border-slate-100">
                <div className="flex items-center gap-1.5 text-[#7c2800] text-xs font-bold">
                  <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                  <span>Pickup Address Confirmed</span>
                </div>
                <p className="text-sm font-bold text-[#191c1e] mt-1">{request.pickupLocation}</p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[#006b25] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>
                    Coordinates: {request.latitude && request.longitude ? `${request.latitude.toFixed(4)}° N, ${request.longitude.toFixed(4)}° E` : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Landmark & Access */}
              <div className="bg-white rounded-xl p-4 flex flex-col gap-1 shadow-sm border border-slate-100">
                <div className="flex items-center gap-1.5 text-[#cd4700] text-xs font-bold">
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                  <span>Landmark &amp; Access Notes</span>
                </div>
                <p className="text-sm font-bold text-[#191c1e] mt-1">{request.landmark || 'Ground level emergency access'}</p>
                <p className="text-xs text-[#5a4138]">Paramedic dispatched with ALS telemetry kit.</p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[#455f8a] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">contact_phone</span>
                  <span>Contact: {request.contactNumber}</span>
                </div>
              </div>

              {/* Destination Receiving */}
              <div className="bg-white rounded-xl p-4 flex flex-col gap-1 shadow-sm border border-slate-100">
                <div className="flex items-center gap-1.5 text-[#455f8a] text-xs font-bold">
                  <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                  <span>Destination Facility</span>
                </div>
                <p className="text-sm font-bold text-[#191c1e] mt-1">
                  {destination?.receivingHospital || request.destination || 'District Civil Hospital'}
                </p>
                <p className="text-xs text-[#5a4138]">
                  {destination?.receivingBuilding ? `${destination.receivingBuilding}, ${destination.receivingRoom}` : 'Sector 4, Civil Lines, New Delhi'}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[#006b25] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                  <span>Triage Bay Assigned</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Navigation Action Bar */}
        <div className="w-full pt-2 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link 
            to={request?.id ? `/ambulance/request?id=${request.id}` : '/ambulance/request'} 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#455f8a] hover:bg-slate-50 px-8 h-12 rounded-full text-sm font-semibold shadow-sm border border-slate-100 transition-all btn-press"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Request</span>
          </Link>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
            <Link 
              to={request?.id ? `/ambulance/update-status?id=${request.id}` : '/ambulance/update-status'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-700 hover:bg-slate-100 px-6 h-14 rounded-full text-sm font-bold border border-slate-300 shadow-sm transition-all btn-press"
            >
              <span className="material-symbols-outlined text-[20px]">sync</span>
              <span>Update Operational Status</span>
            </Link>

            <button 
              id="btn-continue-scene-assessment"
              onClick={() => navigate(request?.id ? `/ambulance/scene-assessment?id=${request.id}` : '/ambulance/scene-assessment', { state: { requestId: request?.id } })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#7c2800] hover:bg-[#5a1e00] text-white rounded-full px-8 h-14 font-bold text-base transition-all shadow-md active:scale-95 btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span>Continue to Scene Assessment</span>
              <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </AmbulanceLayout>
  )
}
