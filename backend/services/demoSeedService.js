import { query, isConnected } from '../db/index.js'
import { PatientModel } from '../models/patientModel.js'
import { CaseModel } from '../models/caseModel.js'
import { AppointmentModel } from '../models/appointmentModel.js'
import { PrescriptionModel } from '../models/prescriptionModel.js'
import { DiagnosticModel } from '../models/diagnosticModel.js'
import { DispensingModel } from '../models/dispensingModel.js'

/**
 * AAROGYA CASE — Demo Patient & Historical Clinical Data Seeder
 * Deterministically creates and pre-seeds VIKASH KUMAR (9546011026)
 * with consistent, realistic synthetic historical records.
 */

export const DEMO_PATIENT_DATA = {
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

export const DemoSeedService = {
  async ensureDemoPatient() {
    try {
      // 1. Ensure Patient in PostgreSQL / PatientModel
      let patient = null
      if (isConnected()) {
        try {
          const res = await query(
            `SELECT * FROM patients WHERE mobile LIKE '%9546011026%' OR patient_unique_code = 'AC-VK2604' LIMIT 1`
          )
          if (res.rows.length > 0) {
            patient = res.rows[0]
          } else {
            const insertRes = await query(
              `INSERT INTO patients (
                id, user_id, patient_id, patient_unique_code, name, mobile, dob, age, gender, identity_type, identity_number, blood_group, address, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
              ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, mobile = EXCLUDED.mobile
              RETURNING *`,
              [
                DEMO_PATIENT_DATA.id,
                DEMO_PATIENT_DATA.user_id,
                DEMO_PATIENT_DATA.patient_id,
                DEMO_PATIENT_DATA.patient_unique_code,
                DEMO_PATIENT_DATA.name,
                DEMO_PATIENT_DATA.mobile,
                DEMO_PATIENT_DATA.dob,
                DEMO_PATIENT_DATA.age,
                DEMO_PATIENT_DATA.gender,
                DEMO_PATIENT_DATA.identity_type,
                DEMO_PATIENT_DATA.identity_number,
                DEMO_PATIENT_DATA.blood_group,
                DEMO_PATIENT_DATA.address,
                DEMO_PATIENT_DATA.created_at
              ]
            )
            patient = insertRes.rows[0]
          }
        } catch (dbErr) {
          console.warn('[DemoSeedService] PostgreSQL insert warning (using fallback):', dbErr.message)
        }
      }

      // 2. Ensure in Memory Patients
      PatientModel.seedPatientSync(DEMO_PATIENT_DATA)
      const effectivePatientId = patient?.id || 2

      // 3. Ensure Historical Case: CASE-2026-0712-VK
      const existingCases = await CaseModel.getByPatientId(effectivePatientId)
      let histCase = existingCases.find(
        c => c.case_number === 'CASE-2026-0712-VK' || c.problem?.includes('allergic rhinitis')
      )

      if (!histCase) {
        const histStructured = {
          chiefComplaint: 'Seasonal Allergic Rhinitis with morning sneezing bouts',
          duration: '10 days',
          symptoms: ['Sneezing', 'Nasal Congestion', 'Watery Eyes', 'Mild Headache'],
          associatedSymptoms: ['Ocular pruritus', 'Clear rhinorrhea'],
          location: 'Upper Respiratory Tract',
          severity: 'Routine',
          pattern: 'Worse early morning upon waking and on dust exposure',
          pastMedicalHistory: 'Childhood asthma (resolved)',
          currentMedications: 'Cetirizine 10mg PRN',
          allergies: 'Dust mites & pollen',
          relevantNegatives: ['No fever', 'No productive cough', 'No wheezing'],
          additionalInformation: 'Citizen reports symptoms flare during seasonal transition and indoor dust cleaning.',
          documents: [
            {
              id: 'DOC-VK-2026-0710',
              originalName: 'Serum_IgE_Allergy_Panel_VK.pdf',
              fileName: 'Serum_IgE_Allergy_Panel_VK.pdf',
              fileType: 'application/pdf',
              uploadedAt: '2026-07-10T10:30:00.000Z',
              status: 'ANALYZED',
              findings: {
                documentType: 'lab_report',
                documentDate: '2026-07-10',
                testName: 'Total Serum IgE & Absolute Eosinophil Count (AEC)',
                summary: 'Elevated Total IgE (340 IU/mL, ref < 100) and elevated AEC (520 /mcL, ref 20-500) consistent with atopic allergic rhinitis.',
                labResults: [
                  { testName: 'Total Serum IgE', value: '340', unit: 'IU/mL', referenceRange: '< 100', status: 'High' },
                  { testName: 'Absolute Eosinophil Count (AEC)', value: '520', unit: '/mcL', referenceRange: '20 - 500', status: 'High' },
                  { testName: 'Hemoglobin', value: '14.8', unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'Normal' }
                ],
                importantFindings: ['Total IgE elevated at 340 IU/mL', 'Absolute eosinophil count elevated at 520 /mcL'],
                issuingDoctor: 'Dr. Sunita Rao, MD (Pathology)',
                facility: 'Apex Clinical Laboratories',
                patientNameOnDocument: 'VIKASH KUMAR'
              }
            }
          ]
        }

        histCase = await CaseModel.create({
          caseNumber: 'CASE-2026-0712-VK',
          patientId: effectivePatientId,
          patientUniqueCode: 'AC-VK2604',
          problem: 'Seasonal allergic rhinitis with morning sneezing, nasal congestion and watery eyes',
          duration: '1-2-weeks',
          severity: 'Routine',
          symptoms: ['Sneezing', 'Nasal Congestion', 'Watery Eyes', 'Mild Headache'],
          assessmentAnswers: [
            { sender: 'patient', text: 'Pichle 10 din se subah uthte hi lagataar 15-20 chhinke aati hain aur naak band rehti hai.', inputMode: 'text', timestamp: '2026-07-12T09:15:00.000Z' },
            { sender: 'ai', text: 'Kya aapko chhinkon ke alawa naak se paani aana ya aankhon mein jalan/khujli bhi hoti hai?', languageStyle: 'hinglish', timestamp: '2026-07-12T09:15:05.000Z' },
            { sender: 'patient', text: 'Haan aankhon mein jalan aur paani aana dono hota hai, khas karke subah ke waqt.', inputMode: 'text', timestamp: '2026-07-12T09:16:00.000Z' },
            { sender: 'ai', text: 'Samajh gaya. Kya aapko pehle se koi dust allergy ya asthma ki problem rahi hai?', languageStyle: 'hinglish', timestamp: '2026-07-12T09:16:05.000Z' },
            { sender: 'patient', text: 'Bachpan mein mild asthma tha par ab theek hai. Dust se zyada allergy hoti hai.', inputMode: 'text', timestamp: '2026-07-12T09:17:00.000Z' }
          ],
          aiAssessment: {
            triageLevel: 'Routine',
            suspectedCondition: 'Allergic Rhinitis',
            recommendedDepartment: 'General Medicine / ENT'
          },
          originalPatientResponse: 'Pichle 10 din se subah uthte hi lagataar 15-20 chhinke aati hain aur naak band rehti hai.',
          structuredHistory: histStructured,
          lifecycleStage: 'COMPLETED',
          status: 'Completed'
        })
      }

      // 4. Ensure Historical Outpatient Appointment: APT-2026-0712-VK
      const existingAppts = await AppointmentModel.getByPatientId(effectivePatientId)
      let histAppt = existingAppts.find(
        a => a.appointment_number === 'APT-2026-0712-VK' || a.appointmentNumber === 'APT-2026-0712-VK'
      )
      if (!histAppt) {
        histAppt = await AppointmentModel.create({
          appointmentNumber: 'APT-2026-0712-VK',
          patientId: effectivePatientId,
          doctorId: 1,
          hospitalId: 1,
          caseId: histCase?.id || null,
          tokenNumber: '#08',
          appointmentDate: '12 Jul 2026',
          timeSlot: '10:00 AM - 10:30 AM',
          opdRoom: 'Room 104',
          problem: 'Seasonal allergic rhinitis with morning sneezing bouts',
          severity: 'Routine',
          paymentMethod: 'Universal Public Health Free OPD Token',
          paymentStatus: 'Completed',
          status: 'Completed'
        })
      }

      // 5. Ensure Historical Doctor Prescription: RX-2026-0712-VK
      const existingRx = await PrescriptionModel.getByPatientId(effectivePatientId)
      let histRx = existingRx.find(
        r => r.rx_number === 'RX-2026-0712-VK' || r.rxNumber === 'RX-2026-0712-VK'
      )
      if (!histRx) {
        histRx = await PrescriptionModel.create({
          rxNumber: 'RX-2026-0712-VK',
          appointmentId: histAppt?.id || null,
          caseId: histCase?.id || null,
          patientId: effectivePatientId,
          patientUniqueCode: 'AC-VK2604',
          doctorId: 1,
          hospitalName: 'District Civil Hospital',
          roomNumber: 'Room 104',
          token: '#08',
          diagnosis: 'Moderate Allergic Rhinitis with Atopy',
          icdCode: 'ICD-10: J30.2',
          vitals: 'BP 118/76 · Temp 98.4°F · Pulse 72 bpm · SpO2 99%',
          pharmacyStatus: 'Dispensed',
          status: 'Issued',
          date: '12 Jul 2026',
          medicines: [
            {
              name: 'Levocetirizine 5mg + Montelukast 10mg Tablet',
              category: 'Antihistamine & Leukotriene Antagonist',
              dosage: '1 Tablet',
              frequency: 'Once Daily at Bedtime (HS)',
              duration: '14 Days (14 Tablets)',
              quantity: 14,
              instructions: 'Take with warm water before sleeping'
            },
            {
              name: 'Fluticasone Furoate Nasal Spray 27.5mcg',
              category: 'Corticosteroid Nasal Spray',
              dosage: '1 Spray each nostril',
              frequency: 'Once Daily in Morning (OD)',
              duration: '30 Days (1 Bottle)',
              quantity: 1,
              instructions: 'Prime bottle before first use; avoid blowing nose for 10 minutes'
            }
          ],
          notes: 'Avoid early morning dust exposure and cold water. Review in 1 month if uncontrolled.'
        })
      }

      // 6. Ensure Historical Diagnostic Request & Completed Report: REQ-2026-0712-VK / REP-2026-0712-VK
      const existingDiagReqs = await DiagnosticModel.getRequestsByPatientId(effectivePatientId)
      let histDiagReq = existingDiagReqs.find(
        d => d.request_number === 'REQ-2026-0712-VK' || d.requestNumber === 'REQ-2026-0712-VK'
      )
      if (!histDiagReq) {
        histDiagReq = await DiagnosticModel.createRequest({
          requestId: 'REQ-2026-0712-VK',
          requestNumber: 'REQ-2026-0712-VK',
          appointmentId: histAppt?.id || null,
          caseId: histCase?.id || null,
          patientId: effectivePatientId,
          patientUniqueCode: 'AC-VK2604',
          doctorId: 1,
          testName: 'Serum Total IgE & Complete Blood Count',
          testScan: 'Serum Total IgE & Complete Blood Count',
          category: 'Pathology',
          priority: 'Routine',
          clinicalNotes: 'Recurrent morning sneezing and seasonal rhinorrhea'
        })
      }

      const existingReports = await DiagnosticModel.getReportsByPatientId(effectivePatientId)
      let histReport = existingReports.find(
        r => r.report_id === 'REP-2026-0712-VK' || r.reportId === 'REP-2026-0712-VK'
      )
      if (!histReport) {
        histReport = await DiagnosticModel.createReport({
          reportId: 'REP-2026-0712-VK',
          requestId: histDiagReq?.id || 'REQ-2026-0712-VK',
          requestNumber: 'REQ-2026-0712-VK',
          patientId: effectivePatientId,
          patientUniqueCode: 'AC-VK2604',
          doctorId: 1,
          testName: 'Serum Total IgE & Complete Blood Count',
          testScan: 'Serum Total IgE & Complete Blood Count',
          category: 'Pathology',
          fileName: 'Serum_IgE_Allergy_Panel_VK.pdf',
          fileSize: '1.8 MB',
          findings: 'Elevated Total Serum IgE (340 IU/mL, normal < 100). Absolute Eosinophil Count 520 /mcL. Correlates with active allergic rhinitis.',
          impression: 'Atopic allergic phenotype with elevated eosinophil and IgE indices.',
          verifiedBy: 'Dr. Sunita Rao, MD (Pathology)'
        })
      }

      // 7. Ensure Historical Pharmacy Dispensing
      const existingDisp = await DispensingModel.getByPatientId(effectivePatientId)
      let histDisp = existingDisp.find(
        d => String(d.prescription_id) === String(histRx?.id) || d.patient_name === 'VIKASH KUMAR'
      )
      if (!histDisp && histRx) {
        await DispensingModel.create({
          patientId: effectivePatientId,
          prescriptionId: histRx.id,
          patientName: 'VIKASH KUMAR',
          items: [
            { name: 'Levocetirizine 5mg + Montelukast 10mg Tablet', dispensedQty: 14, batchNumber: 'BAT-2026-07-L14', status: 'Dispensed' },
            { name: 'Fluticasone Furoate Nasal Spray 27.5mcg', dispensedQty: 1, batchNumber: 'BAT-2026-07-F01', status: 'Dispensed' }
          ],
          status: 'Completed',
          dispensedAt: '2026-07-12T11:00:00.000Z'
        })
      }

      console.log(`[DemoSeedService] Verified synthetic demo patient VIKASH KUMAR (Mobile: 9546011026, Code: AC-VK2604) with complete historical records.`)
      return { success: true, patientId: effectivePatientId }
    } catch (e) {
      console.warn('[DemoSeedService] Error seeding demo patient:', e.message)
      return { success: false, error: e.message }
    }
  }
}

export default DemoSeedService
