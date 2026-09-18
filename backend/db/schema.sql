-- =====================================================================
-- AAROGYA CASE — Centralized Unified Relational Database Schema
-- Target: PostgreSQL 14+
-- =====================================================================

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'pharmacy', 'diagnostic', 'ambulance', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PATIENT ENTITY
-- Patient Unique Code (e.g. AC-7F42K9) is the permanent cross-portal identifier
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    patient_id VARCHAR(50) UNIQUE NOT NULL,             -- e.g. AC-2025-884920
    patient_unique_code VARCHAR(50) UNIQUE NOT NULL,     -- e.g. AC-7F42K9 (Permanent QR identifier)
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    dob VARCHAR(20),
    age VARCHAR(10),
    gender VARCHAR(20),
    identity_type VARCHAR(50) DEFAULT 'Aadhaar',
    identity_number VARCHAR(100),
    blood_group VARCHAR(10),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_unique_code ON patients(patient_unique_code);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_mobile ON patients(mobile);

-- 3. HOSPITALS
CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    hospital_id VARCHAR(50) UNIQUE NOT NULL,            -- e.g. HOSP-DEL-01
    name VARCHAR(200) NOT NULL,
    facility_type VARCHAR(150) DEFAULT 'District Hospital',
    address TEXT NOT NULL,
    emergency_ward VARCHAR(150),
    connected_hubs TEXT,
    distance VARCHAR(50),
    opd_hours VARCHAR(100),
    beds VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. DOCTORS (ONE DOCTOR FOR PROTOTYPE)
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    doctor_id VARCHAR(50) UNIQUE NOT NULL,             -- e.g. DOC-1042
    name VARCHAR(150) NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id) ON DELETE SET NULL,
    hospital_name VARCHAR(200),
    room VARCHAR(50) NOT NULL,
    days VARCHAR(100),
    tokens_available VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_doctor_id ON doctors(doctor_id);

-- 5. PATIENT CASES (AI Triage & Case Information)
CREATE TABLE IF NOT EXISTS patient_cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_unique_code VARCHAR(50) NOT NULL,
    problem VARCHAR(200) NOT NULL,
    duration VARCHAR(50),
    severity VARCHAR(50),
    symptoms JSONB DEFAULT '[]'::jsonb,
    assessment_answers JSONB DEFAULT '[]'::jsonb,
    ai_assessment JSONB DEFAULT '{}'::jsonb,
    original_patient_response TEXT,
    structured_history JSONB DEFAULT '{}'::jsonb,
    lifecycle_stage VARCHAR(50) DEFAULT 'PATIENT CONFIRMED',
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS original_patient_response TEXT;
ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS structured_history JSONB DEFAULT '{}'::jsonb;
ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(50) DEFAULT 'PATIENT CONFIRMED';


-- 6. APPOINTMENTS (Patient -> Appointment -> Doctor)
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    appointment_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL,
    case_id INTEGER REFERENCES patient_cases(id) ON DELETE SET NULL,
    token_number VARCHAR(20) NOT NULL,                 -- e.g. #14
    appointment_date VARCHAR(50) NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    opd_room VARCHAR(50),
    problem VARCHAR(255),
    severity VARCHAR(50),
    payment_method VARCHAR(50) DEFAULT 'Exempted / Government Ayush Scheme',
    payment_status VARCHAR(50) DEFAULT 'Completed',
    status VARCHAR(50) DEFAULT 'Waiting for Doctor',    -- Waiting for Doctor, In Consultation, Completed, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);

