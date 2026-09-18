import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { getPatientProfile, DEFAULT_APPOINTMENTS } from '../../data/patientMockData'

export default function AppointmentDetailsPage() {
  const location = useLocation()
  const profile = getPatientProfile()
  const apt = location.state?.appointment || DEFAULT_APPOINTMENTS[0]

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Appointments', to: '/patient/appointments' },
        { label: 'Appointment Details' }
      ]}
      backTo="/patient/appointments"
      backLabel="Back to Appointments"
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[#166534] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {apt.id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#166534]">
                  {apt.status}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Outpatient Consultation Token Slip
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Booked under Universal Healthcare OPD Scheme</p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Print Token Slip</span>
            </button>
          </div>

          {/* Token Highlight Banner */}
          <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Assigned Consultation Queue Token
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#166534] font-mono tracking-tight mt-1">
                {apt.token}
              </div>
              <span className="text-xs text-slate-600 mt-1 block">Expected reporting window: {apt.time}</span>
            </div>

            <div className="bg-white border border-emerald-200 p-4 rounded-xl text-left text-xs min-w-[220px] shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Room</span>
                <span className="font-bold text-slate-900">{apt.room}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Check-in Counter</span>
                <span className="font-bold text-slate-900">{apt.counter || 'Counter 02'}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 font-bold">Fee</span>
                <span className="font-bold text-[#166534]">{apt.fee}</span>
              </div>
            </div>
          </div>

          {/* Patient & Hospital Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Citizen</span>
              <span className="font-bold text-slate-800 text-sm">{profile.name}</span>
              <span className="text-slate-500 font-mono block">{profile.patientId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Physician</span>
              <span className="font-bold text-slate-800 text-sm">{apt.doctorName}</span>
              <span className="text-slate-500 block">{apt.specialty}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Hospital</span>
              <span className="font-bold text-slate-800 text-sm">{apt.hospitalName}</span>
              <span className="text-slate-500 block">Outpatient Block</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Date & Session</span>
              <span className="font-bold text-slate-800 text-sm">{apt.date}</span>
              <span className="text-[#166534] font-semibold block">{apt.time}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Arrival Guidelines
            </span>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Please reach the hospital OPD registration hall at least 15 minutes before your time slot.</li>
              <li>Present this electronic token slip or SMS notification at Counter 02 for physical queue verification.</li>
              <li>Carry any previous diagnostic slips or physical test films if relevant to your condition.</li>
              <li>For any scheduling changes or queries, dial National Health Helpline 1075.</li>
            </ul>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
