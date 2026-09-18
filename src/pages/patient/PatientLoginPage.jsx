import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { AuthApi } from '../../services/authApi'

export default function PatientLoginPage() {
  const [mobile, setMobile] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [errorMobile, setErrorMobile] = useState('')
  const [errorId, setErrorId] = useState('')
  const [loadingMobile, setLoadingMobile] = useState(false)
  const [loadingId, setLoadingId] = useState(false)
  const navigate = useNavigate()

  const handleMobileSubmit = async (e) => {
    e.preventDefault()
    const clean = mobile.replace(/\D/g, '')
    if (clean.length !== 10) {
      setErrorMobile('Please enter a valid 10-digit Indian mobile number')
      return
    }
    setErrorMobile('')
    setLoadingMobile(true)
    try {
      const res = await AuthApi.patientLogin({ mobile: clean })
      if (res.success && res.patient) {
        navigate('/patient/verify-otp', {
          state: {
            mobile: clean,
            type: 'Mobile',
            isRegistration: false,
            patient: res.patient,
            token: res.token
          }
        })
      } else {
        setErrorMobile(res.message || 'Patient record not found. Please register first.')
      }
    } catch (err) {
      setErrorMobile(err.message || 'Error connecting to healthcare authentication service')
    } finally {
      setLoadingMobile(false)
    }
  }

  const handleIdSubmit = async (e) => {
    e.preventDefault()
    const clean = idNumber.replace(/\s+/g, '')
    if (clean.length < 12) {
      setErrorId('Please enter a valid 14-digit ABHA or 12-digit Aadhaar ID')
      return
    }
    setErrorId('')
    setLoadingId(true)
    try {
      const res = await AuthApi.patientLogin({ identityNumber: clean })
      if (res.success && res.patient) {
        const rawPhone = (res.patient.rawMobile || (res.patient.mobile || '').replace(/\D/g, '').slice(-10)) || '9876543210'
        navigate('/patient/verify-otp', {
          state: {
            id: clean,
            mobile: rawPhone,
            type: 'ABHA/Aadhaar',
            isRegistration: false,
            patient: res.patient,
            token: res.token
          }
        })
      } else {
        setErrorId(res.message || 'Patient record not found for this ABHA / Aadhaar number. Please register first.')
      }
    } catch (err) {
      setErrorId(err.message || 'Error connecting to healthcare authentication service')
    } finally {
      setLoadingId(false)
    }
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient' },
        { label: 'Login' }
      ]}
      backTo="/patient"
      backLabel="Back"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Side: Public Service Editorial & Informational Banner */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200 w-max text-xs font-semibold uppercase tracking-wide">
              <span className="material-symbols-outlined text-base">verified_user</span>
              <span>Digital Health Record Standards Compliant</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight leading-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Access your digital health records safely.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Centralized, paperless access to outpatient records, verified diagnostic reports, and family immunisation schedules across certified civic hospitals.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">security_update_good</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>Direct OTP Login</h3>
                <p className="text-xs text-slate-500 leading-normal">No complex passwords to memorize. Instant validation via registered number.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">badge</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>ABHA & Aadhaar</h3>
                <p className="text-xs text-slate-500 leading-normal">Synchronize cross-facility records with your universal health identifier.</p>
              </div>
            </div>

            {/* Public Health Service Contact Footnote */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-slate-600 text-3xl">support_agent</span>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">National Health Portal Toll-Free Helpline</span>
                <span className="text-base font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>1800-11-4477 / 14477</span>
              </div>
            </div>
          </div>

          {/* Right Side: Authentication Card */}
          <div className="lg:col-span-7 flex justify-center w-full">
            <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl relative">
              {/* Card Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#166534] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Patient Self-Service
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Secure 256-Bit Link
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Patient Login
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Select your preferred authentication method to access your healthcare portal.
                </p>
              </div>

              <div className="space-y-6">
                {/* METHOD 1: Mobile Number */}
                <form onSubmit={handleMobileSubmit} className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>Mobile Number Authentication</span>
                      <span className="text-xs text-slate-500">Recommended for standard personal access</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="mobile-input">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-sm font-semibold text-slate-500 select-none pointer-events-none">+91</span>
                        <input
                          id="mobile-input"
                          type="tel"
                          maxLength={10}
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                          className="w-full pl-14 pr-4 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-transparent shadow-sm transition-all"
                        />
                      </div>
                      {errorMobile && (
                        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-sm">error</span>
                          {errorMobile}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loadingMobile}
                      className={`w-full h-12 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${loadingMobile ? 'opacity-75 cursor-wait' : 'cursor-pointer'}`}
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      {loadingMobile ? (
                        <>
                          <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                          <span>VERIFYING CITIZEN...</span>
                        </>
                      ) : (
                        <>
                          <span>CONTINUE WITH OTP</span>
                          <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* DIVIDER */}
                <div className="relative flex items-center justify-center">
                  <div className="w-full h-px bg-slate-200"></div>
                  <span className="absolute px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-wider">
                    OR
                  </span>
                </div>

                {/* METHOD 2: ABHA / Aadhaar */}
                <form onSubmit={handleIdSubmit} className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>ABHA Number or Aadhaar</span>
                      <span className="text-xs text-slate-500">Access via verified National Digital Health ID</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="id-input">
                        ABHA / Aadhaar Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="id-input"
                        type="text"
                        maxLength={17}
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="Enter 14-digit ABHA or 12-digit Aadhaar"
                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-transparent shadow-sm transition-all"
                      />
                      {errorId && (
                        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-sm">error</span>
                          {errorId}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loadingId}
                      className={`w-full h-12 rounded-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${loadingId ? 'opacity-75 cursor-wait' : 'cursor-pointer'}`}
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      {loadingId ? (
                        <>
                          <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                          <span>VERIFYING ID...</span>
                        </>
                      ) : (
                        <>
                          <span>CONTINUE WITH DIGITAL ID</span>
                          <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Card Registration Action */}
              <div className="mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#166534] text-2xl">person_add</span>
                  <span className="text-xs sm:text-sm text-slate-700">Don't have a registered account?</span>
                </div>
                <Link
                  to="/patient/register"
                  className="px-5 py-2.5 rounded-full bg-white text-[#166534] border border-[#166534] hover:bg-[#166534] hover:text-white text-xs font-bold transition-all shadow-sm whitespace-nowrap text-center w-full sm:w-auto"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  NEW REGISTRATION
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
