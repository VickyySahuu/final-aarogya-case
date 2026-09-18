import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { savePatientProfile, generatePatientUniqueCode } from '../../data/patientMockData'
import { PatientApi } from '../../services/patientApi'
import { AuthApi } from '../../services/authApi'

export default function PatientOtpPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const rawMobile = state.mobile || '9876543210'
  const isRegistration = state.isRegistration || false

  const maskedMobile = `+91 ${rawMobile.slice(0, 2)}XXXXXX${rawMobile.slice(-2)}`

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(45)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const inputRefs = useRef([])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000)
      return () => clearInterval(interval)
    } else {
      setCanResend(true)
    }
  }, [timer])

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otp]
      digits.forEach((d, i) => {
        newOtp[i] = d
      })
      setOtp(newOtp)
      const nextFocus = Math.min(digits.length, 5)
      inputRefs.current[nextFocus]?.focus()
      return
    }

    const digit = value.replace(/\D/g, '')
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = () => {
    setTimer(45)
    setCanResend(false)
    setOtp(['', '', '', '', '', ''])
    setErrorMessage('')
    inputRefs.current[0]?.focus()
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!isComplete || loading) return

    setErrorMessage('')

    if (isRegistration) {
      setLoading(true)
      try {
        const payload = {
          name: state.patientName || 'Citizen',
          mobile: rawMobile,
          dob: state.dob || '01/01/2000',
          age: state.age || '25',
          gender: state.gender || 'Male',
          identityType: state.identityType || 'Aadhaar',
          identityNumber: state.identityNumber || '',
          bloodGroup: state.bloodGroup || 'B+',
          address: state.address || 'Universal Healthcare Jurisdiction'
        }

        const res = await PatientApi.register(payload)

        if (res.success && res.patient) {
          if (res.token) {
            AuthApi.setToken(res.token)
          }
          if (res.session) {
            localStorage.setItem('aarogya_session_data', JSON.stringify(res.session))
          }
          sessionStorage.removeItem('aarogya_active_case_id')
          sessionStorage.removeItem('aarogya_active_case')
          sessionStorage.removeItem('aarogya_doctor_active_patient')
          sessionStorage.removeItem('aarogya_active_appointment_id')
          localStorage.removeItem('aarogya_patient_appointments')

          const patientRecord = {
            id: res.patient.id,
            name: res.patient.name,
            mobile: res.patient.mobile,
            rawMobile: res.patient.rawMobile || rawMobile,
            dob: res.patient.dob,
            age: res.patient.age,
            gender: res.patient.gender,
            identityType: res.patient.identityType,
            identityNumber: res.patient.identityNumber,
            maskedIdentityNumber: `XXXX-XXXX-${(res.patient.identityNumber || '').slice(-4)}`,
            patientId: res.patient.patientId,
            patientUniqueCode: res.patient.patientUniqueCode,
            bloodGroup: res.patient.bloodGroup,
            address: res.patient.address
          }
          savePatientProfile(patientRecord)
          navigate('/patient/registration-complete', {
            state: { patient: patientRecord, isExisting: res.isExisting }
          })
        } else {
          setErrorMessage(res.message || 'Registration failed. Please try again.')
          setLoading(false)
        }
      } catch (err) {
        setErrorMessage(err.message || 'Network error communicating with healthcare registry server.')
        setLoading(false)
      }
    } else {
      // Process 2: Patient Login Verification & Session Establishment
      setLoading(true)
      try {
        const res = await AuthApi.patientLogin({
          mobile: rawMobile,
          identityNumber: state.id,
          otp: otp.join('')
        })

        if (res.success && res.patient) {
          navigate('/patient/home')
        } else {
          setErrorMessage(res.message || 'Login verification failed. Please check your credentials and try again.')
          setLoading(false)
        }
      } catch (err) {
        setErrorMessage(err.message || 'Network error communicating with authentication service.')
        setLoading(false)
      }
    }
  }

  const isComplete = otp.every((d) => d !== '')

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient' },
        { label: 'Verify Mobile' }
      ]}
      backTo={isRegistration ? '/patient/register' : '/patient/login'}
      backLabel="Back"
    >
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col items-center">
        {/* Central Security Card */}
        <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10 md:p-12 flex flex-col items-center relative overflow-hidden">
          {/* Top Brand Anchor Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#166534]"></div>

          {/* Icon Header Visual */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 text-[#166534]">
            <span className="material-symbols-outlined text-3xl">sms</span>
          </div>

          {/* Header Typography */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] text-center mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Verify Mobile Number
          </h1>
          <p className="text-sm text-slate-600 text-center max-w-md mb-6 leading-relaxed">
            Enter the 6-digit one-time password sent to your registered mobile number for authentication.
          </p>

          {/* Target Phone Capsule */}
          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-full mb-8">
            <span className="material-symbols-outlined text-[#166534] text-base">phonelink_lock</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 tracking-wide font-mono">
              OTP sent to {maskedMobile}
            </span>
            <Link
              to={isRegistration ? '/patient/register' : '/patient/login'}
              className="text-slate-400 hover:text-[#166534] transition-colors ml-1"
              title="Edit Mobile Number"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </Link>
          </div>

          {/* 6-Digit OTP Box Grid */}
          <form onSubmit={handleVerify} className="w-full flex flex-col items-center">
            <div className="flex justify-center items-center gap-2 sm:gap-3.5 w-full max-w-md mb-8">
              {otp.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  aria-label={`Digit ${idx + 1}`}
                  className="w-11 h-14 sm:w-14 sm:h-16 bg-slate-50 border-2 border-slate-200 text-center text-xl sm:text-2xl font-bold text-[#0A2540] rounded-xl outline-none focus:bg-white focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20 transition-all shadow-inner font-mono"
                />
              ))}
            </div>

            {/* Quick Demo Fill Helper */}
            <div className="mb-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOtp(['4', '8', '2', '0', '1', '9'])}
                className="text-xs text-[#166534] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full font-semibold transition-colors"
              >
                Auto-fill Demo Code (482019)
              </button>
            </div>

            {/* Resend Section with Countdown */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-8 text-xs sm:text-sm text-slate-600">
              <span>Didn't receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[#166534] hover:text-[#124d27] font-bold underline transition-colors cursor-pointer"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  Resend OTP Now
                </button>
              ) : (
                <span className="font-semibold text-slate-700">
                  Resend in <span className="font-mono text-[#166534]">{timer}s</span>
                </span>
              )}
            </div>

            {/* Error Message Notice */}
            {errorMessage && (
              <div className="w-full max-w-md p-3.5 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Verification Button */}
            <button
              type="submit"
              disabled={!isComplete || loading}
              className={`w-full max-w-md h-14 rounded-full text-white text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                isComplete && !loading
                  ? 'bg-[#166534] hover:bg-[#14532d] shadow-emerald-700/20 active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed opacity-70'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                  <span>VERIFYING & REGISTERING...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">verified</span>
                  <span>CONFIRM & VERIFY</span>
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </>
              )}
            </button>

            {/* Secondary Option: Back */}
            <div className="mt-6">
              <Link
                to={isRegistration ? '/patient/register' : '/patient/login'}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
              >
                Cancel and return to {isRegistration ? 'registration' : 'login'}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PatientLayout>
  )
}
