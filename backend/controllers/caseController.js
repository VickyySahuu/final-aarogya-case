import { CaseModel } from '../models/caseModel.js'
import { AiCaseService } from '../services/aiCaseService.js'
import { DocumentService } from '../services/documentService.js'
import { AiSummaryService } from '../services/aiSummaryService.js'

export function formatCase(c) {
  if (!c) return null
  const parseJson = (val, fallback) => {
    if (!val) return fallback
    if (typeof val === 'object') return val
    try {
      return JSON.parse(val)
    } catch (e) {
      return fallback
    }
  }

  const structuredHistoryRaw = parseJson(c.structured_history || c.structuredHistory, null)
  const defaultQuestionState = {
    askedTopics: [],
    answeredTopics: [],
    skippedTopics: [],
    clarificationCount: {},
    currentTopic: null,
    completionStatus: 'IN_PROGRESS'
  }

  const defaultStructured = {
    chiefComplaint: c.problem || 'Not provided',
    duration: c.duration || 'Unknown',
    symptoms: parseJson(c.symptoms, []),
    associatedSymptoms: [],
    location: 'Not provided',
    severity: c.severity || 'Routine',
    pattern: 'Not provided',
    pastMedicalHistory: 'Not provided',
    currentMedications: 'Not provided',
    allergies: 'Unknown',
    relevantNegatives: [],
    additionalInformation: 'Not provided',
    questionState: defaultQuestionState
  }

  const structuredHistory = structuredHistoryRaw
    ? {
        ...defaultStructured,
        ...structuredHistoryRaw,
        chiefComplaint: structuredHistoryRaw.chiefComplaint || c.problem || 'Not provided',
        duration: structuredHistoryRaw.duration || c.duration || 'Unknown',
        symptoms: Array.isArray(structuredHistoryRaw.symptoms) ? structuredHistoryRaw.symptoms : parseJson(c.symptoms, []),
        associatedSymptoms: Array.isArray(structuredHistoryRaw.associatedSymptoms) ? structuredHistoryRaw.associatedSymptoms : [],
        location: structuredHistoryRaw.location || 'Not provided',
        severity: structuredHistoryRaw.severity || c.severity || 'Routine',
        pattern: structuredHistoryRaw.pattern || 'Not provided',
        pastMedicalHistory: structuredHistoryRaw.pastMedicalHistory || 'Not provided',
        currentMedications: structuredHistoryRaw.currentMedications || 'Not provided',
        allergies: structuredHistoryRaw.allergies || 'Unknown',
        relevantNegatives: Array.isArray(structuredHistoryRaw.relevantNegatives) ? structuredHistoryRaw.relevantNegatives : [],
        additionalInformation: structuredHistoryRaw.additionalInformation || 'Not provided',
        documents: Array.isArray(structuredHistoryRaw.documents) ? structuredHistoryRaw.documents : (Array.isArray(c.documents) ? c.documents : []),
        labResults: Array.isArray(structuredHistoryRaw.labResults) ? structuredHistoryRaw.labResults : (Array.isArray(c.labResults) ? c.labResults : []),
        questionState: structuredHistoryRaw.questionState || defaultQuestionState
      }
    : { ...defaultStructured, documents: [], labResults: [] }

  return {
    id: c.id,
    caseNumber: c.case_number || c.caseNumber,
    case_number: c.case_number || c.caseNumber,
    patientId: c.patient_id || c.patientId,
    patient_id: c.patient_id || c.patientId,
    patientUniqueCode: c.patient_unique_code || c.patientUniqueCode,
    patient_unique_code: c.patient_unique_code || c.patientUniqueCode,
    problem: c.problem,
    duration: c.duration,
    severity: c.severity,
    symptoms: parseJson(c.symptoms, []),
    assessmentAnswers: parseJson(c.assessment_answers || c.assessmentAnswers, []),
    aiAssessment: parseJson(c.ai_assessment || c.aiAssessment, {}),
    originalPatientResponse: typeof c.original_patient_response === 'string'
      ? c.original_patient_response
      : (typeof c.originalPatientResponse === 'string'
          ? c.originalPatientResponse
          : (c.problem && c.problem !== 'Pending clinical intake interview' ? c.problem : '')),
    original_patient_response: typeof c.original_patient_response === 'string'
      ? c.original_patient_response
      : (typeof c.originalPatientResponse === 'string'
          ? c.originalPatientResponse
          : (c.problem && c.problem !== 'Pending clinical intake interview' ? c.problem : '')),
    structuredHistory,
    structured_history: structuredHistory,
    documents: Array.isArray(structuredHistory.documents) ? structuredHistory.documents : [],
    labResults: Array.isArray(structuredHistory.labResults) ? structuredHistory.labResults : [],
    questionState: structuredHistory.questionState,
    lifecycleStage: c.lifecycle_stage || c.lifecycleStage || 'PATIENT CONFIRMED',
    lifecycle_stage: c.lifecycle_stage || c.lifecycleStage || 'PATIENT CONFIRMED',
    status: c.status || 'Active',
    createdAt: c.created_at || c.createdAt,
    updatedAt: c.updated_at || c.updatedAt
  }
}

