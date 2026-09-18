import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { getAppointments } from '../../data/patientMockData'
import { AppointmentApi } from '../../services/appointmentApi'

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadAppointments() {
      setLoading(true)
      try {
        const res = await AppointmentApi.getMyAppointments()
        if (mounted && res.success && Array.isArray(res.appointments)) {
          const mapped = res.appointments.map(a => ({
            id: a.appointmentNumber || a.appointment_number || `APT-${a.id}`,
            hospital: a.hospitalName || a.hospital_name || 'District Civil Hospital',
            hospitalName: a.hospitalName || a.hospital_name || 'District Civil Hospital',
            doctor: a.doctorName || a.doctor_name || 'Dr. Ramanathan Venkatraman',
            doctorName: a.doctorName || a.doctor_name || 'Dr. Ramanathan Venkatraman',
            specialty: a.specialty || a.specialization || 'General Medicine',
            date: a.appointmentDate || a.appointment_date || 'Today',
            time: a.timeSlot || a.time_slot || '09:30 AM',
            token: a.tokenNumber || a.token_number || `#${a.id}`,
            room: a.opdRoom || a.opd_room || 'Room 104',
            fee: a.paymentMethod || 'Universal Public Free OPD',
            status: a.status || 'Confirmed',
            department: 'General Medicine',
            fullAppointment: a
          }))
          setAppointments(mapped)
        }
      } catch (e) {
        console.warn('Failed loading appointments from API:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadAppointments()
    return () => { mounted = false }
  }, [])

  const filtered = appointments.filter((a) => {
    if (filter === 'All') return true
    return (a.status || '').toLowerCase() === filter.toLowerCase()
  })

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'My Appointments' }
      ]}
      backTo="/patient/home"
      backLabel="Home"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Confirmed Appointments
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Your booked OPD consultation slots and hospital queue tokens across public healthcare facilities.
            </p>
          </div>
          <Link
            to="/patient/new-problem"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto shadow-xs"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Book Consultation</span>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['All', 'Confirmed', 'Completed', 'Cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filter === f
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">calendar_today</span>
              <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                No Appointments Scheduled
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                You have no scheduled outpatient appointments. Book an OPD slot through the New Problem workflow to receive a consultation token.
              </p>
              <Link
                to="/patient/new-problem"
                className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-all"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Book Appointment Now</span>
              </Link>
            </div>
          ) : (
            filtered.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#166534]/50 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Token Badge */}
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#166534] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Token</span>
                    <span className="text-xl font-bold font-mono">{apt.token}</span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">{apt.id}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#166534]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                        {apt.status}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">• {apt.room}</span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {apt.doctorName}
                    </h2>
                    <p className="text-xs text-slate-500">{apt.specialty} • {apt.hospitalName}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1 font-bold text-[#166534]">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {apt.date}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
                        {apt.time}
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500">{apt.fee}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center md:pl-4">
                  <Link
                    to="/patient/appointment-details"
                    state={{ appointment: apt }}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span>TOKEN DETAILS</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PatientLayout>
  )
}
