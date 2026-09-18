import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { AppointmentApi } from '../../services/appointmentApi'
import { HOSPITALS_LIST, DOCTORS_LIST } from '../../data/patientMockData'

export function generateUpcomingDateOptions(count = 4) {
  const options = []
  const now = new Date()

  for (let i = 1; i <= count; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)

    const dayName = i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' })
    const fullDay = d.toLocaleDateString('en-US', { weekday: 'long' })
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) // e.g. "20 Sep 2026"

    options.push({
      day: dayName,
      date: dateStr,
      fullDay,
      isoDate: d.toISOString().split('T')[0]
    })
  }
  return options
}

export default function SelectDateTimePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const hospital = state.hospital || HOSPITALS_LIST[0]
  const doctor = state.doctor || DOCTORS_LIST[0]

  const dateOptions = React.useMemo(() => generateUpcomingDateOptions(4), [])

  const defaultMorningSlots = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM'
  ]

  const defaultAfternoonSlots = [
    '12:00 PM - 12:30 PM',
    '12:30 PM - 01:00 PM',
    '01:00 PM - 01:30 PM'
  ]

  const [selectedDate, setSelectedDate] = useState(dateOptions[0] || null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookedSlots, setBookedSlots] = useState([])

  useEffect(() => {
    async function loadSlots() {
      if (selectedDate?.date) {
        try {
          const res = await AppointmentApi.getSlots({
            doctorId: doctor?.id || 1,
            date: selectedDate.date
          })
          if (res.success && Array.isArray(res.bookedSlots)) {
            setBookedSlots(res.bookedSlots)
            if (res.bookedSlots.includes(selectedSlot)) {
              setSelectedSlot(null)
            }
          }
        } catch (e) {
          console.warn('Error loading slots:', e)
        }
      }
    }
    loadSlots()
  }, [selectedDate, doctor?.id])

  const handleContinue = () => {
    if (!selectedDate) {
      alert('Please choose an appointment date.')
      return
    }
    if (!selectedSlot) {
      alert('Please select an OPD time slot.')
      return
    }
    navigate('/patient/confirm-appointment', {
      state: {
        ...state,
        hospital,
        doctor,
        appointmentDate: selectedDate.date,
        dayOfWeek: selectedDate.fullDay,
        timeSlot: selectedSlot
      }
    })
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Select Doctor', to: '/patient/select-doctor' },
        { label: 'Date & Time' }
      ]}
      backTo="/patient/select-doctor"
      backLabel="Back to Doctors"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
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
            {/* Step 3: Active */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold shadow-xs mb-1 ring-4 ring-emerald-100">
                3
              </div>
              <span className="font-bold text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>Date & Time</span>
            </div>
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold mb-1">
                4
              </div>
              <span style={{ fontFamily: 'Lexend, sans-serif' }}>Confirm</span>
            </div>
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold mb-1">
                5
              </div>
              <span style={{ fontFamily: 'Lexend, sans-serif' }}>Payment</span>
            </div>
          </div>
        </div>

        {/* Selected Doctor Summary */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold text-sm">
              <span className="material-symbols-outlined text-xl">stethoscope</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{doctor.name}</p>
              <p className="text-xs text-slate-600">{doctor.designation} • {hospital.name}</p>
            </div>
          </div>
          <Link
            to="/patient/select-doctor"
            className="text-xs text-[#166534] font-bold underline"
          >
            Change Doctor
          </Link>
        </div>

        {/* Selection Area Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Date Selector */}
          <div>
            <h2 className="text-lg font-bold text-[#0A2540] mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Select Consultation Date
            </h2>
            <p className="text-xs text-slate-500 mb-4">Choose from upcoming available OPD clinic days.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dateOptions.map((d, idx) => {
                const isSelected = selectedDate?.date === d.date
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center cursor-pointer ${
                      isSelected
                        ? 'border-[#166534] bg-emerald-50 text-[#166534] shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {d.day}
                    </span>
                    <span className="text-base font-bold font-mono">
                      {d.date}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">{d.fullDay}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Slot Selector */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#0A2540] mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Select Time Slot (Token Window)
              </h2>
              <p className="text-xs text-slate-500">Each token allocates a 30-minute consultation window.</p>
            </div>

            {/* Morning Session */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined text-sm text-amber-500">wb_sunny</span>
                Morning Session (09:00 AM – 12:00 PM)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {defaultMorningSlots.map((slot) => {
                  const isSelected = selectedSlot === slot
                  const isBooked = bookedSlots.includes(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => !isBooked && setSelectedSlot(slot)}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                        isBooked
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                          : isSelected
                            ? 'border-[#166534] bg-[#166534] text-white shadow-xs cursor-pointer'
                            : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer'
                      }`}
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span>{slot}</span>
                      {isBooked ? (
                        <span className="text-[10px] font-normal uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Booked</span>
                      ) : isSelected ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Afternoon Session */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined text-sm text-sky-500">wb_twilight</span>
                Afternoon Session (12:00 PM – 02:00 PM)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {defaultAfternoonSlots.map((slot) => {
                  const isSelected = selectedSlot === slot
                  const isBooked = bookedSlots.includes(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => !isBooked && setSelectedSlot(slot)}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                        isBooked
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                          : isSelected
                            ? 'border-[#166534] bg-[#166534] text-white shadow-xs cursor-pointer'
                            : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer'
                      }`}
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span>{slot}</span>
                      {isBooked ? (
                        <span className="text-[10px] font-normal uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Booked</span>
                      ) : isSelected ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Link
            to="/patient/select-doctor"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back</span>
          </Link>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedDate || !selectedSlot}
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all ${
              selectedDate && selectedSlot ? 'bg-[#166534] hover:bg-[#14532d] cursor-pointer btn-press' : 'bg-slate-400 cursor-not-allowed opacity-70'
            }`}
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span>{selectedDate && selectedSlot ? 'CONFIRM APPOINTMENT DETAILS' : 'SELECT DATE & TIME SLOT TO CONTINUE'}</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </PatientLayout>
  )
}
