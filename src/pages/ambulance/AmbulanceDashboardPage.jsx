import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AmbulanceLayout from '../../components/layout/AmbulanceLayout'
import { getAmbulanceRequest } from '../../data/patientMockData'
import { EmergencyApi } from '../../services/emergencyApi'

export default function AmbulanceDashboardPage() {
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [requestList, setRequestList] = useState([])

  useEffect(() => {
    async function loadRequests() {
      try {
        const res = await EmergencyApi.getAmbulanceRequests({ activeOnly: true })
        if (res.ok && res.data?.requests && res.data.requests.length > 0) {
          setRequestList(res.data.requests)
          const primary = res.data.requests[0]
          setRequest({
            id: primary.id,
            patientName: primary.patient_name || 'Emergency Patient',
            status: primary.status || 'Requested',
            patientId: primary.patient_id ? `PAT-${String(primary.patient_id).padStart(4, '0')}` : 'PAT-8841',
            patientUniqueCode: primary.patient_unique_code || 'AC-7F42K9',
            requestNumber: primary.request_number || 'EMG-2026-000001',
            pickupLocation: primary.pickup_location || 'Sector 14 Dwarka',
            destination: primary.destination || 'District Civil Hospital Emergency Wing',
            eta: primary.eta || '10 mins',
            distance: primary.distance || '5.2 km',
            contactNumber: primary.contact_number || '+91 98765 43210'
          })
          return
        }
      } catch (e) {
        // Fallback to mock
      }
      const req = getAmbulanceRequest()
      setRequest(req)
    }

    loadRequests()
  }, [])

  if (!request) {
    return (
      <AmbulanceLayout activeNav="Dashboard">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500">Loading ambulance dispatch console...</p>
        </div>
      </AmbulanceLayout>
    )
  }

  return (
    <AmbulanceLayout activeNav="Dashboard">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2 self-start bg-[#e7e8eb] text-[#5a4138] px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#7c2800] animate-pulse"></span>
            <span>DISPATCH WORKSTATION 08 • CENTRAL EMERGENCY DISPATCH NODE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#191c1e] tracking-tight mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Ambulance Dashboard
          </h1>
          <p className="text-base text-[#5a4138] max-w-2xl">
            Monitor incoming citizen emergency requests and dispatch status.
          </p>
        </div>

        {/* Main Action Grid (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Card 1: New Requests */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-full bg-[#ffdad6]/60 flex items-center justify-center text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[28px]">notifications_active</span>
                </div>
                <span className="bg-[#ffdbcf] text-[#380d00] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  URGENT DISPATCH
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  New Requests
                </h2>
                <p className="text-sm text-[#5a4138] leading-relaxed">
                  Incoming emergency dispatch requests awaiting unit acceptance.
                </p>
              </div>
            </div>
            <div className="pt-6 mt-4">
              <Link 
                to="/ambulance/request" 
                className="inline-flex items-center justify-center gap-2 bg-[#00501a] text-white hover:bg-[#004015] text-sm font-semibold px-6 py-3 rounded-full transition-colors w-full sm:w-auto shadow-sm btn-press"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>VIEW REQUESTS</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Active Request */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-full bg-[#b2cdfe]/40 flex items-center justify-center text-[#455f8a]">
                  <span className="material-symbols-outlined text-[28px]">near_me</span>
                </div>
                <span className="bg-[#d6e3ff] text-[#001b3d] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  IN TRANSIT
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Active Request
                </h2>
                <p className="text-sm text-[#5a4138] leading-relaxed">
                  Currently assigned transit route and live patient handover.
                </p>
              </div>
            </div>
            <div className="pt-6 mt-4">
              <Link 
                to="/ambulance/patient-location" 
                className="inline-flex items-center justify-center gap-2 bg-[#e7e8eb] text-[#191c1e] hover:bg-[#e0e3e5] text-sm font-semibold px-6 py-3 rounded-full transition-colors w-full sm:w-auto btn-press"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>VIEW ACTIVE</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Card 3: Completed */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-full bg-[#e7e8eb] flex items-center justify-center text-[#5a4138]">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <span className="bg-[#eceef0] text-[#5a4138] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  SESSION ARCHIVE
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Completed Trips
                </h2>
                <p className="text-sm text-[#5a4138] leading-relaxed">
                  Log of finalized patient transfers and emergency handovers.
                </p>
              </div>
            </div>
            <div className="pt-6 mt-4">
              <Link 
                to="/ambulance/completed" 
                className="inline-flex items-center justify-center gap-2 bg-[#eceef0] text-[#5a4138] hover:bg-[#e7e8eb] hover:text-[#191c1e] text-sm font-semibold px-6 py-3 rounded-full transition-colors w-full sm:w-auto btn-press"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>VIEW COMPLETED</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Immediate Emergency Queue Section */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Immediate Emergency Queue
              </h2>
              <span className="bg-[#99f89e] text-[#002106] text-xs font-bold px-3 py-1 rounded-full">
                1 Awaiting Response
              </span>
            </div>
            <span className="text-xs text-[#5a4138]">Auto-updating live sync</span>
          </div>

          {/* Queue Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1 min-w-0">
              {/* Token Badge */}
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex flex-col items-center justify-center font-bold tracking-tight">
                <span className="text-base" style={{ fontFamily: 'Lexend, sans-serif' }}>EMG</span>
                <span className="text-xs font-bold -mt-0.5">01</span>
              </div>

              {/* Case Details */}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-lg sm:text-xl font-bold text-[#191c1e] truncate" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {request.patientName}
                  </span>
                  <span className="bg-[#006b25]/15 text-[#006b25] text-xs font-bold px-3 py-0.5 rounded-full">
                    {request.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5a4138]">
                  <span>Patient ID: <strong className="text-[#191c1e] font-mono">{request.patientId}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Unique Code: <strong className="text-[#7c2800] font-mono">{request.patientUniqueCode}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Ref: <strong className="text-[#191c1e] font-mono">{request.requestNumber}</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 bg-[#f2f4f6]/70 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2 text-[#191c1e] min-w-0">
                    <span className="material-symbols-outlined text-[#7c2800] text-[20px] shrink-0">trip_origin</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[#5a4138] uppercase font-bold">Pickup Location</span>
                      <span className="text-xs font-semibold truncate">{request.pickupLocation}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#191c1e] min-w-0">
                    <span className="material-symbols-outlined text-[#006b25] text-[20px] shrink-0">location_on</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[#5a4138] uppercase font-bold">Destination Node</span>
                      <span className="text-xs font-semibold truncate">{request.destination}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="shrink-0 self-stretch sm:self-end lg:self-center w-full sm:w-auto">
              <Link 
                to="/ambulance/request" 
                className="inline-flex items-center justify-center gap-2 bg-[#00501a] text-white hover:bg-[#004015] font-semibold text-sm px-8 py-3.5 rounded-full transition-colors w-full shadow-md btn-press"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>VIEW REQUEST</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AmbulanceLayout>
  )
}
