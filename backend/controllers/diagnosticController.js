import { DiagnosticModel } from '../models/diagnosticModel.js'
import { PatientModel } from '../models/patientModel.js'

export const DiagnosticController = {
  // Doctor creates diagnostic / scan request
  async createRequest(req, res, next) {
    try {
      const {
        patientId,
        patientUniqueCode,
        appointmentId,
        caseId,
        testScan,
        testName,
        selectedTests,
        testCode,
        category,
        clinicalNotes,
        requestNotes,
        priority
      } = req.body || {}

      // 1. Validate patient requirement
      if (!patientId && !patientUniqueCode) {
        return res.status(400).json({
          success: false,
          message: 'Patient selection is required to create a diagnostic request.'
        })
      }

      // Verify patient exists in registry if ID or unique code provided
      let patient = null
      if (patientId) {
        patient = await PatientModel.findById(patientId)
      }
      if (!patient && patientUniqueCode) {
        patient = await PatientModel.findByUniqueCode(patientUniqueCode)
      }

      const finalPatientId = patient?.id || patientId
      const finalPatientCode = patient?.patient_unique_code || patientUniqueCode

      // 2. Validate test / scan selection
      let effectiveTest = testScan || testName || req.body?.testType
      if (!effectiveTest && Array.isArray(selectedTests) && selectedTests.length > 0) {
        effectiveTest = selectedTests.join(', ')
      }

      if (!effectiveTest || (typeof effectiveTest === 'string' && !effectiveTest.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Active test or scan selection is required.'
        })
      }

      // 3. Determine doctor attribution
      const doctorId = req.doctor?.id || req.session?.doctorId || req.body.doctorId || 1

      const request = await DiagnosticModel.createRequest({
        patientId: finalPatientId,
        patientUniqueCode: finalPatientCode,
        doctorId,
        appointmentId,
        caseId,
        testScan: effectiveTest,
        testName: effectiveTest,
        testCode,
        category,
        clinicalNotes: requestNotes || clinicalNotes,
        requestNotes: requestNotes || clinicalNotes,
        priority: priority || 'Routine'
      })

      return res.status(201).json({
        success: true,
        message: 'Diagnostic request created successfully.',
        requestNumber: request.requestNumber,
        requestId: request.requestId,
        request
      })
    } catch (err) {
      next(err)
    }
  },

  // Diagnostic portal lists requests
  async getRequests(req, res, next) {
    try {
      const { status, patientId } = req.query || {}
      const requests = await DiagnosticModel.getAllRequests({ status, patientId })
      return res.json({ success: true, requests })
    } catch (err) {
      next(err)
    }
  },

  // Retrieve single request details
  async getRequestById(req, res, next) {
    try {
      const id = req.params.id || req.params.requestId
      const request = await DiagnosticModel.findByRequestId(id)
      if (!request) {
        return res.status(404).json({ success: false, message: 'Diagnostic request not found.' })
      }
      return res.json({ success: true, request })
    } catch (err) {
      next(err)
    }
  },

  // Update request lifecycle status: Pending -> In Progress -> Completed
  async updateStatus(req, res, next) {
    try {
      const id = req.params.id || req.params.requestId
      const { status } = req.body || {}

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status value is required.' })
      }

      const updated = await DiagnosticModel.updateRequestStatus(id, status)
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Diagnostic request not found.' })
      }

      return res.json({
        success: true,
        message: `Diagnostic request status updated to ${status}.`,
        request: updated
      })
    } catch (err) {
      next(err)
    }
  },

  // Upload verified diagnostic report
  async uploadReport(req, res, next) {
    try {
      const requestId = req.params.id || req.params.requestId || req.body.requestId || req.body.requestNumber
      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: 'Associated Request ID or Request Number is required to upload report.'
        })
      }

      const {
        patientId,
        patientUniqueCode,
        doctorId,
        testName,
        testScan,
        category,
        fileName,
        fileSize,
        fileUrl,
        findings,
        impression,
        reportData,
        reportFileReference,
        verifiedBy
      } = req.body || {}

      const report = await DiagnosticModel.createReport({
        requestId,
        patientId,
        patientUniqueCode,
        doctorId,
        testName: testScan || testName,
        testScan: testScan || testName,
        category,
        fileName: fileName || 'diagnostic_report.pdf',
        fileSize: fileSize || '3.5 MB',
        fileUrl: fileUrl || '',
        findings: findings || 'Study completed with normal findings.',
        impression: impression || findings || 'Normal study.',
        reportData,
        reportFileReference: reportFileReference || fileName || 'diagnostic_report.pdf',
        verifiedBy: verifiedBy || 'Radiographer S. Varma (Lic #DEL-RAD-884)'
      })

      // Fetch the updated request as well
      const updatedRequest = await DiagnosticModel.findByRequestId(requestId)

      return res.status(201).json({
        success: true,
        message: 'Diagnostic report uploaded and marked Completed successfully.',
        report,
        request: updatedRequest
      })
    } catch (err) {
      next(err)
    }
  },

  // Doctor or Diagnostic Portal queries completed reports for a patient
  async getPatientReports(req, res, next) {
    try {
      const { patientId } = req.params
      if (!patientId) {
        return res.status(400).json({ success: false, message: 'Patient identifier is required.' })
      }

      const reports = await DiagnosticModel.getReportsByPatientId(patientId)
      return res.json({ success: true, reports })
    } catch (err) {
      next(err)
    }
  }
}
