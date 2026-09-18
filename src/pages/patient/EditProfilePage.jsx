import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { getPatientProfile, savePatientProfile } from '../../data/patientMockData'

export default function EditProfilePage() {
  const current = getPatientProfile()
  const navigate = useNavigate()

  const [name, setName] = useState(current.name || '')
  const [rawMobile, setRawMobile] = useState(current.rawMobile || '9876543210')
  const [dob, setDob] = useState(current.dob || '14/05/1977')
  const [age, setAge] = useState(current.age || '48')
  const [gender, setGender] = useState(current.gender || 'Male')
  const [identityType, setIdentityType] = useState(current.identityType || 'Aadhaar')
  const [identityNumber, setIdentityNumber] = useState(current.identityNumber || '9148 2911 0248')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()

    const updated = {
      ...current,
      name,
      rawMobile,
      mobile: `+91 ${rawMobile.slice(0, 2)}XXXXXX${rawMobile.slice(-2)}`,
      dob,
      age,
      gender,
      identityType,
      identityNumber,
      maskedIdentityNumber: `XXXX-XXXX-${identityNumber.replace(/\s+/g, '').slice(-4)}`
    }

    savePatientProfile(updated)
    setSavedSuccess(true)
    setTimeout(() => {
      navigate('/patient/profile')
    }, 1200)
  }

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Profile', to: '/patient/profile' },
        { label: 'Edit Profile' }
      ]}
      backTo="/patient/profile"
      backLabel="Back to Profile"
    >
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
          {/* Header */}
          <div className="pb-4 border-b border-slate-200">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Edit Patient Profile
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Update basic contact and demographic details registered with your civic health identifier.
            </p>
          </div>

          {/* Success Banner */}
          {savedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-100 text-[#166534] flex items-center gap-2 text-xs font-bold animate-pulse">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>Profile updated successfully! Redirecting to profile...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* Patient ID and Unique Code (Read-only / Immutable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Permanent Patient Health ID
                  </span>
                  <span className="font-mono font-bold text-[#166534] text-base">{current.patientId}</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">Immutable ID</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Permanent Patient Unique Code
                  </span>
                  <span className="font-mono font-bold text-[#0A2540] text-base tracking-wider">{current.patientUniqueCode || 'AC-7F42K9'}</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">lock</span>
                  Non-Editable
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="edit-name">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534]"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="edit-mobile">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-mobile"
                  type="tel"
                  maxLength={10}
                  required
                  value={rawMobile}
                  onChange={(e) => setRawMobile(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534] font-mono"
                />
              </div>

              {/* DOB */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="edit-dob">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-dob"
                  type="text"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534]"
                />
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="edit-age">
                  Age (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-age"
                  type="number"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534]"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Identity Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Identity Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={identityType}
                  onChange={(e) => setIdentityType(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534]"
                >
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="ABHA">ABHA Health ID</option>
                </select>
              </div>

              {/* Identity Number */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="edit-id-number">
                  Identity Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-id-number"
                  type="text"
                  required
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534] font-mono tracking-wider"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Link
                to="/patient/profile"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>Cancel</span>
              </Link>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </PatientLayout>
  )
}
