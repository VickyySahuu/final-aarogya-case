// Central mock state and persistence for AAROGYA CASE Patient Portal & Doctor Portal

// 1. SINGLE DOCTOR FOR THE ENTIRE PROTOTYPE
export const DOCTOR_DATA = {
  id: 'doc-1',
  name: 'Dr. Ramanathan Venkatraman',
  doctorId: 'DOC-1042',
  specialization: 'General Medicine',
  hospital: 'District Civil Hospital',
  room: 'Room 104',
  days: 'Mon - Sat (08:30 – 14:00)',
  tokensAvailable: 'Available'
}

try {
  const savedDoctor = typeof window !== 'undefined' ? localStorage.getItem('aarogya_doctor_data') : null
  if (savedDoctor) {
    Object.assign(DOCTOR_DATA, JSON.parse(savedDoctor))
  }
} catch (e) {}

export const DOCTORS_LIST = [DOCTOR_DATA]

export const HOSPITALS_LIST = [
  {
    id: 'hosp-1',
    name: 'District Civil Hospital',
    hospitalId: 'HOSP-DEL-01',
    facilityType: 'Public Multi-Specialty Civic Hospital & Triage Hub',
    address: 'Sector 4, Civil Lines, New Delhi — 110054',
    type: 'District Hospital',
    location: 'Sector 4, Civil Lines, New Delhi — 110054',
    emergencyWard: 'Ground Floor, Bay 01 - 04',
    connectedHubs: 'AIIMS Trauma Wing & Emergency Response 108',
    distance: '1.8 km away',
    opdHours: 'Mon - Sat: 8:00 AM - 2:00 PM',
    beds: '500 Beds',
    emergency: '24x7 Trauma Casualty'
  }
]

try {
  const savedHosp = typeof window !== 'undefined' ? localStorage.getItem('aarogya_hospital_data') : null
  if (savedHosp) {
    Object.assign(HOSPITALS_LIST[0], JSON.parse(savedHosp))
  }
} catch (e) {}

export function generatePatientUniqueCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `AC-${code}`
}

// 2. DEFAULT PATIENT PROFILE (Used when not registered or as baseline)
export const DEFAULT_PATIENT_PROFILE = {
  name: 'Rajesh Kumar Sharma',
  mobile: '+91 98XXXXXX10',
  rawMobile: '9876543210',
  dob: '14/05/1977',
  age: '48',
  gender: 'Male',
  identityType: 'Aadhaar',
  identityNumber: '9148 2911 0248',
  maskedIdentityNumber: 'XXXX-XXXX-0248',
  patientId: 'AC-2025-884920',
  patientUniqueCode: 'AC-7F42K9',
  bloodGroup: 'B+',
  address: 'H-42, Sector 4, Civil Lines, New Delhi - 110054'
}

// 3. APPOINTMENTS: EMPTY BY DEFAULT
// An appointment is ONLY created when patient completes the full intake/booking flow
export const DEFAULT_APPOINTMENTS = []

