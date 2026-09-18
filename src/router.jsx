import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import PageTransition from './components/transitions/PageTransition'
import HomePage from './pages/HomePage'

// Emergency Module
import EmergencyEntryPage from './pages/emergency/EmergencyEntryPage'
import EmergencyCallPage from './pages/emergency/EmergencyCallPage'
import RequestAmbulanceLocationPage from './pages/emergency/RequestAmbulanceLocationPage'
import AmbulanceAssignedPage from './pages/emergency/AmbulanceAssignedPage'
import AmbulanceLiveLocationPage from './pages/emergency/AmbulanceLiveLocationPage'

// Doctor Portal
import DoctorLoginPage from './pages/doctor/DoctorLoginPage'
import DoctorForgotPasswordPage from './pages/doctor/DoctorForgotPasswordPage'
import DoctorSessionExpiredPage from './pages/doctor/DoctorSessionExpiredPage'
import DoctorLogoutPage from './pages/doctor/DoctorLogoutPage'
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage'
import OpdQueuePage from './pages/doctor/OpdQueuePage'
import PatientCasePage from './pages/doctor/PatientCasePage'
import DoctorNotesPage from './pages/doctor/DoctorNotesPage'
import DiagnosticRequestPage from './pages/doctor/DiagnosticRequestPage'
import DiagnosticReportPage from './pages/doctor/DiagnosticReportPage'
import PrescriptionPage from './pages/doctor/PrescriptionPage'
import FinalApprovalPage from './pages/doctor/FinalApprovalPage'
import CaseCompletedPage from './pages/doctor/CaseCompletedPage'
import DoctorProfilePage from './pages/doctor/DoctorProfilePage'
import PatientSearchPage from './pages/doctor/PatientSearchPage'
import PendingWorkPage from './pages/doctor/PendingWorkPage'

// Pharmacy Portal (05.01 - 05.08)
import PharmacyLoginPage from './pages/pharmacy/PharmacyLoginPage'
import PharmacyDashboardPage from './pages/pharmacy/PharmacyDashboardPage'
import AddMedicinePage from './pages/pharmacy/AddMedicinePage'
import PharmacyPrescriptionListPage from './pages/pharmacy/PharmacyPrescriptionListPage'
import PharmacyPrescriptionPage from './pages/pharmacy/PharmacyPrescriptionPage'
import DispenseMedicinePage from './pages/pharmacy/DispenseMedicinePage'
import DeliveryVerifyPage from './pages/pharmacy/DeliveryVerifyPage'
import DeliveryCompletedPage from './pages/pharmacy/DeliveryCompletedPage'
import PharmacyHistoryPage from './pages/pharmacy/PharmacyHistoryPage'
import PharmacyProfilePage from './pages/pharmacy/PharmacyProfilePage'

// Diagnostic & Scan Portal (06.01 - 06.06)
import DiagnosticLoginPage from './pages/diagnostic/DiagnosticLoginPage'
import DiagnosticDashboardPage from './pages/diagnostic/DiagnosticDashboardPage'
import TestScanRequestPage from './pages/diagnostic/TestScanRequestPage'
import PerformTestScanPage from './pages/diagnostic/PerformTestScanPage'
import ReportUploadPage from './pages/diagnostic/ReportUploadPage'
import ReportCompletedPage from './pages/diagnostic/ReportCompletedPage'
import DiagnosticProfilePage from './pages/diagnostic/DiagnosticProfilePage'

// Ambulance Portal (07.01 - 07.06)
import AmbulanceLoginPage from './pages/ambulance/AmbulanceLoginPage'
import AmbulanceDashboardPage from './pages/ambulance/AmbulanceDashboardPage'
import EmergencyRequestPage from './pages/ambulance/EmergencyRequestPage'
import PatientLocationPage from './pages/ambulance/PatientLocationPage'
import UpdateAmbulanceStatusPage from './pages/ambulance/UpdateAmbulanceStatusPage'
import AmbulanceCompletedPage from './pages/ambulance/AmbulanceCompletedPage'
import SceneAssessmentPage from './pages/ambulance/SceneAssessmentPage'

// Admin Portal (08.01 - 08.07)
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import ManageDoctorPage from './pages/admin/ManageDoctorPage'
import ManageHospitalPage from './pages/admin/ManageHospitalPage'
import ManageMedicinePage from './pages/admin/ManageMedicinePage'
import ManageDiagnosticPage from './pages/admin/ManageDiagnosticPage'
import ManageAmbulancePage from './pages/admin/ManageAmbulancePage'
import AdminProfilePage from './pages/admin/AdminProfilePage'

