import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import PatientQrCode from '../../components/common/PatientQrCode'
import { getPatientProfile } from '../../data/patientMockData'
import { AuthApi } from '../../services/authApi'

export default function PatientProfilePage() {
  const [profile, setProfile] = useState(() => AuthApi.getStoredPatient() || getPatientProfile())
  const navigate = useNavigate()

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await AuthApi.getMe()
        if (res.success && res.patient) {
          setProfile(res.patient)
        }
      } catch (err) {
        console.warn('Backend profile fetch warning:', err.message)
      }
    }
    loadSession()
  }, [])

  const handleLogout = async (e) => {
    e.preventDefault()
    await AuthApi.logout()
    navigate('/patient')
  }

  const patientCode = profile.patientUniqueCode || profile.patient_unique_code || profile.patientId || ''

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Profile' }
      ]}
      backTo="/patient/home"
      backLabel="Home"
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-10 space-y-8">
          {/* Card Top Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#166534] flex items-center justify-center text-4xl font-bold shadow-inner shrink-0">
                <span className="material-symbols-outlined text-5xl">person</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Registered Citizen Profile
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {profile.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>Age: {profile.age} Years</span>
                  <span>•</span>
                  <span>{profile.gender}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-[#166534] text-[10px] font-bold">
                    <span className="material-symbols-outlined text-xs mr-0.5">verified</span>
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Permanent Credentials & QR Box */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl w-full md:w-auto justify-between md:justify-end">
              <div className="flex flex-col text-left md:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Patient ID
                </span>
                <span className="text-sm font-bold text-[#166534] font-mono">
                  {profile.patientId}
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] mt-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Patient Unique Code
                </span>
                <span className="text-base font-black text-[#0A2540] font-mono tracking-wider">
                  {patientCode}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 flex items-center md:justify-end gap-1">
                  <span className="material-symbols-outlined text-xs text-[#166534]">lock</span>
                  Permanent Citizen Code
                </span>
              </div>

              {/* QR Code with Click-to-Enlarge Modal */}
              <div className="border border-slate-200 bg-white p-2 rounded-xl flex flex-col items-center">
                <PatientQrCode code={patientCode} size={90} allowEnlarge={true} />
              </div>
            </div>
          </div>

          {/* Structured Citizen Details Grid (STRICT BASIC FIELDS ONLY) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Basic Demographic & Identity Details
              </h2>
              <span className="text-xs text-slate-400">Verified via UIDAI & ABDM</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient Name */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.name}</span>
                <span className="text-[11px] text-slate-500">Official registry name</span>
              </div>

              {/* Mobile Number */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Mobile Number</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-bold text-slate-900 text-sm font-mono">{profile.mobile}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-[#166534]">
                    Verified
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Primary contact & OTP line</span>
              </div>

              {/* DOB / Age */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">DOB / Age</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.dob}</span>
                <span className="text-[11px] text-slate-500">Calculated Age: {profile.age} Years</span>
              </div>

              {/* Gender */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Gender</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.gender}</span>
                <span className="text-[11px] text-slate-500">Standard Demographic Record</span>
              </div>

              {/* Identity Type */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Identity Type</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.identityType}</span>
                <span className="text-[11px] text-slate-500">National Health ID Document</span>
              </div>

              {/* Identity Number */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Identity Number</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 font-mono block">{profile.maskedIdentityNumber}</span>
                <span className="text-[11px] text-slate-500">Masked for citizen privacy</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>LOGOUT / SESSION EXIT</span>
            </button>

            <Link
              to="/patient/edit-profile"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">edit</span>
              <span>EDIT PROFILE</span>
            </Link>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
