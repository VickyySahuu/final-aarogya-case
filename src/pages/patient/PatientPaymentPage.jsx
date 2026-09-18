import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { AppointmentApi } from '../../services/appointmentApi'
import { AuthApi } from '../../services/authApi'
import { getPatientProfile, HOSPITALS_LIST, DOCTORS_LIST } from '../../data/patientMockData'

export default function PatientPaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}

  const hospital = state.hospital || HOSPITALS_LIST[0]
  const doctor = state.doctor || DOCTORS_LIST[0]
  const tomorrow = new Date(Date.now() + 86400000)
  const appointmentDate = state.appointmentDate || tomorrow.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeSlot = state.timeSlot || '09:30 AM - 10:00 AM'
  const chiefComplaint = state.chiefComplaint || state.caseData?.problem || 'Persistent dry cough (5 days) with mild fever and throat irritation'

  const [paymentMethod, setPaymentMethod] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handlePay = async () => {
    if (!paymentMethod) {
      alert('Please select your consultation billing / exemption method to confirm appointment.')
      return
    }
    if (isProcessing) return
    setIsProcessing(true)
    setErrorMsg('')

    try {
      const bookingData = {
        hospitalId: hospital.id || 1,
        doctorId: doctor.id || 1,
        caseId: state.caseId || (typeof window !== 'undefined' ? sessionStorage.getItem('aarogya_active_case_id') : null),
        appointmentDate,
        timeSlot,
        problem: state.caseData?.problem || chiefComplaint,
        severity: state.caseData?.severity || 'Moderate',
        paymentMethod: paymentMethod === 'free' ? 'Universal Public Health Free OPD Token' : 'Pay at Hospital Registration Counter',
        paymentStatus: 'Completed'
      }

      const res = await AppointmentApi.bookAppointment(bookingData)

      if (res.success && res.appointment) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('aarogya_last_appointment_id', String(res.appointment.id))
          sessionStorage.setItem('aarogya_last_appointment_number', String(res.appointment.appointmentNumber))
        }

        navigate('/patient/appointment-confirmed', {
          state: {
            appointmentId: res.appointment.id,
            appointmentNumber: res.appointment.appointmentNumber,
            appointment: res.appointment
          }
        })
      } else {
        setErrorMsg(res.message || 'Failed to confirm appointment with healthcare server.')
        setIsProcessing(false)
      }
    } catch (err) {
      console.error('Payment booking error:', err)
      setErrorMsg(err.message || 'Error communicating with healthcare server.')
      setIsProcessing(false)
    }
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Confirm Appointment', to: '/patient/confirm-appointment' },
        { label: 'Payment' }
      ]}
      backTo="/patient/confirm-appointment"
      backLabel="Back"
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
        {/* Booking Progress Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="flex flex-col items-center text-emerald-800">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center font-bold mb-1">
                ✓
              </div>
              <span className="font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Hospital</span>
            </div>
            <div className="flex flex-col items-center text-emerald-800">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center font-bold mb-1">
                ✓
              </div>
              <span className="font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Doctor</span>
            </div>
            <div className="flex flex-col items-center text-emerald-800">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center font-bold mb-1">
                ✓
              </div>
              <span className="font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Date & Time</span>
            </div>
            <div className="flex flex-col items-center text-emerald-800">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center font-bold mb-1">
                ✓
              </div>
              <span className="font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Confirm</span>
            </div>
            {/* Step 5: Active */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold shadow-xs mb-1 ring-4 ring-emerald-100">
                5
              </div>
              <span className="font-bold text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>Payment</span>
            </div>
          </div>
        </div>

        {/* Screen Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Payment & Token Issuance
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete the verification to issue your electronic OPD consultation token.
          </p>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Amount Due Banner */}
          <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Total Consultation Fee
              </span>
              <div className="text-3xl sm:text-4xl font-bold text-[#0A2540] font-mono mt-0.5">
                ₹0.00
              </div>
              <span className="text-xs text-[#166534] font-semibold">Standard Consultation Fee Exemption (₹0.00)</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-[#166534] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>NO PAYMENT REQUIRED</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Select Billing Mode
            </h2>

            <div className="space-y-3" role="radiogroup">
              {/* Option 1: Universal Health Free Coverage */}
              <div
                onClick={() => setPaymentMethod('free')}
                className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'free'
                    ? 'border-[#166534] bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${paymentMethod === 'free' ? 'bg-[#166534] text-white' : 'border-2 border-slate-300'}`}>
                    {paymentMethod === 'free' && <span className="material-symbols-outlined text-sm">check</span>}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Standard Outpatient Consultation Token (Complimentary)
                    </span>
                    <span className="text-xs text-slate-500">Standard outpatient checkup token</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#166534] font-mono">₹0.00</span>
              </div>

              {/* Option 2: Pay at Hospital Cash Counter */}
              <div
                onClick={() => setPaymentMethod('counter')}
                className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'counter'
                    ? 'border-[#166534] bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${paymentMethod === 'counter' ? 'bg-[#166534] text-white' : 'border-2 border-slate-300'}`}>
                    {paymentMethod === 'counter' && <span className="material-symbols-outlined text-sm">check</span>}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Pay at Hospital Registration Counter (if applicable)
                    </span>
                    <span className="text-xs text-slate-500">Pay directly when reaching OPD Room</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">Counter</span>
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Link
              to="/patient/confirm-appointment"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back</span>
            </Link>

            <button
              type="button"
              disabled={isProcessing || !paymentMethod}
              onClick={handlePay}
              className={`inline-flex items-center gap-2 px-10 py-4 rounded-full text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all ${
                isProcessing
                  ? 'bg-[#166534]/70 cursor-wait'
                  : paymentMethod
                    ? 'bg-[#166534] hover:bg-[#14532d] cursor-pointer btn-press'
                    : 'bg-slate-400 cursor-not-allowed opacity-70'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {isProcessing ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>PROCESSING PAYMENT...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">verified</span>
                  <span>{paymentMethod ? 'CONFIRM & GENERATE TOKEN' : 'SELECT PAYMENT MODE TO CONFIRM'}</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
