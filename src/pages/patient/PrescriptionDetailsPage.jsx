import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import PatientLayout from '../../components/layout/PatientLayout'
import PatientQrCode from '../../components/common/PatientQrCode'
import { getPatientProfile, getPrescriptions, DEFAULT_PRESCRIPTIONS } from '../../data/patientMockData'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'

export default function PrescriptionDetailsPage() {
  const location = useLocation()
  const profile = getPatientProfile()
  const rx = location.state?.prescription || getPrescriptions()[0] || DEFAULT_PRESCRIPTIONS[0]
  const medsList = rx.medicines || rx.items || []

  return (
    <PatientLayout
      activeNav="PATIENT SERVICES"
      breadcrumbs={[
        { label: 'Patient Portal', to: '/patient/home' },
        { label: 'Medicines', to: '/patient/medicines' },
        { label: 'Prescriptions', to: '/patient/prescriptions' },
        { label: 'Prescription Details' }
      ]}
      backTo="/patient/prescriptions"
      backLabel="Back to Prescriptions"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        {/* Read-Only Notice Bar */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-700 no-print">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#166534] text-lg">verified_user</span>
            <span>Official Digitally Signed Clinical Prescription • Attending Medical Officer • <strong>Read Only</strong></span>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#166534] hover:bg-[#14532d] text-white border border-[#166534] rounded-full font-bold transition-colors shadow-xs cursor-pointer btn-press"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Print Rx</span>
          </button>
        </div>

        {/* Prescription Canvas / Sheet */}
        <div className="printable-document bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-10 flex flex-col gap-6 relative overflow-hidden text-left">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="flex items-start gap-4">
              <img src={officialEmblem} alt="AAROGYA CASE Official Emblem" className="h-14 w-auto object-contain shrink-0" />
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-black text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  AAROGYA CASE
                </h1>
                <p className="text-xs font-bold uppercase tracking-wider text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Outpatient Medical Prescription
                </p>
                <span className="text-xs text-slate-500 mt-0.5">{rx.hospitalName || rx.hospital_name || 'District Civil Hospital'} • {rx.hospitalLocation || rx.roomNumber || 'Room 104'}</span>
              </div>
            </div>

            <div className="flex flex-col md:items-end gap-1 bg-slate-50 border border-slate-200 p-4 rounded-xl min-w-[240px]">
              <span className="text-[10px] font-bold uppercase text-slate-400">Prescription Number</span>
              <span className="font-mono font-bold text-[#166534] text-base">{rx.rxNumber || rx.rx_number || rx.prescriptionNumber}</span>
              <span className="text-xs text-slate-500">OPD Token: <strong className="text-slate-800">{rx.token || rx.tokenNumber || '#14'}</strong></span>
            </div>
          </div>

          {/* Department & Doctor Strip */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#166534] text-lg">medical_services</span>
              <span className="font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>Clinical Department:</span>
              <span className="text-slate-700">{rx.department}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">Dr: {rx.doctorName}</span>
              <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-bold">
                {rx.roomNumber}
              </span>
            </div>
          </div>

          {/* Patient Demographics & Vitals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{rx.patientName || rx.patient?.name || profile.name}</span>
              <span className="text-slate-500 block">Registered Citizen</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient ID &amp; Code</span>
              <span className="font-mono font-bold text-slate-900 text-sm block">{rx.patientId || profile.patientId}</span>
              <span className="text-slate-700 font-mono text-[11px] block mt-0.5">Code: <strong className="text-[#166534]">{rx.patientUniqueCode || profile.patientUniqueCode || 'AC-7F42K9'}</strong></span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Demographics</span>
              <span className="font-semibold text-slate-900">{profile.gender}, {profile.age} Yrs</span>
              <span className="text-slate-500 block">Blood Group: {profile.bloodGroup}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Recorded Vitals</span>
              <span className="font-semibold text-slate-900 block">{rx.vitals || 'BP 124/82 · Temp 99.4°F'}</span>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-800 text-2xl shrink-0 mt-0.5">diagnosis</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Provisional Clinical Diagnosis
              </span>
              <p className="font-bold text-slate-900 text-sm sm:text-base mt-0.5">{rx.diagnosis || 'Outpatient Clinical Consultation'}</p>
              <p className="text-xs text-slate-500 mt-0.5">{rx.icdCode || 'ICD-10: J02.9'} • No adverse drug reactions recorded</p>
            </div>
          </div>

          {/* Rx Medications Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Rx • Prescribed Medication
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold">
                  {medsList.length} Medicines
                </span>
              </div>
              <span className="text-xs text-slate-400">Read-Only Official Regimen</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Medication Name & Strength</th>
                    <th className="p-3">Dosage</th>
                    <th className="p-3">Frequency / Timing</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Specific Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {medsList.map((med, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-400 font-mono">0{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm">{med.name || med.medicineName || med.medicine}</div>
                        <div className="text-[11px] text-slate-500">{med.category}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{med.dosage}</td>
                      <td className="p-3 font-bold text-[#166534]">{med.frequency}</td>
                      <td className="p-3 font-semibold text-slate-700">{med.duration}</td>
                      <td className="p-3 text-slate-600 italic">"{med.instructions}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dietary Advice & Review Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Dietary & General Advice
              </span>
              <p className="text-slate-800 leading-relaxed">{rx.dietaryAdvice}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Next Review & OPD Follow-up
              </span>
              <p className="text-slate-800 leading-relaxed font-semibold text-[#166534]">{rx.nextReview}</p>
            </div>
          </div>

          {/* Doctor Signature Block, QR Code & Authenticity Note */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-700 block">Document Status</span>
              <span className="inline-block mt-1 text-[11px] font-bold px-3 py-1 rounded bg-emerald-100 text-[#166534]">
                Digitally Authorized e-Prescription • Active
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Available across hospital pharmacy & patient records</p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-300 rounded-lg shrink-0">
              <PatientQrCode code={profile.patientUniqueCode || 'AC-7F42K9'} size={68} showLabel={false} />
              <span className="text-[8px] font-mono text-[#166534] mt-1 font-bold">{profile.patientUniqueCode || 'AC-7F42K9'}</span>
            </div>

            <div className="text-right">
              <div className="w-44 border-b border-slate-400 mb-1 ml-auto"></div>
              <div className="font-bold text-slate-900 text-sm">{rx.doctorName || 'Dr. Ramanathan Venkatraman'}</div>
              <p className="text-[11px] text-slate-500">{rx.doctorId || 'DOC-1042'} • {rx.roomNumber || 'Room 104'}</p>
              <p className="text-[10px] text-slate-400 italic mt-0.5">Attending Medical Officer Signature</p>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400">
            AAROGYA CASE Prototype Demonstration • Single-Page Outpatient Clinical Medical Record
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