// 4. DEFAULT INITIAL PRESCRIPTIONS (historical baseline for patient records)
export const DEFAULT_PRESCRIPTIONS = [
  {
    id: 'RX-2025-084920-884',
    rxNumber: 'RX-2025-084920-884',
    token: '#14',
    date: '27 Oct 2025',
    doctorName: 'Dr. Ramanathan Venkatraman',
    doctorId: 'DOC-1042',
    department: 'General Medicine',
    roomNumber: 'Room 104',
    hospitalName: 'District Civil Hospital',
    patientName: 'Rajesh Kumar Sharma',
    patientId: 'AC-2025-884920',
    patientUniqueCode: 'AC-7F42K9',
    patientAge: '48',
    patientGender: 'Male',
    diagnosis: 'Acute Viral Pharyngitis with Mild Pyrexia',
    icdCode: 'ICD-10: J02.9',
    vitals: 'BP 124/82 · Temp 99.4°F · Pulse 78 bpm · SpO2 98%',
    pharmacyStatus: 'Sent',
    status: 'Pending',
    patientAccess: 'Available',
    medicines: [
      {
        name: 'Paracetamol 650mg Tablet',
        category: 'Analgesic & Antipyretic',
        dosage: '1 Tablet',
        frequency: 'Thrice Daily (TDS)',
        duration: '5 Days (15 Tablets)',
        requiredQty: 15,
        instructions: 'Take after food with warm water'
      },
      {
        name: 'Cetirizine 10mg Tablet',
        category: 'Antihistamine',
        dosage: '1 Tablet',
        frequency: 'Once Daily (HS)',
        duration: '3 Days (3 Tablets)',
        requiredQty: 3,
        instructions: 'Take at bedtime'
      }
    ],
    dietaryAdvice: 'Consume lukewarm fluids, salt-water gargle thrice daily, avoid refrigerated liquids.',
    nextReview: 'Review in OPD after 5 days if symptoms persist.'
  },
  {
    id: 'RX-2025-DC-004817',
    rxNumber: 'RX-2025-DC-004817',
    token: '#10',
    date: '15 Oct 2025',
    doctorName: 'Dr. Ramanathan Venkatraman',
    doctorId: 'DOC-1042',
    department: 'General Medicine',
    roomNumber: 'Room 104',
    hospitalName: 'District Civil Hospital',
    patientName: 'Rajesh Kumar Sharma',
    patientId: 'AC-2025-884920',
    patientUniqueCode: 'AC-7F42K9',
    diagnosis: 'Acute Viral Pharyngitis with Mild Pyrexia',
    icdCode: 'ICD-10: J02.9',
    vitals: 'BP 124/82 · Temp 99.4°F · Pulse 78 bpm · SpO2 98%',
    pharmacyStatus: 'Delivered',
    status: 'Delivered',
    patientAccess: 'Available',
    medicines: [
      {
        name: 'Amoxicillin 500mg Capsule',
        category: 'Antibiotic',
        dosage: '500mg (1 Cap)',
        frequency: 'Three times daily (TDS)',
        duration: '5 days',
        requiredQty: 15,
        instructions: 'Take after meals. Complete full course.'
      },
      {
        name: 'Paracetamol 500mg Tablet',
        category: 'Analgesic & Antipyretic',
        dosage: '500mg (1 Tab)',
        frequency: 'As needed (SOS / Every 8 hrs)',
        duration: '5 days',
        requiredQty: 10,
        instructions: 'Take for fever >100°F. Max 4 tablets/day.'
      },
      {
        name: 'Betadine Gargle 100ml',
        category: 'Antiseptic Solution',
        dosage: '15ml diluted',
        frequency: 'Three times daily',
        duration: '5 days',
        requiredQty: 1,
        instructions: 'Gargle with warm water. Do not swallow.'
      }
    ],
    dietaryAdvice: 'Consume lukewarm fluids, salt-water gargle thrice daily, avoid refrigerated liquids.',
    nextReview: 'Review in OPD after 5 days if symptoms persist.'
  }
]

export const DEFAULT_CASES = [
  {
    id: 'CASE-2025-0981',
    caseNumber: 'CASE-2025-0981',
    title: 'Acute Fever and Sore Throat (OPD Triage)',
    date: '15 Oct 2025',
    hospital: 'District Civil Hospital, Sector 4',
    doctor: 'Dr. Ramanathan V., MD',
    status: 'Completed',
    statusColor: 'bg-emerald-100 text-emerald-800',
    department: 'General Medicine',
    summary: 'Vital parameters checked: Temp 101.4°F, BP 118/76 mmHg. 3-day antibiotic regimen and anti-pyretic prescribed. Rapid antigen test negative.',
    prescriptionId: 'RX-2025-DC-004817'
  }
]

export const DEFAULT_REPORTS = [
  {
    id: 'REP-2025-10492',
    testName: 'Complete Blood Count (CBC) with Platelet Indices',
    category: 'Haematology & Pathology',
    date: '16 Oct 2025',
    laboratory: 'District Civil Hospital Central Lab',
    sampleId: 'SMP-25-8812A',
    status: 'Verified & Completed',
    summary: 'Hemoglobin 14.2 g/dL (Normal), Total Leucocyte Count 8,400 /mcL (Normal), Platelets 2.4 Lakh /mcL (Normal). No malarial parasites found.',
    verifiedBy: 'Dr. Priya Nair, MD (Pathology)',
    items: [
      { parameter: 'Hemoglobin (Hb)', result: '14.2', unit: 'g/dL', normalRange: '13.0 - 17.0', status: 'Normal' },
      { parameter: 'Total Leucocyte Count (TLC)', result: '8,400', unit: '/mcL', normalRange: '4,000 - 11,000', status: 'Normal' },
      { parameter: 'Platelet Count', result: '2.40', unit: 'Lakh/mcL', normalRange: '1.50 - 4.50', status: 'Normal' },
      { parameter: 'Neutrophils', result: '64', unit: '%', normalRange: '40 - 75', status: 'Normal' },
      { parameter: 'Lymphocytes', result: '28', unit: '%', normalRange: '20 - 45', status: 'Normal' },
      { parameter: 'Erythrocyte Sedimentation Rate (ESR)', result: '12', unit: 'mm/hr', normalRange: '0 - 15', status: 'Normal' }
    ]
  }
]

