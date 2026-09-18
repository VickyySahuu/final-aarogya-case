import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const STATE_FILE = path.join(__dirname, '../.db_state.json')

// Initial Default Seeds
const INITIAL_PATIENTS = [
  {
    id: 1,
    patient_id: 'AC-2025-884920',
    patient_unique_code: 'AC-7F42K9',
    name: 'Rajesh Kumar Sharma',
    mobile: '+91 9876543210',
    dob: '14/05/1977',
    age: '48',
    gender: 'Male',
    identity_type: 'Aadhaar',
    identity_number: '9148 2911 0248',
    blood_group: 'B+',
    address: 'H-42, Sector 4, Civil Lines, New Delhi - 110054',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    user_id: 10,
    patient_id: 'AC-2026-954601',
    patient_unique_code: 'AC-VK2604',
    name: 'VIKASH KUMAR',
    mobile: '9546011026',
    dob: '15/08/2002',
    age: '24',
    gender: 'Male',
    identity_type: 'Aadhaar',
    identity_number: '9546 2026 1102',
    blood_group: 'O+',
    address: 'Quarter 14, Railway Colony, Patna, Bihar - 800001',
    created_at: '2026-07-10T08:00:00.000Z'
  }
]

const INITIAL_PRESCRIPTIONS = [
  {
    id: 1,
    rx_number: 'RX-2025-084920-884',
    appointment_id: null,
    case_id: null,
    patient_id: 1,
    patient_unique_code: 'AC-7F42K9',
    doctor_id: 1,
    hospital_name: 'District Civil Hospital',
    room_number: 'Room 104',
    token: '#14',
    diagnosis: 'Acute Viral Pharyngitis with Mild Pyrexia',
    icd_code: 'ICD-10: J02.9',
    vitals: 'BP 124/82 · Temp 99.4°F · Pulse 78 bpm · SpO2 98%',
    pharmacy_status: 'Sent',
    status: 'Issued',
    patient_access: 'Available',
    created_at: '2025-10-18T10:30:00.000Z',
    updated_at: '2025-10-18T10:30:00.000Z'
  }
]

const INITIAL_PRESCRIPTION_ITEMS = [
  {
    id: 1,
    prescription_id: 1,
    medicine_id: 1,
    medicine_name: 'Paracetamol 650mg Tablet',
    category: 'Analgesic & Antipyretic',
    dosage: '1 Tablet',
    frequency: 'Thrice Daily (TDS)',
    duration: '5 Days (15 Tablets)',
    required_qty: 15,
    instructions: 'Take after food with warm water',
    created_at: '2025-10-18T10:30:00.000Z'
  },
  {
    id: 2,
    prescription_id: 1,
    medicine_id: 2,
    medicine_name: 'Cetirizine 10mg Tablet',
    category: 'Antihistamine',
    dosage: '1 Tablet',
    frequency: 'Once Daily (HS)',
    duration: '5 Days (5 Tablets)',
    required_qty: 5,
    instructions: 'Take at bedtime',
    created_at: '2025-10-18T10:30:00.000Z'
  }
]

const INITIAL_REQUESTS = [
  {
    id: 1,
    request_id: 'REQ-RAD-2026-0001',
    request_number: 'XRAY-2026-000001',
    appointment_id: null,
    case_id: 1,
    patient_id: 1,
    patient_unique_code: 'AC-7F42K9',
    doctor_id: 1,
    test_name: 'Chest X-Ray PA View',
    test_scan: 'Chest X-Ray PA View',
    test_code: 'RAD-CXR-01',
    category: 'Radiology',
    clinical_notes: 'Persistent dry cough for 3 weeks. Rule out lower respiratory infection.',
    request_notes: 'Persistent dry cough for 3 weeks. Rule out lower respiratory infection.',
    priority: 'Routine',
    status: 'Pending',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  }
]

const INITIAL_REPORTS = [
  {
    id: 1,
    report_id: 'REP-2026-000001',
    request_id: 1,
    request_number: 'REQ-2025-88190',
    patient_id: 1,
    patient_unique_code: 'AC-7F42K9',
    doctor_id: 1,
    test_name: 'Ultrasound Whole Abdomen (USG)',
    test_scan: 'Ultrasound Whole Abdomen (USG)',
    category: 'Ultrasound',
    file_name: 'usg_abdomen_pelvis.pdf',
    file_size: '3.1 MB',
    file_url: '',
    findings: 'Liver normal in size and echotexture. Gall bladder well distended, no calculi. Impression: Normal abdominal ultrasound study.',
    impression: 'Normal study. No acute abdominal pathology.',
    report_data: null,
    report_file_reference: 'usg_abdomen_pelvis.pdf',
    verified_by: 'Radiologist Dr. Anita Mehra',
    status: 'Completed',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString()
  }
]

export const memoryPatients = []
export const memoryCases = []
export const memoryAppointments = []
export const memoryPrescriptions = []
export const memoryPrescriptionItems = []
export const memoryRequests = []
export const memoryReports = []
export const memoryDispensings = []

let saveTimeout = null

