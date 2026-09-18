import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import PharmacyLayout from '../../components/layout/PharmacyLayout'
import PatientQrCode from '../../components/common/PatientQrCode'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'

export default function DeliveryCompletedPage() {
  const location = useLocation()
  const data = location.state || {}

  const rxNumber = data.rxNumber || '—'
  const patientName = data.patientName || 'Patient'
  const patientId = data.patientId || '—'
  const patientUniqueCode = data.patientUniqueCode || '—'
  const dispensedMedicines = data.dispensedMedicines || [
    { name: 'Paracetamol 650mg Tablet', requiredQty: 15 },
    { name: 'Cetirizine 10mg Tablet', requiredQty: 3 }
  ]

  const handlePrint = () => {
    window.print()
  }

  return (
    <PharmacyLayout activeNav="Prescriptions">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        {/* Screen Confirmation Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-12 text-center w-full no-print">
          <div className="w-20 h-20 rounded-full bg-[#9bf79f] text-[#00501a] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="material-symbols-outlined text-4xl">task_alt</span>
          </div>

          <h1 className="text-3xl font-bold text-[#191c1e] mb-2 tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Medicine Delivery Completed
          </h1>
          <p className="text-base sm:text-lg text-[#58423a] mb-8 max-w-xl mx-auto">
            Prescription <strong className="text-[#191c1e] font-mono">{rxNumber}</strong> has been successfully verified and delivered to <strong className="text-[#191c1e]">{patientName}</strong>.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-left">
            <div className="p-4 bg-[#f2f4f6] rounded-xl">
              <span className="text-xs text-[#58423a] uppercase font-semibold block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Patient Code
              </span>
              <p className="text-base font-bold text-[#00501a] font-mono mt-1">{patientUniqueCode}</p>
              <span className="text-[11px] text-[#58423a] font-mono">ID: {patientId}</span>
            </div>

            <div className="p-4 bg-[#f2f4f6] rounded-xl">
              <span className="text-xs text-[#58423a] uppercase font-semibold block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Prescription
              </span>
              <p className="text-base font-bold text-[#191c1e] font-mono mt-1">{rxNumber}</p>
            </div>

            <div className="p-4 bg-[#f2f4f6] rounded-xl">
              <span className="text-xs text-[#58423a] uppercase font-semibold block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Status
              </span>
              <p className="text-base font-bold text-[#00501a] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Delivered</span>
              </p>
            </div>

            <div className="p-4 bg-[#f2f4f6] rounded-xl">
              <span className="text-xs text-[#58423a] uppercase font-semibold block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Dispensary
              </span>
              <p className="text-base font-bold text-[#191c1e] mt-1">Counter #01</p>
            </div>
          </div>

          <div className="p-4 bg-[#9bf79f]/20 rounded-xl mb-8 flex items-start gap-3 text-left border border-[#00501a]/20">
            <span className="material-symbols-outlined text-[#00501a]">cloud_done</span>
            <div>
              <p className="text-sm font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Dispensary Record Synced with Central Health Locker
              </p>
              <p className="text-xs text-[#58423a] mt-0.5">
                The handover has been recorded into the patient's record ({patientUniqueCode}). Patient Portal and Doctor Portal status has been updated to Delivered.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button 
              type="button"
              onClick={handlePrint}
              className="h-12 px-7 bg-[#166534] hover:bg-[#14532d] text-white rounded-full text-sm font-bold shadow-md flex items-center gap-2 cursor-pointer btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>PRINT HANDOVER RECEIPT</span>
            </button>

            <Link 
              to="/pharmacy/dashboard" 
              className="h-12 px-7 bg-[#166534] hover:bg-[#14532d] text-white rounded-full text-sm font-semibold shadow-md flex items-center gap-2 btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Dashboard</span>
            </Link>

            <Link 
              to="/pharmacy/history" 
              className="h-12 px-7 bg-[#eceef0] hover:bg-[#e1e2e5] text-[#191c1e] rounded-full text-sm font-semibold flex items-center gap-2 btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>View History</span>
            </Link>
          </div>
        </div>

        {/* Clean Printable Handover Slip (Printed only via @media print) */}
        <div className="printable-document bg-white border border-slate-300 rounded-2xl p-8 sm:p-10 text-left w-full">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#166534] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <img 
                src={officialEmblem} 
                alt="AAROGYA CASE Official Emblem" 
                className="h-14 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  AAROGYA CASE
                </h1>
                <p className="text-xs font-bold text-[#166534] uppercase tracking-wider">
                  Outpatient Pharmacy • Medicine Dispensation &amp; Handover Slip
                </p>
                <p className="text-[11px] text-slate-500">Hospital Healthcare Dispensary System</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prescription Ref</span>
              <span className="text-base font-mono font-bold text-[#166534]">{rxNumber}</span>
              <span className="text-xs text-slate-500 block mt-0.5">Counter: Pharmacy Counter #01</span>
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient Details</span>
              <p className="font-bold text-slate-900 text-sm">{patientName}</p>
              <p className="text-slate-600 font-mono">Patient ID: <strong>{patientId}</strong></p>
              <p className="text-slate-700 font-mono">Unique Code: <strong className="text-[#166534]">{patientUniqueCode}</strong></p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Dispensation Details</span>
              <p className="font-bold text-slate-900">Status: Delivered &amp; Verified</p>
              <p className="text-slate-600">Dispensary: District Civil Hospital</p>
              <p className="text-slate-500">Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Medicines Delivered */}
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Handed Over Medications
            </span>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Medicine Formulation</th>
                  <th className="p-3">Quantity Dispensed</th>
                  <th className="p-3">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {dispensedMedicines.map((m, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-mono font-bold text-slate-400">0{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-900">{m.name || m.medicine}</td>
                    <td className="p-3 font-bold text-[#166534]">{m.requiredQty || 15} Units</td>
                    <td className="p-3 font-semibold text-emerald-700">Verified &amp; Dispensed</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with QR */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="inline-block px-3 py-1 rounded bg-emerald-100 text-[#166534] font-bold text-xs">
                Authorized Pharmacy Handover
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Dispensed at Counter #01 • District Civil Hospital</p>
            </div>

            <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-300 rounded-lg shrink-0">
              <PatientQrCode code={patientUniqueCode} size={64} showLabel={false} />
              <span className="text-[8px] font-mono text-[#166534] mt-0.5 font-bold">{patientUniqueCode}</span>
            </div>
          </div>
        </div>
      </div>
    </PharmacyLayout>
  )
}
