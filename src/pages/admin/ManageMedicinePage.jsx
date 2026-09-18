import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { getAdminMedicines, updateAdminMedicine, addAdminMedicine } from '../../data/patientMockData'
import AdminApi from '../../services/adminApi'

export default function ManageMedicinePage() {
  const [medicines, setMedicines] = useState(getAdminMedicines())
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [medId, setMedId] = useState('')
  const [medName, setMedName] = useState('')
  const [medCategory, setMedCategory] = useState('')
  const [medQty, setMedQty] = useState('')
  const [medUnit, setMedUnit] = useState('Tablets')
  const [medStatus, setMedStatus] = useState('Available')
  const [toastMsg, setToastMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadMedicines = async () => {
    try {
      const res = await AdminApi.getMedicines()
      const list = res.data?.medicines || res.medicines || (Array.isArray(res) ? res : null)
      if (list && list.length > 0) {
        setMedicines(list)
      }
    } catch (err) {
      console.warn('Using local medicines fallback:', err)
    }
  }

  useEffect(() => {
    loadMedicines()
  }, [])

  const openAddModal = () => {
    setIsEditing(false)
    const newId = `MED-NEW-${(medicines.length + 1).toString().padStart(3, '0')}`
    setMedId(newId)
    setMedName('')
    setMedCategory('General Formulary')
    setMedQty('100')
    setMedUnit('Tablets')
    setMedStatus('Available')
    setModalOpen(true)
  }

  const openEditModal = (med) => {
    setIsEditing(true)
    setMedId(med.id)
    setMedName(med.name)
    setMedCategory(med.category || 'General Formulary')
    setMedQty(med.availableQty?.toString() || '0')
    setMedUnit(med.unit || 'Tablets')
    setMedStatus(parseInt(med.availableQty, 10) > 0 ? 'Available' : 'Out of Stock')
    setModalOpen(true)
  }

  const handleModalSave = async (e) => {
    e.preventDefault()
    if (!medName) {
      alert('Please enter a medicine name')
      return
    }

    setIsSaving(true)
    const qtyNumber = parseInt(medQty, 10) || 0
    const finalStatus = medStatus === 'Out of Stock' || qtyNumber <= 0 ? 'Out of Stock' : 'Available'
    const payload = {
      name: medName,
      category: medCategory,
      availableQty: finalStatus === 'Out of Stock' ? 0 : qtyNumber,
      unit: medUnit,
      status: finalStatus
    }

    try {
      if (isEditing) {
        await AdminApi.updateMedicine(medId, payload)
        setToastMsg('Medicine configuration updated successfully.')
      } else {
        await AdminApi.createMedicine(payload)
        setToastMsg('New medicine added to dispensary stock.')
      }
      await loadMedicines()
    } catch (err) {
      console.warn('AdminApi medicine error (fallback to local):', err)
      if (isEditing) {
        const updated = updateAdminMedicine({
          id: medId,
          ...payload
        })
        setMedicines(updated)
        setToastMsg('Medicine configuration updated successfully.')
      } else {
        const updated = addAdminMedicine({
          id: medId,
          ...payload,
          qty: qtyNumber
        })
        setMedicines(updated)
        setToastMsg('New medicine added to dispensary stock.')
      }
    } finally {
      setIsSaving(false)
      setModalOpen(false)
      setTimeout(() => setToastMsg(''), 4000)
    }
  }

  // Filter medicines
  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          med.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (med.category && med.category.toLowerCase().includes(searchTerm.toLowerCase()))
    if (activeCategory === 'All') return matchesSearch
    if (activeCategory === 'Analgesics') return matchesSearch && (med.category?.toLowerCase().includes('analgesic') || med.name.toLowerCase().includes('paracetamol'))
    if (activeCategory === 'Antibiotics') return matchesSearch && (med.category?.toLowerCase().includes('antibiotic') || med.name.toLowerCase().includes('amox') || med.name.toLowerCase().includes('azi'))
    if (activeCategory === 'Liquid & Syrups') return matchesSearch && (med.unit?.toLowerCase().includes('bottle') || med.name.toLowerCase().includes('syrup'))
    return matchesSearch
  })

  const inStockCount = medicines.filter(m => (m.availableQty || 0) > 0).length
  const ratio = medicines.length > 0 ? Math.round((inStockCount / medicines.length) * 100) : 100
  const outOfStockCount = medicines.length - inStockCount

  return (
    <AdminLayout activeNav="Medicines">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col w-full">
          {/* Top Command & Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link 
                to="/admin/dashboard"
                className="inline-flex items-center gap-1.5 text-[#455f8a] hover:text-[#7c2800] transition-colors font-semibold text-sm group"
                style={{ fontFamily: 'Lexend, sans-serif' }}
              >
                <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                <span>Back to Dashboard</span>
              </Link>
              <span className="text-[#e3bfb2] font-bold text-sm">•</span>
              <span className="text-xs uppercase tracking-widest text-[#58423a] font-semibold">Formulary Master v2.4</span>
            </div>

            {/* Add Medicine Action Button */}
            <button 
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 bg-[#00501a] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-[#1b6b33] transition-all active:scale-98 self-start md:self-auto"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span className="tracking-wide">+ ADD MEDICINE</span>
            </button>
          </div>

          {/* Main Section Header & Metrics Bento Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-stretch">
            {/* Title and Context Summary */}
            <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-[#eceef0]">
              <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#d6e3ff]/20 rounded-full blur-3xl pointer-events-none"></div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d6e3ff]/50 text-[#001b3d] text-xs font-semibold mb-3">
                  <span className="material-symbols-outlined text-[16px] text-[#00501a]">verified</span>
                  <span>National Health Mission Approved Standard</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight leading-tight mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Manage Medicine
                </h1>
                <p className="text-sm sm:text-base text-[#58423a] max-w-2xl leading-relaxed">
                  Central pharmaceutical formulary management for Doctor prescribing and Pharmacy dispensation.
                </p>
              </div>

              {/* Live Quick Stats Row */}
              <div className="grid grid-cols-3 gap-4 pt-6 mt-6 bg-[#f2f4f6] rounded-xl p-4 border border-[#e0e3e5]">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#58423a] uppercase font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Listed Items</span>
                  <span className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {medicines.length} <span className="text-xs font-normal text-[#58423a]">Core SKUs</span>
                  </span>
                </div>
                <div className="flex flex-col border-l border-[#e0e3e5] pl-4">
                  <span className="text-[11px] text-[#58423a] uppercase font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Available Ratio</span>
                  <span className="text-xl font-bold text-[#00501a]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {ratio}% <span className="text-xs font-normal text-[#00501a]">In Stock</span>
                  </span>
                </div>
                <div className="flex flex-col border-l border-[#e0e3e5] pl-4">
                  <span className="text-[11px] text-[#58423a] uppercase font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Replenish Alerts</span>
                  <span className="text-xl font-bold text-[#ba1a1a]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    {outOfStockCount} <span className="text-xs font-normal text-[#ba1a1a]">Items</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sync Network Visual Card */}
            <div className="lg:col-span-4 bg-[#f2f4f6] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm border border-[#e0e3e5]">
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 text-[#00501a] mb-1">
                  <span className="material-symbols-outlined text-[20px]">sync</span>
                  <span className="text-xs tracking-wider uppercase font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Active Sync Network</span>
                </div>
                <span className="text-lg font-bold text-[#191c1e] block" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Central Formulary Connectivity
                </span>
              </div>
              <div className="relative z-10 mt-6">
                <p className="text-xs text-[#58423a] mb-3 leading-relaxed">
                  Automatic distribution syncs stock levels directly across hospital kiosks, Doctor prescribing engines, and pharmacy dispensing points.
                </p>
                <div className="flex items-center gap-2 text-[#00501a] text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#00501a] animate-pulse"></span>
                  <span>Dispensary Nodes Connected (Latency: 14ms)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filtering Strip */}
          <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#eceef0]">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#58423a]">search</span>
              <input 
                className="w-full pl-11 pr-4 py-2 rounded-full bg-[#f2f4f6] text-[#191c1e] text-sm placeholder:text-[#58423a]/70 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7c2800]/20 border border-transparent focus:border-[#7c2800] transition-all" 
                id="formulary-search" 
                placeholder="Search by medicine name, SKU, category..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {['All', 'Analgesics', 'Antibiotics', 'Liquid & Syrups'].map(cat => (
                <button 
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat 
                      ? 'bg-[#ffdbcf] text-[#380d00] shadow-sm font-bold' 
                      : 'bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#58423a]'
                  }`}
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  {cat === 'All' ? 'All Formulations' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Toast Notification */}
          {toastMsg && (
            <div className="mb-6 flex items-center gap-3 bg-[#99f89e] text-[#002106] px-5 py-3 rounded-xl shadow-md transition-all border border-[#00501a]/20">
              <span className="material-symbols-outlined text-[#00501a] text-[22px]">check_circle</span>
              <span className="text-xs font-semibold">{toastMsg}</span>
            </div>
          )}

          {/* Formulary Desktop Table & Card Container */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8 border border-[#eceef0]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f4f6] text-[#58423a] text-xs font-bold uppercase tracking-wider border-b border-[#e0e3e5]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    <th className="py-3 px-6">Medicine Details</th>
                    <th className="py-3 px-4">Medicine ID</th>
                    <th className="py-3 px-4">Therapeutic Category</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0] text-[#191c1e] text-sm">
                  {filteredMedicines.map((med) => {
                    const isAvailable = (med.availableQty || 0) > 0 && med.status !== 'Out of Stock'
                    return (
                      <tr key={med.id} className="hover:bg-[#f8f9fc] transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#f2f4f6] flex items-center justify-center text-[#00501a] shrink-0">
                              <span className="material-symbols-outlined text-[22px]">medication</span>
                            </div>
                            <div>
                              <span className="font-bold text-[#191c1e] block group-hover:text-[#7c2800] transition-colors" style={{ fontFamily: 'Lexend, sans-serif' }}>
                                {med.name}
                              </span>
                              <span className="text-xs text-[#58423a]">Oral Dosage • {med.unit || 'Units'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#f2f4f6] text-[#191c1e] border border-[#e0e3e5]">
                            {med.id}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-medium text-[#191c1e]">
                            {med.category || 'General Formulary'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${isAvailable ? 'text-[#191c1e]' : 'text-[#ba1a1a]'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                              {med.availableQty || 0} {med.unit || 'Units'}
                            </span>
                            <span className={`text-[11px] ${isAvailable ? 'text-[#00501a]' : 'text-[#ba1a1a]'}`}>
                              {isAvailable ? 'Sufficient Supply' : 'Critical Reorder Required'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            isAvailable 
                              ? 'bg-[#99f89e] text-[#002106]' 
                              : 'bg-[#ffdad6] text-[#93000a]'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-[#00501a]' : 'bg-[#ba1a1a]'}`}></span>
                            <span>{isAvailable ? 'Available' : 'Out of Stock'}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            type="button"
                            onClick={() => openEditModal(med)}
                            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white hover:bg-[#f2f4f6] text-[#455f8a] hover:text-[#191c1e] text-xs font-bold shadow-sm transition-all border border-[#e0e3e5] active:scale-95"
                            style={{ fontFamily: 'Lexend, sans-serif' }}
                          >
                            <span className="material-symbols-outlined text-[16px] mr-1">edit</span>
                            <span>EDIT</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredMedicines.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-sm text-[#58423a]">
                        No medicines match the search or filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add / Edit Medicine Modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 border border-[#eceef0]">
                <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00501a] text-[24px]">
                      {isEditing ? 'edit_document' : 'add_circle'}
                    </span>
                    <h3 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      {isEditing ? 'Edit Medicine Formulation' : 'Add Formulary Medicine'}
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
                      Medicine Name *
                    </label>
                    <input 
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f2f4f6] text-sm text-[#191c1e] outline-none border border-[#e0e3e5] focus:bg-white focus:border-[#7c2800]"
                      type="text" 
                      required
                      placeholder="e.g. Paracetamol 650mg Tablet"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Medicine ID
                      </label>
                      <input 
                        className="w-full px-4 py-2.5 rounded-lg bg-[#f2f4f6] text-sm font-mono text-[#58423a] outline-none border border-[#e0e3e5]"
                        type="text" 
                        readOnly
                        value={medId}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Category
                      </label>
                      <input 
                        className="w-full px-4 py-2.5 rounded-lg bg-[#f2f4f6] text-sm text-[#191c1e] outline-none border border-[#e0e3e5] focus:bg-white focus:border-[#7c2800]"
                        type="text" 
                        placeholder="e.g. Analgesic"
                        value={medCategory}
                        onChange={(e) => setMedCategory(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Available Quantity *
                      </label>
                      <input 
                        className="w-full px-4 py-2.5 rounded-lg bg-[#f2f4f6] text-sm text-[#191c1e] outline-none border border-[#e0e3e5] focus:bg-white focus:border-[#7c2800]"
                        type="number" 
                        min="0"
                        required
                        value={medQty}
                        onChange={(e) => setMedQty(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        Availability Status
                      </label>
                      <select 
                        className="w-full px-4 py-2.5 rounded-lg bg-[#f2f4f6] text-sm text-[#191c1e] outline-none border border-[#e0e3e5] focus:bg-white"
                        value={medStatus}
                        onChange={(e) => setMedStatus(e.target.value)}
                      >
                        <option value="Available">Available</option>
                        <option value="Out of Stock">Out of Stock</option>
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
