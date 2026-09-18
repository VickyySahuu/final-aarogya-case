import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { AuthApi } from '../../services/authApi'
import { getPatientProfile, HOSPITALS_LIST, DOCTORS_LIST } from '../../data/patientMockData'

export default function ConfirmAppointmentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const patient = AuthApi.getStoredPatient() || getPatientProfile()
  const [isProcessing, setIsProcessing] = useState(false)

  const hospital = state.hospital || HOSPITALS_LIST[0]
  const doctor = state.doctor || DOCTORS_LIST[0]
  const tomorrow = new Date(Date.now() + 86400000)
  const appointmentDate = state.appointmentDate || tomorrow.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const dayOfWeek = state.dayOfWeek || tomorrow.toLocaleDateString('en-US', { weekday: 'long' })
  const timeSlot = state.timeSlot || '09:30 AM - 10:00 AM'

  const handleProceedToPayment = () => {
    if (isProcessing) return
    setIsProcessing(true)
    setTimeout(() => {
      navigate('/patient/payment', {
        state: {
          ...state,
          hospital,
          doctor,
          appointmentDate,
          dayOfWeek,
          timeSlot,
          patient,
          fee: '₹0'
        }
      })
    }, 400)
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Date & Time', to: '/patient/select-date-time' },
        { label: 'Confirm Appointment' }
      ]}
      backTo="/patient/select-date-time"
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
            {/* Step 4: Active */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold shadow-xs mb-1 ring-4 ring-emerald-100">
                4
              </div>
              <span className="font-bold text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>Confirm</span>
            </div>
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold mb-1">
                5
              </div>
              <span style={{ fontFamily: 'Lexend, sans-serif' }}>Payment</span>
            </div>
          </div>
        </div>

        {/* Screen Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Confirm Appointment Details
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Please review the outpatient appointment details below before proceeding to token issuance.
          </p>
        </div>

        {/* Review Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Patient Details */}
          <div className="pb-6 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Patient Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Patient Name</span>
                <span className="font-bold text-slate-900 text-base">{patient.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Patient ID</span>
                <span className="font-mono font-bold text-[#166534] text-base">{patient.patientId || patient.patient_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Contact Mobile</span>
                <span className="font-semibold text-slate-900 font-mono">{patient.mobile}</span>
              </div>
            </div>
          </div>

          {/* Appointment Schedule & Doctor */}
          <div className="pb-6 border-b border-slate-200 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Consultation & Doctor Assignment
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Hospital / Center</span>
                <p className="font-bold text-slate-900 text-base mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>{hospital.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{hospital.location}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Assigned Medical Officer</span>
                <p className="font-bold text-slate-900 text-base mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>{doctor.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{doctor.designation} • {doctor.room}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-[#166534]">calendar_clock</span>
                <div>
                  <span className="text-xs font-bold text-[#166534] uppercase">Date & Token Slot</span>
                  <p className="text-base font-bold text-slate-900">{appointmentDate} ({dayOfWeek})</p>
                </div>
              </div>
              <span className="px-4 py-1.5 rounded-full bg-[#166534] text-white font-bold text-xs">
                {timeSlot}
              </span>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Fee & Subsidy Breakdown
            </span>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Standard OPD Registration Fee</span>
                <span className="font-mono line-through">₹50.00</span>
              </div>
              <div className="flex justify-between text-[#166534] font-semibold">
                <span>Universal Public Health Subsidy</span>
                <span className="font-mono">-₹50.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-base">
                <span>Total Amount Payable</span>
                <span className="font-mono text-[#166534]">₹0.00 (Complimentary)</span>
              </div>
            </div>
          </div>

          {/* Citizen Declaration */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
            <span className="material-symbols-outlined text-blue-700 text-xl shrink-0 mt-0.5">verified_user</span>
            <span>
              By proceeding, you verify that the demographic details are accurate. A confirmed electronic token slip will be issued and registered on your digital health profile.
            </span>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Link
              to="/patient/select-date-time"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back</span>
            </Link>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleProceedToPayment}
              className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer btn-press ${
                isProcessing ? 'bg-[#166534]/70 cursor-wait' : 'bg-[#166534] hover:bg-[#14532d]'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {isProcessing ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>CONFIRMING...</span>
                </>
              ) : (
                <>
                  <span>CONFIRM APPOINTMENT</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
