import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { getAdminDoctor, getAdminHospital, getAdminMedicines, getAdminDiagnostics, getAdminAmbulance } from '../../data/patientMockData'
import { AdminApi } from '../../services/adminApi'

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState({
    doctors: 1,
    hospitals: 1,
    medicines: getAdminMedicines().length,
    diagnostics: getAdminDiagnostics().length,
    ambulances: 1
  })
  const [doctor, setDoctor] = useState(getAdminDoctor())
  const [hospital, setHospital] = useState(getAdminHospital())
  const [ambulance, setAmbulance] = useState(getAdminAmbulance())

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await AdminApi.getDashboard()
        if (res.ok && res.data?.counts) {
          setCounts(res.data.counts)
        }
      } catch (e) {}

      try {
        const docRes = await AdminApi.getDoctor(1)
        if (docRes.ok && docRes.data?.doctor) {
          setDoctor(docRes.data.doctor)
        }
      } catch (e) {}

      try {
        const hospRes = await AdminApi.getHospital(1)
        if (hospRes.ok && hospRes.data?.hospital) {
          setHospital(hospRes.data.hospital)
        }
      } catch (e) {}

      try {
        const ambRes = await AdminApi.getAmbulance(1)
        if (ambRes.ok && ambRes.data?.ambulance) {
          setAmbulance({
            ambulanceNumber: ambRes.data.ambulance.ambulance_number || ambRes.data.ambulance.ambulanceNumber,
            vehicleNumber: ambRes.data.ambulance.vehicle_number || ambRes.data.ambulance.vehicleNumber,
            status: ambRes.data.ambulance.status
          })
        }
      } catch (e) {}
    }

    loadDashboard()
  }, [])

  return (
    <AdminLayout activeNav="Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col w-full pb-8">
          {/* Top Level Admin Title & Context Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col gap-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 self-start px-3.5 py-1 bg-[#00501a]/10 text-[#00501a] rounded-full border border-[#00501a]/20">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Central Administration • Healthcare Operations Console
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight mt-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Admin Dashboard
              </h1>
              <p className="text-base text-[#58423a] leading-relaxed">
                Manage core healthcare registry entities across connected clinical and emergency portals.
              </p>
            </div>

            {/* Active System Telemetry Marker */}
            <div className="flex items-center gap-3 bg-[#f2f4f6] px-5 py-3 rounded-2xl self-start md:self-auto shadow-sm border border-[#e0e3e5]">
              <span className="w-3 h-3 rounded-full bg-[#00501a] animate-pulse"></span>
              <div className="flex flex-col">
                <span className="text-xs text-[#58423a] uppercase tracking-wide font-medium">Registry State</span>
                <span className="text-sm text-[#00501a] font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>5 Core Entities Online</span>
              </div>
            </div>
          </div>

          {/* Primary 5 Category Management Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. DOCTORS CARD */}
            <div className="flex flex-col justify-between bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden border border-[#eceef0]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c2800]/5 rounded-bl-[4rem] pointer-events-none transition-transform group-hover:scale-110"></div>
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#7c2800] group-hover:bg-[#7c2800] group-hover:text-white transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">stethoscope</span>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-[#e6e8ea] text-[#191c1e] text-xs font-semibold tracking-wide" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {counts.doctors || 1} Active Clinician
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Manage Doctor
                </h2>
                <p className="text-sm text-[#58423a] leading-relaxed">
                  Configure single attending clinician profile ({doctor.name}), specialization, and OPD room assignment.
                </p>
              </div>
              <div className="mt-8 pt-4">
                <Link 
                  to="/admin/doctors" 
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[3rem] px-6 bg-[#00501a] hover:bg-[#1b6b33] text-white font-semibold text-sm rounded-full shadow-sm transition-all duration-200"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span>MANAGE DOCTOR</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* 2. HOSPITALS CARD */}
            <div className="flex flex-col justify-between bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden border border-[#eceef0]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#455f8a]/5 rounded-bl-[4rem] pointer-events-none transition-transform group-hover:scale-110"></div>
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#455f8a] group-hover:bg-[#455f8a] group-hover:text-white transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">local_hospital</span>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-[#e6e8ea] text-[#191c1e] text-xs font-semibold tracking-wide" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {counts.hospitals || 1} Facility Registered
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Manage Hospital
                </h2>
                <p className="text-sm text-[#58423a] leading-relaxed">
                  Update institutional health facility name ({hospital.name}), unique code, and verified address.
                </p>
              </div>
              <div className="mt-8 pt-4">
                <Link 
                  to="/admin/hospitals" 
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[3rem] px-6 bg-[#00501a] hover:bg-[#1b6b33] text-white font-semibold text-sm rounded-full shadow-sm transition-all duration-200"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span>MANAGE HOSPITAL</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* 3. MEDICINES CARD */}
            <div className="flex flex-col justify-between bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden border border-[#eceef0]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00501a]/5 rounded-bl-[4rem] pointer-events-none transition-transform group-hover:scale-110"></div>
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#00501a] group-hover:bg-[#00501a] group-hover:text-white transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">medication</span>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-[#e6e8ea] text-[#191c1e] text-xs font-semibold tracking-wide" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {counts.medicines || 10} Formulary Items
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Manage Medicine
                </h2>
                <p className="text-sm text-[#58423a] leading-relaxed">
                  Update dispensary formulary, available quantities, and stock availability across pharmacy nodes.
                </p>
              </div>
              <div className="mt-8 pt-4">
                <Link 
                  to="/admin/medicines" 
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[3rem] px-6 bg-[#00501a] hover:bg-[#1b6b33] text-white font-semibold text-sm rounded-full shadow-sm transition-all duration-200"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span>MANAGE MEDICINES</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* 4. DIAGNOSTICS CARD */}
            <div className="flex flex-col justify-between bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden border border-[#eceef0]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffb59a]/20 rounded-bl-[4rem] pointer-events-none transition-transform group-hover:scale-110"></div>
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#7c2800] group-hover:bg-[#7c2800] group-hover:text-white transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">biotech</span>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-[#e6e8ea] text-[#191c1e] text-xs font-semibold tracking-wide" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {counts.diagnostics || 5} Standard Tests
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Manage Diagnostic
                </h2>
                <p className="text-sm text-[#58423a] leading-relaxed">
                  Configure laboratory investigations, radiology scans, and testing modalities for clinical requisitions.
                </p>
              </div>
              <div className="mt-8 pt-4">
                <Link 
                  to="/admin/diagnostics" 
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[3rem] px-6 bg-[#00501a] hover:bg-[#1b6b33] text-white font-semibold text-sm rounded-full shadow-sm transition-all duration-200"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span>MANAGE DIAGNOSTIC</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* 5. AMBULANCES CARD */}
            <div className="flex flex-col justify-between bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden border border-[#eceef0]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00501a]/10 rounded-bl-[4rem] pointer-events-none transition-transform group-hover:scale-110"></div>
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#00501a] group-hover:bg-[#00501a] group-hover:text-white transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">ambulance</span>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-[#e6e8ea] text-[#191c1e] text-xs font-semibold tracking-wide" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {counts.ambulances || 1} Fleet Unit
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Manage Ambulance
                </h2>
                <p className="text-sm text-[#58423a] leading-relaxed">
                  Oversee emergency fleet readiness, active units ({ambulance.ambulanceNumber || 'DL-01-EQ-9041'}), and dispatch status.
                </p>
              </div>
              <div className="mt-8 pt-4">
                <Link 
                  to="/admin/ambulances" 
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[3rem] px-6 bg-[#00501a] hover:bg-[#1b6b33] text-white font-semibold text-sm rounded-full shadow-sm transition-all duration-200"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span>MANAGE AMBULANCE</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Conceptual Sync Information Banner */}
          <div className="mt-10 bg-[#f2f4f6] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e0e3e5]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#00501a]/10 text-[#00501a] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">sync</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Registry Data Synchronization
                </span>
                <p className="text-sm text-[#58423a] leading-relaxed">
                  Updates configured in the Admin Portal automatically reflect across Doctor, Patient, Pharmacy, Diagnostic, and Ambulance modules in real time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
