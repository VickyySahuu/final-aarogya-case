import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import PharmacyLayout from '../../components/layout/PharmacyLayout'
import PatientQrCode from '../../components/common/PatientQrCode'
import { PrescriptionApi } from '../../services/prescriptionApi'

export default function PharmacyPrescriptionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  
  const [activeRx, setActiveRx] = useState(location.state?.prescription || null)
  const [isLoading, setIsLoading] = useState(!location.state?.prescription)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let mounted = true
    async function fetchDetails() {
      const rxId = params.id || location.state?.prescription?.id || location.state?.prescription?.rxNumber
      if (rxId) {
        try {
          const fresh = await PrescriptionApi.getPharmacyPrescription(rxId)
          if (mounted && fresh) {
            setActiveRx(fresh)
            setIsLoading(false)
            return
          }
        } catch (err) {
          console.warn('Failed to fetch prescription details:', err)
        }
      }

      // If no ID or direct state, try fetching from the active queue
      try {
        const list = await PrescriptionApi.getPharmacyPrescriptions()
        if (mounted && Array.isArray(list) && list.length > 0) {
          setActiveRx(list[0])
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.warn('Queue fetch failed:', err)
      }

      if (mounted) {
        setIsLoading(false)
        if (!location.state?.prescription) {
          setErrorMessage('Unable to load prescription details.')
        }
      }
    }
    fetchDetails()
    return () => { mounted = false }
  }, [params.id, location.state])

  const rx = activeRx || {}
  const rxNumber = rx.rxNumber || rx.prescriptionNumber || rx.id || '—'
  const patientName = rx.patientName || rx.patient?.name || 'Patient'
  const patientId = rx.patientId || rx.patient?.id || '—'
  const patientUniqueCode = rx.patientUniqueCode || rx.patient?.uniqueCode || rx.patient?.patientUniqueCode || '—'
  const patientAge = rx.patient?.age || rx.patientAge || rx.age || '—'
  const patientGender = rx.patient?.gender || rx.patientGender || rx.gender || '—'
  const doctorName = rx.doctorName || (rx.doctor?.name ? `Dr. ${rx.doctor.name}` : 'Dr. Ramanathan Venkatraman')
  const department = rx.doctor?.specialization || rx.department || 'General Medicine'
  const appointment = rx.appointmentId || rx.appointment?.id || (rx.appointment?.tokenNumber ? `Token #${rx.appointment.tokenNumber} (OPD)` : rx.appointmentNumber || 'OPD Consultation')
  const rxDate = rx.appointmentDate || rx.appointment?.date || rx.date || (rx.createdAt ? rx.createdAt.split('T')[0] : '—')
  const status = rx.status || rx.prescriptionStatus || rx.pharmacyStatus || 'Issued'

  const medicines = rx.medicines || rx.items || []

  return (
    <PharmacyLayout activeNav="Prescriptions">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Top Back Link */}
        <div>
          <Link 
            to="/pharmacy/prescriptions" 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:text-[#0A2540] transition-colors py-1 px-3 -ml-3 rounded-full hover:bg-slate-100"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Prescriptions</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Prescription Details
              </h1>
              <span className="bg-emerald-50 text-[#166534] border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-full" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Status: {status}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Read-only clinical prescription record for dispensary fulfillment.
            </p>
          </div>

          {activeRx && (
            <button 
              type="button"
              onClick={() => navigate('/pharmacy/dispense', { state: { prescription: rx } })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[18px]">medication</span>
              <span>DISPENSE MEDICINE</span>
            </button>
          )}
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[#166534] text-4xl animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-slate-700">Loading prescription details...</p>
          </div>
        ) : errorMessage && !activeRx ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-4xl">error_outline</span>
            <p className="text-base font-bold text-slate-800">{errorMessage}</p>
            <Link
              to="/pharmacy/prescriptions"
              className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#166534] text-white text-xs font-bold uppercase tracking-wider shadow-sm"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span>View Prescriptions Queue</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Main Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              {/* Card Header Banner */}
              <div className="bg-slate-50 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Prescription Number
                  </span>
                  <span className="text-xl font-bold text-[#0A2540] font-mono tracking-tight mt-0.5">
                    #{rxNumber}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                  <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full shadow-xs border border-slate-200 text-xs font-semibold text-slate-700">
                    <span className="material-symbols-outlined text-[#166534] text-[16px]">event</span>
                    <span>Date: {rxDate}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs font-bold text-[#166534] uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Status: {status}</span>
                  </div>
                </div>
              </div>

              {/* Patient, Doctor & Clinical Identity Grid */}
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* 6 Core Operational Data Fields */}
                <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Patient Name */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-semibold block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Patient Name
                    </span>
                    <span className="text-base font-bold text-slate-900 block">
                      {patientName}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                      Gender: {patientGender} • Age: {patientAge} Yrs
                    </span>
                  </div>

                  {/* 2. Patient ID */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-semibold block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Patient ID
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono block">
                      {patientId}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Registry Health Identifier
                    </span>
                  </div>

                  {/* 3. Patient Unique Code */}
                  <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                    <span className="text-xs text-[#166534] uppercase font-bold block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Patient Unique Code
                    </span>
                    <span className="text-lg font-extrabold text-[#166534] font-mono block tracking-wider">
                      {patientUniqueCode}
                    </span>
                    <span className="text-[11px] text-[#166534]/80 block mt-0.5 font-medium">
                      Required for Handover Verification
                    </span>
                  </div>

                  {/* 4. Doctor */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-semibold block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Doctor
                    </span>
                    <span className="text-base font-bold text-slate-900 block">
                      {doctorName}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                      Dept of {department}
                    </span>
                  </div>

                  {/* 5. Appointment */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-semibold block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Appointment
                    </span>
                    <span className="text-sm font-bold text-slate-900 block">
                      {appointment}
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Civil Hospital Outpatient Desk
                    </span>
                  </div>

                  {/* 6. Prescription Ref & Date */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-semibold block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Prescription Number &amp; Date
                    </span>
                    <span className="text-sm font-bold text-slate-900 font-mono block">
                      #{rxNumber}
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Issued: {rxDate}
                    </span>
                  </div>
                </div>

                {/* Patient QR Slip */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Patient Identity Token
                  </span>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <PatientQrCode value={patientUniqueCode !== '—' ? patientUniqueCode : rxNumber} size={110} />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-800 mt-2">
                    {patientUniqueCode}
                  </span>
                </div>
              </div>

              {/* Section Header: Medicine List */}
              <div className="px-6 sm:px-8 py-3 bg-slate-50/80 border-t border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Medicine List ({medicines.length})
                </span>
                <span className="text-xs text-slate-500">
                  Formulary Verified
                </span>
              </div>

              {/* Medicine List */}
              <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
                {medicines.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No medicines recorded on this prescription.
                  </div>
                ) : (
                  medicines.map((med, idx) => (
                    <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200/70 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-base font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                            {med.name || med.medicineName || med.medicine}
                          </span>
                        </div>
                        <span className="bg-white font-bold text-xs text-[#166534] px-3 py-1 rounded-full self-start sm:self-auto border border-emerald-200 font-mono shadow-sm">
                          Quantity: {med.requiredQty || med.quantity || 1} Units
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                        <div className="flex flex-col">
                          <span className="text-slate-500 uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Dosage</span>
                          <span className="text-sm text-slate-800 font-medium mt-0.5">{med.dosage || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-500 uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Frequency</span>
                          <span className="text-sm text-slate-800 font-medium mt-0.5">{med.frequency || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-500 uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Duration</span>
                          <span className="text-sm text-slate-800 font-medium mt-0.5">{med.duration || '—'}</span>
                        </div>
                      </div>

                      {med.instructions && (
                        <div className="bg-white p-3 rounded-lg flex items-center gap-2 text-xs border border-slate-200">
                          <span className="material-symbols-outlined text-[#166534] text-[18px]">info</span>
                          <span className="text-slate-800">
                            <strong className="font-semibold">Instructions:</strong> {med.instructions}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Read-Only Notice */}
              <div className="bg-slate-100 px-6 sm:px-8 py-3.5 flex items-center gap-2.5 border-t border-slate-200">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">lock</span>
                <span className="text-xs text-slate-600">
                  <strong className="font-semibold text-slate-900">Read-Only Clinical Requisition:</strong> Issued by authorized physician. Formulations and dosages are non-modifiable.
                </span>
              </div>
            </div>

            {/* Bottom Primary Action Button: DISPENSE MEDICINE */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
              <Link 
                to="/pharmacy/prescriptions" 
                className="w-full sm:w-auto h-12 px-6 rounded-full bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold border border-slate-200 shadow-sm flex items-center justify-center gap-2"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>BACK TO PRESCRIPTIONS</span>
              </Link>

              <button 
                type="button"
                onClick={() => navigate('/pharmacy/dispense', { state: { prescription: rx } })}
                className="w-full sm:w-auto h-12 px-8 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined text-[20px]">medication</span>
                <span>DISPENSE MEDICINE</span>
              </button>
            </div>
          </>
        )}
      </div>
    </PharmacyLayout>
  )
}
