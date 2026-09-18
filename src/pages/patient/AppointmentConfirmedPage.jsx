import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import PatientQrCode from '../../components/common/PatientQrCode'
import { AppointmentApi } from '../../services/appointmentApi'
import { AuthApi } from '../../services/authApi'
import { getPatientProfile, DEFAULT_APPOINTMENTS } from '../../data/patientMockData'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'

export default function AppointmentConfirmedPage() {
  const location = useLocation()
  const state = location.state || {}
  const [patient, setPatient] = useState(AuthApi.getStoredPatient() || getPatientProfile())
  const [apt, setApt] = useState(state.appointment || DEFAULT_APPOINTMENTS[0])

  const targetId = state.appointmentId || state.appointmentNumber || (typeof window !== 'undefined' ? sessionStorage.getItem('aarogya_last_appointment_id') : null)

  useEffect(() => {
    async function loadAppointment() {
      const storedPatient = AuthApi.getStoredPatient()
      if (storedPatient) setPatient(storedPatient)

      if (targetId) {
        try {
          const res = await AppointmentApi.getAppointmentById(targetId)
          if (res.success && res.appointment) {
            setApt(res.appointment)
          }
        } catch (e) {
          console.warn('Error fetching appointment by ID:', e)
        }
      }
    }
    loadAppointment()
  }, [targetId])

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Appointment Confirmed' }
      ]}
      backTo="/patient/home"
      backLabel="Home"
    >
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col items-center">
        {/* Success Card (Web View) */}
        <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10 flex flex-col items-center text-center relative overflow-hidden no-print">
          <div className="h-2 w-full bg-[#166534] absolute top-0 left-0"></div>

          {/* Verification Badge */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#166534] mb-4 shadow-inner">
            <span className="material-symbols-outlined text-4xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-[#166534] mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Outpatient Token Generated
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Appointment Confirmed
          </h1>
          <p className="text-sm text-slate-600 max-w-md mb-6">
            Your appointment has been registered on the central public hospital OPD queue.
          </p>

          {/* Token Card */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Queue Consultation Token
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#166534] font-mono tracking-tight mt-0.5">
                  {apt.token}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Token ID
                </span>
                <p className="font-mono text-sm font-bold text-slate-800">{apt.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-bold">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
                <span className="text-slate-500 font-mono block">{patient.patientId || patient.patient_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Consulting Medical Officer</span>
                <span className="font-bold text-slate-900 text-sm">{apt.doctorName}</span>
                <span className="text-slate-500 block">{apt.specialty}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Hospital & Room</span>
                <span className="font-semibold text-slate-900">{apt.hospitalName}</span>
                <span className="text-slate-500 block">{apt.room}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Scheduled Time</span>
                <span className="font-bold text-[#166534] text-sm">{apt.date}</span>
                <span className="text-slate-500 block">{apt.time}</span>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-left text-xs text-slate-700 flex items-start gap-2.5 mb-8">
            <span className="material-symbols-outlined text-blue-700 text-lg shrink-0 mt-0.5">info</span>
            <span>
              Please report to the OPD waiting lounge 15 minutes before your time slot. Show this digital token or SMS on your phone at Counter 02.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Print Slip</span>
            </button>

            <Link
              to="/patient/appointments"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">calendar_clock</span>
              <span>View Appointments</span>
            </Link>

            <Link
              to="/patient/home"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span>PATIENT HOME</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Dedicated Printable Single-Page Slip */}
        <div className="printable-document print-only bg-white border border-slate-300 rounded-2xl p-8 sm:p-10 shadow-sm text-left w-full">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#166534] pb-6 mb-6">
            <div className="flex items-center gap-4">
              <img src={officialEmblem} alt="AAROGYA CASE Official Emblem" className="h-12 w-auto object-contain shrink-0" />
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  AAROGYA CASE
                </h1>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Outpatient Appointment &amp; Token Slip
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Document Number</span>
              <span className="text-base font-mono font-bold text-[#166534]">{apt.id}</span>
              <span className="text-xs text-slate-500 block mt-0.5">Date: {apt.date}</span>
            </div>
          </div>

          {/* Token Highlight */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Outpatient Queue Token</span>
              <span className="text-4xl font-extrabold text-[#166534] font-mono tracking-tight">{apt.token}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Assigned Slot</span>
              <span className="text-base font-bold text-slate-900">{apt.time}</span>
              <span className="text-xs text-slate-500 block">{apt.room} • {apt.counter || 'Counter 02'}</span>
            </div>
          </div>

          {/* Patient & Doctor Demographics */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient Details</span>
              <p className="font-bold text-slate-900 text-base">{patient.name}</p>
              <p className="text-slate-600 font-mono">Patient ID: <strong>{patient.patientId || patient.patient_id}</strong></p>
              <p className="text-slate-700 font-mono text-xs">Patient Unique Code: <strong className="text-[#166534]">{patient.patientUniqueCode || patient.patient_unique_code || 'AC-7F42K9'}</strong></p>
              <p className="text-slate-500">Gender / Age: {patient.gender || 'Male'}, {patient.age || '48'} Yrs</p>
              <p className="text-slate-500">Contact: {patient.mobile}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Doctor &amp; Hospital</span>
              <p className="font-bold text-slate-900 text-base">{apt.doctorName || 'Dr. Ramanathan Venkatraman'}</p>
              <p className="text-slate-600 font-mono">Doctor ID: <strong>{apt.doctorId || 'DOC-1042'}</strong></p>
              <p className="text-slate-500">{apt.specialty || 'General Medicine'} • {apt.room || 'Room 104'}</p>
              <p className="text-slate-500">{apt.hospitalName || 'District Civil Hospital'}</p>
              <p className="text-slate-600 font-semibold text-[11px] mt-1">Appointment Type: Outpatient Consultation</p>
              <p className="text-[#166534] font-semibold text-[11px]">Payment Status: Confirmed (Universal Free OPD)</p>
            </div>
          </div>

          {/* Chief Complaint Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chief Complaint / Visit Reason</span>
            <p className="text-slate-800 leading-relaxed font-medium">
              {apt.chiefComplaint || 'Persistent dry cough (5 days) with mild fever and throat irritation'}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 mb-6 text-xs text-slate-700 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">Instructions for Patient</span>
            <p>1. Please report to the hospital OPD waiting area 15 minutes before your allotted time slot.</p>
            <p>2. Keep this printed slip or digital token on your phone ready for verification at the reception counter.</p>
            <p>3. Universal public outpatient consultation is fully exempted under standard civil healthcare guidelines.</p>
          </div>

          {/* Status, QR Code & Issuance Block */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Document Status</span>
              <span className="inline-block px-3 py-1 rounded bg-emerald-100 text-[#166534] font-bold text-xs mt-1">
                Confirmed &amp; Registered
              </span>
              <p className="text-[11px] text-slate-400 mt-2">Registration Mode: {apt.paymentMode || 'Public Health Free OPD'}</p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-300 rounded-lg shrink-0">
              <PatientQrCode code={patient.patientUniqueCode || patient.patient_unique_code || 'AC-7F42K9'} size={68} showLabel={false} />
              <span className="text-[8px] font-mono text-[#166534] mt-1 font-bold">{patient.patientUniqueCode || patient.patient_unique_code || 'AC-7F42K9'}</span>
            </div>

            <div className="text-right">
              <div className="w-44 border-b border-slate-400 mb-2 ml-auto"></div>
              <p className="font-bold text-slate-900">Hospital OPD Registrar</p>
              <p className="text-slate-500">{apt.hospitalName || 'District Civil Hospital'}</p>
              <p className="text-[10px] text-slate-400 italic mt-1">Authorized Registration Stamp</p>
            </div>
          </div>

          {/* Authenticity Footer Note */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400">
            AAROGYA CASE Prototype Demonstration • Verified Outpatient Appointment Token Record • Single-Page Document
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
