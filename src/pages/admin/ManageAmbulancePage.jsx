import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { getAdminAmbulance, updateAdminAmbulance } from '../../data/patientMockData'
import AdminApi from '../../services/adminApi'

export default function ManageAmbulancePage() {
  const currentAmbulance = getAdminAmbulance()
  const [isEditMode, setIsEditMode] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Ambulance form fields
  const [ambulanceNumber, setAmbulanceNumber] = useState(currentAmbulance.ambulanceNumber || 'Ambulance Unit #08')
  const [vehicleNumber, setVehicleNumber] = useState(currentAmbulance.vehicleNumber || 'DL-01-EQ-9041')
  const [status, setStatus] = useState(currentAmbulance.status || 'available')

  useEffect(() => {
    AdminApi.getAmbulance(1)
      .then(res => {
        const amb = res.data?.ambulance || res.ambulance || (res.ok ? res.data : null)
        if (amb) {
          if (amb.ambulanceNumber || amb.ambulance_number) setAmbulanceNumber(amb.ambulanceNumber || amb.ambulance_number)
          if (amb.vehicleNumber || amb.vehicle_number) setVehicleNumber(amb.vehicleNumber || amb.vehicle_number)
          if (amb.status) setStatus(amb.status)
        }
      })
      .catch(err => console.warn('Using local ambulance fallback:', err))
  }, [])

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      await AdminApi.updateAmbulance(1, {
        ambulanceNumber,
        vehicleNumber,
        status
      })
    } catch (err) {
      console.warn('Backend updateAmbulance error (fallback to local):', err)
    } finally {
      updateAdminAmbulance({
        ambulanceNumber,
        vehicleNumber,
        unit: ambulanceNumber,
        status
      })
      setIsSaving(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    }
  }

  const getStatusBadge = () => {
    if (status === 'available') {
      return {
        text: 'Ready for Citizen Dispatch',
        bg: 'bg-[#99f89e] text-[#002106]',
        icon: 'check_circle'
      }
    } else if (status === 'ontheway') {
      return {
        text: 'Actively Responding to Emergency',
        bg: 'bg-[#d6e3ff] text-[#001b3d]',
        icon: 'directions_car'
      }
    } else {
      return {
        text: 'Patient Handover / Busy',
        bg: 'bg-[#ffdbcf] text-[#380d00]',
        icon: 'pending'
      }
    }
  }

  const badgeInfo = getStatusBadge()

  return (
    <AdminLayout activeNav="Ambulances">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col w-full pb-10">
          {/* Sub-Header & Breadcrumb Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex flex-col">
              <Link 
                to="/admin/dashboard"
                className="group inline-flex items-center gap-1.5 text-[#455f8a] font-semibold text-sm hover:text-[#7c2800] transition-colors mb-2"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                <span>Back to Dashboard</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Manage Ambulance
              </h1>
              <p className="text-sm text-[#58423a] mt-0.5">
                Emergency vehicle registry, active unit monitoring, and dispatch readiness.
              </p>
            </div>

            {/* Telemetry Pill */}
            <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-full self-start sm:self-center shadow-sm border border-[#e0e3e5]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00501a] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00501a]"></span>
              </span>
              <span className="text-xs text-[#191c1e] font-bold tracking-wide uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Central Dispatch Link Active
              </span>
            </div>
          </div>

          {/* Main Ambulance Management Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Primary Focus: Unit Card & Parameters */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 border border-[#eceef0]">
              {/* Top Unit Identity Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f2f4f6] p-5 rounded-xl border border-[#e0e3e5]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#99f89e] flex items-center justify-center text-[#002106]">
                    <span className="material-symbols-outlined text-[32px]">emergency</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {ambulanceNumber} Dispatch Core
                    </span>
                    <span className="text-xs text-[#58423a]">Fleet Sector 4 • South West Command</span>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${badgeInfo.bg}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                    <span className="material-symbols-outlined text-[16px]">{badgeInfo.icon}</span>
                    <span>{badgeInfo.text}</span>
                  </span>
                </div>
              </div>

              {/* Core Form Fields */}
              <form className="flex flex-col gap-6" onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Ambulance Unit Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" htmlFor="ambulance-number" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Ambulance Number
                    </label>
                    <div className="relative">
                      <input 
                        className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all outline-none border ${
                          isEditMode 
                            ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                            : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                        }`}
                        id="ambulance-number" 
                        readOnly={!isEditMode}
                        type="text" 
                        value={ambulanceNumber}
                        onChange={(e) => setAmbulanceNumber(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#58423a]/60 pointer-events-none text-[20px]">badge</span>
                    </div>
                    <span className="text-[11px] text-[#58423a]">Public registration title on triage switchboards</span>
                  </div>

                  {/* Vehicle Plate Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" htmlFor="vehicle-number" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Vehicle Registration Number
                    </label>
                    <div className="relative">
                      <input 
                        className={`w-full px-4 py-3 rounded-lg text-sm font-mono tracking-wider font-bold transition-all outline-none border ${
                          isEditMode 
                            ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                            : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                        }`}
                        id="vehicle-number" 
                        readOnly={!isEditMode}
                        type="text" 
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#58423a]/60 pointer-events-none text-[20px]">pin</span>
                    </div>
                    <span className="text-[11px] text-[#58423a]">Official RTO state transport identifier</span>
                  </div>
                </div>

                {/* Readonly Institutional Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col p-4 bg-[#f2f4f6] rounded-xl border border-[#e0e3e5]">
                    <span className="text-[11px] text-[#58423a] uppercase font-bold tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Vehicle Specification
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="material-symbols-outlined text-[#455f8a] text-[20px]">medical_services</span>
                      <span className="text-sm font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Advanced Life Support (ALS)
                      </span>
                    </div>
                    <span className="text-[11px] text-[#58423a] mt-1">Equipped with ventilator, telemetry monitor &amp; trauma kit</span>
                  </div>

                  <div className="flex flex-col p-4 bg-[#f2f4f6] rounded-xl border border-[#e0e3e5]">
                    <span className="text-[11px] text-[#58423a] uppercase font-bold tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Assigned Base Station
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="material-symbols-outlined text-[#455f8a] text-[20px]">hub</span>
                      <span className="text-sm font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        South West Dispatch Node • Dwarka Cluster
                      </span>
                    </div>
                    <span className="text-[11px] text-[#58423a] mt-1">Zone 14 central operational depot</span>
                  </div>
                </div>

                {/* Assigned Operator Bar */}
                <div className="flex items-center justify-between p-4 bg-[#f2f4f6] rounded-xl border border-[#e0e3e5]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#d6e3ff] flex items-center justify-center text-[#001b3d]">
                      <span className="material-symbols-outlined text-[20px]">person_apron</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#58423a] uppercase tracking-wider font-bold">Current Assigned Operator</span>
                      <span className="text-xs font-bold text-[#191c1e]">Paramedic Lead Paramveer / Ravi (AMB-OP-104)</span>
                    </div>
                  </div>
                  <span className="text-[11px] px-3 py-1 rounded-full bg-white text-[#58423a] font-semibold hidden sm:inline-block border border-[#e0e3e5]">
                    Duty Shift Alpha
                  </span>
                </div>

                {/* Dispatch Readiness Status Control */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Unit Dispatch Status
                    </span>
                    <span className="text-xs text-[#58423a]">Controls immediate switchboard routing</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 1. Available */}
                    <label className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col gap-1.5 ${
                      status === 'available' ? 'bg-[#99f89e]/15 border-[#00501a] shadow-sm' : 'bg-[#f2f4f6] border-[#e0e3e5] hover:bg-white'
                    }`}>
                      <input 
                        type="radio" 
                        name="unit_status" 
                        value="available"
                        checked={status === 'available'}
                        onChange={() => setStatus('available')}
                        className="sr-only"
                        disabled={!isEditMode}
                      />
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00501a]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#00501a]"></span>
                          Available
                        </span>
                        {status === 'available' && (
                          <span className="material-symbols-outlined text-[#00501a] text-[18px]">check</span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#58423a] leading-tight">Green badge — Ready for instant emergency routing</span>
                    </label>

                    {/* 2. On the Way */}
                    <label className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col gap-1.5 ${
                      status === 'ontheway' ? 'bg-[#d6e3ff]/30 border-[#455f8a] shadow-sm' : 'bg-[#f2f4f6] border-[#e0e3e5] hover:bg-white'
                    }`}>
                      <input 
                        type="radio" 
                        name="unit_status" 
                        value="ontheway"
                        checked={status === 'ontheway'}
                        onChange={() => setStatus('ontheway')}
                        className="sr-only"
                        disabled={!isEditMode}
                      />
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#455f8a]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#455f8a]"></span>
                          On the Way
                        </span>
                        {status === 'ontheway' && (
                          <span className="material-symbols-outlined text-[#455f8a] text-[18px]">check</span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#58423a] leading-tight">Blue badge — Actively navigating to an incident scene</span>
                    </label>

                    {/* 3. Busy */}
                    <label className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col gap-1.5 ${
                      status === 'busy' ? 'bg-[#ffdbcf]/30 border-[#7c2800] shadow-sm' : 'bg-[#f2f4f6] border-[#e0e3e5] hover:bg-white'
                    }`}>
                      <input 
                        type="radio" 
                        name="unit_status" 
                        value="busy"
                        checked={status === 'busy'}
                        onChange={() => setStatus('busy')}
                        className="sr-only"
                        disabled={!isEditMode}
                      />
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7c2800]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#7c2800]"></span>
                          Busy
                        </span>
                        {status === 'busy' && (
                          <span className="material-symbols-outlined text-[#7c2800] text-[18px]">check</span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#58423a] leading-tight">Amber badge — Hospital patient handover or sanitization</span>
                    </label>
                  </div>
                </div>

                {/* Toast feedback */}
                {showToast && (
                  <div className="flex items-center gap-3 bg-[#99f89e] text-[#002106] px-5 py-3 rounded-xl shadow-md transition-all border border-[#00501a]/20">
                    <span className="material-symbols-outlined text-[#00501a] text-[22px]">check_circle</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Changes synchronized successfully</span>
                      <span className="text-xs">Ambulance dispatch unit status propagated across connected portals.</span>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-[#eceef0]">
                  <button 
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm flex items-center justify-center gap-2 shadow hover:bg-opacity-95 active:scale-95 transition-all"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    <span>SAVE CHANGES</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#455f8a] font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    <span>{isEditMode ? 'LOCK FIELDS' : 'EDIT UNIT'}</span>
                  </button>

                  <Link 
                    to="/admin/dashboard"
                    className="w-full sm:w-auto text-center font-semibold text-xs text-[#58423a] hover:text-[#7c2800] transition-colors px-4 py-2"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    ← Back to Dashboard
                  </Link>
                </div>
              </form>
            </div>

            {/* Secondary Visual & Institutional Context Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Live Integration Notice Box */}
              <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-3 border border-[#eceef0]">
                <div className="flex items-center gap-2 text-[#00501a]">
                  <span className="material-symbols-outlined text-[22px]">sync_alt</span>
                  <span className="text-sm font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>National Integration Sync</span>
                </div>
                <p className="text-xs text-[#58423a] leading-relaxed">
                  Emergency Sync: This ambulance unit is requisitioned via <strong className="text-[#191c1e]">Patient Emergency (02.04)</strong> and operated inside <strong className="text-[#191c1e]">Ambulance Portal (07.02)</strong>.
                </p>
                <div className="flex items-center gap-2 text-[#58423a] text-xs bg-[#f2f4f6] p-3 rounded-xl border border-[#e0e3e5]">
                  <span className="material-symbols-outlined text-[16px] text-[#00501a]">lock</span>
                  <span>End-to-end encrypted dispatch handshakes</span>
                </div>
              </div>

              {/* Vehicle Profile Preview */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col border border-[#eceef0]">
                <div className="p-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    <span>Equipment Standard</span>
                    <span className="text-[#00501a] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">verified</span> Level 4 ALS
                    </span>
                  </div>
                  <span className="text-[11px] text-[#58423a]">
                    Validated under National Ambulance Code (AIS 125 Part 1) standard protocols.
                  </span>
                </div>
              </div>

              {/* Citizen Hotlines */}
              <div className="p-6 bg-[#f2f4f6] rounded-2xl flex flex-col gap-2.5 border border-[#e0e3e5]">
                <span className="text-xs uppercase tracking-wider font-bold text-[#58423a]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Citizen Hotlines
                </span>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-[#191c1e]">Emergency Response Service</span>
                  <span className="text-xl font-bold text-[#7c2800]" style={{ fontFamily: 'Lexend, sans-serif' }}>108</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#191c1e]">Health Advisory Support</span>
                  <span className="text-xl font-bold text-[#455f8a]" style={{ fontFamily: 'Lexend, sans-serif' }}>104</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