export function saveFallbackStateSync() {
  try {
    const isPersistentPatient = p => 
      p.id === 1 || p.id === 2 || 
      p.patient_unique_code === 'AC-VK2604' || 
      p.patient_unique_code === 'AC-7F42K9' ||
      String(p.mobile || '').replace(/\D/g, '').endsWith('9546011026') ||
      String(p.mobile || '').replace(/\D/g, '').endsWith('9876543210')

    const persistentPatients = memoryPatients.filter(isPersistentPatient)

    const persistentCases = memoryCases.filter(c => 
      String(c.patient_id) === '2' || 
      c.patient_unique_code === 'AC-VK2604' ||
      c.case_number === 'CASE-2026-0712-VK'
    )

    const persistentAppointments = memoryAppointments.filter(a => 
      String(a.patient_id) === '2' || 
      a.patient_unique_code === 'AC-VK2604' ||
      a.appointment_number === 'APT-2026-0712-VK'
    )

    const persistentPrescriptions = memoryPrescriptions.filter(r => 
      String(r.patient_id) === '2' || 
      r.patient_unique_code === 'AC-VK2604' ||
      r.rx_number === 'RX-2026-0712-VK' ||
      r.id === 1
    )
    const persistentPrescriptionIds = new Set(persistentPrescriptions.map(r => r.id))
    const persistentPrescriptionItems = memoryPrescriptionItems.filter(item => 
      persistentPrescriptionIds.has(item.prescription_id)
    )

    const persistentRequests = memoryRequests.filter(req => 
      String(req.patient_id) === '2' || 
      req.patient_unique_code === 'AC-VK2604' ||
      req.id === 1
    )
    const persistentReports = memoryReports.filter(rep => 
      String(rep.patient_id) === '2' || 
      rep.patient_unique_code === 'AC-VK2604' ||
      rep.id === 1
    )

    const persistentDispensings = memoryDispensings.filter(d => 
      String(d.patient_id) === '2' || 
      d.patient_unique_code === 'AC-VK2604' ||
      d.id === 1
    )

    const payload = {
      patients: persistentPatients.length > 0 ? persistentPatients : memoryPatients,
      cases: persistentCases,
      appointments: persistentAppointments,
      prescriptions: persistentPrescriptions,
      prescription_items: persistentPrescriptionItems,
      diagnostic_requests: persistentRequests,
      diagnostic_reports: persistentReports,
      dispensings: persistentDispensings,
      lastSavedAt: new Date().toISOString()
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(payload, null, 2), 'utf8')
  } catch (e) {
    console.warn('[FallbackStore] Failed to save state to disk:', e.message)
  }
}

export function scheduleSaveFallbackState() {
  saveFallbackStateSync()
}

export const saveFallbackState = saveFallbackStateSync

export function loadFallbackState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8')
      const data = JSON.parse(raw)
      if (data) {
        if (Array.isArray(data.patients) && data.patients.length > 0) {
          memoryPatients.length = 0
          memoryPatients.push(...data.patients)
        }
        if (Array.isArray(data.cases)) {
          memoryCases.length = 0
          memoryCases.push(...data.cases)
        }
        if (Array.isArray(data.appointments)) {
          memoryAppointments.length = 0
          memoryAppointments.push(...data.appointments)
        }
        if (Array.isArray(data.prescriptions)) {
          memoryPrescriptions.length = 0
          memoryPrescriptions.push(...data.prescriptions)
        }
        if (Array.isArray(data.prescription_items)) {
          memoryPrescriptionItems.length = 0
          memoryPrescriptionItems.push(...data.prescription_items)
        }
        if (Array.isArray(data.diagnostic_requests)) {
          memoryRequests.length = 0
          memoryRequests.push(...data.diagnostic_requests)
        }
        if (Array.isArray(data.diagnostic_reports)) {
          memoryReports.length = 0
          memoryReports.push(...data.diagnostic_reports)
        }
        if (Array.isArray(data.dispensings)) {
          memoryDispensings.length = 0
          memoryDispensings.push(...data.dispensings)
        }
        return {
          patients: memoryPatients,
          cases: memoryCases,
          appointments: memoryAppointments,
          prescriptions: memoryPrescriptions,
          prescription_items: memoryPrescriptionItems,
          diagnostic_requests: memoryRequests,
          diagnostic_reports: memoryReports,
          dispensings: memoryDispensings
        }
      }
    }
  } catch (e) {
    console.warn('[FallbackStore] Could not load state from disk:', e.message)
  }

  // Load defaults
  memoryPatients.length = 0
  memoryPatients.push(...INITIAL_PATIENTS)
  memoryPrescriptions.length = 0
  memoryPrescriptions.push(...INITIAL_PRESCRIPTIONS)
  memoryPrescriptionItems.length = 0
  memoryPrescriptionItems.push(...INITIAL_PRESCRIPTION_ITEMS)
  memoryRequests.length = 0
  memoryRequests.push(...INITIAL_REQUESTS)
  memoryReports.length = 0
  memoryReports.push(...INITIAL_REPORTS)
  saveFallbackStateSync()
  return {
    patients: memoryPatients,
    cases: memoryCases,
    appointments: memoryAppointments,
    prescriptions: memoryPrescriptions,
    prescription_items: memoryPrescriptionItems,
    diagnostic_requests: memoryRequests,
    diagnostic_reports: memoryReports,
    dispensings: memoryDispensings
  }
}

// Initial load on import
loadFallbackState()

export default {
  memoryPatients,
  memoryCases,
  memoryAppointments,
  memoryPrescriptions,
  memoryPrescriptionItems,
  memoryRequests,
  memoryReports,
  memoryDispensings,
  saveFallbackStateSync,
  scheduleSaveFallbackState,
  loadFallbackState
}
