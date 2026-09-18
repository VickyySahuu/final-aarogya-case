import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import PharmacyLayout from '../../components/layout/PharmacyLayout'
import { PrescriptionApi } from '../../services/prescriptionApi'

export default function DispenseMedicinePage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [activeRx, setActiveRx] = useState(location.state?.prescription || null)
  const [isLoading, setIsLoading] = useState(!location.state?.prescription)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [stockStatus, setStockStatus] = useState([])

  useEffect(() => {
    let mounted = true
    async function init() {
      if (!activeRx) {
        try {
          const queue = await PrescriptionApi.getPharmacyPrescriptions()
          if (mounted && Array.isArray(queue) && queue.length > 0) {
            setActiveRx(queue[0])
            const meds = queue[0].medicines || queue[0].items || []
            setStockStatus(meds.map(() => 'available'))
            setIsLoading(false)
            return
          }
        } catch (err) {
          console.warn('Queue fetch failed:', err)
        }
        if (mounted) {
          setIsLoading(false)
        }
      } else {
        const meds = activeRx.medicines || activeRx.items || []
        setStockStatus(meds.map(() => 'available'))
        setIsLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  const rx = activeRx || {}
  const rxNumber = rx.rxNumber || rx.prescriptionNumber || rx.id || '—'
  const patientName = rx.patientName || rx.patient?.name || 'Patient'
  const patientId = rx.patientId || rx.patient?.id || '—'
  const patientUniqueCode = rx.patientUniqueCode || rx.patient?.uniqueCode || rx.patient?.patientUniqueCode || '—'
  const doctorName = rx.doctorName || 'Dr. Ramanathan Venkatraman'
  const appointmentDate = rx.appointmentDate || rx.appointment?.date || (rx.createdAt ? rx.createdAt.split('T')[0] : '—')

  const medicines = rx.medicines || rx.items || []

  const toggleStatus = (index, status) => {
    setStockStatus((prev) => {
      const next = [...prev]
      next[index] = status
      return next
    })
  }

  const handleDispense = async () => {
    if (isProcessing || !activeRx) return
    setIsProcessing(true)
    setErrorMsg('')

    const preparedItems = medicines.map((m, i) => ({
      medicineId: m.medicineId || m.medicine_id || null,
      name: m.name || m.medicineName || m.medicine || 'Medication',
      quantity: parseInt(m.requiredQty || m.quantity || 1, 10),
      status: stockStatus[i] || 'available'
    }))

    let dispensingResult = null
    try {
      const res = await PrescriptionApi.dispenseMedicines({
        prescriptionId: activeRx.id || rxNumber,
        dispensedItems: preparedItems
      })
      if (res.ok && res.data?.dispensing) {
        dispensingResult = res.data.dispensing
      } else if (!res.ok && res.status === 400 && res.data?.message?.includes('already')) {
        dispensingResult = {
          prescriptionId: activeRx.id,
          rxNumber: activeRx.rxNumber,
          patientUniqueCode: activeRx.patientUniqueCode
        }
      } else if (!res.ok) {
        setErrorMsg(res.message || 'Unable to dispense medicine. Please verify inventory and counter session.')
        setIsProcessing(false)
        return
      }
    } catch (err) {
      console.warn('Backend dispensing error:', err)
      setErrorMsg('Unable to dispense medicine. Server communication failed.')
      setIsProcessing(false)
      return
    }

    setIsProcessing(false)
    navigate('/pharmacy/delivery-verify', {
      state: {
        prescription: activeRx,
        dispensing: dispensingResult,
        dispensedMedicines: medicines.map((m, i) => ({
          ...m,
          status: stockStatus[i] || 'available'
        }))
      }
    })
  }

  return (
    <PharmacyLayout activeNav="Prescriptions">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Navigation Action */}
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

        {/* Screen Header */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#166534]"></span>
            <span className="text-xs font-semibold text-[#166534] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Step 1 of 2: Dispensary Verification
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Dispense Medicine
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Confirm stock availability and prepare prescribed medication packages.
          </p>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[#166534] text-4xl animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-slate-700">Loading Prescription...</p>
          </div>
        ) : !activeRx ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-slate-400 text-4xl">inventory_2</span>
            <p className="text-base font-bold text-slate-800">No prescription selected for dispensing</p>
            <Link
              to="/pharmacy/prescriptions"
              className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#166534] text-white text-xs font-bold uppercase tracking-wider"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span>Choose from Prescriptions Queue</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Patient Context Summary Strip */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#166534] border border-emerald-200 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">person</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Patient Name
                  </span>
                  <span className="text-lg font-bold text-[#0A2540] truncate" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {patientName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:gap-8 text-xs">
                <div className="flex flex-col">
                  <span className="text-slate-500 uppercase tracking-wide font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Patient ID
                  </span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                    {patientId}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#166534] uppercase tracking-wide font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Unique Code
                  </span>
                  <span className="text-sm font-extrabold text-[#166534] font-mono mt-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {patientUniqueCode}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 uppercase tracking-wide font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Prescription Ref
                  </span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                    #{rxNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">error</span>
                <span className="text-sm font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Medicines List Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Verify Medication Stock
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Check formulary availability before triggering system dispensation.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#166534] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {medicines.length} {medicines.length === 1 ? 'Medication' : 'Medications'} Prescribed
                </span>
              </div>

              <div className="divide-y divide-slate-100 p-6 flex flex-col gap-4">
                {medicines.map((med, idx) => {
                  const qty = med.requiredQty || med.quantity || 1
                  const currentStatus = stockStatus[idx] || 'available'

                  return (
                    <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#166534] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-base font-bold text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
                            {med.name || med.medicineName || med.medicine}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>Dosage: <strong className="text-slate-700">{med.dosage || 'Standard'}</strong></span>
                            <span>•</span>
                            <span>Frequency: <strong className="text-slate-700">{med.frequency || 'Daily'}</strong></span>
                            <span>•</span>
                            <span>Duration: <strong className="text-slate-700">{med.duration || 'As directed'}</strong></span>
                          </div>
                          {med.instructions && (
                            <span className="text-xs text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200 self-start mt-1">
                              <strong>Instructions:</strong> {med.instructions}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Pack Qty</span>
                          <span className="text-sm font-bold font-mono text-[#0A2540]">{qty} Units</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStatus(idx, currentStatus === 'available' ? 'substituted' : 'available')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'available'
                              ? 'bg-emerald-50 text-[#166534] border border-emerald-300'
                              : 'bg-amber-50 text-amber-700 border border-amber-300'
                          }`}
                        >
                          {currentStatus === 'available' ? '✓ In Stock' : 'Substituted'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Prescribed by <strong>{doctorName}</strong> on {appointmentDate}
                </span>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleDispense}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  {isProcessing ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>DISPENSING...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>DISPENSE</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </PharmacyLayout>
  )
}
