import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const EVENT_TYPE_CONFIG = {
  CONSULTATION_CASE: {
    icon: 'clinical_notes',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-600 ring-emerald-100',
    label: 'Consultation'
  },
  AI_INTAKE: {
    icon: 'neurology',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
    dotClass: 'bg-teal-600 ring-teal-100',
    label: 'AI Intake'
  },
  UPLOADED_DOCUMENT: {
    icon: 'description',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-600 ring-blue-100',
    label: 'Document'
  },
  LAB_REPORT: {
    icon: 'biotech',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-600 ring-purple-100',
    label: 'Lab Report'
  },
  DIAGNOSTIC_INVESTIGATION: {
    icon: 'science',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-600 ring-amber-100',
    label: 'Diagnostic Order'
  },
  PRESCRIPTION: {
    icon: 'prescriptions',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-600 ring-emerald-100',
    label: 'Prescription'
  },
  PHARMACY_DISPENSING: {
    icon: 'medication',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    dotClass: 'bg-cyan-600 ring-cyan-100',
    label: 'Pharmacy'
  },
  APPOINTMENT: {
    icon: 'calendar_month',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-600 ring-sky-100',
    label: 'Appointment'
  }
}

const SOURCE_TYPE_CONFIG = {
  PATIENT: { label: 'Patient Provided', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DOCTOR: { label: 'Doctor Verified', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  DOCUMENT: { label: 'Document Reported', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  DIAGNOSTIC: { label: 'Diagnostic Laboratory', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  PRESCRIPTION: { label: 'Prescription', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  PHARMACY: { label: 'Hospital Pharmacy', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  APPOINTMENT: { label: 'Hospital OPD', color: 'bg-sky-50 text-sky-700 border-sky-200' }
}

function formatDisplayDate(dateStr, hasExplicitDate) {
  if (!hasExplicitDate || !dateStr) {
    return {
      formatted: 'Date not available',
      isAvailable: false
    }
  }
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) {
      return { formatted: 'Date not available', isAvailable: false }
    }
    return {
      formatted: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      isAvailable: true
    }
  } catch {
    return { formatted: 'Date not available', isAvailable: false }
  }
}

export default function UnifiedMedicalTimeline({
  events = [],
  loading = false,
  isDoctorView = false,
  emptyMessage = 'No clinical timeline events recorded yet.'
}) {
  const [filter, setFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedEvents, setExpandedEvents] = useState({})

  const toggleExpand = (id) => {
    setExpandedEvents(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter criteria
  const filteredEvents = events.filter(evt => {
    // Type filter
    if (filter === 'CONSULTATIONS' && !['CONSULTATION_CASE', 'AI_INTAKE', 'APPOINTMENT'].includes(evt.eventType)) return false
    if (filter === 'DOCUMENTS' && evt.sourceType !== 'DOCUMENT') return false
    if (filter === 'DIAGNOSTICS' && !['LAB_REPORT', 'DIAGNOSTIC_INVESTIGATION'].includes(evt.eventType)) return false
    if (filter === 'MEDICINES' && !['PRESCRIPTION', 'PHARMACY_DISPENSING'].includes(evt.eventType)) return false

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = (evt.title || '').toLowerCase().includes(q)
      const matchSummary = (evt.summary || '').toLowerCase().includes(q)
      const matchSource = (evt.sourceLabel || '').toLowerCase().includes(q)
      const matchDoctor = (evt.doctorName || '').toLowerCase().includes(q)
      return matchTitle || matchSummary || matchSource || matchDoctor
    }

    return true
  })

  return (
    <div className="w-full space-y-6">
      {/* Controls Bar: Filter Pills + Search Input */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
            {[
              { id: 'ALL', label: 'All Records', count: events.length },
              { id: 'CONSULTATIONS', label: 'Consultations', count: events.filter(e => ['CONSULTATION_CASE', 'AI_INTAKE', 'APPOINTMENT'].includes(e.eventType)).length },
              { id: 'DOCUMENTS', label: 'Documents', count: events.filter(e => e.sourceType === 'DOCUMENT').length },
              { id: 'DIAGNOSTICS', label: 'Diagnostics', count: events.filter(e => ['LAB_REPORT', 'DIAGNOSTIC_INVESTIGATION'].includes(e.eventType)).length },
              { id: 'MEDICINES', label: 'Medications', count: events.filter(e => ['PRESCRIPTION', 'PHARMACY_DISPENSING'].includes(e.eventType)).length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  filter === tab.id
                    ? 'bg-[#166534] text-white border-[#166534] shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64 shrink-0">
            <span className="material-symbols-outlined text-slate-400 text-lg absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search timeline..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#166534] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
          <span className="material-symbols-outlined text-3xl text-[#166534] animate-spin">progress_activity</span>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Compiling Unified Medical Timeline...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEvents.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-2">
          <span className="material-symbols-outlined text-4xl text-slate-300">history</span>
          <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
            {searchQuery || filter !== 'ALL' ? 'No Matching Timeline Events' : 'No Medical History Recorded'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || filter !== 'ALL'
              ? 'Try changing your search term or selecting another filter category.'
              : emptyMessage}
          </p>
        </div>
      )}

      {/* Timeline Stream */}
      {!loading && filteredEvents.length > 0 && (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
          {filteredEvents.map((evt) => {
            const isExpanded = !!expandedEvents[evt.eventId]
            const typeCfg = EVENT_TYPE_CONFIG[evt.eventType] || EVENT_TYPE_CONFIG.CONSULTATION_CASE
            const sourceCfg = SOURCE_TYPE_CONFIG[evt.sourceType] || SOURCE_TYPE_CONFIG.PATIENT
            const dateInfo = formatDisplayDate(evt.eventDate, evt.hasExplicitDate)

            return (
              <div key={evt.eventId} className="relative group">
                {/* Timeline Dot with Icon */}
                <div className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full ${typeCfg.dotClass} ring-4 flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-110 shrink-0 z-10`}>
                  <span className="material-symbols-outlined text-xs sm:text-sm font-bold">{typeCfg.icon}</span>
                </div>

                {/* Event Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all space-y-3">
                  {/* Top Bar: Date + Type Badge + Source Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Clinical Event Date */}
                      <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full border text-[11px] ${
                        dateInfo.isAvailable
                          ? 'bg-slate-100 text-slate-800 border-slate-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        <span className="material-symbols-outlined text-xs">event</span>
                        <span>{dateInfo.formatted}</span>
                        {dateInfo.time && <span className="text-slate-400 font-normal">({dateInfo.time})</span>}
                      </span>

                      {/* Event Type Badge */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${typeCfg.badgeClass}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                        {typeCfg.label}
                      </span>

                      {/* Status Tag */}
                      {evt.status && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {evt.status}
                        </span>
                      )}
                    </div>

                    {/* Source Attribution Pill */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${sourceCfg.color}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span className="material-symbols-outlined text-[11px]">verified</span>
                        <span>{evt.sourceLabel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Concise Clinical Summary */}
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {evt.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {evt.summary}
                    </p>
                  </div>

                  {/* Metadata Bar */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    {evt.doctorName && (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <span className="material-symbols-outlined text-sm text-[#166534]">stethoscope</span>
                        <span>{evt.doctorName}</span>
                      </span>
                    )}
                    {evt.facility && (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-slate-400">domain</span>
                        <span>{evt.facility}</span>
                      </span>
                    )}
                    {evt.category && (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-slate-400">category</span>
                        <span>{evt.category}</span>
                      </span>
                    )}
                  </div>

                  {/* Expandable Details Section */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-fadeIn text-xs">
                      {/* 1. Verbatim Original Patient Complaint */}
                      {evt.details?.originalPatientResponse && (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                            Patient Verbatim Statement (Opening Response)
                          </span>
                          <p className="italic text-emerald-950 text-xs">
                            "{evt.details.originalPatientResponse}"
                          </p>
                        </div>
                      )}

                      {/* 2. Reported Symptoms List */}
                      {Array.isArray(evt.details?.symptoms) && evt.details.symptoms.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                            Documented Symptoms
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {evt.details.symptoms.map((sym, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-full text-xs font-medium">
                                {sym}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Lab Results Table */}
                      {Array.isArray(evt.details?.labResults) && evt.details.labResults.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                            Laboratory Findings & Values
                          </span>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                  <th className="p-2">Test Name</th>
                                  <th className="p-2">Result Value</th>
                                  <th className="p-2">Reference Range</th>
                                  <th className="p-2">Flag</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {evt.details.labResults.map((lr, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="p-2 font-medium text-slate-800">{lr.testName}</td>
                                    <td className="p-2 font-mono font-bold text-slate-900">{lr.value} {lr.unit || ''}</td>
                                    <td className="p-2 text-slate-500">{lr.referenceRange || '—'}</td>
                                    <td className="p-2">
                                      {lr.flag && lr.flag !== 'normal' ? (
                                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded uppercase">
                                          {lr.flag}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
                                          Normal
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* 4. Medications List */}
                      {Array.isArray(evt.details?.medications) && evt.details.medications.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                            Prescribed / Documented Medications
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {evt.details.medications.map((med, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-start gap-2">
                                <span className="material-symbols-outlined text-emerald-700 text-sm mt-0.5">pill</span>
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-900 block">{med.name || med.medicineName}</span>
                                  <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-2">
                                    {med.dosage && <span>{med.dosage}</span>}
                                    {med.frequency && <span>• {med.frequency}</span>}
                                    {med.duration && <span>• {med.duration}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 5. Dispensed Pharmacy Items */}
                      {Array.isArray(evt.details?.dispensedItems) && evt.details.dispensedItems.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                            Pharmacy Dispensed Items
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {evt.details.dispensedItems.map((item, idx) => (
                              <span key={idx} className="bg-cyan-50 border border-cyan-200 text-cyan-900 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">check</span>
                                <span>{item.medicineName || item.name} (Qty: {item.quantity || item.requiredQty})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 6. Uncertain / Unclear Items Warning */}
                      {Array.isArray(evt.details?.uncertainItems) && evt.details.uncertainItems.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>
                            <span className="material-symbols-outlined text-base text-amber-700">warning</span>
                            <span>Unclear / Uncertain Items (Needs Clinical Verification)</span>
                          </div>
                          <ul className="list-disc list-inside text-xs text-amber-950 space-y-0.5">
                            {evt.details.uncertainItems.map((unc, idx) => (
                              <li key={idx}>
                                <strong className="font-semibold">{unc.item}</strong>: {unc.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 7. Action Links */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {evt.details?.fileUrl && (
                          <a
                            href={evt.details.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                            style={{ fontFamily: 'Lexend, sans-serif' }}
                          >
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                            <span>View Original Document</span>
                          </a>
                        )}

                        {evt.caseId && !isDoctorView && (
                          <Link
                            to="/patient/case-details"
                            state={{ caseId: evt.caseId }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold transition-all cursor-pointer"
                            style={{ fontFamily: 'Lexend, sans-serif' }}
                          >
                            <span className="material-symbols-outlined text-xs">folder_open</span>
                            <span>Open Case Record</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expand / Collapse Footer Trigger */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(evt.eventId)}
                    className="text-xs font-bold text-[#166534] hover:text-[#14532d] flex items-center gap-1 transition-all pt-1 cursor-pointer select-none"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Full Details & Findings'}</span>
                    <span className="material-symbols-outlined text-sm transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                      expand_more
                    </span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