// STATE GETTERS & SETTERS (PERSISTENT VIA LOCALSTORAGE)
export function getPatientProfile() {
  try {
    const session = localStorage.getItem('aarogya_session_data')
    if (session) {
      const s = JSON.parse(session)
      if (s?.patient) return s.patient
    }
  } catch {}
  const saved = localStorage.getItem('aarogya_patient_profile')
  if (saved) {
    try {
      const p = JSON.parse(saved)
      if (!p.patientUniqueCode || p.patientUniqueCode === 'PUC-8849-DEL-2025') {
        p.patientUniqueCode = 'AC-7F42K9'
      }
      return p
    } catch (e) { /* fallback */ }
  }
  return DEFAULT_PATIENT_PROFILE
}

export function savePatientProfile(profile) {
  if (!profile.patientUniqueCode) {
    profile.patientUniqueCode = generatePatientUniqueCode()
  }
  localStorage.setItem('aarogya_patient_profile', JSON.stringify(profile))
  return profile
}

export function getAppointments() {
  const saved = localStorage.getItem('aarogya_patient_appointments')
  if (saved) {
    try { return JSON.parse(saved) } catch (e) { /* fallback */ }
  }
  return DEFAULT_APPOINTMENTS
}

export function addAppointment(apt) {
  const profile = getPatientProfile()
  if (!apt.patientUniqueCode) {
    apt.patientUniqueCode = profile.patientUniqueCode || 'AC-7F42K9'
  }
  const current = getAppointments()
  const updated = [apt, ...current]
  localStorage.setItem('aarogya_patient_appointments', JSON.stringify(updated))
  return updated
}

// OPD QUEUE ONLY SHOWS PATIENTS WHO COMPLETED APPOINTMENT BOOKING
export function getOpdQueue() {
  const appointments = getAppointments()
  const profile = getPatientProfile()
  return appointments.map((apt, idx) => ({
    token: parseInt(String(apt.token).replace(/\D/g, '')) || (idx + 14),
    name: apt.patientName || profile.name,
    id: apt.patientId || profile.patientId,
    uniqueCode: apt.patientUniqueCode || profile.patientUniqueCode || 'AC-7F42K9',
    age: apt.patientAge ? `${apt.patientAge}y / ${apt.patientGender || 'Male'}` : `${profile.age}y / ${profile.gender}`,
    extra: `${apt.room || 'Room 104'} • ${apt.date || 'Today'}`,
    category: 'ROUTINE',
    status: apt.queueStatus || (idx === 0 ? 'Current' : 'Waiting'),
    time: apt.time || '09:30 AM',
    appointmentId: apt.id,
    chiefComplaint: apt.chiefComplaint || 'High Fever & Severe Sore Throat',
    fullAppointment: apt
  }))
}

