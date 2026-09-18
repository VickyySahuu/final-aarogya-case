-- =====================================================================
-- AAROGYA CASE — Seed Data for Unified Relational Database
-- =====================================================================

-- 1. SEED USERS
INSERT INTO users (id, username, password_hash, role) VALUES
(1, 'rajesh.sharma', '$2a$10$wN31nI1n8f/6V8XvR...patient', 'patient'),
(2, 'dr.ramanathan', '$2a$10$wN31nI1n8f/6V8XvR...doctor', 'doctor'),
(3, 'pharmacy.central', '$2a$10$wN31nI1n8f/6V8XvR...pharm', 'pharmacy'),
(4, 'diagnostic.node', '$2a$10$wN31nI1n8f/6V8XvR...diag', 'diagnostic'),
(5, 'ambulance.dispatch', '$2a$10$wN31nI1n8f/6V8XvR...amb', 'ambulance'),
(6, 'admin.ayush', '$2a$10$wN31nI1n8f/6V8XvR...admin', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED HOSPITAL
INSERT INTO hospitals (id, hospital_id, name, facility_type, address, emergency_ward, connected_hubs, distance, opd_hours, beds) VALUES
(1, 'HOSP-DEL-01', 'District Civil Hospital', 'Public Multi-Specialty Civic Hospital & Triage Hub', 'Sector 4, Civil Lines, New Delhi — 110054', 'Ground Floor, Bay 01 - 04', 'AIIMS Trauma Wing & Emergency Response 108', '1.8 km away', 'Mon - Sat: 8:00 AM - 2:00 PM', '500 Beds')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED DOCTOR (ONE DOCTOR FOR PROTOTYPE)
INSERT INTO doctors (id, user_id, doctor_id, name, specialization, hospital_id, hospital_name, room, days, tokens_available) VALUES
(1, 2, 'DOC-1042', 'Dr. Ramanathan Venkatraman', 'General Medicine', 'HOSP-DEL-01', 'District Civil Hospital', 'Room 104', 'Mon - Sat (08:30 – 14:00)', 'Available')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED PATIENT (SINGLE PERMANENT UNIQUE CODE)
INSERT INTO patients (id, user_id, patient_id, patient_unique_code, name, mobile, dob, age, gender, identity_type, identity_number, blood_group, address) VALUES
(1, 1, 'AC-2025-884920', 'AC-7F42K9', 'Rajesh Kumar Sharma', '+91 9876543210', '14/05/1977', '48', 'Male', 'Aadhaar', '9148 2911 0248', 'B+', 'H-42, Sector 4, Civil Lines, New Delhi - 110054'),
(2, 6, 'AC-2026-954601', 'AC-VK2604', 'VIKASH KUMAR', '9546011026', '15/08/2002', '24', 'Male', 'Aadhaar', '9546 2026 1102', 'O+', 'Quarter 14, Railway Colony, Patna, Bihar - 800001')
ON CONFLICT (id) DO NOTHING;

-- 5. SEED MEDICINES
INSERT INTO medicines (id, medicine_id, name, category, available_qty, unit, rack, status) VALUES
(1, 'MED-PARA-650', 'Paracetamol 650mg Tablet', 'Analgesic / Antipyretic', 850, 'Tablets', 'Rack A-01', 'Available'),
(2, 'MED-CET-10', 'Cetirizine 10mg Tablet', 'Antihistamine', 420, 'Tablets', 'Rack B-03', 'Available'),
(3, 'MED-AMOX-500', 'Amoxicillin 500mg Capsule', 'Antibiotic', 300, 'Capsules', 'Rack C-02', 'Available'),
(4, 'MED-AZI-500', 'Azithromycin 500mg Tablet', 'Antibiotic', 180, 'Tablets', 'Rack C-05', 'Available'),
(5, 'MED-PAN-40', 'Pantoprazole 40mg Tablet', 'Antacid / PPI', 550, 'Tablets', 'Rack A-04', 'Available')
ON CONFLICT (id) DO NOTHING;

-- 6. SEED AMBULANCE
INSERT INTO ambulances (id, ambulance_number, vehicle_number, specification, base_station, operator_name, operator_id, status) VALUES
(1, 'Ambulance Unit #08', 'DL-01-EQ-9041', 'Advanced Life Support (ALS)', 'South West Dispatch Node • Dwarka Cluster', 'Paramedic Lead Paramveer / Ravi', 'AMB-OP-104', 'available')
ON CONFLICT (id) DO NOTHING;

-- 7. SEED HISTORICAL PRESCRIPTION & ITEMS
INSERT INTO prescriptions (id, rx_number, patient_id, doctor_id, hospital_name, room_number, token, diagnosis, icd_code, vitals, pharmacy_status, status) VALUES
(1, 'RX-2025-084920-884', 1, 1, 'District Civil Hospital', 'Room 104', '#14', 'Acute Viral Pharyngitis with Mild Pyrexia', 'ICD-10: J02.9', 'BP 124/82 · Temp 99.4°F · Pulse 78 bpm · SpO2 98%', 'Sent', 'Pending'),
(2, 'RX-2026-0712-VK', 2, 1, 'District Civil Hospital', 'Room 104', '#08', 'Moderate Allergic Rhinitis with Atopy', 'ICD-10: J30.2', 'BP 118/76 · Temp 98.4°F · Pulse 72 bpm · SpO2 99%', 'Dispensed', 'Issued')
ON CONFLICT (id) DO NOTHING;

INSERT INTO prescription_items (id, prescription_id, medicine_id, medicine_name, category, dosage, frequency, duration, required_qty, instructions) VALUES
(1, 1, 1, 'Paracetamol 650mg Tablet', 'Analgesic & Antipyretic', '1 Tablet', 'Thrice Daily (TDS)', '5 Days (15 Tablets)', 15, 'Take after food with warm water'),
(2, 1, 2, 'Cetirizine 10mg Tablet', 'Antihistamine', '1 Tablet', 'Once Daily (HS)', '3 Days (3 Tablets)', 3, 'Take at bedtime'),
(3, 2, 2, 'Levocetirizine 5mg + Montelukast 10mg Tablet', 'Antihistamine', '1 Tablet', 'Once Daily (HS)', '14 Days (14 Tablets)', 14, 'Take at bedtime with warm water')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED EMERGENCY REQUEST
INSERT INTO emergency_requests (id, request_number, patient_id, ambulance_id, patient_name, patient_unique_code, contact_number, pickup_location, destination, status, request_time) VALUES
(1, 'REQ-EMG-2025-8841', 1, 1, 'Rajesh Kumar Sharma', 'AC-7F42K9', '+91 98765-XXXXX', 'Flat 402, Block C, Green Meadows, Sector 4, Dwarka, New Delhi', 'District Civil Hospital Emergency Wing', 'Pending Acceptance', 'Today, 11:20 AM IST')
ON CONFLICT (id) DO NOTHING;

-- Reset serial sequences
SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id),0) + 1, false) FROM users;
SELECT setval(pg_get_serial_sequence('hospitals', 'id'), coalesce(max(id),0) + 1, false) FROM hospitals;
SELECT setval(pg_get_serial_sequence('doctors', 'id'), coalesce(max(id),0) + 1, false) FROM doctors;
SELECT setval(pg_get_serial_sequence('patients', 'id'), coalesce(max(id),0) + 1, false) FROM patients;
SELECT setval(pg_get_serial_sequence('medicines', 'id'), coalesce(max(id),0) + 1, false) FROM medicines;
SELECT setval(pg_get_serial_sequence('ambulances', 'id'), coalesce(max(id),0) + 1, false) FROM ambulances;
SELECT setval(pg_get_serial_sequence('prescriptions', 'id'), coalesce(max(id),0) + 1, false) FROM prescriptions;
SELECT setval(pg_get_serial_sequence('prescription_items', 'id'), coalesce(max(id),0) + 1, false) FROM prescription_items;
SELECT setval(pg_get_serial_sequence('emergency_requests', 'id'), coalesce(max(id),0) + 1, false) FROM emergency_requests;
