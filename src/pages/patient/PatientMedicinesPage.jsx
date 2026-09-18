import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { getPrescriptions } from '../../data/patientMockData'
import { PrescriptionApi } from '../../services/prescriptionApi'

export default function PatientMedicinesPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    PrescriptionApi.getPatientPrescriptions().then((list) => {
      if (Array.isArray(list)) {
        setPrescriptions(list)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const activeRx = prescriptions[0]

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Medicines' }
      ]}
      backTo="/patient/home"
      backLabel="Home"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Active Medications & Prescriptions
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Medications prescribed by licensed medical practitioners during hospital outpatient consultations.
            </p>
          </div>

          <Link
            to="/patient/prescriptions"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto shadow-xs"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            <span>ALL PRESCRIPTIONS</span>
          </Link>
        </div>

        {/* Current Active Regimen Card */}
        {activeRx ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#166534] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">prescriptions</span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>Latest Prescribed Regimen</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {activeRx.diagnosis}
                  </h2>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-mono font-bold text-[#166534]">{activeRx.rxNumber}</span>
                <p className="text-xs text-slate-500">{activeRx.date} • {activeRx.doctorName}</p>
              </div>
            </div>

            {/* Medicines List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Medicines Schedule
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(activeRx.medicines || []).map((med, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {med.category || 'Therapeutic'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono font-semibold">{med.duration}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        {med.name || med.medicineName}
                      </h4>
                      <p className="text-xs text-[#166534] font-semibold mt-1">Dosage: {med.dosage}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{med.frequency}</p>
                    </div>

                    {med.instructions && (
                      <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500 italic">
                        "{med.instructions}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Advice & Link */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-[#166534] text-lg">medical_information</span>
                <span>Doctor's clinical advice: <strong>{activeRx.dietaryAdvice || 'Follow standard dosage regimen'}</strong></span>
              </div>
              <Link
                to="/patient/prescription-details"
                state={{ prescription: activeRx }}
                className="text-[#166534] hover:text-[#124d27] font-bold underline whitespace-nowrap"
              >
                View Full Signed Prescription →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">medication</span>
            <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
              No Active Medications
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You do not have any active prescription regimens recorded on your citizen profile. Prescriptions will appear here once prescribed by a doctor.
            </p>
          </div>
        )}
      </div>
    </PatientLayout>
  )
}