// Patient Portal (03.01 - 03.31)
import PatientPortalEntryPage from './pages/patient/PatientPortalEntryPage'
import PatientLoginPage from './pages/patient/PatientLoginPage'
import PatientRegistrationPage from './pages/patient/PatientRegistrationPage'
import PatientOtpPage from './pages/patient/PatientOtpPage'
import PatientRegistrationCompletePage from './pages/patient/PatientRegistrationCompletePage'
import PatientHomePage from './pages/patient/PatientHomePage'

import NewProblemPage from './pages/patient/NewProblemPage'
import AiCaseInterviewPage from './pages/patient/AiCaseInterviewPage'
import CaseInformationPage from './pages/patient/CaseInformationPage'
import AiAssessmentPage from './pages/patient/AiAssessmentPage'
import AssessmentResultPage from './pages/patient/AssessmentResultPage'
import NextStepPage from './pages/patient/NextStepPage'
import UploadDocumentsPage from './pages/patient/UploadDocumentsPage'
import DocumentPreviewPage from './pages/patient/DocumentPreviewPage'

import SelectHospitalPage from './pages/patient/SelectHospitalPage'
import SelectDoctorPage from './pages/patient/SelectDoctorPage'
import SelectDateTimePage from './pages/patient/SelectDateTimePage'
import ConfirmAppointmentPage from './pages/patient/ConfirmAppointmentPage'
import PatientPaymentPage from './pages/patient/PatientPaymentPage'
import AppointmentConfirmedPage from './pages/patient/AppointmentConfirmedPage'

import PatientHistoryPage from './pages/patient/PatientHistoryPage'
import PreviousCasesPage from './pages/patient/PreviousCasesPage'
import CaseDetailsPage from './pages/patient/CaseDetailsPage'
import PatientReportsPage from './pages/patient/PatientReportsPage'
import ReportDetailsPage from './pages/patient/ReportDetailsPage'
import PatientMedicinesPage from './pages/patient/PatientMedicinesPage'
import PatientPrescriptionsPage from './pages/patient/PatientPrescriptionsPage'
import PrescriptionDetailsPage from './pages/patient/PrescriptionDetailsPage'
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage'
import AppointmentDetailsPage from './pages/patient/AppointmentDetailsPage'
import PatientProfilePage from './pages/patient/PatientProfilePage'
import EditProfilePage from './pages/patient/EditProfilePage'

function RootLayout() {
  return <PageTransition />
}

