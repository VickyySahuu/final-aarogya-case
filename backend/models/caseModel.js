import { query, isConnected } from '../db/index.js'
import { memoryCases, scheduleSaveFallbackState } from '../db/fallbackStore.js'
import { PatientModel } from './patientModel.js'

export const CaseModel = {
  clearMemory() {
    memoryCases.length = 0
    scheduleSaveFallbackState()
  },

  async create({
    caseNumber,
    patientId,
    patientUniqueCode,
    problem,
    duration,
    severity = null,
    symptoms = [],
    assessmentAnswers = [],
    aiAssessment = {},
    originalPatientResponse = null,
    structuredHistory = null,
    lifecycleStage = 'PATIENT CONFIRMED',
    status = 'Active'
  }) {
    let numPatientId = parseInt(patientId, 10)
    let patientRec = null
    if (isNaN(numPatientId)) {
      patientRec = PatientModel.getByIdSync?.(patientId)
      if (patientRec) numPatientId = patientRec.id
    } else {
      patientRec = PatientModel.getByIdSync?.(numPatientId)
    }
    const finalPatientUniqueCode = patientUniqueCode || patientRec?.patient_unique_code || (typeof patientId === 'string' && patientId.startsWith('AC-') ? patientId : null)

    const rawOriginalResponse = originalPatientResponse || problem || null

    const defaultQuestionState = {
      askedTopics: [],
      answeredTopics: [],
      skippedTopics: [],
      clarificationCount: {},
      currentTopic: null,
      completionStatus: 'IN_PROGRESS'
    }

    const defaultStructured = {
      chiefComplaint: problem || 'Not provided',
      duration: duration || 'Unknown',
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      associatedSymptoms: [],
      location: 'Not provided',
      severity: severity || 'Routine',
      pattern: 'Not provided',
      pastMedicalHistory: 'Not provided',
      currentMedications: 'Not provided',
      allergies: 'Unknown',
      relevantNegatives: [],
      additionalInformation: 'Not provided',
      questionState: defaultQuestionState
    }

    let finalStructured = structuredHistory
    if (!finalStructured || typeof finalStructured !== 'object') {
      finalStructured = defaultStructured
    } else {
      finalStructured = {
        ...defaultStructured,
        ...finalStructured,
        chiefComplaint: finalStructured.chiefComplaint || problem || 'Not provided',
        duration: finalStructured.duration || duration || 'Unknown',
        symptoms: Array.isArray(finalStructured.symptoms) ? finalStructured.symptoms : (Array.isArray(symptoms) ? symptoms : []),
        associatedSymptoms: Array.isArray(finalStructured.associatedSymptoms) ? finalStructured.associatedSymptoms : [],
        location: finalStructured.location || 'Not provided',
        severity: finalStructured.severity || severity || 'Routine',
        pattern: finalStructured.pattern || 'Not provided',
        pastMedicalHistory: finalStructured.pastMedicalHistory || 'Not provided',
        currentMedications: finalStructured.currentMedications || 'Not provided',
        allergies: finalStructured.allergies || 'Unknown',
        relevantNegatives: Array.isArray(finalStructured.relevantNegatives) ? finalStructured.relevantNegatives : [],
        additionalInformation: finalStructured.additionalInformation || 'Not provided',
        questionState: finalStructured.questionState || defaultQuestionState
      }
    }

    if (isConnected()) {
      try {
        const res = await query(
          `INSERT INTO patient_cases (
            case_number, patient_id, patient_unique_code, problem, duration, severity, symptoms, assessment_answers, ai_assessment, original_patient_response, structured_history, lifecycle_stage, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`,
          [
            caseNumber,
            numPatientId || patientId,
            finalPatientUniqueCode,
            problem,
            duration || null,
            severity || null,
            JSON.stringify(symptoms || []),
            JSON.stringify(assessmentAnswers || []),
            JSON.stringify(aiAssessment || {}),
            rawOriginalResponse,
            JSON.stringify(finalStructured),
            lifecycleStage || 'PATIENT CONFIRMED',
            status || 'Active'
          ]
        )
        if (res.rows.length > 0) {
          memoryCases.push(res.rows[0])
          scheduleSaveFallbackState()
          return res.rows[0]
        }
      } catch (err) {
        console.warn('[CaseModel] DB insert error, using memory fallback:', err.message)
      }
    }

    const newId = memoryCases.length > 0 ? Math.max(...memoryCases.map(c => c.id || 0)) + 1 : 1
    const newCase = {
      id: newId,
      case_number: caseNumber,
      patient_id: numPatientId || patientId,
      patient_unique_code: finalPatientUniqueCode,
      problem,
      duration: duration || null,
      severity: severity || null,
      symptoms: symptoms || [],
      assessment_answers: assessmentAnswers || [],
      ai_assessment: aiAssessment || {},
      original_patient_response: rawOriginalResponse,
      structured_history: finalStructured,
      lifecycle_stage: lifecycleStage || 'PATIENT CONFIRMED',
      status: status || 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    memoryCases.push(newCase)
    scheduleSaveFallbackState()
    return newCase
  },

  async findById(id) {
    const numId = parseInt(id, 10)
    if (isConnected() && !isNaN(numId)) {
      try {
        const res = await query('SELECT * FROM patient_cases WHERE id = $1 LIMIT 1', [numId])
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[CaseModel] DB query error, using memory fallback:', err.message)
      }
    }
    return memoryCases.find(c => c.id === numId) || null
  },

  findByIdSync(id) {
    const numId = parseInt(id, 10)
    return memoryCases.find(c => c.id === numId) || null
  },

  async findByCaseNumber(caseNumber) {
    if (!caseNumber) return null
    const str = String(caseNumber).trim()
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM patient_cases WHERE case_number = $1 LIMIT 1', [str])
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[CaseModel] DB query error, using memory fallback:', err.message)
      }
    }
    return memoryCases.find(c => (c.case_number || '').toUpperCase() === str.toUpperCase()) || null
  },

  async getByPatientId(patientId) {
    if (!patientId) return []
    const resolved = await PatientModel.resolvePatient(patientId)
    const numId = resolved?.id || (parseInt(patientId, 10) || null)
    const uniqueCode = resolved?.patient_unique_code || (typeof patientId === 'string' && patientId.startsWith('AC-') ? patientId : null)
    const isNum = typeof numId === 'number' && !isNaN(numId)

    if (isConnected()) {
      try {
        let sql = `
          SELECT c.* FROM patient_cases c
          LEFT JOIN patients p ON c.patient_id = p.id
          WHERE 1=0
        `
        const params = []
        if (isNum) {
          params.push(numId)
          sql += ` OR c.patient_id = $${params.length}`
        }
        if (uniqueCode) {
          params.push(uniqueCode)
          sql += ` OR UPPER(c.patient_unique_code) = UPPER($${params.length}) OR (p.patient_unique_code IS NOT NULL AND UPPER(p.patient_unique_code) = UPPER($${params.length}))`
        }
        sql += ` ORDER BY c.id DESC`

        const res = await query(sql, params)
        return res.rows
      } catch (err) {
        console.warn('[CaseModel] DB query error, using memory fallback:', err.message)
      }
    }

    return memoryCases
      .filter(c => 
        (isNum && (c.patient_id === numId || String(c.patientId) === String(numId))) ||
        (uniqueCode && c.patient_unique_code && c.patient_unique_code.toUpperCase() === uniqueCode.toUpperCase())
      )
      .sort((a, b) => b.id - a.id)
  },

  async update(id, fields) {
    const numId = parseInt(id, 10)
    const allowedKeys = {
      problem: 'problem',
      duration: 'duration',
      severity: 'severity',
      symptoms: 'symptoms',
      assessmentAnswers: 'assessment_answers',
      assessment_answers: 'assessment_answers',
      aiAssessment: 'ai_assessment',
      ai_assessment: 'ai_assessment',
      originalPatientResponse: 'original_patient_response',
      original_patient_response: 'original_patient_response',
      structuredHistory: 'structured_history',
      structured_history: 'structured_history',
      documents: 'documents',
      uploadedDocuments: 'documents',
      uploaded_documents: 'documents',
      lifecycleStage: 'lifecycle_stage',
      lifecycle_stage: 'lifecycle_stage',
      status: 'status'
    }

    const updates = {}
    for (const [k, v] of Object.entries(fields)) {
      if (allowedKeys[k] !== undefined && v !== undefined) {
        updates[allowedKeys[k]] = v
      }
    }

    if (isConnected()) {
      try {
        const keys = Object.keys(updates)
        if (keys.length === 0) return this.findById(numId)

        const setClauses = keys.map((k, idx) => `${k} = $${idx + 2}`)
        setClauses.push('updated_at = CURRENT_TIMESTAMP')

        const values = keys.map(k => {
          const val = updates[k]
          if (k === 'symptoms' || k === 'assessment_answers' || k === 'ai_assessment' || k === 'structured_history') {
            return typeof val === 'string' ? val : JSON.stringify(val)
          }
          return val
        })

        const res = await query(
          `UPDATE patient_cases SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
          [numId, ...values]
        )
        if (res.rows.length > 0) {
          const updated = res.rows[0]
          const memIdx = memoryCases.findIndex(c => c.id === numId)
          if (memIdx >= 0) memoryCases[memIdx] = updated
          else memoryCases.push(updated)
          scheduleSaveFallbackState()
          return updated
        }
      } catch (err) {
        console.warn('[CaseModel] DB update error, using memory fallback:', err.message)
      }
    }

    const item = memoryCases.find(c => c.id === numId)
    if (item) {
      for (const [k, v] of Object.entries(updates)) {
        item[k] = v
      }
      item.updated_at = new Date().toISOString()
      scheduleSaveFallbackState()
      return item
    }

    return null
  }
}
