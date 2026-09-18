import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PharmacyLayout from '../../components/layout/PharmacyLayout'
import { addPharmacyMedicine, getPharmacyStock } from '../../data/patientMockData'
import { PrescriptionApi } from '../../services/prescriptionApi'

export default function AddMedicinePage() {
  const navigate = useNavigate()
  const [medName, setMedName] = useState('')
  const [medId, setMedId] = useState('')
  const [medQty, setMedQty] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const currentStock = getPharmacyStock()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!medName.trim() || !medQty) {
      alert('Please fill in Medicine Name and Available Quantity')
      return
    }

    const payload = {
      name: medName.trim(),
      id: medId.trim() || `MED-${Date.now().toString().slice(-4)}`,
      availableQty: parseInt(medQty, 10),
      quantity: parseInt(medQty, 10)
    }

    try {
      await PrescriptionApi.addPharmacyStock(payload)
    } catch (err) {
      console.warn('Backend add stock warning:', err)
    }

    addPharmacyMedicine({
      name: medName.trim(),
      id: payload.id,
      qty: medQty
    })

    setIsSuccess(true)
    setTimeout(() => {
      navigate('/pharmacy/dashboard')
    }, 1200)
  }

  return (
    <PharmacyLayout activeNav="Dashboard">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Navigation back */}
        <div>
          <Link 
            to="/pharmacy/dashboard" 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#455f8a] hover:text-[#191c1e] transition-colors py-1 px-3 -ml-3 rounded-full hover:bg-slate-100"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#7c2800]" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Stock Formulary Registry
          </span>
          <h1 className="text-3xl font-bold text-[#191c1e] mt-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Add Medicine
          </h1>
          <p className="text-sm text-[#58423a] mt-1">
            Register new pharmaceutical stock into the hospital pharmacy inventory.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center py-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <h3 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Stock Added Successfully
              </h3>
              <p className="text-sm text-[#58423a] mt-1">
                {medName} has been registered to the active pharmacy stock list. Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-sm font-semibold text-[#191c1e]" htmlFor="medicineName" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Medicine Name
                </label>
                <input 
                  id="medicineName" 
                  type="text" 
                  required 
                  placeholder="e.g. Paracetamol 500mg Tablet"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full h-12 px-4 bg-[#f2f4f6] text-[#191c1e] text-base rounded-xl transition-colors focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00501a] border border-transparent" 
                />
                <span className="text-xs text-[#58423a]">Include salt formulation and dosage strength</span>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-sm font-semibold text-[#191c1e]" htmlFor="medicineId" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Medicine ID
                </label>
                <input 
                  id="medicineId" 
                  type="text" 
                  required 
                  placeholder="e.g. MED-PARA-500"
                  value={medId}
                  onChange={(e) => setMedId(e.target.value)}
                  className="w-full h-12 px-4 bg-[#f2f4f6] text-[#191c1e] text-base rounded-xl transition-colors focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00501a] border border-transparent uppercase tracking-wider" 
                />
                <span className="text-xs text-[#58423a]">Unique hospital formulary code</span>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-sm font-semibold text-[#191c1e]" htmlFor="medicineQty" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Available Quantity
                </label>
                <input 
                  id="medicineQty" 
                  type="number" 
                  min="1" 
                  required 
                  placeholder="e.g. 500"
                  value={medQty}
                  onChange={(e) => setMedQty(e.target.value)}
                  className="w-full h-12 px-4 bg-[#f2f4f6] text-[#191c1e] text-base rounded-xl transition-colors focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00501a] border border-transparent" 
                />
                <span className="text-xs text-[#58423a]">Number of units or packaging strips in dispensary storage</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Link 
                  to="/pharmacy/dashboard" 
                  className="h-12 px-6 rounded-full bg-[#eceef0] text-[#191c1e] text-sm font-semibold flex items-center justify-center btn-press"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  className="h-12 px-8 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-sm font-semibold shadow-md flex items-center gap-2 cursor-pointer btn-press"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span>ADD TO INVENTORY</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Existing Formulary Preview */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-[#191c1e] mb-3" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Active Stock Formulary ({currentStock.length} Medicines)
          </h3>
          <div className="divide-y divide-slate-100">
            {currentStock.slice(0, 5).map((med) => (
              <div key={med.id} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-[#191c1e]">{med.name}</span>
                  <span className="text-xs text-[#58423a] block font-mono">ID: {med.id}</span>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-[#166534] px-2.5 py-1 rounded-full">
                  {med.availableQty} Available
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PharmacyLayout>
  )
}