// DOCTOR PATIENT SEARCH & QR LOOKUP
export function searchDoctorPatients(query = '') {
  const q = query.trim().toLowerCase()
  const profile = getPatientProfile()
  const appointments = getAppointments()

  const all = []
  appointments.forEach((apt, idx) => {
    all.push({
      name: apt.patientName || profile.name,
      id: apt.patientId || profile.patientId,
      uniqueCode: apt.patientUniqueCode || profile.patientUniqueCode || 'AC-7F42K9',
      token: apt.token || `#${idx + 14}`,
      room: apt.room || 'Room 104',
      date: apt.date || 'Today',
      time: apt.time || '09:30 AM',
      age: apt.patientAge ? `${apt.patientAge}y / ${apt.patientGender || 'Male'}` : `${profile.age}y / ${profile.gender}`,
      chiefComplaint: apt.chiefComplaint || 'Outpatient Consultation',
      hasAppointment: true,
      fullAppointment: apt
    })
  })

  // Also include registered patient profile if not already having an appointment in list
  if (!all.some(p => p.id === profile.patientId)) {
    all.push({
      name: profile.name,
      id: profile.patientId,
      uniqueCode: profile.patientUniqueCode || 'AC-7F42K9',
      token: 'Not Booked',
      room: 'OPD Reception',
      date: 'Registered Citizen',
      time: '—',
      age: `${profile.age}y / ${profile.gender}`,
      chiefComplaint: 'Citizen Profile on Central Health Registry',
      hasAppointment: false,
      fullAppointment: null
    })
  }

  if (!q) return all

  return all.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) ||
    p.uniqueCode.toLowerCase().includes(q) ||
    String(p.token).toLowerCase().includes(q)
  )
}

export function updateAppointmentQueueStatus(token, newStatus) {
  const current = getAppointments()
  const updated = current.map(apt => {
    const aptToken = parseInt(String(apt.token).replace(/\D/g, ''))
    if (aptToken === token) {
      return { ...apt, queueStatus: newStatus }
    }
    return apt
  })
  localStorage.setItem('aarogya_patient_appointments', JSON.stringify(updated))
  return updated
}

// PRESCRIPTIONS
export function getPrescriptions() {
  const saved = localStorage.getItem('aarogya_patient_prescriptions')
  if (saved) {
    try { return JSON.parse(saved) } catch (e) { /* fallback */ }
  }
  return DEFAULT_PRESCRIPTIONS
}

export function saveDoctorPrescription(newRx) {
  const current = getPrescriptions()
  const updated = [newRx, ...current.filter(p => p.rxNumber !== newRx.rxNumber)]
  localStorage.setItem('aarogya_patient_prescriptions', JSON.stringify(updated))
  return updated
}

export function getCases() {
  return DEFAULT_CASES
}

export function getReports() {
  const saved = localStorage.getItem('aarogya_patient_reports')
  if (saved) {
    try { return JSON.parse(saved) } catch (e) {}
  }
  return DEFAULT_REPORTS
}

// ==========================================
// PHARMACY MODULE PROTOTYPE DATA & FUNCTIONS
// ==========================================

export const DEFAULT_PHARMACY_STOCK = [
  { id: 'MED-PARA-650', name: 'Paracetamol 650mg Tablet', category: 'Analgesic', availableQty: 850, unit: 'Tablets', rack: 'Rack A-01' },
  { id: 'MED-CET-10', name: 'Cetirizine 10mg Tablet', category: 'Antihistamine', availableQty: 420, unit: 'Tablets', rack: 'Rack B-03' },
  { id: 'MED-AMOX-500', name: 'Amoxicillin 500mg Capsule', category: 'Antibiotic', availableQty: 300, unit: 'Capsules', rack: 'Rack C-02' },
  { id: 'MED-AZI-500', name: 'Azithromycin 500mg Tablet', category: 'Antibiotic', availableQty: 180, unit: 'Tablets', rack: 'Rack C-05' },
  { id: 'MED-PAN-40', name: 'Pantoprazole 40mg Tablet', category: 'Antacid / PPI', availableQty: 550, unit: 'Tablets', rack: 'Rack A-04' }
]

export function getPharmacyStock() {
  const saved = localStorage.getItem('aarogya_pharmacy_stock')
  if (saved) {
    try { return JSON.parse(saved) } catch (e) { /* fallback */ }
  }
  return DEFAULT_PHARMACY_STOCK
}

export function addPharmacyMedicine({ name, id, qty }) {
  const current = getPharmacyStock()
  const newMed = {
    id: (id || `MED-${Date.now().toString().slice(-4)}`).toUpperCase(),
    name: name || 'New Formulary Medicine',
    category: 'Hospital Formulary Stock',
    availableQty: parseInt(qty, 10) || 100,
    unit: 'Units',
    rack: 'General Dispensary Storage'
  }
  const updated = [newMed, ...current]
  localStorage.setItem('aarogya_pharmacy_stock', JSON.stringify(updated))
  return updated
}

