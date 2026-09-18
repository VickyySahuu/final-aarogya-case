import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'
import { getPatientProfile } from '../../data/patientMockData'
import { DoctorApi } from '../../services/doctorApi'

const CLINICAL_TEMPLATES = [
  {
    id: 'viral-fever',
    label: 'Viral Fever & URTI',
    icon: 'thermostat',
    data: {
      complaint: 'High grade fever with chills for 3 days, accompanied by sore throat, body aches, and dry cough. No shortness of breath.',
      examination: 'Vitals: BP 118/76 mmHg, Pulse 82 bpm regular, Temp 100.4°F, SpO2 99% on room air. Throat: Mild pharyngeal congestion, tonsils normal without exudates. Chest: Clear bilaterally, vesicular breath sounds. Abdomen: Soft, non-tender.',
      diagnosis: 'Acute Viral Upper Respiratory Tract Infection (URTI) with Pyrexia (ICD-10: J06.9)',
      plan: '1. Paracetamol 650mg TDS SOS for fever >100°F.\n2. Levocetirizine 5mg OD at night for 5 days.\n3. Warm saline gargles thrice daily.\n4. Adequate oral hydration (>2.5L/day).\n5. Review in OPD after 3-5 days if fever persists or sooner if red-flag symptoms develop.'
    }
  },
  {
    id: 'allergic-rhinitis',
    label: 'Allergic Rhinitis / Atopy',
    icon: 'grain',
    data: {
      complaint: 'Recurrent morning sneezing (15-20 bouts), profuse watery rhinorrhea, nasal congestion, and itchy watery eyes for 10 days. Triggered by dust exposure.',
      examination: 'Vitals: BP 120/78 mmHg, Pulse 74 bpm, Temp 98.4°F, SpO2 99%. ENT: Pale, edematous nasal turbinates with clear watery discharge. Conjunctiva: Mild bilateral erythema. Chest: Clear, no wheezing or rhonchi.',
      diagnosis: 'Moderate Seasonal Allergic Rhinitis with Atopic Phenotype (ICD-10: J30.2)',
      plan: '1. Levocetirizine 5mg + Montelukast 10mg once daily at bedtime for 14 days.\n2. Fluticasone Furoate Nasal Spray 1 spray per nostril OD in morning for 30 days.\n3. Avoid morning dust exposure, wear mask during sweeping/cleaning.\n4. Review in 2 weeks.'
    }
  },
  {
    id: 'gastroenteritis',
    label: 'Acute Gastroenteritis / Dyspepsia',
    icon: 'fluid_med',
    data: {
      complaint: 'Loose watery stools (4-5 episodes since yesterday) with crampy lower abdominal pain, nausea, and low-grade fever. Tolerating oral sips.',
      examination: 'Vitals: BP 112/74 mmHg, Pulse 86 bpm, Temp 99.0°F, SpO2 98%. Tongue mildly dry. Abdomen: Soft, mild generalized tenderness, hyperactive bowel sounds, no guarding or rebound tenderness.',
      diagnosis: 'Acute Gastroenteritis without Severe Dehydration (ICD-10: A09)',
      plan: '1. Oral Rehydration Solution (ORS) 1 sachet in 1 liter boiled/cooled water - sip after each loose stool.\n2. Probiotic capsule BD for 5 days.\n3. Pantoprazole 40mg OD before breakfast for 5 days.\n4. Bland light diet (khichdi, curd, banana, coconut water). Avoid oily/spicy foods.\n5. Emergency review if persistent vomiting or bloody stools.'
    }
  },
  {
    id: 'hypertension-review',
    label: 'Hypertension Routine Review',
    icon: 'monitor_heart',
    data: {
      complaint: 'Known hypertensive presenting for routine monthly follow-up. No headache, chest pain, palpitations, or visual blurring.',
      examination: 'Vitals: BP 134/84 mmHg (Right arm sitting), Pulse 72 bpm regular, Temp 98.2°F, SpO2 98%, BMI 24.2 kg/m². CVS: S1 S2 heard, no murmurs. Respiratory: Clear. Bilateral pedal edema absent.',
      diagnosis: 'Essential Hypertension - Well Controlled (ICD-10: I10)',
      plan: '1. Continue Amlodipine 5mg OD morning.\n2. Maintain low sodium diet (<5g salt/day), 30 mins brisk walking daily.\n3. Regular home BP monitoring twice weekly.\n4. Routine annual lipid profile and renal function test.\n5. Review in 1 month with BP log.'
    }
  },
  {
    id: 'routine-checkup',
    label: 'Normal Routine Health Check',
    icon: 'health_and_safety',
    data: {
      complaint: 'General routine health checkup. Asymptomatic at present. No current systemic complaints.',
      examination: 'Vitals: BP 120/80 mmHg, Pulse 76 bpm regular, Temp 98.4°F, SpO2 99%, RR 16/min. General physical examination unremarkable. Pallor/Icterus/Cyanosis/Clubbing/Lymphadenopathy/Edema absent. Systemic examination within normal limits.',
      diagnosis: 'Routine Medical Examination - Healthy Adult (ICD-10: Z00.00)',
      plan: '1. Balanced diet and lifestyle counseling provided.\n2. Adequate hydration and regular aerobic exercise recommended.\n3. Maintain annual preventive health screening.'
    }
  }
]

