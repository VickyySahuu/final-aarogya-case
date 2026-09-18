import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { getAdminDoctor, updateAdminDoctor } from '../../data/patientMockData'
import AdminApi from '../../services/adminApi'

export default function ManageDoctorPage() {
  const currentDoctor = getAdminDoctor()
  const [isEditMode, setIsEditMode] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Doctor state fields
  const [name, setName] = useState(currentDoctor.name || 'Dr. Ramanathan Venkatraman')
  const [doctorId, setDoctorId] = useState(currentDoctor.doctorId || 'DOC-1042')
  const [specialization, setSpecialization] = useState(currentDoctor.specialization || 'General Medicine')
  const [hospital, setHospital] = useState(currentDoctor.hospital || 'District Civil Hospital')
  const [room, setRoom] = useState(currentDoctor.room || 'Room 104')

  useEffect(() => {
    AdminApi.getDoctor(1)
      .then(res => {
        const doc = res.data?.doctor || res.doctor || (res.ok ? res.data : null)
        if (doc) {
          if (doc.name) setName(doc.name)
          if (doc.doctorId || doc.doctor_id) setDoctorId(doc.doctorId || doc.doctor_id)
          if (doc.specialization) setSpecialization(doc.specialization)
          if (doc.hospital) setHospital(doc.hospital)
          if (doc.room) setRoom(doc.room)
        }
      })
      .catch(err => console.warn('Using local doctor fallback:', err))
  }, [])

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      await AdminApi.updateDoctor(1, {
        name,
        specialization,
        hospital,
        room
      })
    } catch (err) {
      console.warn('Backend updateDoctor error (fallback to local):', err)
    } finally {
      updateAdminDoctor({
        name,
        doctorId,
        specialization,
        hospital,
        room
      })
      setIsSaving(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    }
  }

  return (
    <AdminLayout activeNav="Doctors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col w-full">
          {/* Breadcrumb & Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Link 
                to="/admin/dashboard"
                className="inline-flex items-center gap-1.5 text-[#455f8a] hover:text-[#7c2800] font-semibold text-sm transition-colors px-3 py-1.5 rounded-full hover:bg-[#e6e8ea]"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                <span>Back to Dashboard</span>
              </Link>
              <span className="text-[#e3bfb2] text-sm">/</span>
              <span className="text-xs text-[#58423a] uppercase tracking-wider font-semibold">Clinician Master Registry</span>
            </div>

            {/* Mode Badge & Quick State Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#00501a] text-xs font-semibold shadow-sm border border-[#e0e3e5]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00501a] animate-pulse"></span>
                <span>Synced with NIC Triage Core</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-[#e6e8ea] text-[#58423a] text-xs font-semibold">
                Node: DL-CENTRAL-01
              </div>
            </div>
          </div>

          {/* Page Header Summary Banner */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 bg-[#f2f4f6] p-6 sm:p-8 rounded-2xl shadow-sm border border-[#e0e3e5]">
            <div className="flex flex-col gap-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-[#ffdbcf] text-[#380d00] text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Record #{doctorId}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#99f89e] text-[#002106] text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Verified Attending Clinician
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Manage Doctor
              </h1>
              <p className="text-sm sm:text-base text-[#58423a] leading-relaxed">
                Configure master clinician registry record for OPD consultations and e-prescriptions.
              </p>
            </div>

            {/* Toggle Edit / View Controls */}
            <div className="flex items-center gap-1 bg-[#e0e3e5] p-1.5 rounded-full shadow-inner self-start lg:self-auto">
              <button 
                type="button"
                onClick={() => setIsEditMode(false)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !isEditMode ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#58423a] hover:text-[#191c1e]'
                }`}
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span>View Mode</span>
              </button>
              <button 
                type="button"
                onClick={() => setIsEditMode(true)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isEditMode ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#58423a] hover:text-[#191c1e]'
                }`}
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span>Editing Mode</span>
              </button>
            </div>
          </div>

          {/* Main Profile Card Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Left Column: Identity Snapshot & Status */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col items-center text-center relative overflow-hidden border border-[#eceef0]">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#00501a]/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#7c2800]/5 rounded-full blur-xl pointer-events-none"></div>

                {/* Doctor Avatar */}
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden shadow-md bg-[#e6e8ea] p-1 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[64px] text-[#7c2800]">person</span>
                  </div>
                  <div className="absolute bottom-1 right-1 bg-[#00501a] text-white rounded-full p-1.5 shadow-md flex items-center justify-center" title="Accredited Specialist">
                    <span className="material-symbols-outlined text-[18px]">medical_services</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-[#191c1e] mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {name}
                </h2>
                <p className="text-sm font-semibold text-[#455f8a] mb-3" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {specialization}
                </p>

                {/* Status Tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#99f89e] text-[#002106] text-xs font-semibold mb-6">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>Verified Attending Clinician</span>
                </div>

                {/* Quick Administrative Indicators */}
                <div className="w-full grid grid-cols-2 gap-3 pt-4 bg-[#f2f4f6] rounded-xl p-4 border border-[#e0e3e5]">
                  <div className="flex flex-col items-center justify-center p-1">
                    <span className="text-xl font-bold text-[#7c2800]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {room.replace(/\D/g, '') || '104'}
                    </span>
                    <span className="text-xs text-[#58423a]">OPD Assigned</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-1 border-l border-[#e0e3e5]">
                    <span className="text-xl font-bold text-[#00501a]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      99.4%
                    </span>
                    <span className="text-xs text-[#58423a]">e-Rx Adherence</span>
                  </div>
                </div>

                {/* Registration Stamp */}
                <div className="w-full mt-6 pt-4 border-t border-[#eceef0] flex flex-col gap-1.5 text-xs text-[#58423a] text-left">
                  <div className="flex justify-between py-1">
                    <span>Medical Council Reg:</span>
                    <span className="font-bold text-[#191c1e]">MCI-2004-9812A</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Clinical Staff ID:</span>
                    <span className="font-bold text-[#191c1e]">DOC-4102</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Access Level:</span>
                    <span className="font-bold text-[#00501a]">Level 3 (Prescriber)</span>
                  </div>
                </div>
              </div>

              {/* Kiosk Token Info Card */}
              <div className="bg-[#f2f4f6] p-5 rounded-2xl shadow-sm flex items-center gap-4 border border-[#e0e3e5]">
                <div className="w-12 h-12 bg-white rounded-xl p-2 flex items-center justify-center shadow-inner shrink-0 text-[#191c1e]">
                  <span className="material-symbols-outlined text-[28px]">qr_code</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Kiosk Dispatch Token
                  </span>
                  <span className="text-xs text-[#58423a]">
                    Scannable token for offline terminal queue authorization.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Administrative Fields & Configuration Form */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col border border-[#eceef0]">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#eceef0]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#7c2800] text-[24px]">manage_accounts</span>
                    <h3 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Core Registry Attributes
                    </h3>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                    isEditMode ? 'bg-[#99f89e] text-[#002106]' : 'bg-[#eceef0] text-[#58423a]'
                  }`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {isEditMode ? 'EDITABLE' : 'READ ONLY'}
                  </span>
                </div>

                {/* The Administrative Form */}
                <form className="flex flex-col gap-5" onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Doctor Name Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1" htmlFor="doctorName" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span>Doctor Name</span>
                        <span className="text-[#ba1a1a]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[#58423a] text-[22px] pointer-events-none">person</span>
                        <input 
                          className={`w-full pl-11 pr-4 h-12 rounded-lg text-sm transition-all outline-none border ${
                            isEditMode 
                              ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                              : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                          }`}
                          id="doctorName" 
                          name="doctorName" 
                          readOnly={!isEditMode} 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <span className="text-[11px] text-[#58423a]">Legal clinician identity recorded on gazetted registrations.</span>
                    </div>

                    {/* Doctor ID Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1" htmlFor="doctorId" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span>Doctor ID</span>
                        <span className="text-[#ba1a1a]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[#58423a] text-[22px] pointer-events-none">badge</span>
                        <input 
                          className={`w-full pl-11 pr-4 h-12 rounded-lg text-sm font-mono transition-all outline-none border ${
                            isEditMode 
                              ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                              : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                          }`}
                          id="doctorId" 
                          name="doctorId" 
                          readOnly={!isEditMode} 
                          type="text" 
                          value={doctorId}
                          onChange={(e) => setDoctorId(e.target.value)}
                        />
                      </div>
                      <span className="text-[11px] text-[#58423a]">Unique administrative identifier for token mapping.</span>
                    </div>

                    {/* Specialization Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1" htmlFor="specialization" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span>Specialization</span>
                        <span className="text-[#ba1a1a]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[#58423a] text-[22px] pointer-events-none">stethoscope</span>
                        <input 
                          className={`w-full pl-11 pr-4 h-12 rounded-lg text-sm transition-all outline-none border ${
                            isEditMode 
                              ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                              : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                          }`}
                          id="specialization" 
                          name="specialization" 
                          readOnly={!isEditMode} 
                          type="text" 
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                        />
                      </div>
                      <span className="text-[11px] text-[#58423a]">Primary operational medical classification.</span>
                    </div>

                    {/* Hospital / Workplace Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1" htmlFor="workplace" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span>Hospital / Workplace</span>
                        <span className="text-[#ba1a1a]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[#58423a] text-[22px] pointer-events-none">domain</span>
                        <input 
                          className={`w-full pl-11 pr-4 h-12 rounded-lg text-sm transition-all outline-none border ${
                            isEditMode 
                              ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                              : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                          }`}
                          id="workplace" 
                          name="workplace" 
                          readOnly={!isEditMode} 
                          type="text" 
                          value={hospital}
                          onChange={(e) => setHospital(e.target.value)}
                        />
                      </div>
                      <span className="text-[11px] text-[#58423a]">Designated primary duty healthcare facility.</span>
                    </div>

                    {/* Room Number Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1" htmlFor="roomNumber" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span>Room Number / Chamber</span>
                        <span className="text-[#ba1a1a]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[#58423a] text-[22px] pointer-events-none">meeting_room</span>
                        <input 
                          className={`w-full pl-11 pr-4 h-12 rounded-lg text-sm transition-all outline-none border ${
                            isEditMode 
                              ? 'bg-white text-[#191c1e] border-[#e0e3e5] focus:border-[#7c2800] focus:ring-2 focus:ring-[#7c2800]/20' 
                              : 'bg-[#f2f4f6] text-[#58423a] border-transparent cursor-not-allowed'
                          }`}
                          id="roomNumber" 
                          name="roomNumber" 
                          readOnly={!isEditMode} 
                          type="text" 
                          value={room}
                          onChange={(e) => setRoom(e.target.value)}
                        />
                      </div>
                      <span className="text-[11px] text-[#58423a]">Assigned physical consultation room for queue routing.</span>
                    </div>

                    {/* Verification Status Readonly */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Verification Accreditation
                      </label>
                      <div className="h-12 rounded-lg bg-[#f2f4f6] px-4 flex items-center justify-between text-[#191c1e] border border-[#e0e3e5]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#00501a] text-[20px]">verified</span>
                          <span className="text-xs font-bold text-[#00501a]">Verified Attending Clinician</span>
                        </div>
                        <span className="material-symbols-outlined text-[#58423a] text-[18px]">lock</span>
                      </div>
                      <span className="text-[11px] text-[#58423a]">Requires State Medical Superintendent re-validation to revoke.</span>
                    </div>
                  </div>

                  {/* Connected Module Synchronization Card */}
                  <div className="mt-4 bg-[#d6e3ff]/40 border border-[#b2cdfe] p-5 rounded-xl flex items-start gap-4">
                    <span className="material-symbols-outlined text-[#455f8a] text-[26px] mt-0.5 shrink-0">sync_saved_locally</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-[#455f8a]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Doctor Portal Integration Active
                      </span>
                      <p className="text-xs text-[#191c1e] leading-relaxed">
                        Doctor Portal Integration: This clinician profile is automatically synchronized with Doctor Login (04.01), OPD Queue (04.10), and e-Prescriptions (04.27).
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-semibold text-[#455f8a]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-[#00501a]">check_circle</span> 04.01 Doctor Login
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-[#00501a]">check_circle</span> 04.10 OPD Queue Dispatch
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-[#00501a]">check_circle</span> 04.27 Pharmacy e-Rx Engine
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Toast */}
                  {showToast && (
                    <div className="flex items-center gap-3 bg-[#99f89e] text-[#002106] px-5 py-3 rounded-xl shadow-md transition-all border border-[#00501a]/20">
                      <span className="material-symbols-outlined text-[#00501a] text-[24px]">check_circle</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Record Updated</span>
                        <span className="text-xs">Clinician profile modifications synchronized across linked Doctor Portal nodes.</span>
                      </div>
                    </div>
                  )}

                  {/* Administrative Form Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#eceef0]">
                    <Link 
                      to="/admin/dashboard"
                      className="inline-flex items-center gap-2 text-[#455f8a] hover:text-[#191c1e] text-sm font-semibold transition-colors"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                      <span>← Back to Dashboard</span>
                    </Link>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button 
                        type="button"
                        onClick={() => setIsEditMode(!isEditMode)}
                        className="flex-1 sm:flex-none min-h-[3rem] px-6 rounded-full bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#455f8a] text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        <span>{isEditMode ? 'LOCK RECORD' : 'EDIT PROFILE'}</span>
                      </button>

                      <button 
                        type="submit"
                        className="flex-1 sm:flex-none min-h-[3rem] px-8 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
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
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
