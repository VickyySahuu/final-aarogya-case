import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PharmacyLayout from '../../components/layout/PharmacyLayout'
import { PrescriptionApi } from '../../services/prescriptionApi'

export default function PharmacyDashboardPage() {
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const loadDashboardData = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const [queueData, histData] = await Promise.all([
        PrescriptionApi.getPharmacyPrescriptions().catch(() => []),
        PrescriptionApi.getPharmacyHistory().catch(() => [])
      ])
      setPrescriptions(Array.isArray(queueData) ? queueData : [])
      setHistoryList(Array.isArray(histData) ? histData : [])
    } catch (err) {
      console.error('Pharmacy dashboard fetch error:', err)
      setErrorMsg('Unable to load prescriptions. Please ensure backend services are active.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const pendingList = prescriptions.filter((p) => {
    const status = (p.status || '').toLowerCase()
    const pharmacyStatus = (p.pharmacyStatus || p.pharmacy_status || '').toLowerCase()
    return status === 'issued' && pharmacyStatus !== 'dispensed' && pharmacyStatus !== 'delivered'
  })

  const readyToDispenseCount = pendingList.length
  const recentDispensingCount = historyList.length

  return (
    <PharmacyLayout activeNav="Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Work-Control Center Institutional Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-[#166534] border border-emerald-200">
                <span className="material-symbols-outlined text-[15px]">local_pharmacy</span>
                <span>DISPENSARY WORK-CONTROL CENTER</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Counter #01 Live</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Good morning, Pharmacist Lead
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              District Civil Hospital Outpatient Dispensary • Live centralized e-prescription queue.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/pharmacy/prescriptions"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[18px]">prescriptions</span>
              <span>VIEW PRESCRIPTIONS</span>
            </Link>

            <button
              type="button"
              onClick={loadDashboardData}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              style={{ fontFamily: 'Lexend, sans-serif' }}
              title="Refresh queue"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin text-[#166534]' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">error</span>
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={loadDashboardData}
              className="text-xs font-bold underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 3 Core Operational Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Pending Prescriptions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">pending_actions</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Action Required
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Pending Prescriptions
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#0A2540] font-mono">
                  {isLoading ? '—' : pendingList.length}
                </span>
                <span className="text-xs text-slate-500">orders awaiting fulfillment</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Doctor issued outpatient prescriptions awaiting pharmacist medicine review and packaging.
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100">
              <Link
                to="/pharmacy/prescriptions"
                className="inline-flex items-center justify-between w-full text-xs font-bold text-[#166534] hover:text-[#0A2540] transition-colors"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>OPEN PENDING QUEUE</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* 2. Ready to Dispense */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-[#166534] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">inventory_2</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#166534] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Counter Desk
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Ready to Dispense
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#0A2540] font-mono">
                  {isLoading ? '—' : readyToDispenseCount}
                </span>
                <span className="text-xs text-slate-500">active intake items</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Prescriptions with verified formulary medications ready to be packaged for handover.
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100">
              <Link
                to="/pharmacy/prescriptions"
                className="inline-flex items-center justify-between w-full text-xs font-bold text-[#166534] hover:text-[#0A2540] transition-colors"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>FULFILL DISPENSING</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* 3. Recent Dispensing */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  Completed
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Recent Dispensing
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#0A2540] font-mono">
                  {isLoading ? '—' : recentDispensingCount}
                </span>
                <span className="text-xs text-slate-500">handovers verified</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Successful patient handovers authenticated via QR scan or Patient Unique Code.
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100">
              <Link
                to="/pharmacy/history"
                className="inline-flex items-center justify-between w-full text-xs font-bold text-[#166534] hover:text-[#0A2540] transition-colors"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span>VIEW HANDOVER HISTORY</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Operational Focus: "What do I need to do now?" Worklist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Active Prescriptions Needing Action
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Priority outpatient dispensary queue awaiting medicine fulfillment.
              </p>
            </div>
            <Link
              to="/pharmacy/prescriptions"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#166534] hover:underline self-start sm:self-auto"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span>VIEW ALL ({prescriptions.length})</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[#166534] text-3xl animate-spin">
                progress_activity
              </span>
              <span className="text-xs text-slate-500">Checking dispensary queue...</span>
            </div>
          ) : pendingList.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-4xl">
                check_circle
              </span>
              <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                All Prescriptions Fulfilled
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                There are no pending prescriptions waiting for fulfillment at this counter right now.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingList.slice(0, 5).map((rx) => {
                const rxNum = rx.rxNumber || rx.prescriptionNumber || rx.id
                const patientUniqueCode = rx.patientUniqueCode || rx.patient?.uniqueCode || '—'
                const patientId = rx.patientId || rx.patient?.id || '—'
                const patientName = rx.patientName || rx.patient?.name || 'Patient'
                const doctorName = rx.doctorName || 'Doctor'
                const date = rx.appointmentDate || (rx.createdAt ? rx.createdAt.split('T')[0] : '—')
                const medicinesCount = (rx.medicines || rx.items || []).length

                return (
                  <div
                    key={rx.id || rxNum}
                    className="p-5 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#166534] border border-emerald-200 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">medication</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#0A2540]">
                            #{rxNum}
                          </span>
                          <span className="font-bold text-sm text-slate-800">
                            {patientName}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono text-slate-600">ID: {patientId}</span>
                          <span>•</span>
                          <span className="font-mono text-[#166534] font-semibold">
                            Code: {patientUniqueCode}
                          </span>
                          <span>•</span>
                          <span>{medicinesCount} Meds</span>
                          <span>•</span>
                          <span>Dr. {doctorName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link
                        to="/pharmacy/dispense"
                        state={{ prescription: rx }}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        <span>DISPENSE</span>
                      </Link>

                      <Link
                        to="/pharmacy/prescription"
                        state={{ prescription: rx }}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span>OPEN PRESCRIPTION</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PharmacyLayout>
  )
}
