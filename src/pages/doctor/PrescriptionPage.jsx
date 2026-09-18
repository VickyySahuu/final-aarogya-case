import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import PatientQrCode from '../../components/common/PatientQrCode'
import { getPatientProfile, saveDoctorPrescription } from '../../data/patientMockData'
import { PrescriptionApi } from '../../services/prescriptionApi'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'

const AVAILABLE_MEDICINES = [
  { 
    name: 'Amoxicillin 500mg Capsule', 
    type: 'Antibiotic', 
    defaultDosage: '1 Capsule (500mg)', 
    defaultFrequency: 'TDS (1-1-1)', 
    defaultDuration: '5 Days', 
    defaultInstructions: 'Take after meals. Complete full antibiotic course.' 
  },
  { 
    name: 'Paracetamol 650mg Tablet', 
    type: 'Antipyretic / Analgesic', 
    defaultDosage: '1 Tablet (650mg)', 
    defaultFrequency: 'TDS (1-1-1) SOS', 
    defaultDuration: '3 Days', 
    defaultInstructions: 'Take after food for fever >100°F. Max 3 tablets/day.' 
  },
  { 
    name: 'Azithromycin 500mg Tablet', 
    type: 'Antibiotic', 
    defaultDosage: '1 Tablet (500mg)', 
    defaultFrequency: 'OD (1-0-0)', 
    defaultDuration: '3 Days', 
    defaultInstructions: 'Take 1 hour before or 2 hours after meals.' 
  },
  { 
    name: 'Cetirizine 10mg Tablet', 
    type: 'Antihistamine', 
    defaultDosage: '1 Tablet (10mg)', 
    defaultFrequency: 'HS (0-0-1)', 
    defaultDuration: '5 Days', 
    defaultInstructions: 'Take at bedtime. May cause mild drowsiness.' 
  },
  { 
    name: 'Pantoprazole 40mg Tablet', 
    type: 'Antacid / PPI', 
    defaultDosage: '1 Tablet (40mg)', 
    defaultFrequency: 'OD (1-0-0)', 
    defaultDuration: '7 Days', 
    defaultInstructions: 'Take 30 mins before breakfast on empty stomach.' 
  },
  { 
    name: 'Ibuprofen 400mg Tablet', 
    type: 'NSAID / Pain Relief', 
    defaultDosage: '1 Tablet (400mg)', 
    defaultFrequency: 'BD (1-0-1)', 
    defaultDuration: '3 Days', 
    defaultInstructions: 'Take strictly with food or milk. Do not take on empty stomach.' 
  },
  { 
    name: 'Metformin 500mg Tablet', 
    type: 'Antidiabetic', 
    defaultDosage: '1 Tablet (500mg)', 
    defaultFrequency: 'BD (1-0-1)', 
    defaultDuration: '30 Days', 
    defaultInstructions: 'Take with meals. Monitor regular blood sugar levels.' 
  },
  { 
    name: 'Amlodipine 5mg Tablet', 
    type: 'Antihypertensive', 
    defaultDosage: '1 Tablet (5mg)', 
    defaultFrequency: 'OD (1-0-0)', 
    defaultDuration: '30 Days', 
    defaultInstructions: 'Take same time every morning. Log blood pressure weekly.' 
  },
  { 
    name: 'ORS Sachet (Oral Rehydration Salts)', 
    type: 'Electrolyte', 
    defaultDosage: '1 Sachet in 1L water', 
    defaultFrequency: 'SOS (Frequent sips)', 
    defaultDuration: '3 Days', 
    defaultInstructions: 'Dissolve in 1L boiled & cooled water. Sip throughout day.' 
  },
  { 
    name: 'Betadine Gargle 2% (100ml)', 
    type: 'Antiseptic', 
    defaultDosage: '10ml diluted', 
    defaultFrequency: 'BD (1-0-1)', 
    defaultDuration: '5 Days', 
    defaultInstructions: 'Dilute with equal parts warm water. Gargle 30 seconds.' 
  },
]