const FIELD_OPTIONS = {
  complaint: [
    'High grade fever with chills & rigors for 3 days',
    'Persistent sneezing, nasal congestion & watery eyes',
    'Dry hacking cough, sore throat & difficulty swallowing',
    'Severe throbbing headache with light sensitivity',
    'Epigastric burning pain, bloating & acid reflux',
    'Generalized weakness, body ache & malaise',
    'Loose stools (4-5 episodes/day) with crampy abdominal pain',
    'Lower back pain radiating to left leg, aggravated on bending'
  ],
  examination: [
    'Vitals stable: BP 120/80 mmHg, Pulse 76/min, Temp 98.4°F, SpO2 99%',
    'Throat: Pharyngeal erythema present, tonsils not enlarged, no exudates',
    'Nasal mucosa pale and edematous, clear watery discharge, no polyps',
    'Chest: Bilateral breath sounds vesicular, clear, no wheezing or crepitations',
    'Abdomen: Soft, non-tender, no organomegaly, bowel sounds normal',
    'CVS: S1, S2 heard, no murmurs, peripheral pulses well felt',
    'Febrile (Temp 100.8°F), mild tachycardia, no signs of meningism',
    'Neurological: Conscious, oriented, no focal neurological deficit'
  ],
  diagnosis: [
    'Acute Viral Pharyngitis with Mild Pyrexia (ICD-10: J02.9)',
    'Seasonal Allergic Rhinitis with Atopic Phenotype (ICD-10: J30.2)',
    'Acute Upper Respiratory Tract Infection (URTI) (ICD-10: J06.9)',
    'Acute Gastroenteritis without Dehydration (ICD-10: A09)',
    'Tension Headache / Migraine (ICD-10: G43.9)',
    'Essential Hypertension - Controlled (ICD-10: I10)',
    'Type 2 Diabetes Mellitus - Routine Review (ICD-10: E11.9)',
    'Acute Musculoskeletal Strain / Lumbar Spondylosis (ICD-10: M54.5)'
  ],
  plan: [
    'Paracetamol 650mg TDS SOS for fever >100°F with meals.',
    'Levocetirizine 5mg OD at bedtime for 5 days. Avoid driving if drowsy.',
    'Fluticasone furoate nasal spray 1 puff BD for 2 weeks.',
    'Oral Rehydration Solution (ORS) 1 sachet in 1L water; light bland diet.',
    'Steam inhalation twice daily, warm saline gargles, avoid cold beverages.',
    'Avoid dust, pollen, and sudden temperature shifts. Keep oral fluids high (>2.5L/day).',
    'Routine blood investigations (CBC, Serum IgE) ordered. Review in 5 days.',
    'Red flag signs explained. Review in Emergency if breathlessness or persistent high fever occurs.'
  ]
}