const router = createBrowserRouter([
  {
    // Root layout — all routes are children so they all get PageTransition
    element: <RootLayout />,
    children: [
  {
    path: '/',
    element: <HomePage />,
  },
  // Emergency Module Routes
  {
    path: '/emergency',
    element: <EmergencyEntryPage />,
  },
  {
    path: '/patient/emergency',
    element: <EmergencyEntryPage />,
  },
  {
    path: '/login',
    element: <PatientLoginPage />,
  },
  {
    path: '/register',
    element: <PatientRegistrationPage />,
  },
  {
    path: '/emergency/call',
    element: <EmergencyCallPage />,
  },
  {
    path: '/emergency/request-ambulance',
    element: <RequestAmbulanceLocationPage />,
  },
  {
    path: '/emergency/ambulance-assigned',
    element: <AmbulanceAssignedPage />,
  },
  {
    path: '/emergency/live-location',
    element: <AmbulanceLiveLocationPage />,
  },

  // Doctor Portal Routes
  {
    path: '/doctor',
    element: <DoctorLoginPage />,
  },
  {
    path: '/doctor/login',
    element: <DoctorLoginPage />,
  },
  {
    path: '/doctor/forgot-password',
    element: <DoctorForgotPasswordPage />,
  },
  {
    path: '/doctor/session-expired',
    element: <DoctorSessionExpiredPage />,
  },
  {
    path: '/doctor/logout',
    element: <DoctorLogoutPage />,
  },
  {
    path: '/doctor/dashboard',
    element: <DoctorDashboardPage />,
  },
  {
    path: '/doctor/patient-search',
    element: <PatientSearchPage />,
  },
  {
    path: '/doctor/opd-queue',
    element: <OpdQueuePage />,
  },
  {
    path: '/doctor/patient-case',
    element: <PatientCasePage />,
  },
  {
    path: '/doctor/notes',
    element: <DoctorNotesPage />,
  },
  {
    path: '/doctor/diagnostic-request',
    element: <DiagnosticRequestPage />,
  },
  {
    path: '/doctor/diagnostic-report',
    element: <DiagnosticReportPage />,
  },
  {
    path: '/doctor/prescription',
    element: <PrescriptionPage />,
  },
  {
    path: '/doctor/final-approval',
    element: <FinalApprovalPage />,
  },
  {
    path: '/doctor/case-completed',
    element: <CaseCompletedPage />,
  },
  {
    path: '/doctor/pending-work',
    element: <PendingWorkPage />,
  },
  {
    path: '/doctor/profile',
    element: <DoctorProfilePage />,
  },

  // Patient Portal Routes (03.01 - 03.31)
  // Entry & Auth (03.01 - 03.05)
  {
    path: '/patient',
    element: <PatientPortalEntryPage />,
  },
  {
    path: '/patient/login',
    element: <PatientLoginPage />,
  },
  {
    path: '/patient/register',
    element: <PatientRegistrationPage />,
  },
  {
    path: '/patient/verify-otp',
    element: <PatientOtpPage />,
  },
  {
    path: '/patient/registration-complete',
    element: <PatientRegistrationCompletePage />,
  },
  // Patient Home (03.06)
  {
    path: '/patient/home',
    element: <PatientHomePage />,
  },

  // Problem & Clinical Intake (03.07 - 03.13)
  {
    path: '/patient/new-problem',
    element: <NewProblemPage />,
  },
  {
    path: '/patient/ai-interview',
    element: <AiCaseInterviewPage />,
  },
  {
    path: '/patient/case-info',
    element: <CaseInformationPage />,
  },
  {
    path: '/patient/ai-assessment',
    element: <AiAssessmentPage />,
  },
  {
    path: '/patient/assessment-result',
    element: <AssessmentResultPage />,
  },
  {
    path: '/patient/next-step',
    element: <NextStepPage />,
  },
  {
    path: '/patient/upload-documents',
    element: <UploadDocumentsPage />,
  },
  {
    path: '/patient/document-preview',
    element: <DocumentPreviewPage />,
  },

  // Appointment Booking Flow (03.14 - 03.19)
  {
    path: '/patient/select-hospital',
    element: <SelectHospitalPage />,
  },
  {
    path: '/patient/select-doctor',
    element: <SelectDoctorPage />,
  },
  {
    path: '/patient/select-date-time',
    element: <SelectDateTimePage />,
  },
  {
    path: '/patient/confirm-appointment',
    element: <ConfirmAppointmentPage />,
  },
  {
    path: '/patient/payment',
    element: <PatientPaymentPage />,
  },
  {
    path: '/patient/appointment-confirmed',
    element: <AppointmentConfirmedPage />,
  },

  // Records, Reports, Medicines & Appointments (03.20 - 03.29)
  {
    path: '/patient/history',
    element: <PatientHistoryPage />,
  },
  {
    path: '/patient/previous-cases',
    element: <PreviousCasesPage />,
  },
  {
    path: '/patient/case-details',
    element: <CaseDetailsPage />,
  },
  {
    path: '/patient/reports',
    element: <PatientReportsPage />,
  },
  {
    path: '/patient/report-details',
    element: <ReportDetailsPage />,
  },
  {
    path: '/patient/medicines',
    element: <PatientMedicinesPage />,
  },
  {
    path: '/patient/prescriptions',
    element: <PatientPrescriptionsPage />,
  },
  {
    path: '/patient/prescription-details',
    element: <PrescriptionDetailsPage />,
  },
  {
    path: '/patient/appointments',
    element: <PatientAppointmentsPage />,
  },
  {
    path: '/patient/appointment-details',
    element: <AppointmentDetailsPage />,
  },

  // Profile (03.30 - 03.31)
  {
    path: '/patient/profile',
    element: <PatientProfilePage />,
  },
  {
    path: '/patient/edit-profile',
    element: <EditProfilePage />,
  },

  // Pharmacy Portal (05.01 - 05.08)
  {
    path: '/pharmacy',
    element: <PharmacyLoginPage />,
  },
  {
    path: '/pharmacy/login',
    element: <PharmacyLoginPage />,
  },
  {
    path: '/pharmacy/dashboard',
    element: <PharmacyDashboardPage />,
  },
  {
    path: '/pharmacy/add-medicine',
    element: <AddMedicinePage />,
  },
  {
    path: '/pharmacy/prescriptions',
    element: <PharmacyPrescriptionListPage />,
  },
  {
    path: '/pharmacy/prescription',
    element: <PharmacyPrescriptionPage />,
  },
  {
    path: '/pharmacy/prescription/:id',
    element: <PharmacyPrescriptionPage />,
  },
  {
    path: '/pharmacy/dispense',
    element: <DispenseMedicinePage />,
  },
  {
    path: '/pharmacy/delivery-verify',
    element: <DeliveryVerifyPage />,
  },
  {
    path: '/pharmacy/delivery-completed',
    element: <DeliveryCompletedPage />,
  },
  {
    path: '/pharmacy/history',
    element: <PharmacyHistoryPage />,
  },
  {
    path: '/pharmacy/profile',
    element: <PharmacyProfilePage />,
  },

  // Diagnostic & Scan Portal (06.01 - 06.06)
  {
    path: '/diagnostic',
    element: <DiagnosticLoginPage />,
  },
  {
    path: '/diagnostic/login',
    element: <DiagnosticLoginPage />,
  },
  {
    path: '/diagnostic/dashboard',
    element: <DiagnosticDashboardPage />,
  },
  {
    path: '/diagnostic/request',
    element: <TestScanRequestPage />,
  },
  {
    path: '/diagnostic/requests',
    element: <TestScanRequestPage />,
  },
  {
    path: '/diagnostic/perform',
    element: <PerformTestScanPage />,
  },
  {
    path: '/diagnostic/upload',
    element: <ReportUploadPage />,
  },
  {
    path: '/diagnostic/report-upload',
    element: <ReportUploadPage />,
  },
  {
    path: '/diagnostic/completed',
    element: <ReportCompletedPage />,
  },
  {
    path: '/diagnostic/completed-reports',
    element: <ReportCompletedPage />,
  },
  {
    path: '/diagnostic/reports',
    element: <ReportCompletedPage />,
  },
  {
    path: '/diagnostic/profile',
    element: <DiagnosticProfilePage />,
  },

  // Ambulance Portal (07.01 - 07.06)
  {
    path: '/ambulance',
    element: <AmbulanceLoginPage />,
  },
  {
    path: '/ambulance/login',
    element: <AmbulanceLoginPage />,
  },
  {
    path: '/ambulance/dashboard',
    element: <AmbulanceDashboardPage />,
  },
  {
    path: '/ambulance/request',
    element: <EmergencyRequestPage />,
  },
  {
    path: '/ambulance/requests',
    element: <EmergencyRequestPage />,
  },
  {
    path: '/ambulance/emergency-requests',
    element: <EmergencyRequestPage />,
  },
  {
    path: '/ambulance/patient-location',
    element: <PatientLocationPage />,
  },
  {
    path: '/ambulance/location',
    element: <PatientLocationPage />,
  },
  {
    path: '/ambulance/update-status',
    element: <UpdateAmbulanceStatusPage />,
  },
  {
    path: '/ambulance/completed',
    element: <AmbulanceCompletedPage />,
  },
  {
    path: '/ambulance/request-completed',
    element: <AmbulanceCompletedPage />,
  },
  {
    path: '/ambulance/scene-assessment',
    element: <SceneAssessmentPage />,
  },
  {
    path: '/ambulance/assessment',
    element: <SceneAssessmentPage />,
  },

  // Admin Portal Routes (08.01 - 08.07)
  {
    path: '/admin',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboardPage />,
  },
  {
    path: '/admin/doctors',
    element: <ManageDoctorPage />,
  },
  {
    path: '/admin/manage-doctor',
    element: <ManageDoctorPage />,
  },
  {
    path: '/admin/hospitals',
    element: <ManageHospitalPage />,
  },
  {
    path: '/admin/manage-hospital',
    element: <ManageHospitalPage />,
  },
  {
    path: '/admin/medicines',
    element: <ManageMedicinePage />,
  },
  {
    path: '/admin/manage-medicine',
    element: <ManageMedicinePage />,
  },
  {
    path: '/admin/diagnostics',
    element: <ManageDiagnosticPage />,
  },
  {
    path: '/admin/manage-diagnostic',
    element: <ManageDiagnosticPage />,
  },
  {
    path: '/admin/ambulances',
    element: <ManageAmbulancePage />,
  },
  {
    path: '/admin/manage-ambulance',
    element: <ManageAmbulancePage />,
  },
  {
    path: '/admin/profile',
    element: <AdminProfilePage />,
  },
    ] // end children
  }  // end root layout
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
