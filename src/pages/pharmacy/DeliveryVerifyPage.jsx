import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import PharmacyLayout from '../../components/layout/PharmacyLayout'
import { PrescriptionApi } from '../../services/prescriptionApi'

export default function DeliveryVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [activeRx, setActiveRx] = useState(location.state?.prescription || null)
  const [dispensing, setDispensing] = useState(location.state?.dispensing || null)
  const [dispensedMedicines, setDispensedMedicines] = useState(location.state?.dispensedMedicines || [])
  const [isLoading, setIsLoading] = useState(!location.state?.prescription)
  const [inputCode, setInputCode] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('idle') // 'idle' | 'scanning' | 'verified' | 'failed'
  const [isProcessing, setIsProcessing] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let mounted = true
    async function init() {
      if (!activeRx) {
        try {
          const queue = await PrescriptionApi.getPharmacyPrescriptions()
          if (mounted && Array.isArray(queue) && queue.length > 0) {
            setActiveRx(queue[0])
            setDispensedMedicines(queue[0].medicines || queue[0].items || [])
            setIsLoading(false)
            return
          }
        } catch (err) {
          console.warn('Queue fetch failed:', err)
        }
        if (mounted) setIsLoading(false)
      } else {
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
  const correctUniqueCode = rx.patientUniqueCode || rx.patient?.uniqueCode || rx.patient?.patientUniqueCode || ''

  const handleSimulateScan = () => {
    setApiError('')
    setVerificationStatus('scanning')
    setTimeout(() => {
      setInputCode(correctUniqueCode)
      setVerificationStatus('idle')
    }, 600)
  }

  const handleVerifyAndComplete = async (e) => {
    e?.preventDefault()
    if (isProcessing) return
    setApiError('')

    const codeToVerify = inputCode.trim().toUpperCase()
    if (!codeToVerify) {
      setApiError('Please enter or scan the Patient Unique Code to verify delivery.')
      return
    }

    setIsProcessing(true)
    const targetDispensingId = dispensing?.id || activeRx.id || rxNumber

    try {
      const res = await PrescriptionApi.verifyDelivery(targetDispensingId, {
        patientUniqueCode: codeToVerify
      })

      if (res.ok) {
        setVerificationStatus('verified')
        setTimeout(() => {
          navigate('/pharmacy/delivery-completed', {
            state: {
              prescription: activeRx,
              dispensing: res.data?.dispensing || dispensing,
              rxNumber,
              patientName,
              patientId,
              patientUniqueCode: correctUniqueCode,
              dispensedMedicines
            }
          })
        }, 800)
      } else {
        setVerificationStatus('failed')
        setApiError(res.message || 'Unable to verify delivery. Provided code does not match patient unique code on prescription.')
        setIsProcessing(false)
      }
    } catch (err) {
      console.error('Verification API error:', err)
      setVerificationStatus('failed')
      setApiError('Unable to verify delivery. Server communication error. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <PharmacyLayout activeNav="Prescriptions">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Navigation Action */}
        <div className="flex items-center justify-between">
          <Link 
            to="/pharmacy/dispense" 
            state={{ prescription: activeRx }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:text-[#0A2540] transition-colors py-1 px-3 -ml-3 rounded-full hover:bg-slate-100"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Dispense</span>
          </Link>

          <span className="text-xs font-bold text-[#166534] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Step 2 of 2: Handover Authentication
          </span>
        </div>

        {/* Screen Header */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Delivery Verification
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Verify patient identity via QR Scan or Patient Unique Code before medication handover.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[#166534] text-4xl animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-slate-700">Loading Verification Session...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Verification Scanner & Manual Input */}
            <div className="lg:col-span-6 flex flex-col gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Patient Identity Gate
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Prescription #{rxNumber}
                </span>
              </div>

              {/* QR Scanner Target Box */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="w-36 h-36 rounded-xl bg-white flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 relative shadow-inner">
                  <span className="material-symbols-outlined text-[#166534] text-5xl mb-1">
                    {verificationStatus === 'scanning' ? 'hourglass_top' : 'qr_code_scanner'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-700" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {verificationStatus === 'scanning' ? 'SCANNING TOKEN...' : 'SCAN PATIENT QR'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateScan}
                  className="mt-4 px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-[#166534] text-xs font-bold border border-emerald-300 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  <span>SIMULATE QR SCANNER</span>
                </button>
              </div>

              {/* Or Separator */}
              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-200 flex-grow"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">OR ENTER CODE</span>
                <div className="h-px bg-slate-200 flex-grow"></div>
              </div>

              {/* Manual Input Form */}
              <form onSubmit={handleVerifyAndComplete} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between" htmlFor="unique-code-input">
                    <span>Patient Unique Code</span>
                    <span className="text-slate-400 font-normal text-[11px]">e.g. {correctUniqueCode || 'AC-XXXXXX'}</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-xl pointer-events-none">
                      key
                    </span>
                    <input
                      id="unique-code-input"
                      type="text"
                      required
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value.toUpperCase())
                        if (apiError) setApiError('')
                      }}
                      placeholder="Enter Patient Unique Code (e.g. AC-...)"
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base font-mono font-bold tracking-wider placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534] transition-all"
                    />
                  </div>
                </div>

                {/* API Error Alert */}
                {apiError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2 text-xs">
                    <span className="material-symbols-outlined text-red-500 text-base shrink-0 mt-0.5">error</span>
                    <span className="font-medium leading-relaxed">{apiError}</span>
                  </div>
                )}

                {/* Verified Confirmation */}
                {verificationStatus === 'verified' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#166534] flex items-center gap-2 text-xs font-bold">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>DELIVERY VERIFIED! Completing handover record...</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 rounded-full bg-[#166534] hover:bg-[#14532d] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  {isProcessing ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>VERIFYING...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>VERIFY & COMPLETE HANDOVER</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Handover Summary Card */}
            <div className="lg:col-span-6 flex flex-col gap-6 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <span className="text-xs font-bold text-[#0A2540] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Dispensary Handover Summary
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Awaiting Patient Code
                </span>
              </div>

              {/* Patient Identity */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Patient Name</span>
                  <span className="text-base font-bold text-slate-900">{patientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Patient ID</span>
                  <span className="text-sm font-mono font-bold text-slate-800">{patientId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#166534] uppercase font-bold">Expected Code</span>
                  <span className="text-sm font-mono font-extrabold text-[#166534] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {correctUniqueCode}
                  </span>
                </div>
              </div>

              {/* Packaged Medicines */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Packaged Items for Handover ({dispensedMedicines.length})
                </span>
                {dispensedMedicines.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#166534] text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{m.name || m.medicineName || m.medicine}</span>
                    </div>
                    <span className="font-mono font-bold text-[#166534]">
                      Qty: {m.requiredQty || m.quantity || 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Institutional Handover Policy */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#166534] text-xl shrink-0 mt-0.5">verified_user</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Medication delivery verification requires matching the Patient Unique Code generated during hospital registration. This prevents medication misallocation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PharmacyLayout>
  )
}