const POPULAR_MED_PRESETS = [
  {
    label: 'Paracetamol 650mg',
    icon: 'medication',
    data: {
      medicine: 'Paracetamol 650mg Tablet',
      dosage: '1 Tablet (650mg)',
      frequency: 'TDS (1-1-1) SOS',
      duration: '3 Days',
      instructions: 'Take after food for fever >100°F. Max 3 tablets/day.'
    }
  },
  {
    label: 'Amoxicillin 500mg',
    icon: 'medication',
    data: {
      medicine: 'Amoxicillin 500mg Capsule',
      dosage: '1 Capsule (500mg)',
      frequency: 'TDS (1-1-1)',
      duration: '5 Days',
      instructions: 'Take after meals. Complete full antibiotic course.'
    }
  },
  {
    label: 'Azithromycin 500mg',
    icon: 'medication',
    data: {
      medicine: 'Azithromycin 500mg Tablet',
      dosage: '1 Tablet (500mg)',
      frequency: 'OD (1-0-0)',
      duration: '3 Days',
      instructions: 'Take 1 hour before or 2 hours after meals.'
    }
  },
  {
    label: 'Cetirizine 10mg',
    icon: 'vaccines',
    data: {
      medicine: 'Cetirizine 10mg Tablet',
      dosage: '1 Tablet (10mg)',
      frequency: 'HS (0-0-1)',
      duration: '5 Days',
      instructions: 'Take at bedtime. May cause mild drowsiness.'
    }
  },
  {
    label: 'Pantoprazole 40mg',
    icon: 'science',
    data: {
      medicine: 'Pantoprazole 40mg Tablet',
      dosage: '1 Tablet (40mg)',
      frequency: 'OD (1-0-0)',
      duration: '7 Days',
      instructions: 'Take 30 mins before breakfast on empty stomach.'
    }
  },
  {
    label: 'ORS Sachet',
    icon: 'water_drop',
    data: {
      medicine: 'ORS Sachet (Oral Rehydration Salts)',
      dosage: '1 Sachet in 1L water',
      frequency: 'SOS (Frequent sips)',
      duration: '3 Days',
      instructions: 'Dissolve in 1L boiled & cooled water. Sip after loose stools.'
    }
  },
  {
    label: 'Ibuprofen 400mg',
    icon: 'healing',
    data: {
      medicine: 'Ibuprofen 400mg Tablet',
      dosage: '1 Tablet (400mg)',
      frequency: 'BD (1-0-1)',
      duration: '3 Days',
      instructions: 'Take strictly with food or milk. Do not take on empty stomach.'
    }
  }
]

const DOSAGE_OPTIONS = [
  '1 Tablet (500mg)',
  '1 Tablet (650mg)',
  '1 Capsule (500mg)',
  '1 Capsule (250mg)',
  '5ml (1 teaspoon)',
  '10ml (2 teaspoons)',
  '15ml (1 tablespoon)',
  '1 Sachet in 1L water',
  '1 Puff / Spray',
  '2 Puffs / Sprays',
  'Apply thin film locally'
]

const FREQUENCY_OPTIONS = [
  'OD (1-0-0) — Once Daily',
  'BD (1-0-1) — Twice Daily',
  'TDS (1-1-1) — Thrice Daily',
  'QID (1-1-1-1) — Four Times Daily',
  'HS (0-0-1) — At Bedtime',
  'SOS — As Needed / When Required',
  'Every 8 Hours',
  'Every 12 Hours',
  'Weekly (Once a week)'
]

const DURATION_OPTIONS = [
  '3 Days',
  '5 Days',
  '7 Days',
  '10 Days',
  '14 Days',
  '1 Month (30 Days)',
  '2 Months (60 Days)',
  '3 Months (90 Days)',
  'SOS (Until Symptoms Subside)'
]

const INSTRUCTION_OPTIONS = [
  'Take after meals with water',
  'Take 30 mins before breakfast on empty stomach',
  'Take at bedtime. May cause drowsiness',
  'Complete the entire prescribed antibiotic course',
  'Take strictly with food or milk. Do not skip meals',
  'Dissolve in 1L water and sip throughout the day',
  'Rinse mouth thoroughly with water after use',
  'Avoid cold beverages and sour foods'
]

