import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import PatientQrCode from '../../components/common/PatientQrCode'
import { DoctorApi } from '../../services/doctorApi'
import { getPatientProfile } from '../../data/patientMockData'

export default function PatientSearchPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL') // 'ALL' | 'APPOINTED' | 'REGISTERED'
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [qrInputCode, setQrInputCode] = useState('')
  const [qrLookupResult, setQrLookupResult] = useState(null)
  const [qrError, setQrError] = useState('')
  const [allPatients, setAllPatients] = useState([])
  const [loading, setLoading] = useState(false)

  const defaultProfile = getPatientProfile()

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    DoctorApi.searchPatients(searchTerm)
      .then((results) => {
        if (isCurrent) {
          setAllPatients(Array.isArray(results) ? results : [])
        }
      })
      .catch((err) => {
        console.warn('DoctorApi search error:', err.message)
        if (isCurrent) setAllPatients([])
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [searchTerm])

  const filteredPatients = useMemo(() => {
    if (activeFilter === 'APPOINTED') return allPatients.filter(p => p.hasAppointment)
    if (activeFilter === 'REGISTERED') return allPatients.filter(p => !p.hasAppointment)
    return allPatients
  }, [allPatients, activeFilter])

  const handleOpenCase = async (patient, tab = 'overview') => {
    if (patient.appointmentId) {
      await DoctorApi.updateQueueStatus(patient.appointmentId, 'Current')
    }
    navigate('/doctor/patient-case', {
      state: {
        patient: {
          name: patient.name,
          id: patient.id,
          uniqueCode: patient.uniqueCode,
          token: patient.token,
          age: patient.age,
          chiefComplaint: patient.chiefComplaint,
          fullAppointment: patient.fullAppointment,
          appointmentId: patient.appointmentId
        },
        appointmentId: patient.appointmentId,
        initialTab: tab
      }
    })
  }

  const handleQrLookup = async (e) => {
    if (e) e.preventDefault()
    const targetCode = qrInputCode.trim().toUpperCase()
    if (!targetCode) {
      setQrError('Please enter or scan a valid Patient Unique Code.')
      return
    }

    try {
      const matches = await DoctorApi.searchPatients(targetCode)
      const exact = matches.find(p => (p.uniqueCode && p.uniqueCode.toUpperCase() === targetCode) || (p.id && p.id.toUpperCase() === targetCode)) || matches[0]

      if (exact) {
        setQrLookupResult(exact)
        setQrError('')
      } else {
        setQrLookupResult(null)
        setQrError(`No registered patient matches code "${targetCode}". Try searching by name or patient ID.`)
      }
    } catch (err) {
      setQrLookupResult(null)
      setQrError('Search failed. Please try again.')
    }
  }

  const handleQuickLookupDefault = async () => {
    const code = defaultProfile.patientUniqueCode || 'AC-7F42K9'
    setQrInputCode(code)
    try {
      const matches = await DoctorApi.searchPatients(code)
      if (matches.length > 0) {
        setQrLookupResult(matches[0])
        setQrError('')
      }
    } catch (e) {}
  }


  return (
    <DoctorLayout activeNav="Patient Search">
      {/* Breadcrumb strip */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 bg-white shadow-sm no-print">
        <nav className="flex items-center gap-2 text-xs text-[#58423a] font-semibold flex-wrap" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <Link to="/doctor/dashboard" className="hover:text-[#7c2800] flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Doctor Portal</span>
          </Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <span className="text-[#7c2800] font-bold">Patient Search &amp; QR Lookup</span>
        </nav>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200 text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px]">fingerprint</span>
              <span>Central Health Registry • OPD Intake Search</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Patient Search &amp; QR Fast Lookup
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Locate registered citizens and appointed outpatient cases using Patient Name, Patient ID, Consultation Token, or the permanent Patient Unique Code.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsQrModalOpen(true)
                handleQuickLookupDefault()
              }}
              className="h-12 px-6 bg-[#00501a] hover:bg-[#003d14] text-white rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
              <span>FAST QR / CODE LOOKUP</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative flex-grow">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Patient Name, ID (AC-2026-XXXXXX), Token (#14), or Unique Code (AC-XXXXXX)..."
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00501a] transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeFilter === 'ALL'
                    ? 'bg-[#00501a] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                All Records ({allPatients.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('APPOINTED')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeFilter === 'APPOINTED'
                    ? 'bg-[#00501a] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                OPD Tokens ({allPatients.filter(p => p.hasAppointment).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('REGISTERED')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeFilter === 'REGISTERED'
                    ? 'bg-[#00501a] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                Registered Citizens ({allPatients.filter(p => !p.hasAppointment).length})
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Showing {filteredPatients.length} patient record(s) from shared registry database</span>
            <span className="hidden sm:inline">Records link to live Patient Case &amp; Clinical History</span>
          </div>
        </div>

        {/* Patients List Grid */}
        <div className="space-y-4">
          {filteredPatients.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">person_search</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
                No Matching Patients Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No patient matching "{searchTerm}" was found. Try searching by Patient Unique Code (e.g. {defaultProfile.patientUniqueCode || 'AC-7F42K9'}), or clear the search.
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="mt-2 px-6 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filteredPatients.map((patient, idx) => (
              <div
                key={`${patient.id}-${idx}`}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-[#00501a]/40 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Patient Avatar & Demographics */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#00501a] border border-emerald-200 flex items-center justify-center text-2xl font-bold shrink-0">
                    <span className="material-symbols-outlined text-3xl">person</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        {patient.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#00501a] text-xs font-mono font-bold">
                        {patient.uniqueCode}
                      </span>
                      {patient.hasAppointment && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                          Token {patient.token}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                      <span>Patient ID: <strong className="font-mono text-slate-800">{patient.id}</strong></span>
                      <span>•</span>
                      <span>{patient.age}</span>
                      <span>•</span>
                      <span>{patient.room}</span>
                      <span>•</span>
                      <span>{patient.date}</span>
                    </div>

                    <p className="text-xs text-slate-600 italic line-clamp-1 mt-1">
                      Chief Complaint: "{patient.chiefComplaint}"
                    </p>
                  </div>
                </div>

                {/* Right: QR Preview & Action Buttons */}
                <div className="flex items-center gap-4 self-end lg:self-center shrink-0">
                  <div className="hidden sm:block">
                    <PatientQrCode
                      code={patient.uniqueCode}
                      size={64}
                      showLabel={false}
                      allowEnlarge={true}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCase(patient, 'history')}
                      className="h-11 px-5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-press"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-base">history</span>
                      <span>HISTORY</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCase(patient, 'overview')}
                      className="h-11 px-6 rounded-xl bg-[#00501a] hover:bg-[#003812] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition cursor-pointer btn-press"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span>OPEN PATIENT WORKSPACE</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR Code Quick Lookup Modal */}
      {isQrModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00501a] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    QR &amp; Unique Code Patient Lookup
                  </h3>
                  <p className="text-xs text-slate-500">Scan QR token or paste patient unique code</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Input form */}
            <form onSubmit={handleQrLookup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Patient Unique Code or QR Payload
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={qrInputCode}
                    onChange={(e) => setQrInputCode(e.target.value)}
                    placeholder="e.g. AC-7F42K9"
                    className="flex-grow h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00501a]"
                  />
                  <button
                    type="submit"
                    className="h-11 px-6 bg-[#00501a] hover:bg-[#003812] text-white rounded-xl text-xs font-bold uppercase transition btn-press cursor-pointer"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    Lookup
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={handleQuickLookupDefault}
                    className="text-[11px] text-[#00501a] hover:underline font-semibold"
                  >
                    Quick fill registered code ({defaultProfile.patientUniqueCode || 'AC-7F42K9'})
                  </button>
                  <span className="text-[11px] text-slate-400">Barcode/QR optical emulator</span>
                </div>
              </div>

              {qrError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {qrError}
                </div>
              )}

              {/* Resolved Patient Card */}
              {qrLookupResult && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-fade-in text-left">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                        Verified Patient Record Found
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">
                        {qrLookupResult.name}
                      </h4>
                      <div className="text-xs text-slate-600 font-mono mt-0.5">
                        Unique Code: <strong className="text-[#00501a]">{qrLookupResult.uniqueCode}</strong> • ID: {qrLookupResult.id}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Token: {qrLookupResult.token} • {qrLookupResult.room}
                      </div>
                    </div>

                    <PatientQrCode
                      code={qrLookupResult.uniqueCode}
                      size={60}
                      showLabel={false}
                    />
                  </div>

                  <div className="pt-3 border-t border-emerald-200/80 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsQrModalOpen(false)
                        handleOpenCase(qrLookupResult, 'history')
                      }}
                      className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 transition"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      View History
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsQrModalOpen(false)
                        handleOpenCase(qrLookupResult, 'overview')
                      }}
                      className="px-5 py-2 bg-[#00501a] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#003d14] transition btn-press"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      Open Patient Workspace
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </DoctorLayout>
  )
}