export const DEFAULT_PHARMACY_HISTORY = [
  {
    rxNumber: 'RX-2025-072109-114',
    patientName: 'Anita Deshmukh',
    patientId: 'AC-2025-721090',
    patientUniqueCode: 'AC-3D81P2',
    date: '27 Oct 2025, 11:10 AM',
    status: 'Delivered'
  },
  {
    rxNumber: 'RX-2025-068941-802',
    patientName: 'Vikramaditya Rao',
    patientId: 'AC-2025-689410',
    patientUniqueCode: 'AC-9V42L8',
    date: '27 Oct 2025, 10:45 AM',
    status: 'Dispensed'
  },
  {
    rxNumber: 'RX-2025-054321-419',
    patientName: 'Sunita Gupta',
    patientId: 'AC-2025-543210',
    patientUniqueCode: 'AC-4S19Q5',
    date: '27 Oct 2025, 10:15 AM',
    status: 'Delivered'
  }
]

export function getPharmacyHistory() {
  const saved = localStorage.getItem('aarogya_pharmacy_history')
  let history = DEFAULT_PHARMACY_HISTORY
  if (saved) {
    try { history = JSON.parse(saved) } catch (e) { /* fallback */ }
  }
  return history
}

export function markPharmacyPrescriptionDelivered(rxNumber, patientData = {}) {
  const prescriptions = getPrescriptions()
  const updatedRx = prescriptions.map(rx => {
    if (rx.rxNumber === rxNumber || rx.id === rxNumber) {
      return { 
        ...rx, 
        pharmacyStatus: 'Delivered', 
        status: 'Delivered',
        deliveredAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    }
    return rx
  })
  localStorage.setItem('aarogya_patient_prescriptions', JSON.stringify(updatedRx))

  const history = getPharmacyHistory()
  const newHistoryItem = {
    rxNumber,
    patientName: patientData.patientName || patientData.name || 'Rajesh Kumar Sharma',
    patientId: patientData.patientId || patientData.id || 'AC-2025-884920',
    patientUniqueCode: patientData.patientUniqueCode || patientData.uniqueCode || 'AC-7F42K9',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    status: 'Delivered'
  }
  const updatedHistory = [newHistoryItem, ...history.filter(h => h.rxNumber !== rxNumber)]
  localStorage.setItem('aarogya_pharmacy_history', JSON.stringify(updatedHistory))
  return { updatedRx, updatedHistory }
}

// ==========================================
// DIAGNOSTIC & SCAN MODULE PROTOTYPE DATA
// ==========================================

export const DEFAULT_DIAGNOSTIC_REQUESTS = [
  {
    id: 'REQ-2025-992014',
    requestId: 'REQ-2025-992014',
    requestNumber: 'REQ-2025-992014',
    date: '27 Oct 2025, 09:30 AM',
    patientName: 'Rajesh Kumar Sharma',
    patientId: 'AC-2025-884920',
    patientUniqueCode: 'AC-7F42K9',
    patientAge: '48',
    patientGender: 'Male',
    doctorName: 'Dr. Ramanathan Venkatraman',
    doctorId: 'DOC-1042',
    department: 'Department of General Medicine',
    roomNumber: 'Room 104',
    hospitalName: 'District Civil Hospital',
    testName: 'Chest X-Ray (PA View)',
    category: 'Radiology & Imaging',
    modality: 'Direct Digital Radiography',
    priority: 'Routine Outpatient',
    clinicalNotes: 'Persistent dry cough for 3 weeks. Rule out lower respiratory infection or infiltration. Patient is alert, non-smoker, no hemoptysis reported.',
    status: 'Awaiting Scan', // 'Awaiting Scan' | 'In Progress' | 'Completed'
    station: 'X-Ray Suite 03 • Digital DR Bay'
  }
]

export function getDiagnosticRequests() {
  const saved = localStorage.getItem('aarogya_diagnostic_requests')
  if (saved) {
    try { return JSON.parse(saved) } catch (e) { /* fallback */ }
  }
  return DEFAULT_DIAGNOSTIC_REQUESTS
}

export function saveDiagnosticRequest(newReq) {
  const current = getDiagnosticRequests()
  const updated = [newReq, ...current.filter(r => (r.requestId || r.id) !== (newReq.requestId || newReq.id))]
  localStorage.setItem('aarogya_diagnostic_requests', JSON.stringify(updated))
  return updated
}

export const DEFAULT_COMPLETED_REPORTS = [
  {
    id: 'REP-2025-88190',
    requestId: 'REQ-2025-88190',
    requestNumber: 'REQ-2025-88190',
    testName: 'Ultrasound Whole Abdomen (USG)',
    category: 'Ultrasound',
    date: '24 Oct 2025, 03:30 PM',
    patientName: 'Sunita Gupta',
    patientId: 'AC-2025-543210',
    patientUniqueCode: 'AC-4S19Q5',
    doctorName: 'Dr. Ramanathan Venkatraman',
    doctorId: 'DOC-1042',
    department: 'Radiology & Sonology',
    fileName: 'usg_abdomen_pelvis_sg543210.pdf',
    fileSize: '3.1 MB',
    status: 'Completed & Transmitted',
    findings: 'Liver normal in size and echotexture. Gall bladder well distended, no calculi. Kidneys bilateral normal. Impression: Normal abdominal ultrasound study.',
    verifiedBy: 'Dr. Priya Nair, MD (Radiology)'
  }
]

export function getDiagnosticCompletedReports() {
  const saved = localStorage.getItem('aarogya_diagnostic_completed_reports')
  if (saved) {
    try { return JSON.parse(saved) } catch (e) { /* fallback */ }
  }
  return DEFAULT_COMPLETED_REPORTS
}

export function completeDiagnosticReport({
  requestId,
  findings,
  fileName,
  fileSize,
  verifiedBy
}) {
  const requests = getDiagnosticRequests()
  const targetReq = requests.find(r => r.requestId === requestId || r.requestNumber === requestId || r.id === requestId) || DEFAULT_DIAGNOSTIC_REQUESTS[0]

  // Update request status to Completed
  const updatedRequests = requests.map(r => {
    if (r.requestId === requestId || r.requestNumber === requestId || r.id === requestId) {
      return { ...r, status: 'Completed', completedAt: new Date().toLocaleString() }
    }
    return r
  })
  localStorage.setItem('aarogya_diagnostic_requests', JSON.stringify(updatedRequests))

  // Create completed report item
  const newReport = {
    id: `REP-${targetReq.requestId ? targetReq.requestId.replace(/\D/g, '') : Date.now()}`,
    requestId: targetReq.requestId || targetReq.requestNumber || requestId,
    requestNumber: targetReq.requestNumber || targetReq.requestId || requestId,
    testName: targetReq.testName || 'Chest X-Ray (PA View)',
    category: targetReq.category || 'Radiology & Imaging',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    patientName: targetReq.patientName || 'Rajesh Kumar Sharma',
    patientId: targetReq.patientId || 'AC-2025-884920',
    patientUniqueCode: targetReq.patientUniqueCode || 'AC-7F42K9',
    doctorName: targetReq.doctorName || 'Dr. Ramanathan Venkatraman',
    doctorId: targetReq.doctorId || 'DOC-1042',
    department: targetReq.department || 'Department of General Medicine',
    fileName: fileName || 'chest_xray_pa_view_ac884920.pdf',
    fileSize: fileSize || '4.2 MB',
    status: 'Completed & Transmitted',
    findings: findings || 'Normal study. Clear lung fields, normal cardiothoracic index. No infiltrates, effusion or active pulmonary lesion detected.',
    verifiedBy: verifiedBy || 'Radiographer S. Varma (Lic #DEL-RAD-884)'
  }

  // Add to diagnostic completed reports
  const completed = getDiagnosticCompletedReports()
  const updatedCompleted = [newReport, ...completed.filter(c => c.requestId !== newReport.requestId)]
  localStorage.setItem('aarogya_diagnostic_completed_reports', JSON.stringify(updatedCompleted))

  // Also sync to general patient reports so Doctor Portal & Patient Portal can immediately access it!
  const patientReports = getReports()
  const syncedReport = {
    id: newReport.id,
    testName: newReport.testName,
    category: newReport.category,
    date: newReport.date,
    laboratory: 'Central Diagnostic Node AIIMS New Delhi',
    sampleId: `SMP-${newReport.requestId.replace(/\D/g, '') || '8812'}`,
    status: 'Verified & Completed',
    summary: newReport.findings,
    verifiedBy: newReport.verifiedBy,
    items: [
      { parameter: 'Procedure', result: newReport.testName, unit: 'Scan', normalRange: 'Normal Study', status: 'Normal' },
      { parameter: 'Impression', result: 'Clear view, No acute findings', unit: 'Observation', normalRange: 'Normal', status: 'Normal' }
    ]
  }
  const updatedPatientReports = [syncedReport, ...patientReports.filter(r => r.id !== syncedReport.id)]
  localStorage.setItem('aarogya_patient_reports', JSON.stringify(updatedPatientReports))

  return { newReport, updatedRequests, updatedCompleted }
}

// ==========================================
// AMBULANCE MODULE PROTOTYPE DATA & FUNCTIONS
// ==========================================

export const DEFAULT_AMBULANCE_REQUEST = {
  requestNumber: 'REQ-EMG-2025-8841',
  patientName: 'Rajesh Kumar Sharma',
  patientId: 'AC-2025-884920',
  patientUniqueCode: 'AC-7F42K9',
  patientAge: '54 Years',
  patientGender: 'Male',
  contactNumber: '+91 98765-XXXXX',
  abhaId: 'ABHA-91-8273-1092-4410',
  pickupLocation: 'Flat 402, Block C, Green Meadows, Sector 4, Dwarka, New Delhi',
  landmark: 'Near Sector 4 Metro Station Gate 2',
  destination: 'AIIMS Central Hospital Emergency Wing, New Delhi',
  destinationBay: 'Emergency Admissions Bay 03, AIIMS Central Hospital',
  requestTime: 'Today, 11:20 AM IST',
  status: 'Pending Acceptance',
  distance: '6.4 km',
  eta: '12 mins',
  unit: 'Ambulance Unit #08',
  operatorId: 'AMB-OP-104'
}

export function getAmbulanceRequest() {
  const saved = localStorage.getItem('aarogya_ambulance_request')
  let baseRequest = DEFAULT_AMBULANCE_REQUEST
  if (saved) {
    try {
      baseRequest = JSON.parse(saved)
    } catch (e) {
      baseRequest = DEFAULT_AMBULANCE_REQUEST
    }
  }

  // Check if patient shared live location from Emergency module (02)
  try {
    const liveLoc = localStorage.getItem('aarogya_emergency_location')
    if (liveLoc) {
      const parsedLoc = JSON.parse(liveLoc)
      if (parsedLoc?.formatted) {
        baseRequest.pickupLocation = `${parsedLoc.formatted} (Shared from Patient SOS)`
      }
    }
  } catch (e) {}

  return baseRequest
}

export function updateAmbulanceStatus(newStatus) {
  const current = getAmbulanceRequest()
  const updated = {
    ...current,
    status: newStatus,
    updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  localStorage.setItem('aarogya_ambulance_request', JSON.stringify(updated))
  localStorage.setItem('aarogya_ambulance_status', newStatus)
  return updated
}

// ==========================================
// ADMIN MODULE SHARED ENTITY FUNCTIONS
// ==========================================

// 1. DOCTOR MANAGEMENT (ONE DOCTOR ONLY)
export function getAdminDoctor() {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('aarogya_doctor_data') : null
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      Object.assign(DOCTOR_DATA, parsed)
      DOCTORS_LIST[0] = DOCTOR_DATA
    } catch (e) {}
  }
  return { ...DOCTOR_DATA }
}

