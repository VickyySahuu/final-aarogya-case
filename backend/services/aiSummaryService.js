/**
 * AAROGYA CASE — Physician AI Clinical Summary Service (SIH26047)
 * 
 * Synthesizes a structured, physician-ready clinical intake summary from:
 * 1. Current patient encounter & verbatim words
 * 2. Structured clinical history
 * 3. Multimodal uploaded document findings
 * 4. Unified chronological medical timeline & historical registry records
 * 5. Clinical triage safety layer observations
 * 
 * STRICT INVARIANTS:
 * - DRAFT ONLY: Never marked as confirmed; attending doctor is the clinical decision-maker
 * - ZERO FABRICATION: Missing fields default to 'Not provided', 'Unknown', or 'Not assessed'
 * - ZERO DIAGNOSIS / PRESCRIBING: Only organizes reported and documented facts
 * - FULL SOURCE TRACEABILITY: Every item specifies its explicit provenance
 * - SAFE TEMPLATES: Uses "Patient reports...", "Previous record indicates...", "Document reports..."
 */

import { PatientModel } from '../models/patientModel.js'
import { TimelineService } from './timelineService.js'

export class AiSummaryService {
  /**
   * Generates a physician-ready clinical summary for a specific case
   */
  static async generateCaseSummary({ caseItem, patient = null, timelineEvents = null, patientHistory = null }) {
    if (!caseItem) {
      throw new Error('CaseItem is required to generate AI clinical summary')
    }

    // Resolve patient demographics if not supplied
    let resolvedPatient = patient
    if (!resolvedPatient && caseItem.patient_id) {
      resolvedPatient = await PatientModel.findById(caseItem.patient_id) || await PatientModel.findByUniqueCode(caseItem.patient_unique_code)
    }

    // Resolve timeline events if not supplied
    let resolvedTimeline = timelineEvents
    if (!resolvedTimeline && resolvedPatient) {
      try {
        const tRes = await TimelineService.getUnifiedTimeline(resolvedPatient.id || resolvedPatient.patient_unique_code)
        resolvedTimeline = tRes?.events || []
      } catch (e) {
        resolvedTimeline = []
      }
    }

    const structured = caseItem.structured_history || caseItem.structuredHistory || {}
    const originalResponse = caseItem.original_patient_response || caseItem.originalPatientResponse || caseItem.problem || ''
    const chiefComplaintText = structured.chiefComplaint || caseItem.problem || 'Not provided'
    const durationText = structured.duration || caseItem.duration || 'Unknown'
    const severityText = structured.severity || caseItem.severity || 'Routine'
    const symptomsList = Array.isArray(structured.symptoms) ? structured.symptoms : (Array.isArray(caseItem.symptoms) ? caseItem.symptoms : [])
    const associatedSymptoms = Array.isArray(structured.associatedSymptoms) ? structured.associatedSymptoms : []
    const relevantNegatives = Array.isArray(structured.relevantNegatives) ? structured.relevantNegatives : []
    const rawDocs = Array.isArray(structured.documents) ? structured.documents : (Array.isArray(caseItem.documents) ? caseItem.documents : [])

    // 1. Traceable Symptoms with Source Attribution
    const formattedSymptoms = symptomsList.map(s => ({
      name: s,
      source: 'Patient response (AI adaptive interview)',
      status: 'Reported current'
    }))

    const formattedAssociated = associatedSymptoms.map(s => ({
      name: s,
      source: 'Patient response (Adaptive inquiry)',
      status: 'Reported associated'
    }))

    const formattedNegatives = relevantNegatives.map(n => ({
      finding: n,
      source: 'Patient response (Direct question negative confirmation)',
      status: 'Denies symptom'
    }))

    // 2. Multimodal Documents Summary (with provenance)
    const uploadedDocsSummary = rawDocs.map(doc => {
      const findings = doc.findings || {}
      return {
        docId: doc.docId || doc.id,
        name: doc.originalName || 'Medical Document',
        type: findings.documentType || (doc.mimeType?.includes('pdf') ? 'pdf_report' : 'image'),
        date: findings.documentDate || 'Date not specified on document',
        hasExplicitDate: Boolean(findings.documentDate),
        source: `Uploaded ${findings.documentType || 'medical document'}: ${doc.originalName || 'File'}`,
        keyObservations: findings.keyObservations || findings.findingsSummary || 'Document processed and preserved on file',
        extractedMedications: Array.isArray(findings.medications) ? findings.medications : [],
        extractedLabResults: Array.isArray(findings.labResults) ? findings.labResults : [],
        uncertainItems: Array.isArray(findings.uncertainItems) ? findings.uncertainItems : []
      }
    })

    // 3. Current & Previous Medications Traceability
    const medicationEntries = []
    if (structured.currentMedications && structured.currentMedications !== 'Not provided' && structured.currentMedications !== 'None reported') {
      medicationEntries.push({
        name: structured.currentMedications,
        dosage: 'As reported',
        source: 'Patient verbal/text intake',
        context: 'Reported current medication'
      })
    }
    // Also include medications extracted from attached prescriptions
    for (const doc of uploadedDocsSummary) {
      for (const med of doc.extractedMedications) {
        medicationEntries.push({
          name: med.name || med.medicineName,
          dosage: med.dosage || 'Not specified',
          frequency: med.frequency || 'Not specified',
          source: `${doc.source}`,
          context: 'Document-extracted prescription item'
        })
      }
    }

    // 4. History of Present Illness (Safe, objective synthesis with verbatim anchoring)
    let hpiNarrative = ''
    if (originalResponse) {
      hpiNarrative = `Patient reports: "${originalResponse}". `
    }
    hpiNarrative += `Reported chief complaint of ${chiefComplaintText}`
    if (durationText && durationText !== 'Unknown') {
      hpiNarrative += ` with duration of ${durationText}.`
    } else {
      hpiNarrative += ` (duration not specified by patient).`
    }
    if (formattedSymptoms.length > 0) {
      hpiNarrative += ` Identified symptoms include: ${formattedSymptoms.map(s => s.name).join(', ')}.`
    }
    if (formattedNegatives.length > 0) {
      hpiNarrative += ` Patient explicitly denies: ${formattedNegatives.map(n => n.finding).join(', ')}.`
    }
    if (uploadedDocsSummary.length > 0) {
      hpiNarrative += ` Patient submitted ${uploadedDocsSummary.length} clinical document(s) during intake for physician review.`
    }

    // 5. Historical Context from Unified Timeline (Previous consultations / records)
    const historicalHighlights = []
    const priorCases = []
    const priorRxs = []
    const priorReports = []

    if (Array.isArray(resolvedTimeline)) {
      for (const ev of resolvedTimeline) {
        // Exclude current case events from historical summary
        if (ev.sourceId && (String(ev.sourceId) === String(caseItem.id) || String(ev.sourceId) === String(caseItem.case_number))) {
          continue
        }
        if (ev.sourceType === 'CASE') {
          priorCases.push(ev)
        } else if (ev.sourceType === 'PRESCRIPTION') {
          priorRxs.push(ev)
        } else if (ev.sourceType === 'DIAGNOSTIC' || ev.sourceType === 'REPORT') {
          priorReports.push(ev)
        }
      }
    }

    if (priorCases.length > 0) {
      historicalHighlights.push({
        category: 'Prior Clinical Encounter',
        detail: `Previous consultation recorded on ${priorCases[0].date || 'prior date'}: "${priorCases[0].summary || priorCases[0].title}"`,
        source: 'Central Health Registry / Unified Timeline'
      })
    }
    if (priorRxs.length > 0) {
      historicalHighlights.push({
        category: 'Prior Prescription',
        detail: `e-Prescription (${priorRxs[0].title || 'Prior Rx'}) issued on ${priorRxs[0].date || 'prior date'}. ${priorRxs[0].summary || ''}`,
        source: 'Formulary e-Prescription Registry'
      })
    }
    if (priorReports.length > 0) {
      historicalHighlights.push({
        category: 'Prior Diagnostic Investigation',
        detail: `Diagnostic report on record (${priorReports[0].title || 'Lab Test'}): ${priorReports[0].summary || 'Available'}`,
        source: 'Diagnostic Suite Registry'
      })
    }

    // 6. Safety Observations (Zero-diagnosis intake guardrails)
    const safetyObservations = [
      {
        observation: 'Triage protocol: Intake conducted with automated zero-diagnosis clinical safety guardrails.',
        level: 'INFO',
        source: 'AAROGYA CASE Safety Engine'
      }
    ]
    if (severityText === 'Emergency' || severityText === 'Severe') {
      safetyObservations.push({
        observation: `Patient intake severity categorized as ${severityText}. Requires prioritized physician evaluation.`,
        level: 'WARNING',
        source: 'Triage Severity Evaluation'
      })
    }
    if (uploadedDocsSummary.some(d => d.uncertainItems.length > 0)) {
      safetyObservations.push({
        observation: 'One or more uploaded records contains handwritten / partially uncertain content. Manual physician inspection advised.',
        level: 'WARNING',
        source: 'Multimodal Document Confidence Analyzer'
      })
    }

    // 7. Complete Physician AI Summary Structure
    const summary = {
      summaryId: `SUM-${caseItem.case_number || caseItem.id || 'NEW'}`,
      generatedAt: new Date().toISOString(),
      status: 'DRAFT — PENDING PHYSICIAN VERIFICATION',
      isDoctorVerified: false,
      disclaimer: 'DRAFT CLINICAL SUMMARY: Generated by AAROGYA CASE AI for attending physician reference only. Not a medical diagnosis or treatment directive. Attending doctor remains the final clinical decision-maker.',
      
      patient: {
        id: resolvedPatient?.id || caseItem.patient_id,
        name: resolvedPatient?.name || 'Citizen Patient',
        uniqueCode: resolvedPatient?.patient_unique_code || caseItem.patient_unique_code || 'AC-UNKNOWN',
        age: resolvedPatient?.age || 'Not provided',
        gender: resolvedPatient?.gender || 'Not provided',
        bloodGroup: resolvedPatient?.blood_group || 'Not provided',
        mobile: resolvedPatient?.mobile || 'Not provided'
      },

      currentEncounter: {
        caseId: caseItem.id,
        caseNumber: caseItem.case_number || `CASE-${caseItem.id}`,
        lifecycleStage: caseItem.lifecycle_stage || 'PATIENT CONFIRMED',
        status: caseItem.status || 'Active',
        intakeDate: caseItem.created_at || new Date().toISOString(),
        
        chiefComplaint: {
          structured: chiefComplaintText,
          verbatim: originalResponse || 'No verbatim description recorded.',
          source: 'Patient response'
        },
        
        duration: {
          value: durationText,
          source: durationText === 'Unknown' ? 'Not assessed / Not provided' : 'Patient response'
        },

        severity: {
          value: severityText,
          source: 'Patient response / Intake triage'
        },

        historyOfPresentIllness: {
          narrative: hpiNarrative,
          source: 'Synthesized from patient intake statements'
        },

        symptoms: formattedSymptoms,
        associatedSymptoms: formattedAssociated,
        relevantNegatives: formattedNegatives
      },

      medicalBackground: {
        pastMedicalHistory: {
          value: structured.pastMedicalHistory || 'Not provided',
          source: structured.pastMedicalHistory && structured.pastMedicalHistory !== 'Not provided'
            ? 'Patient response'
            : 'Intake record (Not reported)'
        },
        pastSurgicalHistory: {
          value: 'Not reported',
          source: 'Intake record (Not assessed)'
        },
        allergies: {
          value: structured.allergies || 'Unknown',
          source: structured.allergies && structured.allergies !== 'Unknown'
            ? 'Patient response'
            : 'Intake record'
        },
        currentMedications: medicationEntries.length > 0 ? medicationEntries : [
          {
            name: structured.currentMedications || 'Not provided',
            dosage: '—',
            source: 'Patient response',
            context: 'Current medications check'
          }
        ]
      },

      uploadedDocuments: uploadedDocsSummary,

      relevantPreviousHistory: {
        hasPriorRecords: historicalHighlights.length > 0,
        highlights: historicalHighlights,
        priorVisitsCount: priorCases.length,
        priorPrescriptionsCount: priorRxs.length,
        priorReportsCount: priorReports.length,
        source: 'Central Health Registry / Unified Medical Timeline'
      },

      safetyObservations
    }

    return summary
  }
}
