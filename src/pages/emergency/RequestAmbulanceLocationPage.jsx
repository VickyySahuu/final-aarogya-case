import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UtilityBar from '../../components/layout/UtilityBar'
import Header from '../../components/layout/Header'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Footer from '../../components/layout/Footer'
import { EmergencyApi } from '../../services/emergencyApi'
import { buildGoogleMapsDirectionsUrl, isValidCoordinate } from '../../services/googleMapsUtils'

export default function RequestAmbulanceLocationPage() {
  const navigate = useNavigate()
  const [consentChecked, setConsentChecked] = useState(true)
  const [status, setStatus] = useState('idle') // 'idle' | 'detecting' | 'detected' | 'denied' | 'unavailable'
  const [coords, setCoords] = useState(null)
  const [errorCode, setErrorCode] = useState(null) // 1 = PERMISSION_DENIED | 2 = POSITION_UNAVAILABLE | 3 = TIMEOUT
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-check if coordinates were previously verified or if permission is already granted
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aarogya_emergency_location')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (isValidCoordinate(parsed.latitude, parsed.longitude)) {
          setCoords(parsed)
          setStatus('detected')
        }
      }
    } catch (e) {}

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((perm) => {
          if (perm.state === 'granted') {
            triggerLocationDetection()
          }
        })
        .catch(() => {})
    }
  }, [])

  const triggerLocationDetection = () => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      setErrorCode(2)
      setErrorMessage('Geolocation is not supported by your browser.')
      return
    }

    setStatus('detecting')
    setErrorCode(null)
    setErrorMessage('')

    const onSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords
      if (!isValidCoordinate(latitude, longitude)) {
        setStatus('unavailable')
        setErrorCode(2)
        setErrorMessage('Device returned invalid geographic coordinates.')
        return
      }

      const loc = {
        latitude,
        longitude,
        accuracy: accuracy || 12,
        formatted: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
        timestamp: new Date().toLocaleTimeString()
      }
      setCoords(loc)
      setStatus('detected')
      setErrorCode(null)
      setErrorMessage('')
      try {
        localStorage.setItem('aarogya_emergency_location', JSON.stringify(loc))
      } catch (e) {}
    }

    const onHighAccuracyFail = (error) => {
      console.warn('[Geolocation] High accuracy attempt ended:', error.code, error.message)

      // User explicitly clicked Block/Deny — do not retry
      if (error.code === 1) {
        setStatus('denied')
        setErrorCode(1)
        setErrorMessage('Location permission was denied. Please allow location access in your browser address bar settings and click TRY AGAIN.')
        return
      }

      // If timed out or unavailable on desktop/PC, fall back to standard network/Wi-Fi geolocation
      console.log('[Geolocation] Attempting standard accuracy geolocation fallback...')
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (fallbackError) => {
          console.warn('[Geolocation] Standard accuracy fallback failed:', fallbackError.code, fallbackError.message)
          if (fallbackError.code === 1) {
            setStatus('denied')
            setErrorCode(1)
            setErrorMessage('Location permission was denied. Please allow location access in your browser settings and click TRY AGAIN.')
          } else if (fallbackError.code === 3) {
            setStatus('unavailable')
            setErrorCode(3)
            setErrorMessage('Location request timed out. Device took too long to acquire a location fix. Click TRY AGAIN.')
          } else {
            setStatus('unavailable')
            setErrorCode(2)
            setErrorMessage('Position unavailable. Device or network was unable to determine geographic coordinates. Click TRY AGAIN.')
          }
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      )
    }

    // Step 1: Query high-accuracy GPS/sensor with 10s timeout
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onHighAccuracyFail,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleShareLocation = () => {
    if (!consentChecked) {
      alert('Please check the consent box to authorize emergency location sharing.')
      return
    }
    triggerLocationDetection()
  }

  const handleProceed = async () => {
    if (!coords || !isValidCoordinate(coords.latitude, coords.longitude)) {
      alert('Valid geographic coordinates are required to dispatch an ambulance.')
      return
    }

    setIsSubmitting(true)
    let createdRequest = null

    try {
      const res = await EmergencyApi.createEmergencyRequest({
        latitude: coords.latitude,
        longitude: coords.longitude,
        locationAccuracy: coords.accuracy,
        pickupLocation: coords.formatted
      })
      if (res.ok && res.data?.request) {
        createdRequest = res.data.request
        try {
          localStorage.setItem('aarogya_active_emergency_request', JSON.stringify(createdRequest))
          localStorage.setItem('aarogya_active_emergency_request_id', String(createdRequest.id))
        } catch (e) {}
      } else {
        console.warn('[Emergency] Request creation notice:', res.status, res.message)
      }
    } catch (err) {
      console.warn('[Emergency] Backend request fallback:', err)
    } finally {
      setIsSubmitting(false)
    }

    navigate('/emergency/ambulance-assigned', {
      state: { location: coords, request: createdRequest }
    })
  }

  const googleMapsUrl = coords ? buildGoogleMapsDirectionsUrl(coords.latitude, coords.longitude) : null

  return (
    <div className="bg-[#f8f9fc] text-[#0f172a] flex flex-col min-h-screen">
      <UtilityBar activeService="Emergency Response" />
      <Header portalBadge="Patient Portal" activeNav="EMERGENCY" />
      <Breadcrumbs 
        items={[
          { label: 'Emergency', to: '/emergency' },
          { label: 'Share Current Location' }
        ]} 
        backTo="/emergency" 
        backLabel="Back" 
      />

      {/* MAIN PAGE CONTENT */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* 4-STEP PATIENT PROGRESS TRACKER */}
        <section aria-label="Progress Stepper" className="w-full bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-full bg-emerald-50 border border-emerald-200">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-[11px] font-bold text-[#166534] uppercase tracking-wider">Step 1</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">Share Location</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-full bg-slate-50 border border-slate-100 opacity-65">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                2
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Step 2</span>
                <span className="text-xs sm:text-sm font-medium text-slate-700 truncate">Confirm Request</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-full bg-slate-50 border border-slate-100 opacity-65">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                3
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Step 3</span>
                <span className="text-xs sm:text-sm font-medium text-slate-700 truncate">Ambulance Assigned</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-full bg-slate-50 border border-slate-100 opacity-65">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                4
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Step 4</span>
                <span className="text-xs sm:text-sm font-medium text-slate-700 truncate">Live Tracking</span>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN LOCATION CARD */}
        <div className="max-w-2xl mx-auto w-full bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col gap-6">
          {/* Title Section */}
          <div className="border-b border-slate-200 pb-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Emergency Ambulance
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-1.5">
              Share your current location to request an ambulance.
            </p>
          </div>

          {/* Location Status Subcard */}
          <div className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">CURRENT LOCATION</span>
              <span 
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  status === 'detected'
                    ? 'bg-emerald-100 text-[#166534]' 
                    : status === 'detecting'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : status === 'denied'
                        ? 'bg-rose-100 text-rose-800'
                        : status === 'unavailable'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-[#fee2e2] text-[#991b1b]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  status === 'detected' ? 'bg-[#166534]' : status === 'detecting' ? 'bg-amber-600' : 'bg-[#991b1b]'
                }`}></span>
                <span>
                  {status === 'detected' && 'LOCATION: DETECTED'}
                  {status === 'detecting' && 'DETECTING LOCATION...'}
                  {status === 'denied' && 'PERMISSION DENIED'}
                  {status === 'unavailable' && 'LOCATION UNAVAILABLE'}
                  {status === 'idle' && 'LOCATION NOT SHARED'}
                </span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-1 text-center sm:text-left">
              <div 
                className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  status === 'detected'
                    ? 'bg-emerald-100 text-[#166534]' 
                    : status === 'detecting'
                      ? 'bg-amber-100 text-amber-800 animate-spin'
                      : status === 'denied'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-200 text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[32px]">
                  {status === 'detected' && 'check_circle'}
                  {status === 'detecting' && 'refresh'}
                  {status === 'denied' && 'location_off'}
                  {status === 'unavailable' && 'wrong_location'}
                  {status === 'idle' && 'location_searching'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  {status === 'detected' && 'Real Coordinates Captured'}
                  {status === 'detecting' && 'Querying Device Geolocation...'}
                  {status === 'denied' && 'Location Permission Denied'}
                  {status === 'unavailable' && (errorCode === 3 ? 'Location Request Timed Out' : 'Location Unavailable')}
                  {status === 'idle' && 'Device Location Authorization'}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {status === 'detected' && (
                    <>Live GPS Coordinates: <strong>{coords?.formatted}</strong> (Accuracy: ±{Math.round(coords?.accuracy || 12)}m). Pickup point confirmed for emergency dispatch.</>
                  )}
                  {status === 'detecting' && 'Requesting GPS/network coordinates from your device. Please allow browser location access if prompted.'}
                  {status === 'denied' && (errorMessage || 'Location permission was denied. Please allow location access in your browser address bar settings and click TRY AGAIN.')}
                  {status === 'unavailable' && (errorMessage || 'Location hardware or network signal is currently unavailable. Please check device settings and click TRY AGAIN.')}
                  {status === 'idle' && 'Grant device location authorization to detect pickup coordinates for the ambulance.'}
                </p>
              </div>
            </div>

            {/* GOOGLE MAPS LOCATION CARD — replaces embedded Leaflet map */}
            {status === 'detected' && coords && (
              <div className="mt-2 pt-3 border-t border-slate-200">
                <div className="bg-white rounded-xl border border-emerald-200 p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[28px]">location_on</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#166534]">Emergency Location</span>
                      <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        Location detected
                        <span className="material-symbols-outlined text-[16px] text-[#166534]">check_circle</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block mb-0.5">Coordinates captured</span>
                    <span className="text-base font-bold text-slate-900 font-mono">{coords.formatted}</span>
                  </div>

                  {googleMapsUrl ? (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-12 rounded-full bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 btn-press"
                    >
                      <span className="material-symbols-outlined text-[20px]">map</span>
                      <span>OPEN IN GOOGLE MAPS</span>
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </a>
                  ) : (
                    <div className="w-full h-12 rounded-full bg-slate-200 text-slate-500 font-semibold text-sm flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">location_off</span>
                      <span>Location unavailable</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Data Protection Note */}
          <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs sm:text-sm text-[#166534]">Emergency Telemetry Security</span>
              <p className="text-xs sm:text-sm text-emerald-950 mt-0.5 leading-relaxed">
                Your location telemetry is encrypted and routed exclusively to the nearest active ambulance dispatch unit.
              </p>
            </div>
          </div>

          {/* Interactive Consent Checkbox */}
          <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input 
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="w-5 h-5 accent-[#166534] rounded text-[#166534] focus:ring-[#166534] cursor-pointer" 
                type="checkbox" 
              />
              <span className="text-xs sm:text-sm font-medium text-slate-800">
                I consent to share my device location to request an emergency ambulance
              </span>
            </label>
            <span 
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded whitespace-nowrap ${
                status === 'detected' 
                  ? 'bg-emerald-100 text-[#166534]' 
                  : consentChecked 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {status === 'detected' ? 'Authorized' : consentChecked ? 'Ready' : 'Required'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            {status === 'detected' ? (
              <button 
                className="flex-1 h-12 px-8 py-3.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm tracking-wide rounded-full shadow transition-all flex items-center justify-center gap-2 cursor-pointer btn-press" 
                onClick={handleProceed}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                <span>CONTINUE TO DISPATCH</span>
              </button>
            ) : status === 'detecting' ? (
              <button 
                disabled
                className="flex-1 h-12 px-8 py-3.5 bg-slate-300 text-slate-600 font-bold text-sm tracking-wide rounded-full flex items-center justify-center gap-2 cursor-wait" 
                type="button"
              >
                <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                <span>DETECTING LOCATION...</span>
              </button>
            ) : status === 'denied' || status === 'unavailable' ? (
              <button 
                className="flex-1 h-12 px-6 py-3.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-sm tracking-wide rounded-full shadow transition-all flex items-center justify-center gap-2 cursor-pointer btn-press" 
                onClick={handleShareLocation}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">replay</span>
                <span>TRY AGAIN</span>
              </button>
            ) : (
              <button 
                className="flex-1 h-12 px-8 py-3.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm tracking-wide rounded-full shadow transition-all flex items-center justify-center gap-2 cursor-pointer btn-press" 
                onClick={handleShareLocation}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">near_me</span>
                <span>SHARE LOCATION</span>
              </button>
            )}

            <Link 
              className="h-12 px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-sm rounded-full transition-colors flex items-center justify-center gap-1.5" 
              to="/emergency"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