export function updateAdminDoctor(newData) {
  Object.assign(DOCTOR_DATA, newData)
  DOCTORS_LIST[0] = DOCTOR_DATA
  if (typeof window !== 'undefined') {
    localStorage.setItem('aarogya_doctor_data', JSON.stringify(DOCTOR_DATA))
  }
  return { ...DOCTOR_DATA }
}

// 2. HOSPITAL MANAGEMENT
export function getAdminHospital() {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('aarogya_hospital_data') : null
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      Object.assign(HOSPITALS_LIST[0], parsed)
    } catch (e) {}
  }
  return { ...HOSPITALS_LIST[0] }
}

export function updateAdminHospital(newData) {
  Object.assign(HOSPITALS_LIST[0], newData)
  if (typeof window !== 'undefined') {
    localStorage.setItem('aarogya_hospital_data', JSON.stringify(HOSPITALS_LIST[0]))
  }
  return { ...HOSPITALS_LIST[0] }
}

// 3. MEDICINES MANAGEMENT
export function getAdminMedicines() {
  return getPharmacyStock()
}

export function updateAdminMedicine(updatedMed) {
  const current = getPharmacyStock()
  const updated = current.map(item => item.id === updatedMed.id ? { ...item, ...updatedMed } : item)
  if (typeof window !== 'undefined') {
    localStorage.setItem('aarogya_pharmacy_stock', JSON.stringify(updated))
  }
  return updated
}

