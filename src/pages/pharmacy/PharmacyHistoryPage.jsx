import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PharmacyLayout from '../../components/layout/PharmacyLayout'
import { PrescriptionApi } from '../../services/prescriptionApi'

export default function PharmacyHistoryPage() {
  const [historyList, setHistoryList] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchHistory = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const records = await PrescriptionApi.getPharmacyHistory()
      if (Array.isArray(records)) {
        setHistoryList(records)
      } else {
        setHistoryList([])
      }
    } catch (err) {
      console.error('Backend pharmacy history fetch failed:', err)
      setErrorMessage('Unable to load dispensary history ledger. Please check network connection.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const filteredHistory = historyList.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true

    const patientName = String(item.patientName || item.patient?.name || '').toLowerCase()
    const patientId = String(item.patientId || item.patient?.id || '').toLowerCase()
    const uniqueCode = String(item.patientUniqueCode || item.patient_unique_code || '').toLowerCase()
    const rxNumber = String(item.rxNumber || item.prescriptionNumber || item.prescriptionId || '').toLowerCase()
    const date = String(item.dispensedAt || item.createdAt || item.date || '').toLowerCase()

    return (
      patientName.includes(q) ||
      patientId.includes(q) ||
      uniqueCode.includes(q) ||
      rxNumber.includes(q) ||
      date.includes(q)
    )
  })

  return (
    <PharmacyLayout activeNav="History">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Top Bar Navigation & Badge */}
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
            onClick={fetchHistory}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin text-[#166534]' : ''}`}>
              refresh
            </span>
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-[#166534]" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Dispensary Audit Ledger
            </span>
            <h1 className="text-3xl font-bold text-[#0A2540] tracking-tight mt-0.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Pharmacy History
            </h1>
            <p className="text-sm text-slate-600 mt-0.5 max-w-xl">
              Permanent verified log of fulfilled outpatient dispensations and completed patient medicine handovers.
            </p>
          </div>

          {/* Ledger Counter Tile */}
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#166534] border border-emerald-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">assignment_turned_in</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Handovers</span>
              <span className="text-xl font-bold text-[#0A2540] leading-none mt-0.5 font-mono" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {historyList.length} Records
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by Patient Name, ID, Unique Code, Rx Number, or Date..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534] transition-all"
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">error</span>
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={fetchHistory}
              className="text-xs font-bold underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Primary Data Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[#166534] text-4xl animate-spin">
                progress_activity
              </span>
              <p className="text-sm font-semibold text-slate-700">Loading Dispensary History...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-3xl">history_toggle_off</span>
              </div>
              <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                No dispensing history available.
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                {searchQuery
                  ? `No history records matched your search query "${searchQuery}".`
                  : 'Completed dispensations will appear here once patient deliveries are authenticated.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-4 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider text-left border-b border-slate-200" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <div className="col-span-3">Prescription</div>
                <div className="col-span-4">Patient Identity</div>
                <div className="col-span-3">Dispensed Date &amp; Time</div>
                <div className="col-span-2 text-right">Verification Status</div>
              </div>

              {/* Rows */}
              {filteredHistory.map((item, idx) => {
                const rxNum = item.rxNumber || item.prescriptionNumber || item.prescriptionId || '—'
                const patientName = item.patientName || item.patient?.name || 'Patient'
                const patientId = item.patientId || item.patient?.id || '—'
                const uniqueCode = item.patientUniqueCode || item.patient_unique_code || '—'
                const dateStr = item.dispensedAt || item.deliveredAt || item.createdAt || item.date || 'Today'
                const medicines = item.dispensedItems || item.medicines || item.items || []

                return (
                  <div
                    key={item.id || idx}
                    className="p-5 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center text-xs sm:text-sm"
                  >
                    {/* Prescription Column */}
                    <div className="md:col-span-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#166534] border border-emerald-200 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg">medication</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900">
                          #{rxNum}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {medicines.length} {medicines.length === 1 ? 'item' : 'items'} dispensed
                        </span>
                      </div>
                    </div>

                    {/* Patient Column */}
                    <div className="md:col-span-4 flex flex-col gap-0.5">
                      <span className="font-bold text-slate-900 text-sm">{patientName}</span>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono text-slate-500">ID: {patientId}</span>
                        <span>•</span>
                        <span className="font-mono text-[#166534] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Code: {uniqueCode}
                        </span>
                      </div>
                    </div>

                    {/* Date Column */}
                    <div className="md:col-span-3 flex flex-col text-xs text-slate-600">
                      <span className="font-medium text-slate-800">
                        {dateStr.includes('T') ? dateStr.replace('T', ' ').slice(0, 16) : dateStr}
                      </span>
                      <span className="text-[11px] text-slate-400">Counter #01 • OPD</span>
                    </div>

                    {/* Status Column */}
                    <div className="md:col-span-2 flex md:justify-end items-center gap-2 w-full md:w-auto">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#166534] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        <span>Delivered</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedRecord(selectedRecord?.id === item.id ? null : item)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer ml-2"
                      >
                        {selectedRecord?.id === item.id ? 'Hide' : 'Details'}
                      </button>
                    </div>

                    {/* Expanded Items Preview if toggled */}
                    {selectedRecord?.id === item.id && (
                      <div className="col-span-12 w-full bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Handed Over Medication Details
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {medicines.map((m, mIdx) => (
                            <div key={mIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{m.name || m.medicineName || m.medicine}</span>
                              <span className="font-mono text-[#166534] font-bold">Qty: {m.quantity || m.requiredQty || 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
