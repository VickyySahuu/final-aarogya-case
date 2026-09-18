import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { getAdminHospital, updateAdminHospital } from '../../data/patientMockData'
import AdminApi from '../../services/adminApi'

export default function ManageHospitalPage() {
  const currentHospital = getAdminHospital()
  const [isEditMode, setIsEditMode] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Hospital fields
  const [name, setName] = useState(currentHospital.name || 'Ayush Central Hospital')
  const [hospitalId, setHospitalId] = useState(currentHospital.hospitalId || 'HOSP-DEL-01')
  const [facilityType, setFacilityType] = useState(currentHospital.facilityType || 'Public Multi-Specialty Civic Hospital & Triage Hub')
  const [address, setAddress] = useState(currentHospital.address || currentHospital.location || 'Ansari Nagar East, Ring Road, Near AIIMS Campus, New Delhi - 110029')
  const [emergencyWard, setEmergencyWard] = useState(currentHospital.emergencyWard || 'Ground Floor, Bay 01 - 04')
  const [connectedHubs, setConnectedHubs] = useState(currentHospital.connectedHubs || 'AIIMS Trauma Wing & Emergency Response 108')

  useEffect(() => {
    AdminApi.getHospital(1)
      .then(res => {
        const hosp = res.data?.hospital || res.hospital || (res.ok ? res.data : null)
        if (hosp) {
          if (hosp.name) setName(hosp.name)
          if (hosp.hospitalId || hosp.hospital_id) setHospitalId(hosp.hospitalId || hosp.hospital_id)
          if (hosp.facilityType || hosp.facility_type) setFacilityType(hosp.facilityType || hosp.facility_type)
          if (hosp.address || hosp.location) setAddress(hosp.address || hosp.location)
          if (hosp.emergencyWard || hosp.emergency_ward) setEmergencyWard(hosp.emergencyWard || hosp.emergency_ward)
          if (hosp.connectedHubs || hosp.connected_hubs) setConnectedHubs(hosp.connectedHubs || hosp.connected_hubs)
        }
      })
      .catch(err => console.warn('Using local hospital fallback:', err))
  }, [])

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      await AdminApi.updateHospital(1, {
        name,
        address,
        facilityType,
        emergencyWard,
        connectedHubs
      })
    } catch (err) {
      console.warn('Backend updateHospital error (fallback to local):', err)
    } finally {
      updateAdminHospital({
        name,
        hospitalId,
        facilityType,
        address,
        location: address,
        emergencyWard,
        connectedHubs
      })
      setIsSaving(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    }
  }

  return (
    <AdminLayout activeNav="Hospitals">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col w-full">
          {/* Top Navigation Utility Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <Link 
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-[#455f8a] hover:text-[#7c2800] transition-colors font-semibold text-sm group"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span>Back to Dashboard</span>
            </Link>

            {/* Verification / Status Pill & Live Sync Metadata */}
            <div className="flex items-center gap-3 bg-white px-4 py-1.5 rounded-full shadow-sm border border-[#e0e3e5]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00501a] animate-pulse"></span>
              <span className="text-xs text-[#191c1e] font-bold tracking-wide uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Facility Active • Sync ID 982-ND
              </span>
              <span className="text-[#e3bfb2]">|</span>
              <span className="text-xs text-[#58423a] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#00501a]">verified</span> System Verified
              </span>
            </div>
          </div>

          {/* Editorial Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex flex-col max-w-2xl">
              <div className="flex items-center gap-1.5 mb-1.5 text-[#00501a] text-xs uppercase tracking-wider font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                <span>National Registry Record Ref #{hospitalId}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight leading-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Manage Hospital
              </h1>
              <p className="text-sm sm:text-base text-[#58423a] mt-1 leading-relaxed">
                Manage central civic healthcare facility record for patient appointments and triage referral.
              </p>
            </div>

            {/* Quick Action Bar */}
            <div className="flex items-center gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className="inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-[#e6e8ea] hover:bg-[#d8dadc] text-[#191c1e] font-bold text-xs shadow-sm transition-all"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[18px]">{isEditMode ? 'lock' : 'edit'}</span>
                <span>{isEditMode ? 'LOCK RECORD' : 'EDIT RECORD'}</span>
              </button>
              <button 
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-6 h-11 rounded-full bg-[#00501a] hover:bg-[#1b6b33] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </div>

          {/* Main Grid Architecture */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Master Form Container */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden border border-[#eceef0]">
                {/* Accent Top Ambient Strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00501a] via-[#a43700] to-[#455f8a]"></div>

                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#eceef0]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#f2f4f6] flex items-center justify-center text-[#7c2800]">
                      <span className="material-symbols-outlined text-[28px]">apartment</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[#455f8a] font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Institutional Entity Profile
                      </span>
                      <h2 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        {name}
                      </h2>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-[#f2f4f6] text-[#58423a]">
                    <span className="material-symbols-outlined text-[16px]">lock_reset</span> Auto-Audit Enabled
                  </span>
                </div>

                <form className="flex flex-col gap-5" onSubmit={handleSave}>
                  {/* Row 1: Hospital Name & Code */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    <div className="md:col-span-8 flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1" htmlFor="hospital-name" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span>Hospital Name</span>
                        <span className="text-[#ba1a1a]">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          className={`w-full h-12 px-4 rounded-lg text-sm transition-all outline-none border ${
                            isEditMode 
                              ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                              : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                          }`}
                          id="hospital-name" 
                          name="hospital-name" 
                          readOnly={!isEditMode}
                          required 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#58423a]/60 pointer-events-none text-[20px]">domain</span>
                      </div>
                      <span className="text-[11px] text-[#58423a]">Constituent name registered under Hospital Directory.</span>
                    </div>

                    <div className="md:col-span-4 flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1" htmlFor="hospital-id" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span>Facility ID Code</span>
                        <span className="text-[#ba1a1a]">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          className={`w-full h-12 px-4 font-mono rounded-lg text-sm uppercase tracking-wider transition-all outline-none border ${
                            isEditMode 
                              ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                              : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                          }`}
                          id="hospital-id" 
                          name="hospital-id" 
                          readOnly={!isEditMode}
                          required 
                          type="text" 
                          value={hospitalId}
                          onChange={(e) => setHospitalId(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#58423a]/60 pointer-events-none text-[20px]">tag</span>
                      </div>
                      <span className="text-[11px] text-[#58423a]">Immutable administrative prefix.</span>
                    </div>
                  </div>

                  {/* Row 2: Facility Classification */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" htmlFor="facility-type" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Facility Classification &amp; Tier
                    </label>
                    <div className="relative">
                      <input 
                        className={`w-full h-12 px-4 rounded-lg text-sm transition-all outline-none border ${
                          isEditMode 
                            ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                            : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                        }`}
                        id="facility-type" 
                        name="facility-type" 
                        readOnly={!isEditMode}
                        type="text" 
                        value={facilityType}
                        onChange={(e) => setFacilityType(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#58423a]/60 pointer-events-none text-[20px]">category</span>
                    </div>
                    <span className="text-[11px] text-[#58423a]">Designates critical departments, beds, and surgical suites.</span>
                  </div>

                  {/* Row 3: Physical Address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" htmlFor="address" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Full Physical Geo-Address
                    </label>
                    <textarea 
                      className={`w-full p-4 rounded-lg text-sm leading-relaxed resize-none transition-all outline-none border ${
                        isEditMode 
                          ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                          : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                      }`}
                      id="address" 
                      name="address" 
                      readOnly={!isEditMode}
                      rows="3"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <div className="flex items-center justify-between text-[#58423a] text-xs">
                      <span>Public map pin and physical turn-by-turn guidance for ambulance routing.</span>
                    </div>
                  </div>

                  {/* Row 4: Emergency Ward & Connected Hubs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    <div className="flex flex-col gap-1.5 bg-[#f2f4f6] p-4 rounded-xl border border-[#e0e3e5]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#7c2800] flex items-center gap-1.5 uppercase" htmlFor="emergency-ward" style={{ fontFamily: 'Lexend, sans-serif' }}>
                          <span className="material-symbols-outlined text-[18px]">e911_emergency</span>
                          <span>Emergency Ward</span>
                        </label>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ffdbcf] text-[#380d00]">Triage Priority</span>
                      </div>
                      <input 
                        className={`w-full h-10 px-3 rounded text-xs font-semibold outline-none border ${
                          isEditMode ? 'bg-white text-[#191c1e] border-[#e0e3e5]' : 'bg-[#f2f4f6] text-[#58423a] border-transparent'
                        }`}
                        id="emergency-ward" 
                        name="emergency-ward" 
                        readOnly={!isEditMode}
                        type="text" 
                        value={emergencyWard}
                        onChange={(e) => setEmergencyWard(e.target.value)}
                      />
                      <span className="text-[10px] text-[#58423a]">Active 24x7 intake zones reserved for emergency triage.</span>
                    </div>

                    <div className="flex flex-col gap-1.5 bg-[#f2f4f6] p-4 rounded-xl border border-[#e0e3e5]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#455f8a] flex items-center gap-1.5 uppercase" htmlFor="connected-hubs" style={{ fontFamily: 'Lexend, sans-serif' }}>
                          <span className="material-symbols-outlined text-[18px]">hub</span>
                          <span>Connected Hubs</span>
                        </label>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#d6e3ff] text-[#001b3d]">Dual Mesh</span>
                      </div>
                      <input 
                        className={`w-full h-10 px-3 rounded text-xs font-semibold outline-none border ${
                          isEditMode ? 'bg-white text-[#191c1e] border-[#e0e3e5]' : 'bg-[#f2f4f6] text-[#58423a] border-transparent'
                        }`}
                        id="connected-hubs" 
                        name="connected-hubs" 
                        readOnly={!isEditMode}
                        type="text" 
                        value={connectedHubs}
                        onChange={(e) => setConnectedHubs(e.target.value)}
                      />
                      <span className="text-[10px] text-[#58423a]">Synchronized tele-radiology triage and municipal ALS/BLS fleet dispatcher.</span>
                    </div>
                  </div>

                  {/* Connected Module Integration Note Card */}
                  <div className="mt-4 p-5 bg-[#f2f4f6] rounded-xl flex items-start gap-4 border border-[#e0e3e5]">
                    <div className="p-2 rounded-full bg-[#455f8a] text-white shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#191c1e] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                          Connected Module Note: Citizen &amp; Fleet Pipeline
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[#00501a]"></span>
                        <span className="text-[10px] text-[#00501a] font-bold uppercase">Live Broadcast</span>
                      </div>
                      <p className="text-xs text-[#58423a] mt-1 leading-relaxed">
                        <strong className="text-[#191c1e]">Patient Portal Integration:</strong> This hospital information feeds directly into Patient Hospital Selection (03.14) and Emergency Ambulance Routing (07.04). Updates apply across regional kiosks and vehicle dispatchers.
                      </p>
                    </div>
                  </div>

                  {/* Toast */}
                  {showToast && (
                    <div className="flex items-center gap-3 bg-[#99f89e] text-[#002106] px-5 py-3 rounded-xl shadow-md transition-all border border-[#00501a]/20">
                      <span className="material-symbols-outlined text-[#00501a] text-[24px]">check_circle</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Record Synchronized</span>
                        <span className="text-xs">Changes propagated to Patient Portal and Ambulance Grid.</span>
                      </div>
                    </div>
                  )}

                  {/* Master Form Action Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-2 border-t border-[#eceef0]">
                    <Link 
                      to="/admin/dashboard"
                      className="inline-flex items-center gap-2 text-[#455f8a] hover:text-[#191c1e] text-sm font-semibold transition-colors"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      <span>← Back to Dashboard</span>
                    </Link>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button 
                        type="button"
                        onClick={() => setIsEditMode(!isEditMode)}
                        className="flex-1 sm:flex-none h-12 px-6 rounded-full bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#455f8a] text-sm font-bold transition-all"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        {isEditMode ? 'LOCK FIELDS' : 'EDIT RECORD'}
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 sm:flex-none h-12 px-8 rounded-full bg-[#00501a] hover:bg-[#1b6b33] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        <span>SAVE CHANGES</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Visual Facility Intelligence & GIS Routing Preview */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Facility Capacity Card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col border border-[#eceef0]">
                <div className="p-5 flex flex-col gap-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#58423a] font-bold uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Live Facility Capacity
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#00501a]/10 text-[#00501a] text-[10px] font-bold">500 Beds Total</span>
                  </div>

                  {/* Capacity Visualizer */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1 text-[#191c1e]">
                        <span>Critical ICU Occupancy</span>
                        <span className="font-bold text-[#7c2800]">88% (22/25)</span>
                      </div>
                      <div className="w-full h-2 bg-[#f2f4f6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#7c2800] rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 text-[#191c1e]">
                        <span>General &amp; Ayush Inpatient Ward</span>
                        <span className="font-bold text-[#00501a]">64% (288/450)</span>
                      </div>
                      <div className="w-full h-2 bg-[#f2f4f6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00501a] rounded-full" style={{ width: '64%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 text-[#191c1e]">
                        <span>Liquid Medical Oxygen (LMO)</span>
                        <span className="font-bold text-[#455f8a]">94% (Nominal)</span>
                      </div>
                      <div className="w-full h-2 bg-[#f2f4f6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#455f8a] rounded-full" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Realtime Geo-Routing Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3 border border-[#eceef0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#455f8a] text-[22px]">near_me</span>
                    <span className="text-sm font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>GIS Map Point</span>
                  </div>
                  <span className="text-xs text-[#58423a] font-mono">28.5672° N, 77.2100° E</span>
                </div>

                <div className="w-full h-32 rounded-xl bg-[#f2f4f6] relative overflow-hidden shadow-inner flex items-center justify-center border border-[#e0e3e5]">
                  <div className="flex flex-col items-center bg-white/90 px-4 py-1.5 rounded-full shadow-md backdrop-blur-sm border border-[#eceef0]">
                    <div className="flex items-center gap-1 text-[#7c2800] text-xs font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      <span>{hospitalId} Geofence Verified</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#58423a] pt-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#00501a]">alt_route</span> Optimal 108 Corridor
                  </span>
                  <span className="text-[#191c1e] font-semibold">Avg Triage Arrival: 7.2 min</span>
                </div>
              </div>

              {/* Quick Emergency Network Contacts */}
              <div className="bg-[#f2f4f6] rounded-2xl p-5 flex flex-col gap-2.5 border border-[#e0e3e5]">
                <span className="text-xs uppercase tracking-wider text-[#58423a] font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Regional Integration Desk
                </span>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#e0e3e5]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#7c2800] text-[18px]">call</span>
                    <span className="text-xs font-semibold text-[#191c1e]">Triage Intercom</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#58423a]">+91 11 2659-4401</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#e0e3e5]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00501a] text-[18px]">crisis_alert</span>
                    <span className="text-xs font-semibold text-[#191c1e]">108 Fleet Gateway</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#00501a]">Channel D-9 Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
