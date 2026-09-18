import { CaseModel } from '../models/caseModel.js'
import { AppointmentModel } from '../models/appointmentModel.js'
import { PrescriptionModel } from '../models/prescriptionModel.js'
import { DiagnosticModel } from '../models/diagnosticModel.js'
import { DispensingModel } from '../models/dispensingModel.js'
import { PatientModel } from '../models/patientModel.js'

/**
 * Unified Medical Timeline Service for AAROGYA CASE
 * Aggregates and chronologically normalizes all clinical records:
 * - Consultations & Clinical Cases
 * - Uploaded Medical Documents & Extracted Findings
 * - Doctor Prescriptions & Medications
 * - Diagnostic Requests & Completed Laboratory/Imaging Reports
 * - Hospital Pharmacy Dispensings
 * - Outpatient Appointments
 */

function parseComparableDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

export const TimelineService = {
  /**
   * Builds a unified, chronologically sorted clinical timeline for a patient
   */
  async getPatientTimeline(patientId) {
    if (!patientId) return { patient: null, events: [], totalEvents: 0 }

    const patient = await PatientModel.resolvePatient(patientId)
    const resolvedId = patient ? patient.id : (parseInt(patientId, 10) || patientId)

    // Fetch all clinical records in parallel
    const [
      cases,
      appointments,
      prescriptions,
      diagnosticRequests,
      diagnosticReports,
      dispensings
    ] = await Promise.all([
      CaseModel.getByPatientId(resolvedId).catch(() => []),
      AppointmentModel.getByPatientId(resolvedId).catch(() => []),
      PrescriptionModel.getByPatientId(resolvedId).catch(() => []),
      DiagnosticModel.getRequestsByPatientId(resolvedId).catch(() => []),
      DiagnosticModel.getReportsByPatientId(resolvedId).catch(() => []),
      DispensingModel.getByPatientId(resolvedId).catch(() => [])
    ])

    const events = []
    const seenDocumentIds = new Set()

    // 1. Cases & Attached Uploaded Documents
    for (const c of cases) {
      const caseId = c.id
      const caseNum = c.case_number || c.caseNumber || `CASE-${c.id}`
      const hist = c.structured_history || {}
      const chiefComplaint = hist.chiefComplaint || c.problem || 'Clinical Consultation'
      const duration = hist.duration || 'Not specified'
      const symptoms = Array.isArray(hist.symptoms) ? hist.symptoms : []
      const originalVerbatim = c.original_patient_response || c.originalPatientResponse || ''

      // Case Event
      events.push({
        eventId: `EVT-CASE-${caseId}`,
        eventDate: c.created_at || c.date || new Date().toISOString(),
        hasExplicitDate: true,
        recordedAt: c.created_at || new Date().toISOString(),
        eventType: 'CONSULTATION_CASE',
        title: `Clinical Consultation: ${chiefComplaint}`,
        summary: `Patient presented with ${chiefComplaint}${duration ? ` for ${duration}` : ''}.${symptoms.length > 0 ? ` Reported symptoms: ${symptoms.join(', ')}.` : ''}`,
        sourceType: 'PATIENT',
        sourceLabel: 'Source: Patient Clinical Intake (AI-Assisted)',
        sourceId: String(caseId),
        caseId: caseId,
        status: c.status || 'Active',
        category: hist.category || 'General Medicine',
        doctorName: c.doctor_name || null,
        facility: c.hospital_name || 'Outpatient Department',
        details: {
          caseNumber: caseNum,
          chiefComplaint,
          duration,
          symptoms,
          originalPatientResponse: originalVerbatim,
          pastMedicalHistory: hist.pastMedicalHistory || 'None reported',
          knownAllergies: hist.knownAllergies || 'Unknown',
          relevantNegatives: hist.relevantNegatives || [],
          transcriptTurns: Array.isArray(c.assessment_answers) ? c.assessment_answers.length : 0
        }
      })

      // Attached Uploaded Documents
      const rawDocs = [
        ...(Array.isArray(hist.documents) ? hist.documents : []),
        ...(Array.isArray(c.documents) ? c.documents : []),
        ...(Array.isArray(c.uploadedDocuments) ? c.uploadedDocuments : []),
        ...(Array.isArray(c.uploaded_documents) ? c.uploaded_documents : [])
      ]

      for (const doc of rawDocs) {
        if (!doc) continue
        const docId = doc.id || doc.docId || doc.storedFileName || (doc.fileName ? `DOC-${doc.fileName}` : `DOC-${Math.random()}`)
        if (seenDocumentIds.has(docId)) continue
        seenDocumentIds.add(docId)

        const originalName = doc.originalName || doc.fileName || doc.title || 'Medical Document'
        const findings = doc.findings || {}
        const rawType = (findings.documentType || doc.documentType || 'document').toLowerCase()
        const isLab = rawType.includes('lab') || rawType.includes('diagnostic') || rawType.includes('radiology') || rawType.includes('pathology')
        const isRx = rawType.includes('prescription') || rawType.includes('medication')
        const docType = isLab ? 'lab_report' : isRx ? 'prescription' : rawType

        const docDate = findings.documentDate || doc.documentDate || doc.date || null
        const eventType = isLab ? 'LAB_REPORT' : isRx ? 'PRESCRIPTION' : 'UPLOADED_DOCUMENT'
        const sourceLabel = isRx
          ? `Source: Uploaded Prescription (${originalName})`
          : isLab
            ? `Source: Uploaded Lab Report (${originalName})`
            : `Source: Uploaded Document (${originalName})`

        const findingsSummary = Array.isArray(findings.importantFindings) && findings.importantFindings.length > 0
          ? findings.importantFindings.join('. ')
          : findings.summary
            ? findings.summary
            : isLab && Array.isArray(findings.labResults) && findings.labResults.length > 0
              ? findings.labResults.map(l => `${l.testName || l.test}: ${l.value} ${l.unit || ''}`).join(', ')
              : isRx && Array.isArray(findings.medications) && findings.medications.length > 0
                ? findings.medications.map(m => `${m.name} (${m.dosage || 'prescribed'})`).join(', ')
                : `Uploaded ${docType.replace('_', ' ')} record.`

        events.push({
          eventId: `EVT-DOC-${docId}`,
          eventDate: docDate, // NEVER invent date if not present on document
          hasExplicitDate: !!docDate,
          recordedAt: doc.uploadedAt || c.created_at || new Date().toISOString(),
          eventType,
          title: `${docType.replace('_', ' ').toUpperCase()}: ${originalName}`,
          summary: findingsSummary,
          sourceType: 'DOCUMENT',
          sourceLabel,
          sourceId: String(docId),
          caseId: caseId,
          status: doc.status || 'Analyzed',
          category: isLab ? 'Laboratory / Pathology' : isRx ? 'Prescription / Medications' : 'Clinical Records',
          doctorName: findings.issuingDoctor || doc.doctorName || null,
          facility: findings.facility || doc.provider || null,
          details: {
            fileName: originalName,
            documentType: docType,
            documentDate: docDate,
            uploadedAt: doc.uploadedAt || c.created_at,
            issuingDoctor: findings.issuingDoctor || doc.doctorName,
            facility: findings.facility || doc.provider,
            patientNameOnDocument: findings.patientNameOnDocument || doc.patientName,
            medications: findings.medications || [],
            labResults: findings.labResults || findings.labValues || [],
            investigations: findings.investigations || [],
            importantFindings: findings.importantFindings || [],
            uncertainItems: findings.uncertainItems || [],
            fileUrl: `/api/patient-cases/${caseId}/documents/${docId}/file`
          }
        })
      }
    }

    // 2. Outpatient Appointments
    for (const appt of appointments) {
      const apptId = appt.id
      const apptNum = appt.appointment_number || appt.appointmentNumber || `APT-${appt.id}`
      const doctorName = appt.doctor_name || appt.doctorName || 'Consultant Physician'
      const hospitalName = appt.hospital_name || appt.hospitalName || 'District Civil Hospital'
      const apptDate = appt.appointment_date || appt.appointmentDate || appt.created_at

      events.push({
        eventId: `EVT-APPT-${apptId}`,
        eventDate: apptDate || null,
        hasExplicitDate: !!apptDate,
        recordedAt: appt.created_at || new Date().toISOString(),
        eventType: 'APPOINTMENT',
        title: `Doctor Consultation: ${doctorName}`,
        summary: `Appointment scheduled at ${hospitalName} (${appt.time_slot || 'Regular Slot'}). ${appt.chief_complaint ? `Reason: ${appt.chief_complaint}.` : ''} Status: ${appt.status || 'Confirmed'}.`,
        sourceType: 'APPOINTMENT',
        sourceLabel: `Source: Hospital Appointment (${hospitalName})`,
        sourceId: String(apptId),
        status: appt.status || 'Confirmed',
        category: appt.category || 'Outpatient Consultation',
        doctorName: doctorName,
        facility: hospitalName,
        details: {
          appointmentNumber: apptNum,
          timeSlot: appt.time_slot || appt.timeSlot,
          room: appt.room || appt.opd_room,
          chiefComplaint: appt.chief_complaint || appt.problem
        }
      })
    }

    // 3. Doctor Prescriptions
    for (const rx of prescriptions) {
      const rxId = rx.id
      const rxNum = rx.prescription_number || rx.prescriptionNumber || rx.rx_number || rx.rxNumber || `RX-${rx.id}`
      const doctorName = rx.doctor_name || rx.doctorName || 'Consultant Doctor'
      const hospitalName = rx.hospital_name || rx.hospitalName || 'District Civil Hospital'
      const rxDate = rx.date || rx.created_at
      const medicines = Array.isArray(rx.medicines) ? rx.medicines : []

      events.push({
        eventId: `EVT-RX-${rxId}`,
        eventDate: rxDate || null,
        hasExplicitDate: !!rxDate,
        recordedAt: rx.created_at || new Date().toISOString(),
        eventType: 'PRESCRIPTION',
        title: `Prescription Issued: ${rxNum}`,
        summary: `Prescribed by ${doctorName} (${medicines.length} medication(s): ${medicines.map(m => m.name || m.medicineName).slice(0, 3).join(', ')}${medicines.length > 3 ? '...' : ''}).`,
        sourceType: 'PRESCRIPTION',
        sourceLabel: `Source: Doctor Prescription (${doctorName})`,
        sourceId: String(rxId),
        status: rx.status || 'Issued',
        category: 'Pharmacy & Therapeutics',
        doctorName: doctorName,
        facility: hospitalName,
        details: {
          prescriptionNumber: rxNum,
          medicines,
          clinicalNotes: rx.clinical_notes || rx.notes,
          diagnosis: rx.diagnosis,
          pharmacyStatus: rx.pharmacy_status || rx.pharmacyStatus || 'Pending'
        }
      })
    }

    // 4. Diagnostic Investigations Ordered
    for (const req of diagnosticRequests) {
      const reqId = req.id
      const reqNum = req.request_number || req.requestNumber || req.request_id || req.requestId || `REQ-${req.id}`
      const testName = req.test_name || req.testName || req.test_scan || req.testScan || 'Diagnostic Investigation'
      const doctorName = req.doctor_name || req.doctorName || 'Attending Physician'

      events.push({
        eventId: `EVT-DIAG-REQ-${reqId}`,
        eventDate: req.created_at || null,
        hasExplicitDate: !!req.created_at,
        recordedAt: req.created_at || new Date().toISOString(),
        eventType: 'DIAGNOSTIC_INVESTIGATION',
        title: `Diagnostic Investigation Ordered: ${testName}`,
        summary: `Ordered by ${doctorName}. Investigation category: ${req.category || 'Diagnostic Test'}. Status: ${req.status || 'Pending'}.`,
        sourceType: 'DIAGNOSTIC',
        sourceLabel: `Source: Diagnostic Order (${doctorName})`,
        sourceId: String(reqId),
        status: req.status || 'Pending',
        category: req.category || 'Diagnostic & Imaging',
        doctorName: doctorName,
        details: {
          requestNumber: reqNum,
          testName,
          category: req.category,
          clinicalNotes: req.clinical_notes || req.request_notes
        }
      })
    }

    // 5. Diagnostic Test Reports
    for (const rep of diagnosticReports) {
      const repId = rep.id
      const repNum = rep.report_id || rep.reportId || `REP-${rep.id}`
      const testName = rep.test_name || rep.testName || rep.test_scan || rep.testScan || 'Laboratory Report'
      const verifiedBy = rep.verified_by || rep.verifiedBy || 'Consultant Pathologist'

      events.push({
        eventId: `EVT-DIAG-REP-${repId}`,
        eventDate: rep.created_at || null,
        hasExplicitDate: !!rep.created_at,
        recordedAt: rep.created_at || new Date().toISOString(),
        eventType: 'LAB_REPORT',
        title: `Diagnostic Report: ${testName}`,
        summary: rep.findings || rep.impression || `Test completed and verified by ${verifiedBy}.`,
        sourceType: 'DIAGNOSTIC',
        sourceLabel: `Source: Diagnostic Laboratory (${verifiedBy})`,
        sourceId: String(repId),
        status: rep.status || 'Completed',
        category: rep.category || 'Laboratory Pathology',
        doctorName: verifiedBy,
        details: {
          reportId: repNum,
          testName,
          findings: rep.findings,
          impression: rep.impression,
          verifiedBy: verifiedBy,
          fileUrl: rep.file_url || rep.fileUrl,
          fileName: rep.file_name || rep.fileName
        }
      })
    }

    // 6. Pharmacy Dispensings
    for (const disp of dispensings) {
      const dispId = disp.id
      const dispNum = disp.dispensing_number || disp.dispensingNumber || `DISP-${disp.id}`
      const items = Array.isArray(disp.dispensed_items) ? disp.dispensed_items : (Array.isArray(disp.items) ? disp.items : [])
      const dispDate = disp.delivered_at || disp.dispensed_at || disp.created_at

      events.push({
        eventId: `EVT-DISP-${dispId}`,
        eventDate: dispDate || null,
        hasExplicitDate: !!dispDate,
        recordedAt: disp.created_at || new Date().toISOString(),
        eventType: 'PHARMACY_DISPENSING',
        title: `Medication Dispensed: ${dispNum}`,
        summary: `Dispensed ${items.length} medication(s) (${items.map(i => i.medicineName || i.name).slice(0, 3).join(', ')}). Dispensed by: ${disp.dispensed_by || 'Hospital Pharmacist'}.`,
        sourceType: 'PHARMACY',
        sourceLabel: `Source: Hospital Pharmacy Dispensing (${disp.dispensed_by || 'Pharmacist Lead'})`,
        sourceId: String(dispId),
        status: disp.status || 'Dispensed',
        category: 'Pharmacy Dispensing',
        details: {
          dispensingNumber: dispNum,
          rxNumber: disp.rx_number || disp.rxNumber,
          dispensedItems: items,
          dispensedBy: disp.dispensed_by || disp.dispensedBy,
          deliveryVerifiedBy: disp.delivery_verified_by || disp.deliveryVerifiedBy,
          deliveredAt: disp.delivered_at || disp.deliveredAt
        }
      })
    }

    // 7. Chronological Sorting (Newest first)
    events.sort((a, b) => {
      const dateA = parseComparableDate(a.eventDate)
      const dateB = parseComparableDate(b.eventDate)

      if (dateA && dateB) {
        const diff = dateB.getTime() - dateA.getTime()
        if (diff !== 0) return diff
      } else if (dateA && !dateB) {
        return -1 // Events with known clinical dates come before unknown dates
      } else if (!dateA && dateB) {
        return 1
      }

      // Secondary sort: recordedAt
      const recA = parseComparableDate(a.recordedAt) || new Date(0)
      const recB = parseComparableDate(b.recordedAt) || new Date(0)
      const recDiff = recB.getTime() - recA.getTime()
      if (recDiff !== 0) return recDiff

      // Deterministic tie-breaker
      return String(b.eventId).localeCompare(String(a.eventId))
    })

    return {
      success: true,
      patient: patient ? {
        id: patient.id,
        patientId: patient.patient_id,
        uniqueCode: patient.patient_unique_code,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.blood_group
      } : null,
      events,
      totalEvents: events.length
    }
  },

  async getUnifiedTimeline(patientId) {
    return this.getPatientTimeline(patientId)
  }
}

export const timelineService = TimelineService
export default TimelineService