-- 7. MEDICINE INVENTORY / FORMULARY
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    medicine_id VARCHAR(50) UNIQUE NOT NULL,           -- e.g. MED-PARA-650
    name VARCHAR(200) NOT NULL,
    category VARCHAR(150),
    available_qty INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'Tablets',
    rack VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Available',            -- Available, Out of Stock
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PRESCRIPTIONS (Doctor -> Prescription -> PharmacyDispensing, Patient -> Prescription)
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    rx_number VARCHAR(50) UNIQUE NOT NULL,             -- e.g. RX-2025-084920-884
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    case_id INTEGER REFERENCES patient_cases(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_unique_code VARCHAR(50),                   -- e.g. AC-7F42K9
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_name VARCHAR(200),
    room_number VARCHAR(50),
    token VARCHAR(20),
    diagnosis TEXT,
    icd_code VARCHAR(50),
    vitals VARCHAR(255),
    pharmacy_status VARCHAR(50) DEFAULT 'Sent',        -- Sent, Dispensed, Delivered
    status VARCHAR(50) DEFAULT 'Issued',               -- Issued, Dispensed, Completed
    patient_access VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_rx_number ON prescriptions(rx_number);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_case ON prescriptions(case_id);

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS case_id INTEGER REFERENCES patient_cases(id) ON DELETE SET NULL;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_unique_code VARCHAR(50);

-- 9. PRESCRIPTION ITEMS (Prescription items with dosage & required quantity)
CREATE TABLE IF NOT EXISTS prescription_items (
    id SERIAL PRIMARY KEY,
    prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
    medicine_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    required_qty INTEGER NOT NULL DEFAULT 1,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. PHARMACY DISPENSING & DELIVERY
CREATE TABLE IF NOT EXISTS pharmacy_dispensings (
    id SERIAL PRIMARY KEY,
    dispensing_number VARCHAR(50) UNIQUE,              -- e.g. DISP-2026-000001
    prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    rx_number VARCHAR(50) NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_unique_code VARCHAR(50),                   -- e.g. AC-7F42K9
    dispensed_items JSONB DEFAULT '[]'::jsonb,
    dispensed_by VARCHAR(150),
    delivery_verified_by VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Dispensed',            -- Dispensed, Completed, Delivered
    dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_dispensings_disp_num ON pharmacy_dispensings(dispensing_number);
CREATE INDEX IF NOT EXISTS idx_pharmacy_dispensings_rx ON pharmacy_dispensings(prescription_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_dispensings_patient ON pharmacy_dispensings(patient_id);

ALTER TABLE pharmacy_dispensings ADD COLUMN IF NOT EXISTS dispensing_number VARCHAR(50);
ALTER TABLE pharmacy_dispensings ADD COLUMN IF NOT EXISTS patient_unique_code VARCHAR(50);
ALTER TABLE pharmacy_dispensings ADD COLUMN IF NOT EXISTS dispensed_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pharmacy_dispensings ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;


-- 11. DIAGNOSTIC REQUESTS (Doctor -> DiagnosticRequest)
CREATE TABLE IF NOT EXISTS diagnostic_requests (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,            -- e.g. REQ-RAD-2026-9921
    request_number VARCHAR(100) UNIQUE,                -- e.g. MRI-2026-000001
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    case_id INTEGER REFERENCES patient_cases(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_unique_code VARCHAR(50),                   -- e.g. AC-7F42K9
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    test_scan VARCHAR(200),
    test_code VARCHAR(50),
    category VARCHAR(100),
    clinical_notes TEXT,
    request_notes TEXT,
    priority VARCHAR(50) DEFAULT 'Urgent',             -- Routine, Urgent, STAT
    status VARCHAR(50) DEFAULT 'Pending',              -- Pending, In Progress, Completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_req_id ON diagnostic_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_req_num ON diagnostic_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_patient ON diagnostic_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_status ON diagnostic_requests(status);

ALTER TABLE diagnostic_requests ADD COLUMN IF NOT EXISTS request_number VARCHAR(100);
ALTER TABLE diagnostic_requests ADD COLUMN IF NOT EXISTS case_id INTEGER REFERENCES patient_cases(id) ON DELETE SET NULL;
ALTER TABLE diagnostic_requests ADD COLUMN IF NOT EXISTS patient_unique_code VARCHAR(50);
ALTER TABLE diagnostic_requests ADD COLUMN IF NOT EXISTS test_scan VARCHAR(200);
ALTER TABLE diagnostic_requests ADD COLUMN IF NOT EXISTS request_notes TEXT;

-- 12. DIAGNOSTIC REPORTS (Doctor -> DiagnosticRequest -> DiagnosticReport)
CREATE TABLE IF NOT EXISTS diagnostic_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) UNIQUE NOT NULL,             -- e.g. REP-8812
    request_id INTEGER NOT NULL REFERENCES diagnostic_requests(id) ON DELETE CASCADE,
    request_number VARCHAR(100),
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_unique_code VARCHAR(50),
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    test_scan VARCHAR(200),
    category VARCHAR(100),
    file_name VARCHAR(255),
    file_size VARCHAR(50),
    file_url TEXT,
    findings TEXT,
    impression TEXT,
    report_data JSONB,
    report_file_reference TEXT,
    verified_by VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_reports_patient ON diagnostic_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_reports_req_id ON diagnostic_reports(request_id);

ALTER TABLE diagnostic_reports ADD COLUMN IF NOT EXISTS request_number VARCHAR(100);
ALTER TABLE diagnostic_reports ADD COLUMN IF NOT EXISTS patient_unique_code VARCHAR(50);
ALTER TABLE diagnostic_reports ADD COLUMN IF NOT EXISTS test_scan VARCHAR(200);
ALTER TABLE diagnostic_reports ADD COLUMN IF NOT EXISTS report_data JSONB;
ALTER TABLE diagnostic_reports ADD COLUMN IF NOT EXISTS report_file_reference TEXT;
ALTER TABLE diagnostic_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 13. AMBULANCES
CREATE TABLE IF NOT EXISTS ambulances (
    id SERIAL PRIMARY KEY,
    ambulance_number VARCHAR(100) UNIQUE NOT NULL,     -- e.g. Ambulance Unit #08
    vehicle_number VARCHAR(50) NOT NULL,               -- e.g. DL-01-EQ-9041
    specification VARCHAR(100) DEFAULT 'Advanced Life Support (ALS)',
    base_station VARCHAR(200) DEFAULT 'South West Dispatch Node • Dwarka Cluster',
    operator_name VARCHAR(150) DEFAULT 'Paramedic Lead Paramveer / Ravi',
    operator_id VARCHAR(50) DEFAULT 'AMB-OP-104',
    status VARCHAR(50) DEFAULT 'available',            -- available, ontheway, busy
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. EMERGENCY REQUESTS (Patient -> EmergencyRequest -> Ambulance)
CREATE TABLE IF NOT EXISTS emergency_requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,        -- e.g. EMG-2026-000001
    patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
    ambulance_id INTEGER REFERENCES ambulances(id) ON DELETE SET NULL,
    patient_name VARCHAR(150),
    patient_unique_code VARCHAR(50),
    contact_number VARCHAR(50),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_accuracy DOUBLE PRECISION,
    pickup_location TEXT NOT NULL,
    landmark VARCHAR(200),
    destination VARCHAR(200),
    destination_bay VARCHAR(150),
    distance VARCHAR(50),
    eta VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Requested',            -- Requested, Assigned, En Route, Arrived, Completed
    request_time VARCHAR(100),
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emergency_requests_num ON emergency_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_patient ON emergency_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_ambulance ON emergency_requests(ambulance_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON emergency_requests(status);

ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS location_accuracy DOUBLE PRECISION;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS patient_age VARCHAR(20);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS patient_gender VARCHAR(20);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS incident_category VARCHAR(100);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS incident_description TEXT;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS patient_condition VARCHAR(50);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS prearrival_alert_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS receiving_hospital VARCHAR(200);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS receiving_building VARCHAR(150);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS receiving_floor VARCHAR(50);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS receiving_unit VARCHAR(100);
ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS receiving_room VARCHAR(100);

-- 15. DIAGNOSTIC TESTS CATALOG (Admin -> DiagnosticTest, Doctor -> DiagnosticRequest)
CREATE TABLE IF NOT EXISTS diagnostic_tests (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(50) UNIQUE NOT NULL,               -- e.g. DIAG-XR-01
    name VARCHAR(200) NOT NULL,
    category VARCHAR(150),
    turnaround VARCHAR(50) DEFAULT '25 Mins',
    status VARCHAR(50) DEFAULT 'Active',
    icon VARCHAR(50) DEFAULT 'biotech',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_tests_tid ON diagnostic_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_tests_name ON diagnostic_tests(name);

