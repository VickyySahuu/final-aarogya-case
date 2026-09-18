import { AppointmentModel } from '../models/appointmentModel.js'
import { DoctorModel } from '../models/doctorModel.js'
import { HospitalModel } from '../models/hospitalModel.js'
import { PatientModel } from '../models/patientModel.js'

export function formatAppointment(a) {
  if (!a) return null
  const aptNum = a.appointment_number || a.appointmentNumber || `APT-${new Date().getFullYear()}-${String(a.id).padStart(4, '0')}`
  const token = a.token_number || a.token || `#${Math.floor(10 + Math.random() * 40)}`
  const pId = a.patient_id || a.patientId
  const patient = (pId ? PatientModel.getByIdSync?.(pId) : null) ||
    (a.patient_unique_code || a.patientUniqueCode ? PatientModel.findByUniqueCodeSync?.(a.patient_unique_code || a.patientUniqueCode) : null)

  const currentYear = new Date().getFullYear()
  const patientName = a.patient_name || a.patientName || patient?.name || ''
  const patientCode = a.patient_code_id || a.patientCode || patient?.patient_id || (pId ? `AC-${currentYear}-${pId}` : `AC-${currentYear}-000000`)
  const patientUniqueCode = a.patient_unique_code || a.patientUniqueCode || patient?.patient_unique_code || 'AC-000000'
  const patientAge = a.patient_age !== undefined ? a.patient_age : (a.patientAge !== undefined ? a.patientAge : (patient?.age || ''))
  const patientGender = a.patient_gender || a.patientGender || patient?.gender || ''
  const patientMobile = a.patient_mobile || a.patientMobile || patient?.mobile || ''

  return {
    id: a.id,
    appointmentId: a.id,
    appointmentNumber: aptNum,
    tokenNumber: token,
    token: token,
    patientId: pId,
    patient_id: pId,
    patientName,
    patientCode,
    patientUniqueCode,
    patientAge,
    patientGender,
    patientMobile,
    doctorId: a.doctor_id || a.doctorId,
    doctorName: a.doctor_name || a.doctorName || 'Dr. Ramanathan Venkatraman',
    doctorCode: a.doctor_code_id || a.doctorCode || 'DOC-1042',
    specialty: a.doctor_specialization || a.specialization || a.specialty || 'General Medicine',
    hospitalId: a.hospital_id || a.hospitalId,
    hospitalName: a.hospital_name || a.hospitalName || 'District Civil Hospital',
    hospitalAddress: a.hospital_address || a.hospitalAddress || 'Sector 4, Civil Lines, New Delhi — 110054',
    caseId: a.case_id || a.caseId || null,
    case_id: a.case_id || a.caseId || null,
    date: a.appointment_date || a.date,
    appointmentDate: a.appointment_date || a.date,
    time: a.time_slot || a.time,
    timeSlot: a.time_slot || a.time,
    room: a.opd_room || a.room || 'Room 104',
    opdRoom: a.opd_room || a.room || 'Room 104',
    counter: a.counter || 'Counter 02',
    problem: a.problem || a.chiefComplaint || 'Reported Outpatient Consultation',
    chiefComplaint: a.problem || a.chiefComplaint || 'Reported Outpatient Consultation',
    severity: a.severity || 'Moderate',
    paymentMethod: a.payment_method || a.paymentMode || 'Universal Public Health Free OPD Token',
    paymentMode: a.payment_method || a.paymentMode || 'Universal Public Health Free OPD Token',
    paymentStatus: a.payment_status || a.paymentStatus || 'Completed',
    status: a.status || 'Waiting for Doctor',
    createdAt: a.created_at || a.createdAt,
    updatedAt: a.updated_at || a.updatedAt
  }
}

