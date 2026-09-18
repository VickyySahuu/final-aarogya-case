import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { AppointmentApi } from '../../services/appointmentApi'
import { HOSPITALS_LIST } from '../../data/patientMockData'

export default function SelectHospitalPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}

  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')

  useEffect(() => {
    async function loadHospitals() {
      setLoading(true)
      setError('')
      try {
        const res = await AppointmentApi.getHospitals()
        if (res.success && res.hospitals.length > 0) {
          const mapped = res.hospitals.map(h => ({
            id: h.id,
            hospitalId: h.hospital_id || `HOSP-${h.id}`,
            name: h.name,
            type: h.facility_type || 'District Hospital',
            location: h.address || 'Civil Lines Cluster',
            distance: h.distance || '1.8 km away',
            opdHours: h.opd_hours || 'Mon - Sat: 8:00 AM - 2:00 PM',
            emergency: h.emergency_ward || '24x7 Emergency Available',
            beds: h.beds || '500 Beds'
          }))
          setHospitals(mapped)
        } else {
          // Fallback to existing mock if server not responding
          setHospitals(HOSPITALS_LIST)
        }
      } catch (err) {
        console.warn('Error loading hospitals:', err)
        setHospitals(HOSPITALS_LIST)
      } finally {
        setLoading(false)
      }
    }
    loadHospitals()
  }, [])

  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch = (h.name || '').toLowerCase().includes(search.toLowerCase()) || (h.location || '').toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filterType === 'All' || (h.type || '').includes(filterType)
    return matchesSearch && matchesFilter
  })

  const handleContinue = () => {
    if (!selectedHospital) {
      alert('Please select a healthcare facility or hospital to proceed.')
      return
    }
    navigate('/patient/select-doctor', {
      state: {
        ...state,
        hospital: selectedHospital
      }
    })
  }

  return (
    <PatientLayout
      activeNav="HOME"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Book Appointment' },
        { label: 'Select Hospital' }
      ]}
      backTo="/patient/next-step"
      backLabel="Back"
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
        {/* Booking Progress Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {/* Step 1: Active */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold shadow-xs mb-1 ring-4 ring-emerald-100">
                1
              </div>
              <span className="font-bold text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>Select Hospital</span>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold mb-1">
                2
              </div>
              <span style={{ fontFamily: 'Lexend, sans-serif' }}>Select Doctor</span>
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

        {/* Screen Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Select Hospital
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Choose an affiliated public healthcare facility or community health centre for your outpatient consultation.
          </p>
        </div>

        {/* Filters and Search Area */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hospital by name, area, or pin code..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:bg-white text-sm"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'All', label: 'All Facilities' },
              { id: 'CHC', label: 'Community Health Centre (CHC)' },
              { id: 'PHC', label: 'Primary Health Centre (PHC)' },
              { id: 'District', label: 'District Hospital' }
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterType(pill.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterType === pill.id
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selectable Facility Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHospitals.map((hosp) => {
            const isSelected = selectedHospital?.id === hosp.id
            return (
              <div
                key={hosp.id}
                onClick={() => setSelectedHospital(hosp)}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'border-[#166534] bg-emerald-50/40 ring-2 ring-[#166534]/10 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                      {hosp.type}
                    </span>
                    <span className={`material-symbols-outlined text-2xl ${isSelected ? 'text-[#166534]' : 'text-slate-300'}`}>
                      {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {hosp.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal mb-3">
                    {hosp.location}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#166534]">near_me</span>
                      <span>{hosp.distance}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-500">schedule</span>
                      <span>{hosp.opdHours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-red-600">emergency</span>
                      <span className="text-red-700 font-medium">{hosp.emergency}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className={`block w-full py-2 rounded-xl text-center text-xs font-bold transition-colors ${
                    isSelected ? 'bg-[#166534] text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isSelected ? 'FACILITY SELECTED' : 'SELECT FACILITY'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Link
            to="/patient/next-step"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back</span>
          </Link>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedHospital}
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all ${
              selectedHospital ? 'bg-[#166534] hover:bg-[#14532d] cursor-pointer btn-press' : 'bg-slate-400 cursor-not-allowed opacity-70'
            }`}
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span>{selectedHospital ? 'PROCEED TO SELECT DOCTOR' : 'CHOOSE A HOSPITAL TO PROCEED'}</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </PatientLayout>
  )
}