export function addAdminMedicine(newMed) {
  return addPharmacyMedicine(newMed)
}

// 4. DIAGNOSTICS MANAGEMENT
export const DEFAULT_DIAGNOSTICS_CATALOG = [
  {
    id: 'DIAG-XR-01',
    name: 'Chest X-Ray (PA View)',
    category: 'Radiology / Digital Radiography',
    turnaround: '15 Mins',
    status: 'Active',
    icon: 'radiology'
  },
  {
    id: 'DIAG-MRI-02',
    name: 'Magnetic Resonance Imaging (MRI)',
    category: 'Advanced Neuro / Musculoskeletal Imaging',
    turnaround: '45 Mins',
    status: 'Active',
    icon: 'vital_signs'
  },
  {
    id: 'DIAG-BLD-03',
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology / Pathology',
    turnaround: '30 Mins',
    status: 'Active',
    icon: 'bloodtype'
  },
  {
    id: 'DIAG-USG-04',
    name: 'Ultrasound Abdomen',
    category: 'Sonography',
    turnaround: '20 Mins',
    status: 'Active',
    icon: 'question_mark'
  },
  {
    id: 'DIAG-CTS-05',
    name: 'CT Scan (Head / Brain)',
    category: 'Computed Tomography',
    turnaround: '25 Mins',
    status: 'Active',
    icon: 'psychology'
  }
]