export const CaseController = {
  // POST /api/patient-cases
  async create(req, res, next) {
    try {
      const {
        problem,
        duration,
        severity,
        symptoms,
        assessmentAnswers,
        aiAssessment,
        originalPatientResponse,
        structuredHistory,
        lifecycleStage,
        status
      } = req.body || {}

      if (!problem || !problem.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Problem / Chief complaint is required'
        })
      }

      const caseNumber = `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

      const patientId = req.patient.id
      const patientUniqueCode = req.patient.patient_unique_code || req.patient.patientUniqueCode

      const newCase = await CaseModel.create({
        caseNumber,
        patientId,
        patientUniqueCode,
        problem: problem.trim(),
        duration: duration || null,
        severity: severity || null,
        symptoms: Array.isArray(symptoms) ? symptoms : [],
        assessmentAnswers: Array.isArray(assessmentAnswers) ? assessmentAnswers : [],
        aiAssessment: aiAssessment || {},
        originalPatientResponse: originalPatientResponse || problem.trim(),
        structuredHistory: structuredHistory || null,
        lifecycleStage: lifecycleStage || 'PATIENT CONFIRMED',
        status: status || 'Active'
      })

      console.log(`[CaseController] Case created: ${newCase.case_number} for Patient ID ${patientId}`)

      return res.status(201).json({
        success: true,
        message: 'Patient case created successfully',
        case: formatCase(newCase)
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/patient-cases/interview/init
  // Rule 4: Resume active case if exists, else create new (never duplicate)
  // Rule 5: Authenticated patient is source of truth
  async initOrResumeInterview(req, res, next) {
    try {
      const patientId = req.patient.id
      const patientUniqueCode = req.patient.patient_unique_code || req.patient.patientUniqueCode

      const allCases = await CaseModel.getByPatientId(patientId)
      const existingCase = allCases.find(
        c => (c.status === 'Active' && c.lifecycle_stage !== 'COMPLETED')
      )

      if (existingCase) {
        const formatted = formatCase(existingCase)
        return res.status(200).json({
          success: true,
          isResumed: true,
          message: 'Active clinical case resumed successfully',
          case: formatted,
          conversationHistory: formatted.assessmentAnswers || [],
          questionState: formatted.questionState,
          initialQuestion: formatted.assessmentAnswers?.length > 0
            ? null
            : 'Hello. I am the Aarogya Case intake assistant. Please describe your health concern or main symptoms in your own words.'
        })
      }

      const caseNumber = `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      const newCase = await CaseModel.create({
        caseNumber,
        patientId,
        patientUniqueCode,
        problem: 'Pending clinical intake interview',
        duration: null,
        severity: 'Routine',
        symptoms: [],
        assessmentAnswers: [],
        aiAssessment: {},
        originalPatientResponse: null,
        structuredHistory: null,
        lifecycleStage: 'IN PROGRESS',
        status: 'Active'
      })

      const formatted = formatCase(newCase)
      return res.status(201).json({
        success: true,
        isResumed: false,
        message: 'New clinical case initialized successfully',
        case: formatted,
        conversationHistory: [],
        questionState: formatted.questionState,
        initialQuestion: 'Hello. I am the Aarogya Case intake assistant. Please describe your health concern or main symptoms in your own words.'
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/patient-cases/:id/interview
  // Rule 1: originalPatientResponse preserved verbatim, never overwritten by cumulative text
  // Rule 2: assessment_answers stores full conversation transcript separately
  // Rule 3: structuredHistory merged with existing info, never replaces
  // Rule 5: Patient ownership strictly enforced
  // Rule 6: Adaptive questions state-driven from structured state & missing info
  async processInterviewTurn(req, res, next) {
    try {
      const { id } = req.params
      const { message, conversationHistory = [], inputMode = 'text' } = req.body || {}

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Patient message cannot be empty'
        })
      }

      let caseItem = await CaseModel.findById(id)
      if (!caseItem && String(id).startsWith('CASE-')) {
        caseItem = await CaseModel.findByCaseNumber(id)
      }

      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: 'Patient case not found'
        })
      }

      // Strict ownership check
      if (String(caseItem.patient_id) !== String(req.patient.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Case does not belong to authenticated citizen'
        })
      }

      const formattedCaseItem = formatCase(caseItem)

      // Process turn via AI Service
      const aiTurnResult = await AiCaseService.processTurn({
        patientMessage: message.trim(),
        existingCase: formattedCaseItem,
        conversationHistory: Array.isArray(conversationHistory) && conversationHistory.length > 0
          ? conversationHistory
          : (formattedCaseItem.assessmentAnswers || [])
      })

      // Append turn to full interview transcript in assessment_answers
      const existingAnswers = Array.isArray(formattedCaseItem.assessmentAnswers)
        ? [...formattedCaseItem.assessmentAnswers]
        : []

      existingAnswers.push({
        sender: 'patient',
        text: message.trim(),
        inputMode: inputMode === 'voice' ? 'voice' : 'text',
        timestamp: new Date().toISOString()
      })
      existingAnswers.push({
        sender: 'ai',
        text: aiTurnResult.nextQuestion,
        languageStyle: aiTurnResult.languageStyle || 'english',
        touchOptions: aiTurnResult.touchOptions || null,
        nextStepGuidance: aiTurnResult.nextStepGuidance || null,
        timestamp: new Date().toISOString()
      })

      // Rule 1: Preserve original verbatim response from the first patient message
      let originalVerbatim = caseItem.original_patient_response
      if (!originalVerbatim || originalVerbatim === 'Pending clinical intake interview') {
        originalVerbatim = message.trim()
      }

      // Preserve existing attached documents & lab results from case
      const prevStructuredForDocs = typeof caseItem.structured_history === 'string'
        ? JSON.parse(caseItem.structured_history)
        : (caseItem.structured_history || caseItem.structuredHistory || {})
      const preservedDocs = Array.isArray(prevStructuredForDocs.documents) ? prevStructuredForDocs.documents : []
      const preservedLabs = Array.isArray(prevStructuredForDocs.labResults) ? prevStructuredForDocs.labResults : []

      const mergedTurnStructured = {
        ...aiTurnResult.extractedInformation,
        documents: preservedDocs,
        labResults: preservedLabs
      }

      // Update case state safely
      const updatePayload = {
        problem: aiTurnResult.extractedInformation.chiefComplaint || caseItem.problem,
        duration: aiTurnResult.extractedInformation.duration !== 'Unknown'
          ? aiTurnResult.extractedInformation.duration
          : caseItem.duration,
        severity: (aiTurnResult.extractedInformation.severity && aiTurnResult.extractedInformation.severity !== 'Routine' && aiTurnResult.extractedInformation.severity !== 'Not provided')
          ? aiTurnResult.extractedInformation.severity
          : caseItem.severity,
        symptoms: aiTurnResult.extractedInformation.symptoms,
        assessmentAnswers: existingAnswers,
        originalPatientResponse: originalVerbatim,
        structuredHistory: mergedTurnStructured,
        lifecycleStage: aiTurnResult.isComplete ? 'PATIENT CONFIRMED' : 'IN PROGRESS',
        status: 'Active'
      }

      const updated = await CaseModel.update(caseItem.id, updatePayload)

      return res.status(200).json({
        success: true,
        turnResult: aiTurnResult,
        case: formatCase(updated)
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/patient-cases/:id/interview/reset or POST /api/patient-cases/interview/reset
  async resetInterview(req, res, next) {
    try {
      const patientId = req.patient.id
      const { id } = req.params || {}

      let caseItem = null
      if (id) {
        caseItem = await CaseModel.findById(id)
        if (!caseItem && String(id).startsWith('CASE-')) {
          caseItem = await CaseModel.findByCaseNumber(id)
        }
      }

      if (!caseItem) {
        const allCases = await CaseModel.getByPatientId(patientId)
        caseItem = allCases.find(
          c => (c.status === 'Active' && c.lifecycle_stage !== 'COMPLETED')
        )
      }

      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: 'Active patient case not found to reset'
        })
      }

      // Strict patient ownership check
      if (String(caseItem.patient_id) !== String(patientId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Case does not belong to authenticated citizen'
        })
      }

      const defaultQuestionState = {
        askedTopics: [],
        answeredTopics: [],
        skippedTopics: [],
        clarificationCount: {},
        currentTopic: null,
        completionStatus: 'IN_PROGRESS'
      }

      const defaultStructured = {
        chiefComplaint: 'Not provided',
        duration: 'Unknown',
        symptoms: [],
        associatedSymptoms: [],
        location: 'Not provided',
        severity: 'Routine',
        pattern: 'Not provided',
        pastMedicalHistory: 'Not provided',
        currentMedications: 'Not provided',
        allergies: 'Unknown',
        relevantNegatives: [],
        additionalInformation: 'Not provided',
        questionState: defaultQuestionState
      }

      const resetPayload = {
        problem: 'Pending clinical intake interview',
        duration: null,
        severity: 'Routine',
        symptoms: [],
        assessmentAnswers: [],
        originalPatientResponse: '',
        original_patient_response: '',
        documents: [],
        uploadedDocuments: [],
        structuredHistory: { ...defaultStructured, documents: [], labResults: [] },
        lifecycleStage: 'IN PROGRESS',
        status: 'Active'
      }

      const updated = await CaseModel.update(caseItem.id, resetPayload)
      const formatted = formatCase(updated)

      return res.status(200).json({
        success: true,
        message: 'Clinical intake interview reset successfully. You can provide your health details again.',
        case: formatted,
        conversationHistory: [],
        questionState: formatted.questionState,
        initialQuestion: 'Hello. I am the Aarogya Case intake assistant. Please describe your health concern or main symptoms in your own words.'
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/patient-cases/:id/confirm
  async confirmCase(req, res, next) {
    try {
      const { id } = req.params
      const { structuredHistory } = req.body || {}

      let caseItem = await CaseModel.findById(id)
      if (!caseItem && String(id).startsWith('CASE-')) {
        caseItem = await CaseModel.findByCaseNumber(id)
      }

      if (!caseItem) {
        return res.status(404).json({ success: false, message: 'Patient case not found' })
      }

      // Strict ownership check
      if (String(caseItem.patient_id) !== String(req.patient.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Case does not belong to authenticated citizen'
        })
      }

      const updates = {
        lifecycleStage: 'PATIENT CONFIRMED',
        status: 'Active'
      }

      const existingStructured = typeof caseItem.structured_history === 'string'
        ? JSON.parse(caseItem.structured_history)
        : (caseItem.structured_history || caseItem.structuredHistory || {})

      const existingDocs = Array.isArray(existingStructured.documents) ? existingStructured.documents : []
      const existingLabs = Array.isArray(existingStructured.labResults) ? existingStructured.labResults : []

      if (structuredHistory && typeof structuredHistory === 'object') {
        const incomingDocs = Array.isArray(structuredHistory.documents) ? structuredHistory.documents : []
        const incomingLabs = Array.isArray(structuredHistory.labResults) ? structuredHistory.labResults : []
        updates.structuredHistory = {
          ...existingStructured,
          ...structuredHistory,
          documents: incomingDocs.length > 0 ? incomingDocs : existingDocs,
          labResults: incomingLabs.length > 0 ? incomingLabs : existingLabs
        }
        if (structuredHistory.chiefComplaint) {
          updates.problem = structuredHistory.chiefComplaint
        }
        if (structuredHistory.duration && structuredHistory.duration !== 'Unknown') {
          updates.duration = structuredHistory.duration
        }
        if (Array.isArray(structuredHistory.symptoms)) {
          updates.symptoms = structuredHistory.symptoms
        }
      } else {
        updates.structuredHistory = existingStructured
      }

      const updated = await CaseModel.update(caseItem.id, updates)
      return res.status(200).json({
        success: true,
        message: 'Patient case confirmed and ready for physician review',
        case: formatCase(updated)
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/patient-cases
  async getAll(req, res, next) {
    try {
      const cases = await CaseModel.getByPatientId(req.patient.id)
      return res.status(200).json({
        success: true,
        cases: cases.map(formatCase)
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/patient-cases/:id
  async getById(req, res, next) {
    try {
      const { id } = req.params
      let caseItem = await CaseModel.findById(id)
      if (!caseItem && String(id).startsWith('CASE-')) {
        caseItem = await CaseModel.findByCaseNumber(id)
      }

      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: 'Patient case not found'
        })
      }

      // Security check: ensure case belongs to the authenticated patient
      if (String(caseItem.patient_id) !== String(req.patient.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Case does not belong to authenticated citizen'
        })
      }

      return res.status(200).json({
        success: true,
        case: formatCase(caseItem)
      })
    } catch (err) {
      next(err)
    }
  },

  // PATCH /api/patient-cases/:id
  async update(req, res, next) {
    try {
      const { id } = req.params
      let caseItem = await CaseModel.findById(id)
      if (!caseItem && String(id).startsWith('CASE-')) {
        caseItem = await CaseModel.findByCaseNumber(id)
      }

      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: 'Patient case not found'
        })
      }

      // Security check: ensure case belongs to the authenticated patient
      if (String(caseItem.patient_id) !== String(req.patient.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Case does not belong to authenticated citizen'
        })
      }

      const updated = await CaseModel.update(caseItem.id, req.body)

      return res.status(200).json({
        success: true,
        message: 'Patient case updated successfully',
        case: formatCase(updated)
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/patient-cases/:id/documents
  // Multimodal AI document upload and analysis attached to current case
  async uploadAndAnalyzeDocument(req, res, next) {
    try {
      const { id } = req.params
      const patientId = req.patient.id

      let caseItem = await CaseModel.findById(id)
      if (!caseItem && String(id).startsWith('CASE-')) {
        caseItem = await CaseModel.findByCaseNumber(id)
      }

      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: 'Patient case not found'
        })
      }

      // Security check: ensure case belongs to the authenticated patient
      if (String(caseItem.patient_id) !== String(patientId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Case does not belong to authenticated citizen'
        })
      }

      let buffer = null
      let originalName = 'medical_document.pdf'
      let mimeType = 'application/pdf'
      let size = 0

      // Support multer file upload
      if (req.file) {
        buffer = req.file.buffer
        originalName = req.file.originalname || 'document'
        mimeType = req.file.mimetype || 'application/pdf'
        size = req.file.size || buffer.length
      } else if (req.body?.fileData) {
        // Support base64 JSON payload
        let base64String = req.body.fileData
        if (base64String.includes(';base64,')) {
          base64String = base64String.split(';base64,')[1]
        }
        buffer = Buffer.from(base64String, 'base64')
        originalName = req.body.fileName || 'medical_document'
        mimeType = req.body.fileType || 'application/pdf'
        size = buffer.length
      } else {
        return res.status(400).json({
          success: false,
          message: 'No document file provided. Please attach a PDF or image.'
        })
      }

      // Validate file format and size
      const validation = DocumentService.validateFile({ buffer, originalName, mimeType, size })
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        })
      }

      // Save document file securely on disk
      const savedDoc = await DocumentService.saveFile({
        caseId: caseItem.id,
        buffer,
        originalName,
        mimeType
      })

      const formattedCase = formatCase(caseItem)
      const languageStyle = req.body?.languageStyle || 'english'

      // Analyze document using Gemini / clinical document extractor
      const findings = await DocumentService.processAndAnalyze({
        buffer,
        mimeType: savedDoc.mimeType,
        fileName: savedDoc.originalName,
        existingCase: formattedCase,
        languageStyle
      })

      // Merge findings into structured history (with source attribution & conflict handling)
      const { mergedHistory, newDocEntry } = DocumentService.mergeFindingsIntoCase({
        existingCase: formattedCase,
        documentRecord: savedDoc,
        findings,
        languageStyle
      })

      // Generate document-aware adaptive follow-up question
      const followUp = DocumentService.generateDocumentFollowUpQuestion({
        findings,
        documentRecord: savedDoc,
        languageStyle,
        existingCase: formattedCase
      })

      // Record turn into conversation transcript
      const existingAnswers = Array.isArray(formattedCase.assessmentAnswers)
        ? [...formattedCase.assessmentAnswers]
        : []

      existingAnswers.push({
        sender: 'patient',
        text: `[Uploaded Document: ${savedDoc.originalName}]`,
        documentId: savedDoc.docId,
        documentName: savedDoc.originalName,
        inputMode: 'document',
        timestamp: new Date().toISOString()
      })

      existingAnswers.push({
        sender: 'ai',
        text: followUp.nextQuestion,
        languageStyle: followUp.languageStyle,
        touchOptions: followUp.touchOptions,
        documentFindingsSummary: followUp.summary,
        timestamp: new Date().toISOString()
      })

      // CRITICAL INVARIANT: original_patient_response must NEVER be overwritten by document upload!
      const originalVerbatim = caseItem.original_patient_response || caseItem.originalPatientResponse

      const updatePayload = {
        structuredHistory: mergedHistory,
        assessmentAnswers: existingAnswers,
        originalPatientResponse: originalVerbatim,
        status: 'Active'
      }

      const updated = await CaseModel.update(caseItem.id, updatePayload)

      return res.status(200).json({
        success: true,
        message: 'Document uploaded and analyzed successfully',
        document: newDocEntry,
        findings,
        turnResult: {
          nextQuestion: followUp.nextQuestion,
          languageStyle: followUp.languageStyle,
          touchOptions: followUp.touchOptions,
          summary: followUp.summary
        },
        case: formatCase(updated)
      })
    } catch (err) {
      next(err)
    }
  },

  // DELETE /api/patient-cases/:id/documents/:docId
  // Remove / discard an uploaded document from active case
  async deleteDocument(req, res, next) {
    try {
      const { id, docId } = req.params
      const patientId = req.patient.id

      let caseItem = await CaseModel.findById(id)
      if (!caseItem && String(id).startsWith('CASE-')) {
        caseItem = await CaseModel.findByCaseNumber(id)
      }

      if (!caseItem) {
        return res.status(404).json({ success: false, message: 'Patient case not found' })
      }

      // Security check
      if (String(caseItem.patient_id) !== String(patientId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Case does not belong to authenticated citizen'
        })
      }

      const formatted = formatCase(caseItem)
      const prevStructured = formatted.structuredHistory || {}
      const docs = Array.isArray(prevStructured.documents) ? prevStructured.documents : []
      const updatedDocs = docs.filter(d => d.id !== docId)

      const updatedHistory = {
        ...prevStructured,
        documents: updatedDocs
      }

      const updated = await CaseModel.update(caseItem.id, {
        structuredHistory: updatedHistory
      })

      return res.status(200).json({
        success: true,
        message: 'Document removed from case successfully',
        case: formatCase(updated)
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/patient-cases/:id/documents/:docId/file
  // Securely retrieve original document file
  async getDocumentFile(req, res, next) {
    try {
      const { id, docId } = req.params

      let caseItem = await CaseModel.findById(id)
      if (!caseItem && String(id).startsWith('CASE-')) {
        caseItem = await CaseModel.findByCaseNumber(id)
      }

      if (!caseItem) {
        return res.status(404).json({ success: false, message: 'Patient case not found' })
      }

      // If requested by a patient, verify patient ownership
      if (req.patient && String(caseItem.patient_id) !== String(req.patient.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Document does not belong to authenticated citizen'
        })
      }

      const formatted = formatCase(caseItem)
      const docs = formatted.documents || []
      const docEntry = docs.find(d => d.id === docId)

      if (!docEntry) {
        return res.status(404).json({ success: false, message: 'Document not found in case' })
      }

      const filePath = DocumentService.getFilePath(caseItem.id, docEntry.storedFileName)
      if (!filePath) {
        return res.status(404).json({ success: false, message: 'Document file not found on server' })
      }

      res.setHeader('Content-Type', docEntry.mimeType || 'application/octet-stream')
      res.setHeader('Content-Disposition', `inline; filename="${docEntry.originalName || 'document'}"`)
      return res.sendFile(filePath)
    } catch (err) {
      next(err)
    }
  },

  // GET /api/patient-cases/:id/summary
  // Physician AI Clinical Summary with source traceability and patient isolation
  async getAiSummary(req, res, next) {
    try {
      const { id } = req.params
      let caseItem = await CaseModel.findById(id)
      if (!caseItem && String(id).startsWith('CASE-')) {
        caseItem = await CaseModel.findByCaseNumber(id)
      }

      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: 'Patient case not found'
        })
      }

      // Security / Patient Isolation:
      // If the caller is a patient, enforce strict case ownership
      if (req.patient && String(caseItem.patient_id) !== String(req.patient.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Case summary does not belong to authenticated citizen'
        })
      }

      const summary = await AiSummaryService.generateCaseSummary({
        caseItem,
        patient: req.patient || null
      })

      return res.status(200).json({
        success: true,
        summary
      })
    } catch (err) {
      next(err)
    }
  }
}
