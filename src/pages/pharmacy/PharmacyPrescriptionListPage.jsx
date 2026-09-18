import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PharmacyLayout from '../../components/layout/PharmacyLayout'
import { PrescriptionApi } from '../../services/prescriptionApi'

export default function PharmacyPrescriptionListPage() {
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL') // 'ALL' | 'PENDING' | 'DISPENSED'

  const loadPrescriptions = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const list = await PrescriptionApi.getPharmacyPrescriptions()
      if (Array.isArray(list)) {
        setPrescriptions(list)
      } else {
        setPrescriptions([])
      }
    } catch (err) {
      console.error('Error fetching pharmacy prescriptions:', err)
      setErrorMessage('Unable to load prescriptions. Please ensure backend services are connected.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPrescriptions()
  }, [])

  const filteredPrescriptions = prescriptions.filter((p) => {
    const q = searchQuery.toLowerCase().trim()
    const rxNumber = String(p.rxNumber || p.prescriptionNumber || '').toLowerCase()
    const patientName = String(p.patientName || '').toLowerCase()
    const patientId = String(p.patientId || '').toLowerCase()
    const patientUniqueCode = String(p.patientUniqueCode || '').toLowerCase()
    const doctorName = String(p.doctorName || '').toLowerCase()

    const matchesQuery =
      !q ||
      rxNumber.includes(q) ||
      patientName.includes(q) ||
      patientId.includes(q) ||
      patientUniqueCode.includes(q) ||
      doctorName.includes(q)

    if (!matchesQuery) return false

    const status = String(p.status || '').toLowerCase()
    const pharmacyStatus = String(p.pharmacyStatus || p.pharmacy_status || '').toLowerCase()

    if (activeFilter === 'PENDING') {
      return status === 'issued' && pharmacyStatus !== 'dispensed' && pharmacyStatus !== 'delivered'
    }
    if (activeFilter === 'DISPENSED') {
      return pharmacyStatus === 'dispensed' || status === 'dispensed'
    }

    return true
  })

  const pendingCount = prescriptions.filter(
    (p) =>
      String(p.status || '').toLowerCase() === 'issued' &&
      String(p.pharmacyStatus || p.pharmacy_status || '').toLowerCase() !== 'dispensed' &&
      String(p.pharmacyStatus || p.pharmacy_status || '').toLowerCase() !== 'delivered'
  ).length

  const readyDeliveryCount = prescriptions.filter(
    (p) =>
      String(p.pharmacyStatus || p.pharmacy_status || '').toLowerCase() === 'dispensed' ||
      String(p.status || '').toLowerCase() === 'dispensed'
  ).length

  return (
    <PharmacyLayout activeNav="Prescriptions">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/pharmacy/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:text-[#0A2540] transition-colors py-1 px-3 -ml-3 rounded-full hover:bg-slate-100"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={loadPrescriptions}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin text-[#166534]' : ''}`}>
              refresh
            </span>
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#166534] mb-1 font-semibold text-xs uppercase tracking-widest" style={{ fontFamily: 'Lexend, sans-serif' }}>
              <span className="material-symbols-outlined text-[18px]">prescriptions</span>
              <span>Dispensary Worklist</span>
            </div>
            <h1 className="text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Prescriptions
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Active doctor e-prescriptions received from outpatient consultation desks.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-semibold text-slate-600">Pending:</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{pendingCount}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-xs font-semibold text-slate-600">Dispensed:</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{readyDeliveryCount}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-grow max-w-lg">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Rx Number, Patient Name, ID, or Unique Code..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534] transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-[#166534] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              All Prescriptions ({prescriptions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('PENDING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'PENDING'
                  ? 'bg-[#166534] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Pending Dispensing ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('DISPENSED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'DISPENSED'
                  ? 'bg-[#166534] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Awaiting Handover ({readyDeliveryCount})
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-red-500">error</span>
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadPrescriptions}
              className="text-xs font-bold underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Prescriptions List */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[#166534] text-4xl animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Loading Dispensary Queue...
            </p>
            <span className="text-xs text-slate-400">Fetching real-time e-prescriptions from central health server</span>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-3xl">prescriptions</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
              No Prescriptions Available
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              {searchQuery
                ? `No prescriptions match your search query "${searchQuery}".`
                : 'All outpatient prescriptions for this counter have been dispensed and delivered.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-bold text-[#166534] hover:underline cursor-pointer"
              >
                Clear search query
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPrescriptions.map((rx) => {
              const rxNum = rx.rxNumber || rx.prescriptionNumber || rx.id
              const patientUniqueCode = rx.patientUniqueCode || rx.patient?.uniqueCode || rx.patient?.patientUniqueCode || '—'
              const patientId = rx.patientId || rx.patient?.id || '—'
              const patientName = rx.patientName || rx.patient?.name || 'Patient'
              const doctorName = rx.doctorName || 'Consulting Physician'
              const date = rx.appointmentDate || (rx.createdAt ? rx.createdAt.split('T')[0] : '—')
              const medicinesCount = (rx.medicines || rx.items || []).length
              const isDispensed =
                String(rx.pharmacyStatus || rx.pharmacy_status || '').toLowerCase() === 'dispensed' ||
                String(rx.status || '').toLowerCase() === 'dispensed'

              return (
                <div
                  key={rx.id || rxNum}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Rx Identifier & Patient Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#166534] border border-emerald-200 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">medication</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-base text-[#0A2540]">
                          #{rxNum}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isDispensed
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isDispensed ? 'Dispensed • Awaiting Handover' : 'Pending Dispensing'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="font-bold text-slate-900 text-sm">
                          {patientName}
                        </span>
                        <span className="font-mono text-slate-500">
                          ID: <strong className="text-slate-700">{patientId}</strong>
                        </span>
                        <span className="font-mono text-[#166534] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Code: {patientUniqueCode}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          <span>{doctorName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          <span>{date}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">pill</span>
                          <span>{medicinesCount} {medicinesCount === 1 ? 'Medicine' : 'Medicines'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                    {isDispensed ? (
                      <Link
                        to="/pharmacy/delivery-verify"
                        state={{ prescription: rx }}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                        <span>VERIFY DELIVERY</span>
                      </Link>
                    ) : (
                      <Link
                        to="/pharmacy/dispense"
                        state={{ prescription: rx }}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>DISPENSE</span>
                      </Link>
                    )}

                    <Link
                      to="/pharmacy/prescription"
                      state={{ prescription: rx }}
                      className="inline-flex items-center gap-1 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span>OPEN PRESCRIPTION</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PharmacyLayout>
  )
}