export const AppointmentController = {
  // GET /api/appointments/slots?doctorId=...&date=...
  async getSlots(req, res, next) {
    try {
      const { doctorId = 1, date } = req.query
      const tomorrow = new Date(Date.now() + 86400000)
      const targetDate = date || tomorrow.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

      const morning = [
        '09:00 AM - 09:30 AM',
        '09:30 AM - 10:00 AM',
        '10:00 AM - 10:30 AM',
        '10:30 AM - 11:00 AM',
        '11:00 AM - 11:30 AM',
        '11:30 AM - 12:00 PM'
      ]

      const afternoon = [
        '12:00 PM - 12:30 PM',
        '12:30 PM - 01:00 PM',
        '01:00 PM - 01:30 PM'
      ]

      const booked = await AppointmentModel.getBookedSlotsForDate(doctorId, targetDate)

      const morningSlots = morning.map(slot => ({
        slot,
        isAvailable: !booked.includes(slot)
      }))

      const afternoonSlots = afternoon.map(slot => ({
        slot,
        isAvailable: !booked.includes(slot)
      }))

      return res.json({
        success: true,
        date: targetDate,
        doctorId,
        morningSlots,
        afternoonSlots,
        bookedSlots: booked
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/appointments
  async book(req, res, next) {
    try {
      const {
        hospitalId,
        doctorId,
        caseId,
        appointmentDate,
        date,
        timeSlot,
        problem,
        chiefComplaint,
        severity,
        paymentMethod,
        paymentStatus
      } = req.body

      const targetDate = appointmentDate || date
      const complaintText = problem || chiefComplaint

      if (!hospitalId) {
        return res.status(400).json({ success: false, message: 'Hospital selection is required' })
      }
      if (!doctorId) {
        return res.status(400).json({ success: false, message: 'Doctor selection is required' })
      }
      if (!targetDate || !timeSlot) {
        return res.status(400).json({ success: false, message: 'Appointment date and time slot are required' })
      }

      // Check for slot conflict
      const alreadyBooked = await AppointmentModel.isSlotBooked(doctorId, targetDate, timeSlot)
      if (alreadyBooked) {
        return res.status(409).json({
          success: false,
          message: 'Selected consultation time slot is already booked. Please select another slot.'
        })
      }

      // Resolve doctor room info
      const doctor = await DoctorModel.findById(doctorId) || await DoctorModel.getSingleDoctor()
      const hospital = await HospitalModel.findByHospitalId(hospitalId) || await HospitalModel.getPrimaryHospital()

      const patientId = req.patient.id
      const appointmentNumber = `APT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
      const tokenNumber = `#${Math.floor(10 + Math.random() * 40)}`

      const created = await AppointmentModel.create({
        appointmentNumber,
        patientId,
        doctorId: doctor?.id || doctorId,
        hospitalId: hospital?.id || hospitalId,
        caseId: caseId || null,
        tokenNumber,
        appointmentDate: targetDate,
        timeSlot,
        opdRoom: doctor?.room || 'Room 104',
        problem: complaintText || null,
        severity: severity || 'Moderate',
        paymentMethod: paymentMethod || 'Universal Public Health Free OPD Token',
        paymentStatus: paymentStatus || 'Completed',
        status: 'Waiting for Doctor'
      })

      const populated = await AppointmentModel.findById(created.id)
      console.log(`[AppointmentController] Appointment booked: ${appointmentNumber} (Token ${tokenNumber}) for Patient ${patientId}`)

      return res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        appointment: formatAppointment(populated || created)
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/appointments/:id
  async getById(req, res, next) {
    try {
      const { id } = req.params
      let appointment = null
      if (String(id).startsWith('APT-')) {
        appointment = await AppointmentModel.findByAppointmentNumber(id)
      } else {
        appointment = await AppointmentModel.findById(id)
      }

      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment record not found' })
      }

      // Security check: if patient is authenticated, ensure appointment belongs to them
      if (req.patient && String(appointment.patient_id) !== String(req.patient.id)) {
        return res.status(403).json({ success: false, message: 'Access denied: Appointment belongs to another citizen' })
      }

      return res.json({
        success: true,
        appointment: formatAppointment(appointment)
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/appointments
  async getAllForPatient(req, res, next) {
    try {
      const appointments = await AppointmentModel.getByPatientId(req.patient.id)
      return res.json({
        success: true,
        appointments: appointments.map(formatAppointment)
      })
    } catch (err) {
      next(err)
    }
  }
}
