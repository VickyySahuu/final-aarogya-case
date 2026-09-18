import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import { PrescriptionApi } from '../../services/prescriptionApi'

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    PrescriptionApi.getPatientPrescriptions().then((list) => {
      if (Array.isArray(list)) {
        setPrescriptions(list)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Medicines', to: '/patient/medicines' },
        { label: 'Prescriptions' }
      ]}
      backTo="/patient/medicines"
      backLabel="Back to Medicines"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Doctor Prescriptions
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Official digitally signed prescriptions received directly from the Doctor Portal and public hospital OPD rooms.
          </p>
        </div>

        {/* Prescriptions List */}
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">prescriptions</span>
              <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                No Prescriptions Issued Yet
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Digitally signed e-prescriptions issued by your doctor during hospital outpatient consultations will be accessible here.
              </p>
            </div>
          ) : (
            prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#166534]/50 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#166534] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl">prescriptions</span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">{rx.rxNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {rx.status || 'Active'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">• Token {rx.token || '#—'}</span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {rx.diagnosis}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <span className="material-symbols-outlined text-sm text-[#166534]">calendar_today</span>
                        {rx.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-slate-400">domain</span>
                        {rx.hospital || rx.hospitalName || 'District Civil Hospital'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-slate-400">stethoscope</span>
                        {rx.doctor || rx.doctorName || 'Dr. Ramanathan Venkatraman'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {Array.isArray(rx.medicines) ? rx.medicines.map(m => m.name || m.medicineName).join(', ') : 'Prescription medications recorded.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center md:pl-4">
                  <Link
                    to="/patient/prescription-details"
                    state={{ prescription: rx }}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span>PRESCRIPTION DETAILS</span>
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
