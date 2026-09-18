import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { savePatientProfile, getPatientProfile } from '../../data/patientMockData'

export default function PatientRegistrationPage() {
  const [fullName, setFullName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [identityType, setIdentityType] = useState('Aadhaar')
  const [identityNumber, setIdentityNumber] = useState('')
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return ''
    const birthDate = new Date(birthDateStr)
    if (isNaN(birthDate.getTime())) return ''
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? String(age) : '0'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required'
    if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length !== 10) {
      newErrors.mobileNumber = 'Valid 10-digit mobile number required'
    }
    if (!dob) newErrors.dob = 'Date of birth is required'
    if (!gender) newErrors.gender = 'Please select a gender'
    if (!identityNumber.trim()) newErrors.identityNumber = 'Identity number required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const calculatedAge = calculateAge(dob) || '25'

    navigate('/patient/verify-otp', {
      state: {
        mobile: mobileNumber.trim(),
        isRegistration: true,
        patientName: fullName.trim(),
        dob: dob,
        age: calculatedAge,
        gender,
        identityType,
        identityNumber: identityNumber.trim(),
        bloodGroup: 'B+',
        address: 'Universal Healthcare Jurisdiction'
      }
    })
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient' },
        { label: 'New Registration' }
      ]}
      backTo="/patient"
      backLabel="Back to Portal"
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-10 md:p-12 overflow-hidden">
          {/* Institutional Top Accent */}
          <div className="h-1.5 w-full bg-[#166534] absolute top-0 left-0"></div>

          {/* Top Institutional Header Ribbon */}
          <div className="flex items-start justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200 text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>Step 1 of 2: Patient Onboarding</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                New Registration
              </h1>
              <p className="text-sm text-slate-600 max-w-xl">
                Create your basic patient identity to access public healthcare services across connected health centers and clinics.
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-[#166534] border border-emerald-200 shrink-0">
              <span className="material-symbols-outlined text-3xl">local_hospital</span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between" htmlFor="fullName">
                  <span>Full Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-xl pointer-events-none">badge</span>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter patient full name as per official ID"
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534] transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Official registry name used for prescriptions</span>
                {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
              </div>

              {/* 2. Mobile Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between" htmlFor="mobileNumber">
                  <span>Mobile Number</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none select-none">
                    <span className="material-symbols-outlined text-slate-400 text-xl">call</span>
                    <span className="text-xs font-semibold text-slate-600 font-mono tracking-normal">+91</span>
                    <span className="h-4 w-px bg-slate-300 ml-1"></span>
                  </div>
                  <input
                    id="mobileNumber"
                    type="tel"
                    maxLength={10}
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full h-12 pl-20 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534] transition-all font-mono tracking-wider"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Will receive instant one-time password (OTP)</span>
                {errors.mobileNumber && <p className="text-xs text-red-600">{errors.mobileNumber}</p>}
              </div>

              {/* 3. Date of Birth (Date Picker Selection) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between" htmlFor="dob">
                  <span>Date of Birth</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-xl pointer-events-none">calendar_today</span>
                  <input
                    id="dob"
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value)
                      if (errors.dob) setErrors((prev) => ({ ...prev, dob: null }))
                    }}
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534] transition-all cursor-pointer font-medium"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {dob ? `Calculated Age: ${calculateAge(dob)} Years` : 'Select birth date from calendar'}
                  </span>
                  {dob && (
                    <span className="text-[11px] font-bold text-[#166534] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {calculateAge(dob)} Yrs
                    </span>
                  )}
                </div>
                {errors.dob && <p className="text-xs text-red-600 font-medium">{errors.dob}</p>}
              </div>

              {/* 4. Gender Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Gender</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 h-12 p-1 rounded-xl bg-slate-100 border border-slate-200">
                  {['Female', 'Male', 'Other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGender(g)
                        if (errors.gender) setErrors((prev) => ({ ...prev, gender: null }))
                      }}
                      className={`flex items-center justify-center gap-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        gender === g
                          ? 'bg-[#166534] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {g === 'Female' ? 'female' : g === 'Male' ? 'male' : 'transgender'}
                      </span>
                      <span>{g}</span>
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">
                  {gender ? `Selected: ${gender}` : 'Select your demographic gender'}
                </span>
                {errors.gender && <p className="text-xs text-red-600 font-medium">{errors.gender}</p>}
              </div>

              {/* 5. Identity Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Identity Type</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5 h-12">
                  {['Aadhaar', 'ABHA'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIdentityType(type)}
                      className={`flex items-center justify-between px-3 rounded-xl border text-xs font-bold transition-all ${
                        identityType === type
                          ? 'bg-[#166534] border-[#166534] text-white shadow-sm'
                          : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">
                          {type === 'Aadhaar' ? 'id_card' : 'health_and_safety'}
                        </span>
                        <span>{type}</span>
                      </div>
                      {identityType === type && (
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">
                  {identityType === 'Aadhaar' ? '12-digit Unique Aadhaar Number' : '14-digit National Digital Health ABHA ID'}
                </span>
              </div>

              {/* 6. Identity Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between" htmlFor="identityNumber">
                  <span>{identityType} Number</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-xl pointer-events-none">pin</span>
                  <input
                    id="identityNumber"
                    type="text"
                    required
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                    placeholder={`Enter ${identityType} number`}
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534] transition-all tracking-wider font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Strictly used for civic verification and authentication</span>
                {errors.identityNumber && <p className="text-xs text-red-600">{errors.identityNumber}</p>}
              </div>
            </div>

            {/* Institutional Trust Callout */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 mt-4">
              <span className="material-symbols-outlined text-[#166534] text-2xl shrink-0 mt-0.5">verified_user</span>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>Data Privacy & Consent</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your credentials are encrypted under the Public Health Data Governance framework. No biometric data is stored on this public kiosk.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              <Link
                to="/patient"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-center text-xs font-bold transition-all"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                ← Back to Portal Entry
              </Link>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] active:scale-[0.99] text-white shadow-md hover:shadow-lg transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>VERIFY & PROCEED (OTP)</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </PatientLayout>
  )
}