export default function PrescriptionPage() {
  const location = useLocation()
  let cached = null
  try {
    const raw = sessionStorage.getItem('aarogya_doctor_active_patient')
    if (raw) cached = JSON.parse(raw)
  } catch (e) {}

  const opdPatient = location.state?.patient || cached || null
  const defaultProfile = getPatientProfile()

  const [step, setStep] = useState('compose') // 'compose' | 'select' | 'review' | 'issued'
  const [medicines, setMedicines] = useState([])
  const [searchMed, setSearchMed] = useState('')
  const [newMed, setNewMed] = useState({ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' })
  const [catalog, setCatalog] = useState(AVAILABLE_MEDICINES.map(m => ({ name: m.name, category: m.type, stock: 'In Stock' })))

  const [isProcessing, setIsProcessing] = useState(false)
  const [rxNumber, setRxNumber] = useState('RX-2026-000001')

  const patientName = opdPatient?.name || (opdPatient?.id ? `Patient #${opdPatient.id}` : defaultProfile.name)
  const patientId = opdPatient?.id || defaultProfile.patientId
  const patientUniqueCode = opdPatient?.uniqueCode || opdPatient?.patientUniqueCode || defaultProfile.patientUniqueCode || 'AC-7F42K9'

  const doctorName = 'Dr. Ramanathan Venkatraman'
  const doctorId = 'DOC-1042'
  const roomNumber = 'Room 104'
  const tokenNumber = opdPatient ? (typeof opdPatient.token === 'number' ? `#${opdPatient.token}` : (opdPatient.token || opdPatient.tokenNumber || '#14')) : '#14'

  const patient = {
    ...opdPatient,
    name: patientName,
    id: patientId,
    patientId: patientId,
    uniqueCode: patientUniqueCode,
    token: tokenNumber
  }

  useEffect(() => {
    PrescriptionApi.getMedicinesCatalog().then(meds => {
      if (Array.isArray(meds) && meds.length > 0) {
        setCatalog(meds.map(m => ({ name: m.name, category: m.category || 'General Formulary', stock: m.status || 'In Stock' })))
      }
    }).catch(() => {})
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleIssue = async () => {
    if (medicines.length === 0) {
      alert('Please select and add at least one medication before issuing the prescription.')
      return
    }
    if (isProcessing) return
    setIsProcessing(true)

    let finalRxNumber = rxNumber

    try {
      const payload = {
        patientId: opdPatient?.patientDbId || opdPatient?.id || patientId,
        patientUniqueCode: patientUniqueCode,
        appointmentId: opdPatient?.appointmentId || opdPatient?.id || 1,
        caseId: opdPatient?.caseDetails?.id || opdPatient?.caseId || opdPatient?.id || 1,
        diagnosis: opdPatient?.problem || opdPatient?.chiefComplaint || 'Acute Viral Pharyngitis with Mild Pyrexia',
        icdCode: 'ICD-10: J02.9',
        vitals: 'BP 124/82 · Temp 99.4°F · Pulse 78 bpm · SpO2 98%',
        medicines: medicines.map(m => ({
          medicineName: m.medicine,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions || 'Take after meals'
        }))
      }

      const res = await PrescriptionApi.createPrescription(payload)
      if (res.ok && res.data?.prescription) {
        finalRxNumber = res.data.prescription.prescriptionNumber || res.data.prescription.rxNumber || res.data.prescription.rx_number || finalRxNumber
        setRxNumber(finalRxNumber)
      } else {
        // Fallback demo rx number if offline
        finalRxNumber = `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`
        setRxNumber(finalRxNumber)
      }
    } catch (err) {
      console.warn('[PrescriptionPage] Backend call failed, using local demo prescription:', err.message)
      finalRxNumber = `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`
      setRxNumber(finalRxNumber)
    }

    saveDoctorPrescription({
      id: finalRxNumber,
      rxNumber: finalRxNumber,
      token: tokenNumber,
      date: 'Today',
      doctorName: doctorName,
      doctorId: doctorId,
      department: 'General Medicine',
      roomNumber: roomNumber,
      hospitalName: 'District Civil Hospital',
      hospitalLocation: 'Civil Lines, Sector 4, New Delhi',
      patientName: patientName,
      patientId: patientId,
      patientAge: opdPatient?.age || `${defaultProfile.age} Yrs / ${defaultProfile.gender}`,
      patientGender: defaultProfile.gender,
      patientUniqueCode: patientUniqueCode,
      patientAddress: defaultProfile.address,
      diagnosis: opdPatient?.problem || opdPatient?.chiefComplaint || 'Acute Viral Pharyngitis with Mild Pyrexia',
      icdCode: 'ICD-10: J02.9',
      vitals: 'BP 124/82 · Temp 99.4°F · Pulse 78 bpm · SpO2 98%',
      pharmacyStatus: 'Sent',
      patientAccess: 'Available',
      medicines: medicines.map(m => ({
        name: m.medicine,
        category: 'Prescription Medication',
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions
      })),
      dietaryAdvice: 'Consume lukewarm fluids, salt-water gargle thrice daily, avoid refrigerated liquids.',
      nextReview: 'Review in OPD after 5 days if symptoms persist.'
    })

    setIsProcessing(false)
    setStep('issued')
  }

  const addMedicine = (name) => {
    const found = AVAILABLE_MEDICINES.find(m => m.name.toLowerCase() === name.toLowerCase() || m.name.toLowerCase().startsWith(name.toLowerCase()))
    if (found) {
      setNewMed({
        medicine: found.name,
        dosage: found.defaultDosage || '1 Tablet (500mg)',
        frequency: found.defaultFrequency || 'BD (1-0-1)',
        duration: found.defaultDuration || '5 Days',
        instructions: found.defaultInstructions || 'Take after meals'
      })
    } else {
      setNewMed({
        medicine: name,
        dosage: '1 Tablet (500mg)',
        frequency: 'BD (1-0-1)',
        duration: '5 Days',
        instructions: 'Take after meals'
      })
    }
    setStep('compose')
  }

  const applyMedPreset = (preset) => {
    setNewMed({ ...preset.data })
  }

  const addNewMedToList = () => {
    if (!newMed.medicine.trim()) {
      alert('Please enter or select a medicine name.')
      return
    }
    if (!newMed.dosage.trim()) {
      alert('Please enter or select a dosage.')
      return
    }
    if (!newMed.frequency.trim()) {
      alert('Please enter or select a frequency.')
      return
    }
    if (!newMed.duration.trim()) {
      alert('Please enter or select a duration.')
      return
    }

    setMedicines([...medicines, { ...newMed }])
    setNewMed({ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' })
  }

  const removeMedicine = (idx) => setMedicines(medicines.filter((_, i) => i !== idx))

  const filteredCatalog = catalog.filter(m => !searchMed || m.name.toLowerCase().includes(searchMed.toLowerCase()) || (m.category || '').toLowerCase().includes(searchMed.toLowerCase()))

  return (
    <DoctorLayout 
      activeNav="Prescriptions" 
      showPatientContext 
      patientName={patient.name}
      patientAge={patient.age || opdPatient?.age}
      patientToken={patient.token}
      patientUniqueCode={patient.uniqueCode}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 bg-white shadow-sm">
        <nav className="flex items-center gap-2 text-xs text-[#58423a] font-semibold flex-wrap" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <Link to="/doctor/dashboard" className="hover:text-[#7c2800] flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">home</span>Doctor Portal</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <Link to="/doctor/patient-case" className="hover:text-[#7c2800]">Patient Case</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <span className="text-[#7c2800] font-bold">e-Prescription</span>
        </nav>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Patient Context Banner */}
        <div className="w-full rounded-2xl bg-white shadow-sm p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#ffdbcf] flex items-center justify-center text-[#380d00] text-2xl font-bold shadow-inner" style={{ fontFamily: 'Lexend, sans-serif' }}>RS</div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#00501a] rounded-full shadow-sm ring-2 ring-white"></span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Lexend, sans-serif' }}>{patientName}</h1>
                <span className="px-3 py-1 rounded-full bg-[#a43700] text-white text-xs font-semibold tracking-wide uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>Token {tokenNumber} (OPD Priority Queue)</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap text-base text-[#58423a]">
                <span className="font-semibold text-[#191c1e]">ID: {patientId}</span>
                <span className="text-[#dfc0b5]">•</span>
                <span>Male, 48 Yrs</span>
                <span className="text-[#dfc0b5]">•</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px] text-[#00501a]">fingerprint</span>ABHA ID: <strong className="text-[#191c1e] font-semibold">91-8273-1092-4410</strong></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#9bf79f] text-[#00531b] text-[15px] font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00501a] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00501a]"></span>
              </span>
              Active Consultation • In Progress
            </div>
          </div>
        </div>

        {step === 'issued' ? (
          /* Prescription Issued */
          <div className="flex flex-col gap-6">
            {/* Screen UI Confirmation */}
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm text-center no-print">
              <div className="w-20 h-20 rounded-full bg-[#9bf79f] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[#00501a] text-4xl">check_circle</span>
              </div>
              <h2 className="text-2xl font-bold text-[#191c1e] mb-1" style={{ fontFamily: 'Lexend, sans-serif' }}>Prescription Issued Successfully</h2>
              <p className="text-base text-[#58423a] mb-6">e-Prescription {rxNumber} has been digitally authorized and dispatched to hospital pharmacy.</p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="h-14 px-8 bg-[#166534] hover:bg-[#14532d] text-white rounded-full text-[15px] font-bold flex items-center gap-2 shadow-md cursor-pointer btn-press"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  <span className="material-symbols-outlined">print</span>
                  <span>PRINT PRESCRIPTION</span>
                </button>
                <Link to="/doctor/final-approval" state={{ patient }} className="h-14 px-8 bg-[#00501a] text-white rounded-full text-[15px] font-semibold shadow-md flex items-center gap-2 btn-press" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="material-symbols-outlined">task_alt</span>Final Approval
                </Link>
                <Link to="/doctor/patient-case" state={{ patient }} className="h-14 px-8 bg-[#eceef0] text-[#191c1e] rounded-full text-[15px] font-semibold flex items-center gap-2 btn-press" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="material-symbols-outlined">arrow_back</span>Back to Patient Workspace
                </Link>
              </div>
            </div>

            {/* Printable Prescription Document (Clean A4 Sheet) */}
            <div className="printable-document bg-white border border-slate-300 rounded-2xl p-8 sm:p-10 shadow-sm text-left">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-[#166534] pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <img src={officialEmblem} alt="AAROGYA CASE Official Emblem" className="h-12 w-auto object-contain shrink-0" />
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      AAROGYA CASE
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Outpatient Medical Prescription
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Document Number</span>
                  <span className="text-base font-mono font-bold text-[#166534]">{rxNumber}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Patient & Doctor Demographics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient Details</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{patientName}</p>
                  <p className="text-slate-500 font-mono">ID: {patientId}</p>
                  <p className="text-slate-700 font-mono text-[11px]">Unique Code: <strong className="text-[#166534]">{patientUniqueCode}</strong></p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Doctor Details</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{doctorName}</p>
                  <p className="text-slate-500 font-mono">ID: {doctorId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Hospital / Center</span>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">District Civil Hospital</p>
                  <p className="text-slate-500">General Medicine</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Room & Token</span>
                  <p className="font-bold text-[#166534] text-sm mt-0.5">{roomNumber}</p>
                  <p className="text-slate-700 font-bold">Token: {tokenNumber}</p>
                </div>
              </div>

              {/* Medicine Table */}
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Rx • Prescribed Medication Regimen
                </span>
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Medicine Name</th>
                      <th className="p-3">Dosage</th>
                      <th className="p-3">Frequency</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {medicines.map((m, i) => (
                      <tr key={i}>
                        <td className="p-3 font-mono font-bold text-slate-400">0{i + 1}</td>
                        <td className="p-3 font-semibold text-slate-900">{m.medicine}</td>
                        <td className="p-3">{m.dosage}</td>
                        <td className="p-3 font-bold text-[#166534]">{m.frequency}</td>
                        <td className="p-3">{m.duration}</td>
                        <td className="p-3 text-slate-600 italic">{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions and Advice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Clinical Instructions</span>
                  <p className="text-slate-800 leading-relaxed">
                    Take medicines strictly as prescribed after meals. Complete the entire antimicrobial course. Report immediately in case of hypersensitivity or rash.
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Dietary Advice & Review</span>
                  <p className="text-slate-800 leading-relaxed">
                    Consume lukewarm fluids, salt-water gargle thrice daily, avoid refrigerated beverages. Review in OPD after 5 days if symptoms persist.
                  </p>
                </div>
              </div>

              {/* Doctor Approval, QR Code & Status */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Document Status</span>
                  <span className="inline-block px-3 py-1 rounded bg-emerald-100 text-[#166534] font-bold text-xs mt-1">
                    Digitally Authorized e-Prescription
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2">Dispatched to District Civil Hospital Pharmacy</p>
                </div>

                {/* QR Code */}
                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-300 rounded-lg shrink-0">
                  <PatientQrCode code={patientUniqueCode} size={68} showLabel={false} />
                  <span className="text-[8px] font-mono text-[#166534] mt-1 font-bold">{patientUniqueCode}</span>
                </div>

                <div className="text-right">
                  <div className="w-48 border-b border-slate-400 mb-2 ml-auto"></div>
                  <p className="font-bold text-slate-900">{doctorName}</p>
                  <p className="text-slate-500">{doctorId} • {roomNumber}</p>
                  <p className="text-[10px] text-slate-400 italic mt-1">Attending Medical Officer Signature</p>
                </div>
              </div>

              {/* Authenticity Footer */}
              <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400">
                AAROGYA CASE Prototype Demonstration • Verified Clinical Outpatient Prescription Record • Single-Page Medical Document
              </div>
            </div>
          </div>
        ) : step === 'review' ? (
          /* Review Prescription */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 pt-8 pb-4 bg-[#f2f4f6]">
              <h2 className="text-xl font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Review Prescription</h2>
              <p className="text-sm text-[#58423a] mt-1">Verify all medicines, dosages, and instructions before issuing.</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-[#f2f4f6] rounded-xl"><span className="text-xs text-[#58423a] uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Rx Number</span><p className="text-[15px] font-bold text-[#191c1e] mt-1">{rxNumber}</p></div>
                <div className="p-3 bg-[#f2f4f6] rounded-xl"><span className="text-xs text-[#58423a] uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Patient</span><p className="text-[15px] font-bold text-[#191c1e] mt-1">{patientName}</p></div>
                <div className="p-3 bg-[#f2f4f6] rounded-xl"><span className="text-xs text-[#58423a] uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Doctor</span><p className="text-[15px] font-bold text-[#191c1e] mt-1">{doctorName}</p></div>
                <div className="p-3 bg-[#f2f4f6] rounded-xl"><span className="text-xs text-[#58423a] uppercase font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Room</span><p className="text-[15px] font-bold text-[#191c1e] mt-1">{roomNumber} • Token {tokenNumber}</p></div>
              </div>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left">
                  <thead><tr className="bg-[#f2f4f6] text-xs text-[#58423a] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}><th className="py-3 px-4">#</th><th className="py-3 px-4">Medicine</th><th className="py-3 px-4">Dosage</th><th className="py-3 px-4">Frequency</th><th className="py-3 px-4">Duration</th><th className="py-3 px-4">Instructions</th></tr></thead>
                  <tbody>{medicines.map((m, i) => (<tr key={i} className="border-b border-[#eceef0]"><td className="py-3 px-4 text-sm font-bold">{i+1}</td><td className="py-3 px-4 text-[15px] font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>{m.medicine}</td><td className="py-3 px-4 text-sm">{m.dosage}</td><td className="py-3 px-4 text-sm">{m.frequency}</td><td className="py-3 px-4 text-sm">{m.duration}</td><td className="py-3 px-4 text-sm text-[#58423a]">{m.instructions}</td></tr>))}</tbody>
                </table>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#eceef0]">
                <button onClick={() => setStep('compose')} className="h-12 px-6 bg-[#eceef0] text-[#191c1e] rounded-full text-[15px] font-semibold btn-press" style={{ fontFamily: 'Lexend, sans-serif' }}>Edit Prescription</button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleIssue}
                  className={`h-12 px-8 text-white rounded-full text-[15px] font-semibold shadow-md flex items-center gap-2 cursor-pointer btn-press ${
                    isProcessing ? 'bg-[#00501a]/70 cursor-wait' : 'bg-[#00501a] hover:bg-[#003812]'
                  }`}
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  {isProcessing ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>ISSUING e-PRESCRIPTION...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">verified</span>
                      <span>ISSUE e-PRESCRIPTION</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : step === 'select' ? (
          /* Select Medicine from Catalog */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 pt-8 pb-4 bg-[#f2f4f6] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Select Medicine — Hospital Pharmacy Catalog</h2>
                <p className="text-sm text-[#58423a] mt-1">Choose medicines from the hospital pharmacy stock list</p>
              </div>
              <button onClick={() => setStep('compose')} className="px-4 py-2 bg-white rounded-full text-[15px] font-semibold text-[#191c1e] flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>Back
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="relative w-full max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8f7066]">search</span>
                <input className="w-full h-11 pl-11 pr-4 bg-[#f2f4f6] rounded-full text-sm focus:outline-none focus:bg-white shadow-inner" placeholder="Search medicines..." value={searchMed} onChange={e => setSearchMed(e.target.value)} />
              </div>
              <div className="flex flex-col gap-3">
                {filteredCatalog.map(m => (
                  <button key={m.name} onClick={() => addMedicine(m.name)} className="p-4 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] transition-colors text-left flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-[#00501a]">medication</span>
                      <div>
                        <p className="text-[15px] font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>{m.name}</p>
                        <p className="text-sm text-[#58423a]">{m.category}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${m.stock === 'In Stock' ? 'bg-[#9bf79f] text-[#00531b]' : 'bg-[#ffdbcf] text-[#380d00]'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>{m.stock}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Compose Prescription */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 pt-8 pb-4 bg-[#f2f4f6] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#58423a] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}>e-Prescription</span>
                  <span className="px-3 py-1 rounded-full bg-white text-[#191c1e] text-xs font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>{rxNumber}</span>
                </div>
                <h2 className="text-xl font-semibold text-[#191c1e] mt-2" style={{ fontFamily: 'Lexend, sans-serif' }}>Prescription — {patientName}</h2>
              </div>
              <div className="text-sm text-[#58423a]"><strong>{doctorName}</strong> • {roomNumber} • Token {tokenNumber}</div>
            </div>
            <div className="p-8 space-y-6">
              {/* Current Medicines */}
              {medicines.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="bg-[#f2f4f6] text-xs text-[#58423a] uppercase tracking-wider" style={{ fontFamily: 'Lexend, sans-serif' }}><th className="py-3 px-4">#</th><th className="py-3 px-4">Medicine</th><th className="py-3 px-4">Dosage</th><th className="py-3 px-4">Frequency</th><th className="py-3 px-4">Duration</th><th className="py-3 px-4">Instructions</th><th className="py-3 px-4"></th></tr></thead>
                    <tbody>{medicines.map((m, i) => (<tr key={i} className="border-b border-[#eceef0]"><td className="py-3 px-4 text-sm font-bold">{i+1}</td><td className="py-3 px-4 text-[15px] font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>{m.medicine}</td><td className="py-3 px-4 text-sm">{m.dosage}</td><td className="py-3 px-4 text-sm">{m.frequency}</td><td className="py-3 px-4 text-sm">{m.duration}</td><td className="py-3 px-4 text-sm text-[#58423a]">{m.instructions}</td><td className="py-3 px-4"><button onClick={() => removeMedicine(i)} className="text-[#ba1a1a] hover:text-[#93000a]"><span className="material-symbols-outlined text-[18px]">delete</span></button></td></tr>))}</tbody>
                  </table>
                </div>
              )}

              {/* Add Medicine Form */}
              <div className="p-6 sm:p-7 bg-[#f8fafc] rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-[#191c1e] flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      <span className="material-symbols-outlined text-[#00501a] text-[22px]">medication</span>
                      Prescribe Medication
                    </h3>
                    <p className="text-xs text-[#58423a] mt-0.5">
                      Choose from pre-selected menus & chips, or write custom dosages, frequencies, and durations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => setStep('select')} 
                      className="px-4 py-2 bg-[#455f8a] hover:bg-[#344b70] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer" 
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-[16px]">search</span>
                      Browse Hospital Catalog
                    </button>
                    {(newMed.medicine || newMed.dosage || newMed.frequency || newMed.duration || newMed.instructions) && (
                      <button
                        type="button"
                        onClick={() => setNewMed({ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' })}
                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        title="Clear all fields"
                      >
                        Clear Form
                      </button>
                    )}
                  </div>
                </div>

                {/* 1-Click Popular Medication Presets Strip */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      <span className="material-symbols-outlined text-[16px] text-emerald-700">bolt</span>
                      Quick 1-Click Common Prescriptions (Auto-fills all fields):
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold hidden sm:inline">Click to pre-fill</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {POPULAR_MED_PRESETS.map((preset, pIdx) => {
                      const isMatch = newMed.medicine === preset.data.medicine
                      return (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => applyMedPreset(preset)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                            isMatch
                              ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400'
                              : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-2xs'
                          }`}
                          style={{ fontFamily: 'Lexend, sans-serif' }}
                        >
                          <span className="material-symbols-outlined text-[15px]">{preset.icon}</span>
                          <span>{preset.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Datalists for browser autocomplete */}
                <datalist id="rx-medicine-datalist">
                  {AVAILABLE_MEDICINES.map((m, i) => (
                    <option key={i} value={m.name} />
                  ))}
                </datalist>
                <datalist id="rx-dosage-datalist">
                  {DOSAGE_OPTIONS.map((d, i) => (
                    <option key={i} value={d} />
                  ))}
                </datalist>
                <datalist id="rx-frequency-datalist">
                  {FREQUENCY_OPTIONS.map((f, i) => (
                    <option key={i} value={f} />
                  ))}
                </datalist>
                <datalist id="rx-duration-datalist">
                  {DURATION_OPTIONS.map((d, i) => (
                    <option key={i} value={d} />
                  ))}
                </datalist>
                <datalist id="rx-instructions-datalist">
                  {INSTRUCTION_OPTIONS.map((ins, i) => (
                    <option key={i} value={ins} />
                  ))}
                </datalist>

                {/* 4 Core Fields Grid: Medicine, Dosage, Frequency, Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Medicine Name Field */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span className="material-symbols-outlined text-[17px] text-[#00501a]">medication</span>
                        Medicine Name
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addMedicine(e.target.value)
                            e.target.value = ''
                          }
                        }}
                        defaultValue=""
                        className="text-[11px] max-w-[120px] sm:max-w-none bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-medium hover:border-emerald-500 cursor-pointer truncate"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <option value="" disabled>Pre-select...</option>
                        {AVAILABLE_MEDICINES.map((m, idx) => (
                          <option key={idx} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      list="rx-medicine-datalist"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-all"
                      placeholder="e.g. Paracetamol 650mg"
                      value={newMed.medicine}
                      onChange={e => setNewMed({ ...newMed, medicine: e.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {['Paracetamol', 'Amoxicillin', 'Pantoprazole', 'Cetirizine'].map((pill, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => addMedicine(pill)}
                          className="text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                        >
                          + {pill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dosage Field */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span className="material-symbols-outlined text-[17px] text-[#00501a]">scale</span>
                        Dosage
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setNewMed(prev => ({ ...prev, dosage: e.target.value }))
                            e.target.value = ''
                          }
                        }}
                        defaultValue=""
                        className="text-[11px] max-w-[120px] sm:max-w-none bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-medium hover:border-emerald-500 cursor-pointer truncate"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <option value="" disabled>Pre-select...</option>
                        {DOSAGE_OPTIONS.map((d, idx) => (
                          <option key={idx} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      list="rx-dosage-datalist"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-all"
                      placeholder="e.g. 1 Tablet (650mg)"
                      value={newMed.dosage}
                      onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {['1 Tab (650mg)', '1 Tab (500mg)', '1 Cap', '5ml (1 tsp)', '1 Sachet'].map((chip, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewMed(prev => ({ ...prev, dosage: chip }))}
                          className="text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency Field */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span className="material-symbols-outlined text-[17px] text-[#00501a]">schedule</span>
                        Frequency
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setNewMed(prev => ({ ...prev, frequency: e.target.value }))
                            e.target.value = ''
                          }
                        }}
                        defaultValue=""
                        className="text-[11px] max-w-[120px] sm:max-w-none bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-medium hover:border-emerald-500 cursor-pointer truncate"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <option value="" disabled>Pre-select...</option>
                        {FREQUENCY_OPTIONS.map((f, idx) => (
                          <option key={idx} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      list="rx-frequency-datalist"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-all"
                      placeholder="e.g. TDS (1-1-1)"
                      value={newMed.frequency}
                      onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {['OD (1-0-0)', 'BD (1-0-1)', 'TDS (1-1-1)', 'HS (0-0-1)', 'SOS'].map((chip, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewMed(prev => ({ ...prev, frequency: chip }))}
                          className="text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration Field */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span className="material-symbols-outlined text-[17px] text-[#00501a]">calendar_month</span>
                        Duration
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setNewMed(prev => ({ ...prev, duration: e.target.value }))
                            e.target.value = ''
                          }
                        }}
                        defaultValue=""
                        className="text-[11px] max-w-[120px] sm:max-w-none bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-medium hover:border-emerald-500 cursor-pointer truncate"
                        style={{ fontFamily: 'Lexend, sans-serif' }}
                      >
                        <option value="" disabled>Pre-select...</option>
                        {DURATION_OPTIONS.map((d, idx) => (
                          <option key={idx} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      list="rx-duration-datalist"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-all"
                      placeholder="e.g. 5 Days"
                      value={newMed.duration}
                      onChange={e => setNewMed({ ...newMed, duration: e.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '30 Days'].map((chip, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewMed(prev => ({ ...prev, duration: chip }))}
                          className="text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Special Instructions & Food Directives */}
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      <span className="material-symbols-outlined text-[17px] text-[#00501a]">clinical_notes</span>
                      Special Instructions & Intake Advice
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setNewMed(prev => ({ ...prev, instructions: e.target.value }))
                          e.target.value = ''
                        }
                      }}
                      defaultValue=""
                      className="text-[11px] max-w-[150px] sm:max-w-none bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-medium hover:border-emerald-500 cursor-pointer truncate"
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <option value="" disabled>Pre-select instruction...</option>
                      {INSTRUCTION_OPTIONS.map((ins, idx) => (
                        <option key={idx} value={ins}>{ins}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    list="rx-instructions-datalist"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-all"
                    placeholder="e.g. Take after meals with warm water, or write custom instruction..."
                    value={newMed.instructions}
                    onChange={e => setNewMed({ ...newMed, instructions: e.target.value })}
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {[
                      'Take after meals',
                      'Before breakfast (empty stomach)',
                      'At bedtime (may cause drowsiness)',
                      'Complete full course',
                      'Take with food or milk'
                    ].map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewMed(prev => ({ ...prev, instructions: chip }))}
                        className="text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-600 px-2.5 py-1 rounded border border-slate-200 transition-colors cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Add Medication Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Both menu pre-selection & free-form writing supported across all prescription fields
                  </span>
                  <button
                    type="button"
                    onClick={addNewMedToList}
                    className="w-full sm:w-auto min-h-[44px] px-6 sm:px-8 bg-[#00501a] hover:bg-[#003812] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>ADD MEDICATION TO PRESCRIPTION</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#eceef0]">
                <Link to="/doctor/patient-case" className="h-12 px-6 bg-[#eceef0] text-[#191c1e] rounded-full text-[15px] font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Cancel</Link>
                <button onClick={() => medicines.length > 0 && setStep('review')} disabled={medicines.length === 0} className={`h-12 px-8 rounded-full text-[15px] font-semibold shadow-md flex items-center gap-2 ${medicines.length > 0 ? 'bg-[#455f8a] text-white' : 'bg-[#eceef0] text-[#8f7066] cursor-not-allowed'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span>REVIEW PRESCRIPTION</span><span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  )
}