export function getAdminDiagnostics() {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('aarogya_diagnostics_catalog') : null
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {}
  }
  return DEFAULT_DIAGNOSTICS_CATALOG
}

export function updateAdminDiagnostic(updatedTest) {
  const current = getAdminDiagnostics()
  const updated = current.map(item => item.id === updatedTest.id ? { ...item, ...updatedTest } : item)
  if (typeof window !== 'undefined') {
    localStorage.setItem('aarogya_diagnostics_catalog', JSON.stringify(updated))
  }
  return updated
}

export function addAdminDiagnostic(newTest) {
  const current = getAdminDiagnostics()
  const created = {
    id: newTest.id || `DIAG-NEW-${(current.length + 1).toString().padStart(2, '0')}`,
    name: newTest.name || 'New Diagnostic Modality',
    category: newTest.category || 'General Pathology / Radiology',
    turnaround: newTest.turnaround || '30 Mins',
    status: 'Active',
    icon: newTest.icon || 'biotech'
  }
  const updated = [...current, created]
  if (typeof window !== 'undefined') {
    localStorage.setItem('aarogya_diagnostics_catalog', JSON.stringify(updated))
  }
  return updated
}

// 5. AMBULANCE MANAGEMENT
export function getAdminAmbulance() {
  const base = getAmbulanceRequest()
  const savedAmbulance = typeof window !== 'undefined' ? localStorage.getItem('aarogya_admin_ambulance') : null
  if (savedAmbulance) {
    try {
      return { ...base, ...JSON.parse(savedAmbulance) }
    } catch (e) {}
  }
  return {
    ...base,
    ambulanceNumber: base.unit || 'Ambulance Unit #08',
    vehicleNumber: 'DL-01-EQ-9041',
    status: (base.status || 'available').toLowerCase().replace(/\s+/g, '') === 'ontheway' ? 'ontheway' : (base.status || '').toLowerCase().includes('busy') ? 'busy' : 'available'
  }
}

export function updateAdminAmbulance(updatedData) {
  const current = getAdminAmbulance()
  const merged = { ...current, ...updatedData }
  if (typeof window !== 'undefined') {
    localStorage.setItem('aarogya_admin_ambulance', JSON.stringify(merged))
    // Also sync status with ambulance request
    let mappedStatus = 'Available'
    if (merged.status === 'ontheway') mappedStatus = 'On the Way'
    if (merged.status === 'busy') mappedStatus = 'Busy'
    updateAmbulanceStatus(mappedStatus)
  }
  return merged
}