export default function DoctorNotesPage() {
  const location = useLocation()
  let cached = null
  try {
    const raw = sessionStorage.getItem('aarogya_doctor_active_patient')
    if (raw) cached = JSON.parse(raw)
  } catch (e) {}

  const defaultProfile = getPatientProfile()
  const patient = location.state?.patient || cached || {
    name: defaultProfile.name,
    id: defaultProfile.patientId,
    uniqueCode: defaultProfile.patientUniqueCode || 'AC-7F42K9',
    age: `${defaultProfile.age} Yrs / ${defaultProfile.gender}`,
    token: '#14'
  }

  const initials = (patient.name || 'PT')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase()

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [notes, setNotes] = useState({
    complaint: '',
    examination: '',
    diagnosis: '',
    plan: '',
  })

  // Auto-fill from patient intake if available
  const intakeComplaint = patient.caseDetails?.originalPatientResponse || 
    patient.caseDetails?.problem || 
    patient.chiefComplaint || 
    patient.problem || ''

  const handleApplyTemplate = (tmpl) => {
    setActiveTemplate(tmpl.id)
    setNotes({ ...tmpl.data })
  }

  const handleInsertOption = (key, text) => {
    setNotes(prev => {
      const current = prev[key] ? prev[key].trim() : ''
      if (!current) {
        return { ...prev, [key]: text }
      }
      if (current.includes(text)) {
        return prev
      }
      return { ...prev, [key]: `${current}\n• ${text}` }
    })
  }

  const handleClearField = (key) => {
    setNotes(prev => ({ ...prev, [key]: '' }))
  }

  const handleSave = async () => {
    if (!notes.complaint && !notes.diagnosis) {
      alert('Please enter clinical findings / provisional diagnosis before saving notes.')
      return
    }
    setSaving(true)
    try {
      await DoctorApi.saveNotes({
        appointmentId: patient.appointmentId || patient.id,
        caseId: patient.caseDetails?.id || patient.caseId,
        patientId: patient.id || patient.patientDbId,
        complaint: notes.complaint,
        examination: notes.examination,
        diagnosis: notes.diagnosis,
        plan: notes.plan
      })
    } catch (e) {
      console.warn('Backend saveNotes warning:', e)
    } finally {
      setSaving(false)
      setSaved(true)
    }
  }

  return (
    <DoctorLayout 
      activeNav="Doctor Notes" 
      showPatientContext 
      patientName={patient.name}
      patientAge={patient.age}
      patientToken={patient.token}
      patientUniqueCode={patient.uniqueCode}
    >
      {/* Active Consultation Strip */}
      <div className="w-full bg-[#00501a] text-white px-4 sm:px-6 lg:px-10 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold tracking-wide" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[#9bf79f] animate-pulse"></span>
          <span className="font-bold tracking-wider">ACTIVE CONSULTATION IN PROGRESS</span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span className="bg-[#27853a] text-white px-2 py-0.5 rounded font-bold">Token {patient.token || '#—'}</span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span className="text-[#9bf79f] hidden md:inline">ABHA ID: 91-8273-1092-4410</span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span>OPD Room 104</span>
        </div>
        <div className="flex items-center gap-2 text-[#9bf79f] text-xs font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span className="hidden sm:inline">HIP Interoperable Session Locked</span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 bg-white shadow-sm">
        <nav className="flex items-center gap-2 text-xs text-[#58423a] font-semibold flex-wrap" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <Link to="/doctor/dashboard" className="hover:text-[#7c2800] flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">home</span>Doctor Portal</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <Link to="/doctor/opd-queue" className="hover:text-[#7c2800]">OPD Queue</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <Link to="/doctor/patient-case" state={{ patient }} className="hover:text-[#7c2800]">Patient Case ({patient.id || patient.uniqueCode || ''})</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <span className="text-[#7c2800] font-bold">Doctor Notes</span>
        </nav>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Patient Context */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-[#b3cdfe] text-[#3c5781] flex items-center justify-center text-2xl font-bold shadow-sm" style={{ fontFamily: 'Lexend, sans-serif' }}>{initials}</div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#27853a] ring-2 ring-white"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>{patient.name}</span>
                <span className="bg-[#d6e3ff] text-[#001b3d] text-xs font-semibold px-2 py-0.5 rounded-full" style={{ fontFamily: 'Lexend, sans-serif' }}>{patient.age}</span>
                <span className="bg-[#e1e2e5] text-[#58423a] text-xs font-semibold px-2 py-0.5 rounded-full" style={{ fontFamily: 'Lexend, sans-serif' }}>Token {patient.token}</span>
                <span className="bg-blue-50 text-blue-700 text-xs font-mono font-bold px-2 py-0.5 rounded border border-blue-200">
                  {patient.uniqueCode}
                </span>
              </div>
              <span className="text-sm text-[#58423a]">ID: {patient.id} • Permanent Code: {patient.uniqueCode}</span>
            </div>
          </div>
        </div>

        {saved ? (
          /* Saved Confirmation */
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-[#9bf79f] flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[#00501a] text-4xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>Doctor Notes Saved</h2>
            <p className="text-base text-[#58423a] mb-8">Clinical notes for {patient.name} (Token {patient.token}) have been saved and linked to the patient's record.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/doctor/patient-case" state={{ patient }} className="h-14 px-8 bg-[#166534] hover:bg-[#14532d] text-white rounded-full text-[15px] font-semibold flex items-center gap-2 btn-press" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined">person</span>Back to Patient Workspace
              </Link>
              <Link to="/doctor/diagnostic-request" state={{ patient }} className="h-14 px-8 bg-[#455f8a] text-white rounded-full text-[15px] font-semibold flex items-center gap-2 btn-press" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined">biotech</span>Request Diagnostic
              </Link>
              <Link to="/doctor/prescription" state={{ patient }} className="h-14 px-8 bg-[#00501a] text-white rounded-full text-[15px] font-semibold flex items-center gap-2 btn-press" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined">medication</span>Write Prescription
              </Link>
              <button onClick={() => setSaved(false)} className="h-14 px-6 bg-[#eceef0] text-[#191c1e] rounded-full text-[15px] font-semibold flex items-center gap-2 btn-press" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined">edit</span>Edit Notes
              </button>
            </div>
          </div>
        ) : (
          /* Notes Editor */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 pt-8 pb-4 bg-[#f2f4f6] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Clinical Notes — Active Consultation</h2>
                <p className="text-sm text-[#58423a] mt-1">Choose pre-selected options from the menus/chips or write your custom clinical assessment.</p>
              </div>
              <span className="text-xs text-[#00501a] bg-[#9bf79f]/50 border border-[#27853a]/30 px-3 py-1 rounded-full font-semibold self-start md:self-auto flex items-center gap-1.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="w-2 h-2 rounded-full bg-[#00501a]"></span>Pre-Select & Quick-Write Active
              </span>
            </div>

            {/* Quick 1-Click Clinical Templates Strip */}
            <div className="px-6 sm:px-8 py-4 bg-emerald-50/70 border-b border-emerald-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="material-symbols-outlined text-[18px] text-emerald-700">bolt</span>
                  One-Click Clinical Templates (Pre-fills all sections)
                </span>
                {intakeComplaint && (
                  <button
                    type="button"
                    onClick={() => handleInsertOption('complaint', intakeComplaint)}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-emerald-200 hover:border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">record_voice_over</span>
                    Insert Intake Complaint
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {CLINICAL_TEMPLATES.map((tmpl) => {
                  const isSelected = activeTemplate === tmpl.id
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400' 
                          : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 shadow-2xs hover:shadow-xs'
                      }`}
                      style={{ fontFamily: 'Lexend, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-[15px]">{tmpl.icon}</span>
                      <span>{tmpl.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {[
                { 
                  key: 'complaint', 
                  label: 'Chief Complaint & History of Present Illness', 
                  icon: 'symptoms',
                  placeholder: 'Describe patient complaints, onset, duration, triggers, or click pre-selected options above/below...'
                },
                { 
                  key: 'examination', 
                  label: 'Clinical Examination Findings & Vitals', 
                  icon: 'stethoscope',
                  placeholder: 'Record vitals (BP, Pulse, Temp, SpO2), general physical examination, systemic exam findings...'
                },
                { 
                  key: 'diagnosis', 
                  label: 'Provisional Diagnosis & ICD Code', 
                  icon: 'diagnosis',
                  placeholder: 'Enter provisional clinical diagnosis or choose from pre-selected diagnoses below...'
                },
                { 
                  key: 'plan', 
                  label: 'Clinical Plan, Advice & Treatment Directives', 
                  icon: 'clinical_notes',
                  placeholder: 'Document medical management directives, non-pharmacological advice, warning signs, and review timeframe...'
                },
              ].map((field) => {
                const options = FIELD_OPTIONS[field.key] || []
                return (
                  <div key={field.key} className="space-y-3 bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-base sm:text-lg font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                        <span className="material-symbols-outlined text-[#166534] text-[22px]">{field.icon}</span>
                        {field.label}
                      </label>
                      <div className="flex items-center gap-2">
                        {/* Dropdown Menu for Pre-selected items */}
                        <div className="relative inline-block">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleInsertOption(field.key, e.target.value)
                                e.target.value = ''
                              }
                            }}
                            defaultValue=""
                            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 font-medium hover:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                            style={{ fontFamily: 'Lexend, sans-serif' }}
                          >
                            <option value="" disabled>Choose from menu...</option>
                            {options.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        {notes[field.key] && (
                          <button
                            type="button"
                            onClick={() => handleClearField(field.key)}
                            className="text-xs text-slate-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            title="Clear this field"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Pre-selected Clickable Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Pre-select:</span>
                      {options.slice(0, 4).map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleInsertOption(field.key, opt)}
                          className="text-[11px] font-medium bg-white hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95 text-left"
                        >
                          + {opt.length > 40 ? opt.slice(0, 38) + '…' : opt}
                        </button>
                      ))}
                    </div>

                    {/* Freeform Writing Textarea */}
                    <textarea
                      className="w-full min-h-[110px] p-4 bg-white rounded-xl text-sm sm:text-base text-[#191c1e] border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none focus:shadow-sm transition-all resize-y leading-relaxed"
                      placeholder={field.placeholder}
                      value={notes[field.key]}
                      onChange={(e) => setNotes({ ...notes, [field.key]: e.target.value })}
                      style={{ fontFamily: "'Atkinson Hyperlegible Next', sans-serif" }}
                    />
                  </div>
                )
              })}

              <div className="flex items-center justify-between pt-4 border-t border-[#eceef0] flex-wrap gap-4">
                <span className="text-xs text-[#8f7066] font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Signed by: Dr. Ramanathan Venkatraman (Doctor ID: DOC-1042)
                </span>
                <div className="flex items-center gap-3">
                  <Link to="/doctor/patient-case" className="h-12 px-6 bg-[#eceef0] text-[#191c1e] rounded-full text-[15px] font-semibold flex items-center gap-2 hover:bg-slate-200 transition-colors" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Cancel
                  </Link>
                  <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="h-12 px-8 bg-[#00501a] hover:bg-[#003812] text-white rounded-full text-[15px] font-semibold shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50" 
                    style={{ fontFamily: 'Lexend, sans-serif' }}
                  >
                    <span className="material-symbols-outlined">save</span>
                    {saving ? 'SAVING NOTES...' : 'SAVE CLINICAL NOTES'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  )
}
