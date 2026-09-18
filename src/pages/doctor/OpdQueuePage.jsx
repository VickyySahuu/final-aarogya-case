import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import { DoctorApi } from '../../services/doctorApi'

export default function OpdQueuePage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [skipPatient, setSkipPatient] = useState(null)
  const [queueData, setQueueData] = useState([])
  const [loading, setLoading] = useState(true)

  const loadQueue = async (selectedFilter = filter) => {
    try {
      setLoading(true)
      const data = await DoctorApi.getOpdQueue(selectedFilter)
      setQueueData(Array.isArray(data) ? data : [])
    } catch (e) {
      console.warn('Failed to load queue from backend:', e.message)
      setQueueData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue(filter)
  }, [filter])

  const filtered = queueData.filter((p) => {
    const matchFilter = filter === 'ALL' || p.category === filter
    const matchSearch = !search ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.id && p.id.toLowerCase().includes(search.toLowerCase())) ||
      (p.uniqueCode && p.uniqueCode.toLowerCase().includes(search.toLowerCase())) ||
      String(p.token).includes(search)
    return matchFilter && matchSearch
  })

  const handleSkip = async (patient) => {
    if (!patient) return
    const id = patient.appointmentId || patient.id
    await DoctorApi.updateQueueStatus(id, 'Skipped')
    await loadQueue(filter)
    setSkipPatient(null)
  }

  const handleRecall = async (patient) => {
    if (!patient) return
    const id = patient.appointmentId || patient.id
    await DoctorApi.updateQueueStatus(id, 'Waiting')
    await loadQueue(filter)
  }

  const handleSelectPatient = async (patient) => {
    if (!patient) return
    const id = patient.appointmentId || patient.id
    // Set status to Current when doctor selects patient
    await DoctorApi.updateQueueStatus(id, 'Current')
    navigate('/doctor/patient-case', {
      state: {
        patient: {
          ...patient,
          status: 'Current'
        },
        appointmentId: id
      }
    })
  }

  const handleCallNextPatient = async () => {
    const nextWaiting = queueData.find(p => p.status === 'Waiting')
    if (nextWaiting) {
      await handleSelectPatient(nextWaiting)
    } else if (queueData.length > 0) {
      await handleSelectPatient(queueData[0])
    } else {
      alert('No waiting patients in the OPD queue.')
    }
  }


  const statusStyle = (status) => {
    switch (status) {
      case 'Current': return { bg: '#00501a', color: '#ffffff' }
      case 'Waiting': return { bg: '#b3cdfe', color: '#3c5781' }
      case 'Skipped': return { bg: '#ffdbcf', color: '#380d00' }
      case 'Completed': return { bg: '#9bf79f', color: '#00531b' }
      default: return { bg: '#eceef0', color: '#191c1e' }
    }
  }

  const categoryStyle = (cat) => {
    switch (cat) {
      case 'URGENT': return { bg: '#ffdad6', color: '#93000a' }
      case 'PRIORITY': return { bg: '#d6e3ff', color: '#001b3d' }
      default: return { bg: '#e6e8ea', color: '#58423a' }
    }
  }

  const counts = { ALL: queueData.length, ROUTINE: queueData.filter(p => p.category === 'ROUTINE').length, PRIORITY: queueData.filter(p => p.category === 'PRIORITY').length, URGENT: queueData.filter(p => p.category === 'URGENT').length }

  return (
    <DoctorLayout activeNav="OPD Queue">
      {/* Subheader */}
      <div className="w-full px-4 sm:px-6 lg:px-10 pt-8 pb-6 bg-white shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-y-2 text-[#58423a] text-xs font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <div className="flex items-center gap-2">
              <Link to="/doctor/dashboard" className="hover:underline">Doctor Portal</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#00501a] font-semibold">OPD Queue</span>
            </div>
            <div className="flex items-center gap-3 bg-[#f2f4f6] px-4 py-1 rounded-full text-[#455f8a]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00501a] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00501a]"></span>
              </span>
              <span className="font-medium tracking-tight text-xs">Room 104 • District Civil Hospital • Morning Session (Active)</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#455f8a] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>OPD Queue</h1>
              <p className="text-sm sm:text-base text-[#58423a]" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>Manage today's outpatient consultation queue and call next waiting patient.</p>
            </div>
            <button className="h-12 sm:h-14 px-6 sm:px-8 bg-[#00501a] hover:bg-[#27853a] text-white rounded-full text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shrink-0 btn-press" style={{ fontFamily: 'Lexend, sans-serif' }} onClick={handleCallNextPatient}>
              <span>NEXT PATIENT</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-6">
        {/* Filter + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'ROUTINE', 'PRIORITY', 'URGENT'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${filter === f ? 'bg-[#00501a] text-white' : 'bg-[#e6e8ea] text-[#58423a] hover:bg-[#e1e2e5]'}`}
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                {f === 'URGENT' && <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>}
                {f} ({counts[f]})
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-80">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8f7066] text-[20px]">search</span>
            <input className="w-full h-11 pl-11 pr-4 bg-[#f2f4f6] rounded-full text-sm text-[#191c1e] focus:outline-none focus:bg-white shadow-inner" placeholder="Search by name, ID or token..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Skip Confirmation */}
        {skipPatient !== null && (
          <div className="w-full bg-[#ffdad6] text-[#93000a] p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">person_off</span>
              </div>
              <div>
                <span className="text-[15px] font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Skip this patient?</span>
                <p className="text-sm">Token #{skipPatient.token} ({skipPatient.name}) will be marked as Skipped and moved to recall list.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              <button onClick={() => handleSkip(skipPatient)} className="px-6 py-2 bg-[#ba1a1a] text-white text-xs font-semibold rounded-full" style={{ fontFamily: 'Lexend, sans-serif' }}>SKIP PATIENT</button>
              <button onClick={() => setSkipPatient(null)} className="px-4 py-2 bg-white text-[#191c1e] text-xs font-semibold rounded-full" style={{ fontFamily: 'Lexend, sans-serif' }}>CANCEL</button>
            </div>
          </div>
        )}

        {/* Queue Table */}
        <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f2f4f6] text-[#58423a] text-xs tracking-wider uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <th className="py-4 px-6">Token</th>
                  <th className="py-4 px-6">Patient Name &amp; ID</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#f2f4f6] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#8f7066] text-3xl">hourglass_empty</span>
                        </div>
                        <h3 className="text-xl font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>No booked patients in OPD queue</h3>
                        <p className="text-sm text-[#58423a] max-w-md">The OPD queue only displays patients who have completed the full appointment booking flow in the Patient Portal.</p>
                        <div className="mt-2">
                          <Link
                            to="/patient/home"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00501a] text-white text-xs font-semibold hover:bg-[#27853a] transition-all"
                            style={{ fontFamily: 'Lexend, sans-serif' }}
                          >
                            <span>Open Patient Portal</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((p) => {
                  const cs = categoryStyle(p.category)
                  const ss = statusStyle(p.status)
                  const isCurrent = p.status === 'Current'
                  return (
                    <tr key={p.id || p.token} className={`hover:bg-[#f2f4f6] transition-colors ${isCurrent ? 'bg-[#00501a]/5' : ''}`}>
                      <td className="py-6 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm ${isCurrent ? 'bg-[#00501a] text-white' : 'bg-[#e1e2e5] text-[#455f8a]'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                            {String(p.token).padStart(2, '0')}
                          </div>
                          {isCurrent && (
                            <div className="flex flex-col">
                              <span className="text-xs text-[#00501a] font-bold tracking-wider uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>In Consultation</span>
                              <span className="text-sm text-[#8f7066]">{p.time}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-[#455f8a]" style={{ fontFamily: 'Lexend, sans-serif' }}>{p.name}</span>
                          <div className="flex items-center gap-2 text-sm text-[#58423a]" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>
                            <span>ID: {p.id || p.patientId}</span><span>•</span><span>{p.age}</span><span>•</span><span>{p.extra}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-6 whitespace-nowrap">
                        <span className="px-4 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1" style={{ backgroundColor: cs.bg, color: cs.color, fontFamily: 'Lexend, sans-serif' }}>
                          {p.category === 'URGENT' && <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>}
                          {p.category.charAt(0) + p.category.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="py-6 px-6 whitespace-nowrap">
                        <span className="px-4 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1" style={{ backgroundColor: ss.bg, color: ss.color, fontFamily: 'Lexend, sans-serif' }}>
                          {p.status === 'Completed' && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                          {p.status}
                        </span>
                      </td>
                      <td className="py-6 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === 'Skipped' && (
                            <button onClick={() => handleRecall(p)} className="h-10 px-4 rounded-full bg-[#455f8a] text-white text-xs font-semibold transition-all flex items-center gap-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                              <span className="material-symbols-outlined text-[16px]">replay</span>RECALL
                            </button>
                          )}
                          <button onClick={() => handleSelectPatient(p)} className={`h-10 px-4 rounded-full text-xs font-semibold transition-all ${isCurrent ? 'bg-[#00501a] text-white hover:bg-[#27853a]' : 'bg-[#e6e8ea] text-[#455f8a] hover:bg-[#e1e2e5]'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                            VIEW CASE
                          </button>
                          {p.status === 'Waiting' && (
                            <button onClick={() => setSkipPatient(p)} className="h-10 px-4 rounded-full bg-[#f2f4f6] hover:bg-[#ffdad6] hover:text-[#93000a] text-[#8f7066] text-xs font-semibold transition-all" style={{ fontFamily: 'Lexend, sans-serif' }}>
                              SKIP
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Queue footer */}
          <div className="p-6 bg-[#f2f4f6] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#58423a]" style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-[#00501a]">check_circle</span>
              <span>Showing {filtered.length} of {queueData.length} patients registered for Room 104 today</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Average Consultation Time: <strong className="text-[#455f8a] font-semibold">9.4 mins</strong></span>
              <span>•</span>
              <span>Queue Estimated Wait: <strong className="text-[#455f8a] font-semibold">45 mins</strong></span>
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  )
}
