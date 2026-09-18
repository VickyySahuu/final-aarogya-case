import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { AppointmentApi } from '../../services/appointmentApi'
import { DOCTORS_LIST, HOSPITALS_LIST } from '../../data/patientMockData'

export default function SelectDoctorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const hospital = state.hospital || HOSPITALS_LIST[0]

  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  useEffect(() => {
    async function loadDoctors() {
      setLoading(true)
      try {
        const res = await AppointmentApi.getDoctors()
        if (res.success && res.doctors.length > 0) {
          const mapped = res.doctors.map(d => ({
            id: d.id,
            doctorId: d.doctor_id || `DOC-${d.id}`,
            name: d.name,
            specialization: d.specialization || 'General Medicine',
            designation: d.specialization || 'General Medicine Specialist',
            room: d.room || 'Room 104',
            days: d.days || 'Mon - Sat (08:30 – 14:00)',
            tokensAvailable: d.tokens_available || 'Available'
          }))
          setDoctors(mapped)
        } else {
          setDoctors(DOCTORS_LIST)
        }
      } catch (err) {
        console.warn('Error fetching doctors:', err)
        setDoctors(DOCTORS_LIST)
      } finally {
        setLoading(false)
      }
    }
    loadDoctors()
  }, [])

  const handleContinue = () => {
    if (!selectedDoctor) {
      alert('Please select a doctor to proceed with your appointment booking.')
      return
    }
    navigate('/patient/select-date-time', {
      state: {
        ...state,
        hospital,
        doctor: selectedDoctor
      }
    })
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Select Hospital', to: '/patient/select-hospital' },
        { label: 'Select Doctor' }
      ]}
      backTo="/patient/select-hospital"
      backLabel="Back to Hospitals"
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
        {/* Booking Progress Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {/* Step 1: Completed */}
            <div className="flex flex-col items-center text-emerald-800">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center font-bold mb-1">
                ✓
              </div>
              <span className="font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Hospital</span>
            </div>
            {/* Step 2: Active */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold shadow-xs mb-1 ring-4 ring-emerald-100">
                2
              </div>
              <span className="font-bold text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>Select Doctor</span>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold mb-1">
                3
              </div>
              <span style={{ fontFamily: 'Lexend, sans-serif' }}>Date & Time</span>
            </div>
            {/* Step 4 */}
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold mb-1">
                4
              </div>
              <span style={{ fontFamily: 'Lexend, sans-serif' }}>Confirm</span>
            </div>
            {/* Step 5 */}
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold mb-1">
                5
              </div>
              <span style={{ fontFamily: 'Lexend, sans-serif' }}>Payment</span>
            </div>
          </div>
        </div>

        {/* Selected Facility Context Bar */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#166534] text-2xl">domain</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>Selected Facility</span>
              <p className="text-sm font-bold text-slate-900">{hospital.name}</p>
              <p className="text-xs text-slate-600">{hospital.location}</p>
            </div>
          </div>
          <Link
            to="/patient/select-hospital"
            className="text-xs text-[#166534] font-bold underline hover:text-[#14532d]"
          >
            Change Facility
          </Link>
        </div>

        {/* Screen Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Select Available Doctor
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Choose a registered outpatient medical practitioner on roster for your appointment slot.
          </p>
        </div>

        {/* Doctor Selection Grid */}
        <div className="grid grid-cols-1 max-w-lg gap-5">
          {doctors.map((doc) => {
            const isSelected = selectedDoctor?.id === doc.id
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoctor(doc)}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'border-[#166534] bg-emerald-50/40 ring-2 ring-[#166534]/10 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center font-bold text-lg">
                      <span className="material-symbols-outlined text-2xl">person</span>
                    </div>
                    <span className={`material-symbols-outlined text-2xl ${isSelected ? 'text-[#166534]' : 'text-slate-300'}`}>
                      {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {doc.name}
                  </h3>
                  <p className="text-xs text-[#166534] font-semibold mt-0.5">{doc.specialization}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Doctor ID: {doc.doctorId}</p>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400">meeting_room</span>
                      <span>{doc.room}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400">calendar_month</span>
                      <span>{doc.days}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-emerald-600">confirmation_number</span>
                      <span className="text-emerald-700 font-bold">{doc.tokensAvailable}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className={`block w-full py-2 rounded-xl text-center text-xs font-bold transition-colors ${
                    isSelected ? 'bg-[#166534] text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isSelected ? 'DOCTOR SELECTED' : 'SELECT DOCTOR'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Link
            to="/patient/select-hospital"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back</span>
          </Link>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedDoctor}
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all ${
              selectedDoctor ? 'bg-[#166534] hover:bg-[#14532d] cursor-pointer btn-press' : 'bg-slate-400 cursor-not-allowed opacity-70'
            }`}
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span>{selectedDoctor ? 'PROCEED TO DATE & TIME' : 'CHOOSE A DOCTOR TO PROCEED'}</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </PatientLayout>
  )
}
