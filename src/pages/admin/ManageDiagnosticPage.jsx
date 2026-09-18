import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { getAdminDiagnostics, updateAdminDiagnostic, addAdminDiagnostic } from '../../data/patientMockData'
import AdminApi from '../../services/adminApi'

export default function ManageDiagnosticPage() {
  const [tests, setTests] = useState(getAdminDiagnostics())
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [testId, setTestId] = useState('')
  const [testName, setTestName] = useState('')
  const [testTurnaround, setTestTurnaround] = useState('25 Mins')
  const [testCategory, setTestCategory] = useState('')
  const [testStatus, setTestStatus] = useState('Active')
  const [toastMsg, setToastMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadDiagnostics = async () => {
    try {
      const res = await AdminApi.getDiagnostics()
      const list = res.data?.diagnostics || res.diagnostics || (Array.isArray(res) ? res : null)
      if (list && list.length > 0) {
        setTests(list)
      }
    } catch (err) {
      console.warn('Using local diagnostics fallback:', err)
    }
  }

  useEffect(() => {
    loadDiagnostics()
  }, [])

  const openAddModal = () => {
    setIsEditing(false)
    const newId = `DIAG-NEW-${(tests.length + 1).toString().padStart(2, '0')}`
    setTestId(newId)
    setTestName('')
    setTestCategory('Clinical Pathology / Radiology')
    setTestTurnaround('25 Mins')
    setTestStatus('Active')
    setModalOpen(true)
  }

  const openEditModal = (t) => {
    setIsEditing(true)
    setTestId(t.id)
    setTestName(t.name)
    setTestCategory(t.category || 'General Diagnostic')
    setTestTurnaround(t.turnaround || '25 Mins')
    setTestStatus(t.status || 'Active')
    setModalOpen(true)
  }

  const handleModalSave = async (e) => {
    e.preventDefault()
    if (!testName) {
      alert('Please enter a test/scan name')
      return
    }

    setIsSaving(true)
    const payload = {
      name: testName,
      category: testCategory,
      turnaround: testTurnaround,
      status: testStatus
    }

    try {
      if (isEditing) {
        await AdminApi.updateDiagnostic(testId, payload)
        setToastMsg('Diagnostic modality updated successfully.')
      } else {
        await AdminApi.createDiagnostic(payload)
        setToastMsg('New diagnostic modality added to registry.')
      }
      await loadDiagnostics()
    } catch (err) {
      console.warn('AdminApi diagnostic error (fallback to local):', err)
      if (isEditing) {
        const updated = updateAdminDiagnostic({
          id: testId,
          ...payload
        })
        setTests(updated)
        setToastMsg('Diagnostic modality updated successfully.')
      } else {
        const updated = addAdminDiagnostic({
          id: testId,
          ...payload
        })
        setTests(updated)
        setToastMsg('New diagnostic modality added to registry.')
      }
    } finally {
      setIsSaving(false)
      setModalOpen(false)
      setTimeout(() => setToastMsg(''), 4000)
    }
  }

  return (
    <AdminLayout activeNav="Diagnostics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col w-full">
          {/* Subtle Ambient Glow */}
          <div className="relative w-full">
            {/* Navigation Header & Primary Action Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
              <div className="flex items-center gap-2">
                <Link 
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-1.5 text-[#455f8a] hover:text-[#7c2800] font-semibold text-sm transition-colors group"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                  <span>Back to Dashboard</span>
                </Link>
                <span className="text-[#e3bfb2] text-sm">/</span>
                <span className="text-xs text-[#58423a] uppercase tracking-wider font-semibold">Clinical Catalog</span>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00501a] text-white rounded-full font-bold text-sm shadow-sm hover:bg-[#1b6b33] active:scale-95 transition-all"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  <span>+ ADD TEST / SCAN</span>
                </button>
              </div>
            </div>

            {/* Page Title & Operational Metric Bar */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
              <div className="flex flex-col max-w-2xl">
                <div className="flex items-center gap-1.5 mb-1 text-[#00501a] text-xs uppercase tracking-wider font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                  <span>National Health Modality Directory</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight leading-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Manage Diagnostic
                </h1>
                <p className="text-sm sm:text-base text-[#58423a] mt-1 leading-relaxed">
                  Manage standardized clinical investigations and imaging modalities for Doctor requisitions and Lab execution.
                </p>
              </div>

              {/* Quick Operational Metrics Card */}
              <div className="flex items-center gap-4 p-4 px-6 bg-white rounded-2xl shadow-sm border border-[#eceef0]">
                <div className="flex flex-col pr-4">
                  <span className="text-xs text-[#58423a]">Active Modalities</span>
                  <span className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {tests.length} Available
                  </span>
                </div>
                <div className="w-[1px] h-8 bg-[#e0e3e5]"></div>
                <div className="flex flex-col pl-2">
                  <span className="text-xs text-[#58423a]">Standard SLA</span>
                  <span className="text-lg font-bold text-[#00501a]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    15–45m
                  </span>
                </div>
              </div>
            </div>

            {/* Toast Notification */}
            {toastMsg && (
              <div className="mb-6 flex items-center gap-3 bg-[#99f89e] text-[#002106] px-5 py-3 rounded-xl shadow-md transition-all border border-[#00501a]/20">
                <span className="material-symbols-outlined text-[#00501a] text-[22px]">check_circle</span>
                <span className="text-xs font-semibold">{toastMsg}</span>
              </div>
            )}

            {/* Modalities Inventory Container */}
            <div className="flex flex-col gap-4">
              {tests.map((t) => {
                const isActive = t.status !== 'Inactive'
                return (
                  <div 
                    key={t.id} 
                    className="p-5 sm:p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group border border-[#eceef0]"
                  >
                    <div className="flex items-start md:items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#f2f4f6] text-[#455f8a] flex items-center justify-center shrink-0 group-hover:bg-[#455f8a] group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[26px]">{t.icon || 'biotech'}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-[#191c1e] truncate" style={{ fontFamily: 'Lexend, sans-serif' }}>
                            {t.name}
                          </h2>
                          <span className="px-2.5 py-0.5 bg-[#e6e8ea] text-[#58423a] text-xs font-mono rounded-full">
                            {t.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#58423a] text-xs mt-1">
                          <span className="material-symbols-outlined text-[15px] text-[#8f7066]">tune</span>
                          <span>{t.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#f2f4f6]">
                      <div className="flex flex-col items-start md:items-end">
                        <span className="text-[11px] text-[#58423a] uppercase tracking-wider font-semibold">Standard Turnaround</span>
                        <div className="flex items-center gap-1 text-sm font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                          <span className="material-symbols-outlined text-[16px] text-[#00501a]">schedule</span>
                          <span>{t.turnaround}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-[#99f89e] text-[#002106]' : 'bg-[#ffdad6] text-[#93000a]'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#00501a]' : 'bg-[#ba1a1a]'}`}></span>
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </span>

                        <button 
                          type="button"
                          onClick={() => openEditModal(t)}
                          className="px-4 py-1.5 rounded-full bg-white text-[#455f8a] hover:bg-[#f2f4f6] text-xs font-bold shadow-sm transition-all border border-[#e0e3e5] active:scale-95"
                          style={{ fontFamily: 'Lexend, sans-serif' }}
                        >
                          EDIT
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Diagnostic Sync Integration Notice */}
            <div className="mt-8 p-6 bg-[#f2f4f6] rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-[#e0e3e5]">
              <div className="w-10 h-10 rounded-xl bg-[#00501a] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">sync</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Diagnostic Sync
                </span>
                <p className="text-xs text-[#58423a]">
                  These modalities feed Doctor Select Test/Scan (04.21) and Diagnostic Portal Requisitions (06.03).
                </p>
              </div>
              <div className="sm:ml-auto flex items-center gap-2 text-[#00501a] text-xs uppercase tracking-wider font-bold whitespace-nowrap" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="w-2 h-2 rounded-full bg-[#00501a] animate-ping"></span>
                <span>Realtime Live</span>
              </div>
            </div>
          </div>

          {/* Interactive Modal for Add / Edit */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 border border-[#eceef0]">
                <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00501a] text-[24px]">
                      {isEditing ? 'edit_document' : 'add_circle'}
                    </span>
                    <h3 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {isEditing ? 'Edit Diagnostic Modality' : 'Add Standard Test / Scan'}
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-[#f2f4f6] hover:bg-[#e6e8ea] flex items-center justify-center text-[#58423a]"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <form onSubmit={handleModalSave} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Test / Scan Name *
                    </label>
                    <input 
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f2f4f6] text-sm text-[#191c1e] outline-none border border-[#e0e3e5] focus:bg-white focus:border-[#7c2800]"
                      type="text" 
                      required
                      placeholder="e.g. Chest X-Ray (PA View)"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Identifier Code
                      </label>
                      <input 
                        className="w-full px-4 py-2.5 rounded-lg bg-[#f2f4f6] text-sm font-mono text-[#58423a] outline-none border border-[#e0e3e5]"
                        type="text" 
                        readOnly
                        value={testId}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Turnaround SLA
                      </label>
                      <input 
                        className="w-full px-4 py-2.5 rounded-lg bg-[#f2f4f6] text-sm text-[#191c1e] outline-none border border-[#e0e3e5] focus:bg-white focus:border-[#7c2800]"
                        type="text" 
                        value={testTurnaround}
                        onChange={(e) => setTestTurnaround(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Department Category
                      </label>
                      <input 
                        className="w-full px-4 py-2.5 rounded-lg bg-[#f2f4f6] text-sm text-[#191c1e] outline-none border border-[#e0e3e5] focus:bg-white focus:border-[#7c2800]"
                        type="text" 
                        placeholder="e.g. Sonography"
                        value={testCategory}
                        onChange={(e) => setTestCategory(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Availability Status
                      </label>
                      <select 
                        className="w-full px-4 py-2.5 rounded-lg bg-[#f2f4f6] text-sm text-[#191c1e] outline-none border border-[#e0e3e5] focus:bg-white"
                        value={testStatus}
                        onChange={(e) => setTestStatus(e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eceef0]">
                    <button 
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-5 py-2 rounded-full text-xs font-semibold text-[#58423a] hover:bg-[#f2f4f6]"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 rounded-full text-xs font-bold bg-[#00501a] text-white shadow-sm hover:bg-[#1b6b33] active:scale-95"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
