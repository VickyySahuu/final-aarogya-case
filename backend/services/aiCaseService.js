/**
 * AAROGYA CASE — SIH26047 STEP 2
 * AI Clinical Intake & Structured Extraction Service
 * 
 * Functions strictly as a healthcare information-collection assistant.
 * - Architecture:
 *   Patient Response -> Gemini / AI Provider (when GEMINI_API_KEY present)
 *                    -> Structured JSON Output
 *                    -> Server-Side Validation
 *                    -> Guardrail Validation
 *                    -> Merge into structuredHistory
 *                    -> Missing Information Calculation
 *                    -> Next Adaptive Question
 * - Deterministic clinical NLP engine acts as verified fallback for offline / failure / tests.
 * - Enforces strict zero-diagnosis and zero-prescription safety guardrails.
 * - Preserves original patient response verbatim without overwriting.
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config()
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// Clinical symptoms dictionary with English and Hindi/Hinglish mappings
const CLINICAL_SYMPTOMS_DICT = [
  { match: /(high\s+)?fever|bukhar|pyrexia|temperature/i, canonical: 'Fever', category: 'General' },
  { match: /body\s*pain|body\s*ache|badan\s*dard/i, canonical: 'Body pain', category: 'Musculoskeletal' },
  { match: /shoulder\s*pain|joint\s*pain|kandhe\s*(me\s*)?dard|jodo\s*(me\s*)?dard|back\s*pain|kamar\s*dard|neck\s*pain|knee\s*pain/i, canonical: 'Shoulder / Joint pain', category: 'Musculoskeletal' },
  { match: /headache|head\s*pain|sar\s*dard|sir\s*dard/i, canonical: 'Headache', category: 'Neurological' },
  { match: /cough|khasi|khansi/i, canonical: 'Cough', category: 'Respiratory' },
  { match: /sore\s*throat|throat\s*pain|gale\s*me\s*(halka\s*|tez\s*)?dard|gale\s*me\s*kharash|gala\s*kharab|throat\s*irritation/i, canonical: 'Sore throat', category: 'ENT' },
  { match: /cold|runny\s*nose|sardi|jukham|chheenk|sneezing/i, canonical: 'Common cold / Runny nose', category: 'ENT' },
  { match: /chills|shivering|thand\s*lagna|kapkapi/i, canonical: 'Chills', category: 'General' },
  { match: /vomit(ing)?|ulti/i, canonical: 'Vomiting', category: 'Gastrointestinal' },
  { match: /nausea|ji\s*machlana/i, canonical: 'Nausea', category: 'Gastrointestinal' },
  { match: /stomach\s*pain|abdominal\s*pain|pet\s*dard|cramps/i, canonical: 'Abdominal pain', category: 'Gastrointestinal' },
  { match: /diarrhea|loose\s*motion|dast/i, canonical: 'Diarrhea', category: 'Gastrointestinal' },
  { match: /shortness\s*of\s*breath|breathing\s*(problem|issue|difficulty)|saans\s*(fulna|lene\s*me\s*takleef)/i, canonical: 'Shortness of breath', category: 'Respiratory' },
  { match: /chest\s*pain|chhati\s*me\s*dard/i, canonical: 'Chest pain', category: 'Cardiovascular' },
  { match: /dizziness|chakkar|lightheadedness/i, canonical: 'Dizziness', category: 'Neurological' },
  { match: /fatigue|tiredness|weakness|kamzori/i, canonical: 'Fatigue / Weakness', category: 'General' },
  { match: /rash|itching|khujli|redness|skin\s*eruption/i, canonical: 'Skin rash / Itching', category: 'Dermatological' },
  { match: /kidney\s*stone|pathri|renal\s*calcul(us|i)/i, canonical: 'Kidney stone / Renal calculus', category: 'Nephrological' },
  { match: /blood\s*in\s*urine|peshab\s*me\s*khoon|hematuria/i, canonical: 'Blood in urine / Hematuria', category: 'Nephrological' },
  { match: /flank\s*pain|kamar\s*(ke\s*paas\s*)?.*(pain|dard)/i, canonical: 'Flank pain / Lower back pain', category: 'Musculoskeletal' },
  { match: /dysuria|burning\s*(urination|urine)|peshab\s*me\s*jalan/i, canonical: 'Burning sensation during urination', category: 'Nephrological' },
  { match: /\b(pain|dard|ache)\b/i, canonical: 'Localized pain', category: 'General' },
]

// Duration extractors
function extractDuration(text) {
  if (!text) return null
  const cleaned = text.trim().toLowerCase()

  if (/today|aaj\s*se|subah\s*se|since\s*morning|few\s*hours/i.test(cleaned)) {
    return 'Today (< 24 hours)'
  }
  if (/yesterday|kal\s*se/i.test(cleaned)) {
    return '1-2 days'
  }
  const engNumMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
  const engWordMatch = cleaned.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*(days?)/i)
  if (engWordMatch) {
    const num = engNumMap[engWordMatch[1].toLowerCase()]
    return `${num} days`
  }
  const hindiNumMap = { ek: 1, do: 2, teen: 3, chaar: 4, char: 4, panch: 5, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10 }
  const hindiWordMatch = cleaned.match(/\b(ek|do|teen|chaar|char|panch|chhah|saat|aath|nau|das)\s*(din|days?)/i)
  if (hindiWordMatch) {
    const num = hindiNumMap[hindiWordMatch[1].toLowerCase()]
    return `${num} days`
  }
  const daysMatch = cleaned.match(/(\d+)\s*(din|days?)/i)
  if (daysMatch) {
    const num = daysMatch[1]
    return `${num} days`
  }
  const hindiWeekMatch = cleaned.match(/\b(ek|do|teen|chaar|char)\s*(hafta|hafte|weeks?)/i)
  if (hindiWeekMatch) {
    const num = hindiNumMap[hindiWeekMatch[1].toLowerCase()]
    return num === 1 ? '1 week (7 days)' : `${num} weeks`
  }
  if (/1\s*week|ek\s*hafta|one\s*week|around\s*a\s*week/i.test(cleaned)) {
    return '1 week (7 days)'
  }
  if (/(\d+)\s*(hafta|hafte|weeks?)/i.test(cleaned)) {
    const m = cleaned.match(/(\d+)\s*(hafta|hafte|weeks?)/i)
    return `${m[1]} weeks`
  }
  if (/more\s*than\s*a\s*week|several\s*days|kuch\s*din/i.test(cleaned)) {
    return '4-7 days'
  }
  return null
}

// Chronic history extractors
function extractPastHistory(text) {
  if (!text) return null
  const cleaned = text.toLowerCase()
  if (/no\s*(prior|past|chronic)\s*(illness|disease|history)|koi\s*purani\s*bimari\s*nahi|none|nothing|healthy/i.test(cleaned)) {
    return 'None reported'
  }
  const conditions = []
  if (/diabetes|sugar/i.test(cleaned)) conditions.push('Type 2 Diabetes')
  if (/hypertension|high\s*bp|blood\s*pressure/i.test(cleaned)) conditions.push('Hypertension')
  if (/asthma|damah/i.test(cleaned)) conditions.push('Asthma / Respiratory allergy')
  if (/thyroid|hypothyroid/i.test(cleaned)) conditions.push('Thyroid disorder')
  if (/heart\s*(disease|problem)|cardiac/i.test(cleaned)) conditions.push('Cardiac history')
  return conditions.length > 0 ? conditions.join(', ') : null
}

// Current medication extractors
function extractMedications(text) {
  if (!text) return null
  const cleaned = text.toLowerCase()
  if (/no\s*med(ication)?s?|none|kuch\s*nahi\s*(le\s*raha|khaya)|nothing\s*taken/i.test(cleaned)) {
    return 'None reported'
  }
  const meds = []
  if (/paracetamol|crocin|dolo|calpol/i.test(cleaned)) meds.push('Paracetamol / Antipyretic')
  if (/metformin|glycomet/i.test(cleaned)) meds.push('Metformin')
  if (/amlodipine|telmisartan/i.test(cleaned)) meds.push('Antihypertensive medication')
  if (/cetirizine|allegra|antihistamine/i.test(cleaned)) meds.push('Cetirizine / Antiallergic')
  if (/inhaler|asthalin/i.test(cleaned)) meds.push('Inhaler')
  if (/antibiotic|amoxicillin|azithromycin/i.test(cleaned)) meds.push('Antibiotics')
  return meds.length > 0 ? meds.join(', ') : null
}

// Allergy extractors
function extractAllergies(text) {
  if (!text) return null
  const cleaned = text.toLowerCase()
  if (/no\s*allerg(y|ies)|koi\s*allergy\s*nahi|none|no\s*known\s*allerg(y|ies)/i.test(cleaned)) {
    return 'None reported'
  }
  const allergies = []
  if (/penicillin/i.test(cleaned)) allergies.push('Penicillin')
  if (/sulfa/i.test(cleaned)) allergies.push('Sulfa drugs')
  if (/aspirin|nsaid/i.test(cleaned)) allergies.push('Aspirin / NSAIDs')
  if (/dust|dhool/i.test(cleaned)) allergies.push('Dust allergy')
  if (/pollen/i.test(cleaned)) allergies.push('Pollen allergy')
  if (/peanuts?|nuts?/i.test(cleaned)) allergies.push('Nut allergy')
  return allergies.length > 0 ? allergies.join(', ') : null
}

// Check if patient says they have nothing more to add
function isPatientFinished(text) {
  if (!text) return false
  const cleaned = text.trim().toLowerCase().replace(/[.,!?;:]/g, ' ')
  return (
    /^(no|nahi|nahin|nothing|nothing\s*else|bas|bas\s*itna|that('s|\s+is)?\s*all|done|all\s*done|no\s*more)$/i.test(cleaned.trim()) ||
    /\bnothing\s*else\b/i.test(cleaned) ||
    /\bthat('s|\s+is)\s*all\b/i.test(cleaned) ||
    /bas\s*itna\s*hi\s*hai|aur\s*kuch\s*nahi|nothing\s*more(\s*to\s*add)?/i.test(cleaned)
  )
}

// Field Semantics Normalizers (Enforces consistent clinical terminology)
// - "None reported" ONLY when the patient explicitly states absence.
// - "Not provided" when the patient has not supplied the information.
// - "Unknown" when the information is genuinely unknown / unresolved.
function normalizeHistoryField(val, defaultIfMissing = 'Not provided') {
  if (!val || val === 'null' || val === 'undefined') return defaultIfMissing
  const lower = String(val).trim().toLowerCase()
  if (lower === 'not provided') return 'Not provided'
  if (lower === 'not assessed') return 'Not assessed'
  if (lower === 'unknown') return 'Unknown'
  if (lower.includes('declined') || lower.includes('skipped')) return 'Declined / Skipped'
  if (
    lower === 'none' ||
    lower === 'none reported' ||
    lower === 'no' ||
    lower === 'nil' ||
    lower === 'no known allergies' ||
    lower === 'no chronic illness' ||
    lower === 'no medications' ||
    lower === 'healthy'
  ) {
    return 'None reported'
  }
  return String(val).trim()
}

function normalizeAllergyField(val) {
  if (!val || val === 'null' || val === 'undefined') return 'Unknown'
  const lower = String(val).trim().toLowerCase()
  if (lower === 'unknown') return 'Unknown'
  if (lower === 'not provided') return 'Not provided'
  if (lower === 'not assessed') return 'Not assessed'
  if (lower.includes('declined') || lower.includes('skipped')) return 'Declined / Skipped'
  if (
    lower === 'none' ||
    lower === 'none reported' ||
    lower === 'no known allergies' ||
    lower === 'no allergies' ||
    lower === 'no' ||
    lower === 'nil'
  ) {
    return 'None reported'
  }
  return String(val).trim()
}

function normalizeDurationField(val) {
  if (!val || val === 'null' || val === 'undefined') return 'Unknown'
  const lower = String(val).trim().toLowerCase()
  if (lower === 'unknown') return 'Unknown'
  if (lower === 'not provided') return 'Not provided'
  // Canonicalize Hindi days e.g. "3 din" -> "3 days"
  const daysMatch = lower.match(/(\d+)\s*(din|days?)/i)
  if (daysMatch) {
    return `${daysMatch[1]} days`
  }
  return String(val).trim()
}

function canonicalizeSymptom(s) {
  if (!s) return null
  const cleaned = String(s).trim()
  for (const dict of CLINICAL_SYMPTOMS_DICT) {
    if (dict.match.test(cleaned)) {
      return dict.canonical
    }
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function canonicalizeNegative(n) {
  if (!n) return null
  const cleaned = String(n).trim()
  const lower = cleaned.toLowerCase()
  if (lower.startsWith('no ') || lower.startsWith('not ')) {
    const raw = lower.replace(/^(no|not)\s+/i, '')
    const canon = canonicalizeSymptom(raw)
    return `No ${canon.toLowerCase()}`
  }
  const canon = canonicalizeSymptom(cleaned)
  return `No ${canon.toLowerCase()}`
}

// Location extractor (especially for abdominal pain or localized symptoms)
function extractLocation(text) {
  if (!text) return null
  const cleaned = text.toLowerCase()
  if (/flank|kamar|lower\s*back|back\s*pain|kidney\s*area/i.test(cleaned)) {
    return 'Flank / Lower back'
  }
  if (/upper\s*abdomen|pet\s*ke\s*upar|epigastric|above\s*navel/i.test(cleaned)) {
    return 'Upper abdomen'
  }
  if (/lower\s*abdomen|pet\s*ke\s*niche|hypogastric|pelvic/i.test(cleaned)) {
    return 'Lower abdomen'
  }
  if (/right\s*lower|right\s*side\s*pet|daaye\s*taraf/i.test(cleaned)) {
    return 'Right lower abdomen'
  }
  if (/left\s*lower|left\s*side\s*pet|baaye\s*taraf/i.test(cleaned)) {
    return 'Left lower abdomen'
  }
  if (/right\s*side/i.test(cleaned)) {
    return 'Right side'
  }
  if (/left\s*side/i.test(cleaned)) {
    return 'Left side'
  }
  if (/central|center|middle|around\s*navel|periumbilical/i.test(cleaned)) {
    return 'Central abdomen'
  }
  if (/whole\s*abdomen|pure\s*pet\s*me/i.test(cleaned)) {
    return 'Generalized / Whole abdomen'
  }
  if (/chest|chhati/i.test(cleaned)) {
    return 'Chest'
  }
  if (/throat|gala/i.test(cleaned)) {
    return 'Throat'
  }
  if (/head|forehead|sar|sir/i.test(cleaned)) {
    return 'Head / Forehead'
  }
  return null
}

// Severity extractor
function extractSeverity(text) {
  if (!text) return null
  const cleaned = text.toLowerCase()
  if (/severe|extreme|unbearable|bahut\s*jyada|tez\s*(dard)?|heavy/i.test(cleaned)) {
    return 'Severe'
  }
  if (/moderate|medium|theek\s*thaak|tolerable/i.test(cleaned)) {
    return 'Moderate'
  }
  if (/mild|slight|halka|kam|thoda/i.test(cleaned)) {
    return 'Mild'
  }
  const scaleMatch = cleaned.match(/(\d+)\s*(\/|\s*out\s*of\s*)\s*10/i)
  if (scaleMatch) {
    const num = parseInt(scaleMatch[1], 10)
    if (num >= 7) return 'Severe'
    if (num >= 4) return 'Moderate'
    return 'Mild'
  }
  return null
}

// Pattern extractor
function extractPattern(text) {
  if (!text) return null
  const cleaned = text.toLowerCase()
  if (/continuous|constant|lagatar|hamesha|all\s*the\s*time/i.test(cleaned)) {
    return 'Continuous'
  }
  if (/intermittent|comes\s*and\s*goes|kabhi\s*kabhi|waves|spasms|ruk\s*ruk\s*ke/i.test(cleaned)) {
    return 'Intermittent / Comes and goes'
  }
  if (/throbbing|pulsing/i.test(cleaned)) {
    return 'Throbbing'
  }
  if (/sharp|stabbing/i.test(cleaned)) {
    return 'Sharp'
  }
  if (/burning|jalan/i.test(cleaned)) {
    return 'Burning'
  }
  if (/getting\s*better|improving|sudhar\s*raha|kam\s*ho\s*raha|relief/i.test(cleaned)) {
    return 'Getting better'
  }
  if (/getting\s*worse|worsening|badh\s*raha|kharab\s*ho\s*raha/i.test(cleaned)) {
    return 'Getting worse'
  }
  return null
}

// Ambiguity detector for duration
function detectAmbiguousDuration(text) {
  if (!text) return false
  const cleaned = text.toLowerCase()
  // If concrete duration is extractable, not ambiguous
  if (extractDuration(text)) return false

  const ambiguousPatterns = [
    /(bahut|kaafi|kuch|thode|bohot)\s*(time|din|dino|hafto|samay)\s*se/i,
    /a\s*lot\s*of\s*time|for\s*(a\s*long|some)\s*time|many\s*days|for\s*days/i,
    /quite\s*some\s*time|several\s*days\s*back|long\s*back/i,
    /purana\s*hai|since\s*long/i,
    /bahut\s*time|kaafi\s*time|kuch\s*time/i
  ]
  return ambiguousPatterns.some(pat => pat.test(cleaned))
}

// Contradiction detector for clinical fields
function detectContradiction(prevStructured, newExtractions) {
  const notes = []
  if (
    prevStructured.duration &&
    prevStructured.duration !== 'Unknown' &&
    prevStructured.duration !== 'Not provided' &&
    newExtractions.duration &&
    newExtractions.duration !== 'Unknown' &&
    newExtractions.duration !== 'Not provided' &&
    prevStructured.duration.trim().toLowerCase() !== newExtractions.duration.trim().toLowerCase()
  ) {
    notes.push(`[Clarification] Duration updated from ${prevStructured.duration} to ${newExtractions.duration} based on patient statement.`)
  }

  if (
    prevStructured.severity &&
    prevStructured.severity !== 'Routine' &&
    prevStructured.severity !== 'Not provided' &&
    newExtractions.severity &&
    newExtractions.severity !== 'Routine' &&
    newExtractions.severity !== 'Not provided' &&
    prevStructured.severity.trim().toLowerCase() !== newExtractions.severity.trim().toLowerCase()
  ) {
    notes.push(`[Clarification] Severity updated from ${prevStructured.severity} to ${newExtractions.severity} based on patient statement.`)
  }

  return notes
}

// Language style detector for turn-level language mirroring
function detectLanguageStyle(text) {
  if (!text || typeof text !== 'string') return 'english'
  const trimmed = text.trim()
  // Check for Devanagari script (pure Hindi)
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return 'hindi'
  }
  const lower = trimmed.toLowerCase()
  const hindiMatches = lower.match(/\b(mujhe|mera|mere|meri|hai|hain|ho\s*raha|nahi|nahin|bukhar|dard|pet|sar|sir|gale|kamar|se|aur|bhi|kya|kab|kaun|kaise|bahut|bohot|thoda|kal|aaj|subah|shaam|dawa|kuch|chahiye|pe|par|khasi|khansi|ulti|jalan|chheenk|sardi|jukham|badan|thand|chakkar|le\s*raha|kamzori|kamzor|pata|batao|ilaj|peshab|pathri|chhati|khani|loon|hoon|gaya|gayi|diya|liya|halka)\b/gi) || []
  return hindiMatches.length > 0 ? 'hinglish' : 'english'
}

// Identify clinical complaint category for topic prioritization & variable depth
function identifyComplaintCategory(chiefComplaint, symptoms = [], currentText = '') {
  const allText = `${chiefComplaint || ''} ${(symptoms || []).join(' ')} ${currentText || ''}`.toLowerCase()
  if (/kidney\s*stone|pathri|renal\s*calcul|urine|peshab|hematuria|flank|kamar/i.test(allText)) {
    return 'urinary_stone'
  }
  if (/chest\s*pain|chhati\s*me\s*dard|angina/i.test(allText)) {
    return 'chest_pain'
  }
  if (/gale\s*me\s*(halka\s*)?dard|mild\s*sore\s*throat|halka\s*(bukhar|jukham)|mild\s*cold|minor\s*cold/i.test(allText)) {
    return 'simple'
  }
  if (/fever|bukhar|pyrexia|temperature/i.test(allText)) {
    return 'fever'
  }
  if (/stomach|abdominal|pet\s*dard|cramps|belly|digestive|loose\s*motion|diarrhea|vomit/i.test(allText)) {
    return 'abdominal'
  }
  if (/headache|sar\s*dard|sir\s*dard|migraine/i.test(allText)) {
    return 'headache'
  }
  if (/cough|khasi|khansi|breathing|shortness\s*of\s*breath|saans/i.test(allText)) {
    return 'respiratory'
  }
  return 'general'
}

// Configurable clinical topic sets per complaint with Natural Multilingual Support
const CLINICAL_TOPIC_CONFIGS = {
  simple: {
    topics: ['duration', 'severity', 'associatedSymptoms'],
    coreRequiredTopics: ['duration'],
    minTopicsForCompletion: 2,
    questions: {
      duration: {
        english: 'How many days have you been experiencing this throat discomfort or mild symptom?',
        hindi: 'Aapko gale me yeh takleef kitne din se ho rahi hai?',
        hinglish: 'Aapko gale me ye mild discomfort kitne din se ho rahi hai?'
      },
      severity: {
        english: 'Is the discomfort mild, or is it making it difficult to swallow or drink water?',
        hindi: 'Yeh dard halka hai ya paani peene me pareshani ho rahi hai?',
        hinglish: 'Ye pain mild hai ya paani peene aur nigalne me dikkat ho rahi hai?'
      },
      associatedSymptoms: {
        english: 'Have you noticed any fever, cough, or difficulty breathing with this?',
        hindi: 'Kya iske saath bukhar, khasi ya saans lene me takleef hai?',
        hinglish: 'Kya iske saath bukhar, cough ya saans lene me koi dikkat hai?'
      }
    }
  },
  urinary_stone: {
    topics: ['associatedSymptoms', 'pattern', 'severity', 'location', 'pastMedicalHistory'],
    coreRequiredTopics: ['associatedSymptoms', 'pattern'],
    minTopicsForCompletion: 4,
    questions: {
      severity: {
        english: 'How intense is the pain right now: mild, moderate, or severe?',
        hindi: 'Dard kitna tevar hai: halka, madhyam ya bahut tez?',
        hinglish: 'Dard kitna intense hai: mild, moderate ya severe?'
      },
      location: {
        english: 'Is the pain located on your lower back/flank or lower abdomen, and does it spread downward?',
        hindi: 'Dard kamar, peeth ya pet me kis jagah ho raha hai, aur kya yeh niche ki taraf badhta hai?',
        hinglish: 'Dard lower back, flank ya pet ke kis side hai, aur kya ye niche ki taraf radiate ho raha hai?'
      },
      pattern: {
        english: 'Is the pain continuous, or does it come and go in sharp cramp-like waves?',
        hindi: 'Dard lagatar bana rehta hai ya ruk-ruk kar tez marod ki tarah aata hai?',
        hinglish: 'Dard continuous hai ya waves aur spasms ki tarah aata-jata hai?'
      },
      associatedSymptoms: {
        english: 'Are you having burning during urination, difficulty passing urine, fever with chills, or nausea/vomiting?',
        hindi: 'Kya peshab me jalan, peshab rukne ki takleef, thand lagkar bukhar ya ulti jaisa lag raha hai?',
        hinglish: 'Kya urine pass karne me burning sensation, fever with chills, ya ulti/nausea ho raha hai?'
      },
      pastMedicalHistory: {
        english: 'Do you have a personal history of kidney stones, high uric acid, or prior urinary tract infections?',
        hindi: 'Kya aapko pehle kabhi pathri ya kidney infection ki samasya rahi hai?',
        hinglish: 'Kya aapko pehle kabhi kidney stones, pathri ya urinary infection ki history rahi hai?'
      }
    }
  },
  chest_pain: {
    topics: ['severity', 'pattern', 'associatedSymptoms', 'pastMedicalHistory'],
    coreRequiredTopics: ['severity', 'associatedSymptoms'],
    minTopicsForCompletion: 3,
    questions: {
      severity: {
        english: 'How severe is the chest discomfort, and does it feel like heaviness, pressure, or sharp pain?',
        hindi: 'Chhati ka dard kitna tez hai, aur kya yeh bhari-pan, dabav ya tez dard jaisa lagta hai?',
        hinglish: 'Chest pain kitna severe hai, aur kya heaviness ya pressure jaisa feel ho raha hai?'
      },
      pattern: {
        english: 'Does the pain spread to your left arm, shoulder, neck, or jaw?',
        hindi: 'Kya yeh dard baaye haath, kandhe, gardan ya jabde ki taraf fail raha hai?',
        hinglish: 'Kya ye dard left arm, shoulder, neck ya jaw ki taraf radiate ho raha hai?'
      },
      associatedSymptoms: {
        english: 'Are you experiencing sweating, shortness of breath, dizziness, or nausea?',
        hindi: 'Kya paseena, saans phoolna, chakkar ya ulti jaisa lag raha hai?',
        hinglish: 'Kya sweating, saans phoolna, dizziness ya nausea ho raha hai?'
      },
      pastMedicalHistory: {
        english: 'Do you have a personal history of high blood pressure, diabetes, or heart conditions?',
        hindi: 'Kya aapko high BP, sugar ya dil ki bimari ki purani history hai?',
        hinglish: 'Kya aapko high BP, diabetes ya cardiac illness ki koi history hai?'
      }
    }
  },
  fever: {
    topics: ['duration', 'associatedSymptoms', 'relevantNegatives', 'pastMedicalHistory', 'currentMedications', 'allergies'],
    coreRequiredTopics: ['duration', 'associatedSymptoms'],
    minTopicsForCompletion: 3,
    questions: {
      duration: {
        english: 'When did the fever start, or approximately how many days have you had it?',
        hindi: 'Bukhar kab shuru hua, aur lagbhag kitne din se hai?',
        hinglish: 'Bukhar kab se hai, ya approximately kitne din ho gaye hain?'
      },
      associatedSymptoms: {
        english: 'Have you experienced chills, body pain, headache, cough, vomiting, or skin rash?',
        hindi: 'Kya bukhar ke saath thand, badan dard, sir dard, khasi ya ulti ho rahi hai?',
        hinglish: 'Kya fever ke saath chills, body pain, headache, cough ya ulti jaisa kuch ho raha hai?'
      },
      relevantNegatives: {
        english: 'Are there any key symptoms you do NOT have, such as no cough, no vomiting, or no breathing difficulty?',
        hindi: 'Kya koi aise lakshan hain jo aapko bilkul nahi hain, jaise koi khasi nahi ya ulti nahi?',
        hinglish: 'Kya koi symptoms hain jo aapko bilkul nahi hain, jaise no cough ya no vomiting?'
      },
      pastMedicalHistory: {
        english: 'Do you have any existing chronic health conditions, such as diabetes, high BP, asthma, or thyroid issues?',
        hindi: 'Kya aapko sugar, high BP ya damah jaisi koi purani bimari hai?',
        hinglish: 'Kya aapko koi chronic health condition jaise diabetes, high BP ya asthma hai?'
      },
      currentMedications: {
        english: 'Are you taking any medications (such as paracetamol or other medicines) for this fever or other conditions?',
        hindi: 'Kya aap is bukhar ke liye koi dawa jaise paracetamol le rahe hain?',
        hinglish: 'Kya aap is fever ke liye koi medicine jaise paracetamol le rahe hain?'
      },
      allergies: {
        english: 'Do you have any known allergies to medicines (like penicillin or sulfa) or specific foods?',
        hindi: 'Kya aapko kisi dawa ya bhojan se koi allergy hai?',
        hinglish: 'Kya aapko kisi medicine (jaise penicillin) ya food se koi allergy hai?'
      }
    }
  },
  abdominal: {
    topics: ['location', 'duration', 'severity', 'pattern', 'associatedSymptoms', 'pastMedicalHistory'],
    coreRequiredTopics: ['location', 'duration'],
    minTopicsForCompletion: 3,
    questions: {
      location: {
        english: 'Could you tell me where the pain or discomfort is mainly located (such as upper abdomen, lower abdomen, or on one side)?',
        hindi: 'Dard pet me kis jagah ho raha hai (jaise upar, niche, ya daaye/baaye taraf)?',
        hinglish: 'Dard pet me mainly kaha par hai (jaise upper abdomen, lower abdomen ya ek side)?'
      },
      duration: {
        english: 'How long have you had this stomach pain, or approximately how many days has it been present?',
        hindi: 'Yeh pet dard kitne din se ho raha hai?',
        hinglish: 'Ye pet dard kitne din se hai ya kab shuru hua tha?'
      },
      severity: {
        english: 'How severe is the pain on a scale from mild, moderate, to severe?',
        hindi: 'Dard kitna tez hai: halka, madhyam ya bahut tez?',
        hinglish: 'Pain kitna severe hai: mild, moderate ya severe?'
      },
      pattern: {
        english: 'Is the pain continuous throughout the day, or does it come and go in intervals or waves?',
        hindi: 'Dard lagatar bana rehta hai ya ruk-ruk kar aata hai?',
        hinglish: 'Pain continuous hai ya intervals/waves me aata-jata rehta hai?'
      },
      associatedSymptoms: {
        english: 'Have you noticed any nausea, vomiting, loose motions, acidity, fever, or changes in your bowel movements?',
        hindi: 'Kya ulti, dast, jalan ya bukhar jaisa kuch mehsoos ho raha hai?',
        hinglish: 'Kya nausea, vomiting, loose motions ya fever jaisa kuch feel ho raha hai?'
      },
      pastMedicalHistory: {
        english: 'Do you have any prior history of gastrointestinal issues, acidity/ulcers, gallstones, or previous abdominal surgery?',
        hindi: 'Kya pehle kabhi pet ki bimari, ulcer ya surgery ki history rahi hai?',
        hinglish: 'Kya pehle kabhi ulcers, acidity ya koi prior abdominal surgery ki history rahi hai?'
      }
    }
  },
  headache: {
    topics: ['duration', 'severity', 'pattern', 'associatedSymptoms', 'pastMedicalHistory'],
    coreRequiredTopics: ['duration', 'severity'],
    minTopicsForCompletion: 3,
    questions: {
      duration: {
        english: 'How long have you had this headache, or how many days has it been present?',
        hindi: 'Yeh sir dard kitne din se ho raha hai?',
        hinglish: 'Ye headache kitne din se hai ya kab start hua tha?'
      },
      severity: {
        english: 'How intense is the headache on a scale from mild, moderate, to severe?',
        hindi: 'Sir dard kitna tez hai: halka, madhyam ya severe?',
        hinglish: 'Headache kitna severe hai: mild, moderate ya severe?'
      },
      pattern: {
        english: 'Is the headache throbbing, sharp, dull, or continuous, and is it on one side or all over?',
        hindi: 'Dard kaisa hai: dhak-dhak karta hua, tez, ya poore sir me?',
        hinglish: 'Headache throbbing hai, sharp hai ya poore sir me continuous hai?'
      },
      associatedSymptoms: {
        english: 'Are you experiencing any nausea, sensitivity to bright light or loud sounds, dizziness, or neck stiffness?',
        hindi: 'Kya roshni se pareshani, chakkar, ulti ya gardan me jakdan mehsoos ho rahi hai?',
        hinglish: 'Kya bright light se problem, nausea, chakkar ya neck stiffness ho rahi hai?'
      },
      pastMedicalHistory: {
        english: 'Do you have a history of migraines, high blood pressure, sinus problems, or eye strain?',
        hindi: 'Kya migraine, high BP ya sinus ki koi purani history hai?',
        hinglish: 'Kya migraines, high BP ya sinus ki koi prior history hai?'
      }
    }
  },
  respiratory: {
    topics: ['duration', 'severity', 'associatedSymptoms', 'relevantNegatives', 'pastMedicalHistory', 'currentMedications'],
    coreRequiredTopics: ['duration', 'associatedSymptoms'],
    minTopicsForCompletion: 3,
    questions: {
      duration: {
        english: 'How many days have you been experiencing this cough or breathing difficulty?',
        hindi: 'Khasi ya saans lene me takleef kitne din se hai?',
        hinglish: 'Cough ya breathing problem kitne din se ho rahi hai?'
      },
      severity: {
        english: 'Are you experiencing any shortness of breath, chest tightness, or difficulty speaking in full sentences?',
        hindi: 'Kya saans phool rahi hai ya chhati me jakdan mehsoos ho rahi hai?',
        hinglish: 'Kya shortness of breath, chest tightness ya baat karne me problem ho rahi hai?'
      },
      associatedSymptoms: {
        english: 'Are you having fever, sore throat, runny nose, or mucus/phlegm with the cough?',
        hindi: 'Kya bukhar, gale me dard ya balgam aa raha hai?',
        hinglish: 'Kya fever, sore throat ya cough ke saath mucus/phlegm aa raha hai?'
      },
      relevantNegatives: {
        english: 'Are there symptoms you do NOT have, such as no chest pain, no blood in cough, or no wheezing?',
        hindi: 'Kya koi aisi samasya hai jo nahi hai, jaise chhati me dard nahi ya khasi me khoon nahi?',
        hinglish: 'Kya koi symptoms hain jo aapko nahi hain, jaise no chest pain ya no wheezing?'
      },
      pastMedicalHistory: {
        english: 'Do you have a history of asthma, bronchitis, smoking, or chronic respiratory allergies?',
        hindi: 'Kya damah, asthma ya allergy ki koi purani samasya hai?',
        hinglish: 'Kya asthma, allergy ya smoking ki koi history hai?'
      },
      currentMedications: {
        english: 'Are you using any inhalers, cough syrups, or taking regular medications?',
        hindi: 'Kya aap koi inhaler ya khasi ka syrup le rahe hain?',
        hinglish: 'Kya aap koi inhaler ya regular cough medicine le rahe hain?'
      }
    }
  },
  general: {
    topics: ['duration', 'severity', 'associatedSymptoms', 'pastMedicalHistory', 'currentMedications', 'allergies'],
    coreRequiredTopics: ['duration', 'associatedSymptoms'],
    minTopicsForCompletion: 3,
    questions: {
      duration: {
        english: 'When did your symptoms begin, or how many days have you noticed this discomfort?',
        hindi: 'Aapko yeh takleef kitne din se ho rahi hai?',
        hinglish: 'Ye discomfort kitne din se hai ya kab shuru hua tha?'
      },
      severity: {
        english: 'How severe is this condition affecting your daily routine: mild, moderate, or severe?',
        hindi: 'Yeh takleef kitni tez hai: halki, madhyam ya severe?',
        hinglish: 'Ye condition kitni severe hai: mild, moderate ya severe?'
      },
      associatedSymptoms: {
        english: 'Have you noticed any other accompanying symptoms such as fever, fatigue, body ache, or nausea?',
        hindi: 'Kya bukhar, thakan, badan dard ya ulti jaisa kuch mehsoos ho raha hai?',
        hinglish: 'Kya fever, fatigue, body pain ya koi aur symptom notice kiya hai?'
      },
      pastMedicalHistory: {
        english: 'Do you have any chronic medical conditions, such as diabetes, blood pressure, or thyroid issues?',
        hindi: 'Kya diabetes, BP ya thyroid ki koi purani bimari hai?',
        hinglish: 'Kya diabetes, blood pressure ya thyroid jaisi koi chronic problem hai?'
      },
      currentMedications: {
        english: 'Are you currently taking any prescription medications or over-the-counter remedies?',
        hindi: 'Kya aap niyamit roop se koi dawa le rahe hain?',
        hinglish: 'Kya aap abhi koi regular medicines ya tablets le rahe hain?'
      },
      allergies: {
        english: 'Do you have any known allergies to medicines or foods?',
        hindi: 'Kya aapko kisi dawa ya bhojan se koi allergy hai?',
        hinglish: 'Kya aapko kisi medicine ya food se koi allergy hai?'
      }
    }
  }
}

// Deduplication check: prevents asking questions for information already known or already asked
function isQuestionDuplicateOrKnown(candidateQuestion, mergedStructured, questionState) {
  if (!candidateQuestion || typeof candidateQuestion !== 'string') return true
  const lower = candidateQuestion.toLowerCase()

  // 1. Duration deduplication
  const durationKnown = mergedStructured.duration && mergedStructured.duration !== 'Unknown' && mergedStructured.duration !== 'Not provided'
  if (durationKnown && (
    lower.includes('how long') ||
    lower.includes('since when') ||
    lower.includes('how many days') ||
    lower.includes('when did') ||
    lower.includes('kitne din') ||
    lower.includes('kab se') ||
    lower.includes('kab shuru')
  )) {
    return true
  }

  // 2. Location deduplication
  const locationKnown = mergedStructured.location && mergedStructured.location !== 'Not provided' && mergedStructured.location !== 'Not assessed'
  if (locationKnown && (
    lower.includes('where is the pain') ||
    lower.includes('where is') ||
    lower.includes('location of') ||
    lower.includes('which side') ||
    lower.includes('kaha par') ||
    lower.includes('kis jagah') ||
    lower.includes('kis side')
  )) {
    return true
  }

  // 3. Past history deduplication
  const historyKnown = mergedStructured.pastMedicalHistory && mergedStructured.pastMedicalHistory !== 'Not provided' && mergedStructured.pastMedicalHistory !== 'Not assessed'
  if (historyKnown && (
    lower.includes('chronic health') ||
    lower.includes('past medical') ||
    lower.includes('purani bimari') ||
    lower.includes('diabetes, high bp') ||
    lower.includes('prior history')
  )) {
    return true
  }

  // 4. Medications deduplication
  const medsKnown = mergedStructured.currentMedications && mergedStructured.currentMedications !== 'Not provided' && mergedStructured.currentMedications !== 'Not assessed'
  if (medsKnown && (
    lower.includes('taking any medication') ||
    lower.includes('taking any medicines') ||
    lower.includes('dawa le rahe') ||
    lower.includes('paracetamol')
  )) {
    return true
  }

  // 5. Allergies deduplication
  const allergiesKnown = mergedStructured.allergies && mergedStructured.allergies !== 'Unknown' && mergedStructured.allergies !== 'Not assessed'
  if (allergiesKnown && (
    lower.includes('any allergies') ||
    lower.includes('known allergies') ||
    lower.includes('allergic to') ||
    lower.includes('koi allergy')
  )) {
    return true
  }

  return false
}

// Patient disposition detector: differentiates UNKNOWN, DECLINED/SKIPPED, and NONE REPORTED (Section 20/21)
function detectPatientDisposition(text) {
  if (!text) return null
  const cleaned = text.trim().toLowerCase()
  if (
    /nahi\s*batana|don't\s*want\s*to\s*(say|share|tell)|prefer\s*not\s*to\s*say|skip|leave\s*it/i.test(cleaned) ||
    /main\s*ye\s*nahi\s*batana\s*chahta/i.test(cleaned)
  ) {
    return 'DECLINED'
  }
  if (
    /nahi\s*pata|don't\s*know|not\s*sure|no\s*idea|malum\s*nahi|pata\s*nahi|mujhe\s*nahi\s*pata/i.test(cleaned)
  ) {
    return 'UNKNOWN'
  }
  if (
    /koi\s*(bhi\s*)?(purani\s*bimari|allergy|dawa|medicine)?\s*nahi|none|nothing|nil|no\s*known|healthy|kuch\s*nahi/i.test(cleaned)
  ) {
    return 'NONE_REPORTED'
  }
  return null
}

// Touch-ready options generator for mobile/touch-first interactions (Section 32)
function getTouchOptionsForTopic(topic, category) {
  switch (topic) {
    case 'severity':
      return ['Mild', 'Moderate', 'Severe', 'Not sure']
    case 'pattern':
      return ['Constant', 'Comes and goes', 'Getting worse', 'Getting better']
    case 'relevantNegatives':
      return ['No other symptoms', 'Have additional symptoms', 'Not sure']
    case 'pastMedicalHistory':
      return ['None reported', 'Diabetes', 'High BP', 'Asthma', 'Not sure']
    case 'currentMedications':
      return ['None reported', 'Paracetamol', 'Other medicines', 'Not sure']
    case 'allergies':
      return ['None reported', 'Penicillin', 'Dust allergy', 'Not sure']
    case 'duration':
      return ['Today', '1-2 days', '3-5 days', 'More than 1 week']
    case 'duration_clarification':
      return ['1-2 days', '3-5 days', 'About 1 week', 'Several weeks']
    default:
      return null
  }
}

// Next-step supportive guidance generator (Section 26)
function generateNextStepGuidance({ category, mergedStructured, isComplete }) {
  if (!isComplete) return null
  const allText = `${mergedStructured.chiefComplaint || ''} ${(mergedStructured.symptoms || []).join(' ')} ${(mergedStructured.associatedSymptoms || []).join(' ')}`.toLowerCase()

  if (
    category === 'chest_pain' ||
    (category === 'urinary_stone' && (allText.includes('blood in urine') || allText.includes('hematuria') || allText.includes('inability'))) ||
    allText.includes('shortness of breath') ||
    (allText.includes('severe') && allText.includes('continuous'))
  ) {
    return 'Safety-sensitive concern noted. We recommend prioritizing prompt evaluation with an emergency care unit or immediate clinical consultation.'
  }

  if (category === 'simple') {
    return 'Mild supportive care recommended: rest, adequate hydration, and symptom monitoring. If symptoms persist beyond 48 hours or worsen, schedule a physician consultation.'
  }

  return 'Clinical intake details captured. Please review your structured summary and confirm your case to proceed with physician consultation.'
}

// Relevance engine: selects the next relevant topic based on validated state, missing info, past turns, and language style
function selectNextAdaptiveTopic({
  category,
  mergedStructured,
  questionState = {},
  lastPatientMessage = '',
  languageStyle = 'english'
}) {
  const config = CLINICAL_TOPIC_CONFIGS[category] || CLINICAL_TOPIC_CONFIGS.general
  const askedTopics = new Set(questionState.askedTopics || [])
  const answeredTopics = new Set(questionState.answeredTopics || [])

  const isKnown = {
    duration: mergedStructured.duration && mergedStructured.duration !== 'Unknown' && mergedStructured.duration !== 'Not provided',
    location: mergedStructured.location && mergedStructured.location !== 'Not provided' && mergedStructured.location !== 'Not assessed',
    severity: mergedStructured.severity && mergedStructured.severity !== 'Routine' && mergedStructured.severity !== 'Not provided',
    pattern: mergedStructured.pattern && mergedStructured.pattern !== 'Not provided' && mergedStructured.pattern !== 'Not assessed',
    associatedSymptoms: Array.isArray(mergedStructured.associatedSymptoms) && mergedStructured.associatedSymptoms.length > 0,
    relevantNegatives: Array.isArray(mergedStructured.relevantNegatives) && mergedStructured.relevantNegatives.length > 0,
    pastMedicalHistory: mergedStructured.pastMedicalHistory && mergedStructured.pastMedicalHistory !== 'Not provided' && mergedStructured.pastMedicalHistory !== 'Not assessed',
    currentMedications: mergedStructured.currentMedications && mergedStructured.currentMedications !== 'Not provided' && mergedStructured.currentMedications !== 'Not assessed',
    allergies: mergedStructured.allergies && mergedStructured.allergies !== 'Unknown' && mergedStructured.allergies !== 'Not assessed'
  }

  for (const [topic, known] of Object.entries(isKnown)) {
    if (known) {
      answeredTopics.add(topic)
    }
  }

  const durationClarificationCount = (questionState.clarificationCount && questionState.clarificationCount.duration) || 0
  if (detectAmbiguousDuration(lastPatientMessage) && !isKnown.duration && durationClarificationCount < 2) {
    const clarificationQuestion = languageStyle === 'english'
      ? 'Approximately how many days or weeks has this been happening?'
      : 'Aapko lagbhag kitne din, hafte ya mahine se ye problem ho rahi hai?'
    return {
      topic: 'duration_clarification',
      isClarification: true,
      question: clarificationQuestion,
      touchOptions: getTouchOptionsForTopic('duration_clarification', category),
      updatedAnsweredTopics: Array.from(answeredTopics)
    }
  }

  const remainingCandidateTopics = config.topics.filter(topic => {
    return !isKnown[topic] && !askedTopics.has(topic)
  })

  const coreAnswered = config.coreRequiredTopics.every(t => isKnown[t] || answeredTopics.has(t))
  const totalCovered = answeredTopics.size + askedTopics.size
  const hasAskedAny = askedTopics.size > 0

  if (remainingCandidateTopics.length === 0 || (hasAskedAny && coreAnswered && totalCovered >= config.minTopicsForCompletion)) {
    const completeMsg = languageStyle === 'english'
      ? 'Thank you for providing these clinical details. We have collected sufficient intake information for the doctor. Please review your case summary and confirm to proceed.'
      : 'Aapki clinical jankari collect kar li gayi hai. Kripya apni case summary review karein aur consultation ke liye Confirm karein.'
    return {
      topic: null,
      isComplete: true,
      question: completeMsg,
      touchOptions: ['Confirm Case', 'Review Summary'],
      updatedAnsweredTopics: Array.from(answeredTopics)
    }
  }

  const nextTopic = remainingCandidateTopics[0]
  const questionObj = config.questions[nextTopic]
  let questionText = 'Could you provide more details regarding your symptoms?'
  if (typeof questionObj === 'string') {
    questionText = questionObj
  } else if (questionObj && typeof questionObj === 'object') {
    questionText = questionObj[languageStyle] || questionObj.hinglish || questionObj.english
  }

  return {
    topic: nextTopic,
    isClarification: false,
    question: questionText,
    touchOptions: getTouchOptionsForTopic(nextTopic, category),
    updatedAnsweredTopics: Array.from(answeredTopics)
  }
}

// Patient direct inquiry safety check (diagnosis or medication requests) with Language Mirroring (Section 2 & 28)
function detectPatientSafetyInquiry(text, languageStyle = 'english') {
  if (!text) return null
  const cleaned = text.toLowerCase()
  if (
    /do\s+i\s+have\s+(dengue|malaria|covid|cancer|typhoid|flu|jaundice|infection)/i.test(cleaned) ||
    /kya\s+mujhe\s+(dengue|malaria|covid|bimari)/i.test(cleaned) ||
    /(dengue|malaria|covid)\s+hai\s+kya/i.test(cleaned) ||
    /what\s+(disease|illness|condition)\s+(is\s+this|do\s+i\s+have)/i.test(cleaned) ||
    /what\s+is\s+my\s+diagnosis/i.test(cleaned) ||
    /diagnose\s+me/i.test(cleaned)
  ) {
    const redirection = languageStyle === 'english'
      ? 'I am an AI clinical intake assistant and cannot diagnose medical conditions or interpret illnesses. Only your examining doctor can make a diagnosis after reviewing your symptoms. To help the doctor evaluate you, could you please tell me what specific symptoms you are experiencing and how long they have been present?'
      : 'Main ek AI clinical intake assistant hoon aur koi bimari diagnose nahi kar sakta. Keval doctor hi lakshanon ki janch karke diagnosis de sakte hain. Doctor ki madad ke liye, kripya batayein ki aapko kya takleef hai aur kab se ho rahi hai?'
    return {
      type: 'diagnosis_inquiry',
      redirection
    }
  }
  if (
    /which\s+medicine\s+(should\s+i\s+take|to\s+take)/i.test(cleaned) ||
    /what\s+medicine\s+should/i.test(cleaned) ||
    /what\s+tablet\s+should/i.test(cleaned) ||
    /give\s+me\s+(treatment|medicine|prescription)/i.test(cleaned) ||
    /kaun\s*si\s*(dawa|medicine|tablet)\s*(khani|lu|chahiye|loon|len)/i.test(cleaned) ||
    /dawa\s+batao|ilaj\s+batao/i.test(cleaned)
  ) {
    const redirection = languageStyle === 'english'
      ? 'I cannot prescribe or recommend any medications or treatments. Only your consulting physician can safely prescribe medicines. To help prepare your case for the doctor, are you currently taking any medications, or do you have any known allergies?'
      : 'Main koi dawa ya prescription recommend nahi kar sakta. Keval doctor hi surakshit roop se dawa likh sakte hain. Doctor ki taiyari ke liye, kya aap koi dawa le rahe hain ya koi allergy hai?'
    return {
      type: 'prescription_inquiry',
      redirection
    }
  }
  return null
}

export const AiCaseService = {
  /**
   * Reports the current AI provider configuration
   */
  getProviderStatus() {
    const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0
    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
    return {
      provider: hasApiKey ? 'gemini' : 'deterministic-nlp',
      model: hasApiKey ? model : 'deterministic-rule-engine',
      hasApiKey,
      safetyGuardrailsActive: true
    }
  },

  /**
   * Validates structured output against expected clinical schema & safety rules
   */
  validateAiOutput(output) {
    if (!output || typeof output !== 'object') return false
    if (!output.extractedInformation || typeof output.extractedInformation !== 'object') return false
    if (!Array.isArray(output.extractedInformation.symptoms)) return false
    if (!Array.isArray(output.missingInformation)) return false
    if (typeof output.nextQuestion !== 'string' || !output.nextQuestion.trim()) return false

    // Safety guardrails against diagnostic statements in AI questions or extracted data
    const questionLower = output.nextQuestion.toLowerCase()
    const forbiddenPhrases = [
      'you have dengue',
      'you have malaria',
      'you have covid',
      'you have typhoid',
      'diagnosed with',
      'i diagnose',
      'you suffer from',
      'take this medicine',
      'buy these tablets',
      'i prescribe',
      'take paracetamol 650'
    ]
    for (const phrase of forbiddenPhrases) {
      if (questionLower.includes(phrase)) {
        console.warn(`[AiCaseService Guardrail Triggered] Blocked forbidden diagnostic phrase: "${phrase}"`)
        return false
      }
    }

    // Safety guardrails against diagnostic claims in chief complaint
    const ccLower = (output.extractedInformation.chiefComplaint || '').toLowerCase()
    if (ccLower.includes('diagnosed with') || ccLower.includes('confirmed dengue') || ccLower.includes('confirmed malaria')) {
      console.warn(`[AiCaseService Guardrail Triggered] Blocked speculative diagnosis in chief complaint.`)
      return false
    }

    return true
  },

  /**
   * Calls Google Gemini API when GEMINI_API_KEY is configured
   */
  async callGeminiApi({ patientMessage, existingCase = {}, conversationHistory = [], languageStyle = 'english' }) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || !apiKey.trim()) {
      throw new Error('GEMINI_API_KEY is not configured.')
    }

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
    const candidateModels = Array.from(new Set([primaryModel, 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.6-flash']))

    const prevStructured = existingCase.structuredHistory || existingCase.structured_history || {}
    const prevQuestionState = existingCase.questionState || prevStructured.questionState || {}

    const systemPrompt = `You are an AI clinical intake assistant for the AAROGYA CASE public healthcare platform.
Your sole responsibility is collecting patient medical history for a physician prior to consultation.

CRITICAL CLINICAL SAFETY & QUESTIONING RULES:
1. DO NOT DIAGNOSE any illness or disease under any circumstances (never say "you have dengue", "diagnosed with", etc.).
2. DO NOT PRESCRIBE or recommend any medicines, dosages, or treatments.
3. Extract only clinical facts directly stated or affirmed by the patient. Do not fabricate or assume unstated information.
4. If a field is not mentioned by the patient, leave it null (never invent false negative findings).
5. DO NOT ask for information that is already known in PREVIOUS STRUCTURED CASE.
6. Ask only ONE useful clinical follow-up question targeting uncollected details.
7. LANGUAGE MIRRORING RULE:
   The patient's current response is in ${languageStyle.toUpperCase()}.
   You MUST formulate "suggestedFollowUp" strictly in ${languageStyle.toUpperCase()} mirroring the patient's conversational style:
   - If English: clear, polite conversational English (e.g. "How long have you had this fever?").
   - If Hindi: natural Hindi (e.g. "Aapko bukhar ke saath thand ya sir dard bhi ho raha hai?").
   - If Hinglish: natural conversational Hinglish (e.g. "Kya aapko chills, headache ya koi aur problem bhi ho rahi hai?").
   Do NOT translate every response into formal English. Keep clinical entity extraction standardized in medical English for the physician.

PREVIOUS STRUCTURED CASE:
${JSON.stringify(prevStructured, null, 2)}

PREVIOUSLY ASKED TOPICS:
${JSON.stringify(prevQuestionState.askedTopics || [], null, 2)}

RECENT CONVERSATION TURNS:
${JSON.stringify(conversationHistory.slice(-4), null, 2)}

PATIENT STATEMENT:
"${patientMessage}"

Output strictly a valid JSON object matching this exact schema:
{
  "extractedEntities": {
    "chiefComplaint": "string or null",
    "duration": "string or null",
    "location": "string or null",
    "severity": "string or null",
    "pattern": "string or null",
    "symptoms": ["string"],
    "associatedSymptoms": ["string"],
    "pastMedicalHistory": "string or null",
    "currentMedications": "string or null",
    "allergies": "string or null",
    "relevantNegatives": ["string"]
  },
  "suggestedFollowUp": "string or null",
  "touchOptions": ["string"] or null
}`

    let lastError = null

    for (const model of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          lastError = new Error(`Gemini API (${model}) error HTTP ${response.status}: ${errText.slice(0, 150)}`)
          // If model not found or temporarily unavailable, try next candidate model
          if (response.status === 404 || response.status === 503) {
            console.warn(`[AiCaseService] Model ${model} returned ${response.status}. Trying next candidate model...`)
            continue
          }
          throw lastError
        }

        const data = await response.json()
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!rawText) {
          throw new Error(`Gemini API (${model}) returned an empty response candidate.`)
        }

        let cleaned = rawText.trim()
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        const parsed = JSON.parse(cleaned)
        if (!parsed || typeof parsed !== 'object' || !parsed.extractedEntities) {
          throw new Error('Malformed Gemini response: missing extractedEntities.')
        }

        // Safety Guardrail validation against diagnostic claims
        const entities = parsed.extractedEntities
        const forbidden = /dengue|malaria|covid|typhoid|diagnosed\s+with|i\s+diagnose|take\s+this\s+medicine|i\s+prescribe/i
        if (forbidden.test(entities.chiefComplaint || '') || forbidden.test(parsed.suggestedFollowUp || '')) {
          console.warn('[AiCaseService Guardrail] Blocked forbidden diagnostic/prescription output from Gemini response.')
          throw new Error('Gemini output violated clinical safety guardrails (diagnosis/prescription detected).')
        }

        return parsed
      } catch (err) {
        clearTimeout(timeoutId)
        lastError = err
        console.warn(`[AiCaseService] Model ${model} failed (${err.message}). Trying next candidate model if available...`)
      }
    }

    throw lastError || new Error('All Gemini candidate models failed.')
  },

  /**
   * Evaluates missing clinical fields based on the structured history
   */
  determineMissingInfo(structured) {
    const missing = []
    if (!structured.chiefComplaint || structured.chiefComplaint === 'Not provided') {
      missing.push('chiefComplaint')
    }
    if (!structured.duration || structured.duration === 'Unknown') {
      missing.push('duration')
    }
    if (!structured.symptoms || structured.symptoms.length === 0) {
      missing.push('symptoms')
    }
    if (!structured.associatedSymptoms || structured.associatedSymptoms.length === 0) {
      missing.push('associatedSymptoms')
    }
    if (!structured.pastMedicalHistory || structured.pastMedicalHistory === 'Not provided') {
      missing.push('pastMedicalHistory')
    }
    if (!structured.currentMedications || structured.currentMedications === 'Not provided') {
      missing.push('currentMedications')
    }
    if (!structured.allergies || structured.allergies === 'Unknown') {
      missing.push('allergies')
    }
    return missing
  },

  /**
   * Generates next adaptive question strictly from current validated state, question state, and missing information
   */
  generateAdaptiveQuestion(structured, missingInfo, questionCount, lastPatientMessage, prevQuestionState = {}, languageStyle = 'english') {
    // 0. Check if patient explicitly made a diagnostic or prescription inquiry
    const safetyInquiry = detectPatientSafetyInquiry(lastPatientMessage, languageStyle)
    if (safetyInquiry) {
      return {
        nextQuestion: safetyInquiry.redirection,
        isComplete: false,
        questionState: prevQuestionState,
        touchOptions: null,
        nextStepGuidance: null
      }
    }

    const category = identifyComplaintCategory(structured.chiefComplaint, structured.symptoms, lastPatientMessage)

    // Check if patient explicitly concluded
    if (isPatientFinished(lastPatientMessage)) {
      const finishMsg = languageStyle === 'english'
        ? 'Thank you for sharing your medical information. We have captured all key details for your case. Please review the case summary and click Confirm Case to proceed.'
        : 'Aapki medical details note kar li gayi hain. Kripya case summary review karein aur doctor consultation ke liye Confirm Case par click karein.'
      return {
        nextQuestion: finishMsg,
        isComplete: true,
        touchOptions: ['Confirm Case', 'Review Summary'],
        nextStepGuidance: generateNextStepGuidance({ category, mergedStructured: structured, isComplete: true }),
        questionState: {
          ...prevQuestionState,
          completionStatus: 'COMPLETED'
        }
      }
    }

    // Question limit guardrail (complete interview between 4 to 6 questions max)
    if (questionCount >= 5) {
      const limitMsg = languageStyle === 'english'
        ? 'Thank you for providing these clinical details. We have collected sufficient intake information for the doctor. Is there any other symptom or detail you want the doctor to know, or shall we proceed to case review?'
        : 'Dhanyawad. Doctor ke liye zaroori clinical jankari collect ho chuki hai. Kripya apni summary check karke Confirm karein.'
      return {
        nextQuestion: limitMsg,
        isComplete: true,
        touchOptions: ['Confirm Case', 'Review Summary'],
        nextStepGuidance: generateNextStepGuidance({ category, mergedStructured: structured, isComplete: true }),
        questionState: {
          ...prevQuestionState,
          completionStatus: 'COMPLETED'
        }
      }
    }

    const adaptiveResult = selectNextAdaptiveTopic({
      category,
      mergedStructured: structured,
      questionState: prevQuestionState,
      lastPatientMessage,
      languageStyle
    })

    const updatedState = {
      askedTopics: Array.isArray(prevQuestionState.askedTopics) ? [...prevQuestionState.askedTopics] : [],
      answeredTopics: adaptiveResult.updatedAnsweredTopics || [],
      skippedTopics: Array.isArray(prevQuestionState.skippedTopics) ? [...prevQuestionState.skippedTopics] : [],
      clarificationCount: { ...(prevQuestionState.clarificationCount || {}) },
      currentTopic: adaptiveResult.topic || prevQuestionState.currentTopic,
      completionStatus: adaptiveResult.isComplete ? 'COMPLETED' : 'IN_PROGRESS'
    }

    if (adaptiveResult.isClarification) {
      updatedState.clarificationCount.duration = (updatedState.clarificationCount.duration || 0) + 1
      updatedState.currentTopic = 'duration_clarification'
    } else if (adaptiveResult.topic && !updatedState.askedTopics.includes(adaptiveResult.topic)) {
      updatedState.askedTopics.push(adaptiveResult.topic)
    }

    return {
      nextQuestion: adaptiveResult.question,
      isComplete: !!adaptiveResult.isComplete,
      touchOptions: adaptiveResult.touchOptions || null,
      nextStepGuidance: generateNextStepGuidance({ category, mergedStructured: structured, isComplete: !!adaptiveResult.isComplete }),
      questionState: updatedState
    }
  },

  /**
   * Deterministic extraction engine (used as verified offline/safe fallback)
   */
  extractWithDeterministicFallback({ currentText, prevStructured, prevQuestionState = {} }) {
    // 1. Identify symptoms in current message
    const identifiedSymptoms = []
    for (const sym of CLINICAL_SYMPTOMS_DICT) {
      if (sym.match.test(currentText)) {
        identifiedSymptoms.push(sym.canonical)
      }
    }

    // 2. Extract Duration
    const foundDuration = extractDuration(currentText)

    // 3. Extract Location
    const foundLocation = extractLocation(currentText)

    // 4. Extract Severity
    const foundSeverity = extractSeverity(currentText)

    // 5. Extract Pattern
    const foundPattern = extractPattern(currentText)

    // 6. Extract Past History
    let foundHistory = extractPastHistory(currentText)

    // 7. Extract Medications
    let foundMeds = extractMedications(currentText)

    // 8. Extract Allergies
    let foundAllergies = extractAllergies(currentText)

    // Patient disposition handling (Section 20 & 21)
    const disposition = detectPatientDisposition(currentText)
    if (disposition === 'DECLINED') {
      if (prevQuestionState.currentTopic === 'pastMedicalHistory') foundHistory = 'Declined / Skipped'
      if (prevQuestionState.currentTopic === 'currentMedications') foundMeds = 'Declined / Skipped'
      if (prevQuestionState.currentTopic === 'allergies') foundAllergies = 'Declined / Skipped'
    } else if (disposition === 'UNKNOWN') {
      if (prevQuestionState.currentTopic === 'pastMedicalHistory') foundHistory = 'Unknown'
      if (prevQuestionState.currentTopic === 'currentMedications') foundMeds = 'Unknown'
      if (prevQuestionState.currentTopic === 'allergies') foundAllergies = 'Unknown'
    } else if (disposition === 'NONE_REPORTED') {
      if (prevQuestionState.currentTopic === 'pastMedicalHistory' || /purani|bimari|chronic/i.test(currentText)) foundHistory = 'None reported'
      if (prevQuestionState.currentTopic === 'currentMedications' || /dawa|medicine|tablet/i.test(currentText)) foundMeds = 'None reported'
      if (prevQuestionState.currentTopic === 'allergies' || /allergy/i.test(currentText)) foundAllergies = 'None reported'
    }

    // 9. Determine Chief Complaint
    let chiefComplaint = prevStructured.chiefComplaint
    if (
      !chiefComplaint ||
      chiefComplaint === 'Not provided' ||
      chiefComplaint === 'Reported health concern' ||
      chiefComplaint === 'Pending clinical intake interview'
    ) {
      if (identifiedSymptoms.length > 0) {
        chiefComplaint = identifiedSymptoms[0]
      } else {
        chiefComplaint = currentText.length > 80 ? `${currentText.slice(0, 77)}...` : currentText
      }
    }

    // 10. Merge symptoms cumulatively (no duplicates)
    const existingSymptomsList = Array.isArray(prevStructured.symptoms) ? [...prevStructured.symptoms] : []
    for (const s of identifiedSymptoms) {
      if (!existingSymptomsList.includes(s)) {
        existingSymptomsList.push(s)
      }
    }

    // 11. Distribute primary vs associated symptoms
    const primarySymptoms = existingSymptomsList.length > 0 ? existingSymptomsList : []
    const associatedSymptoms = Array.isArray(prevStructured.associatedSymptoms) ? [...prevStructured.associatedSymptoms] : []
    if (existingSymptomsList.length > 1) {
      for (let i = 1; i < existingSymptomsList.length; i++) {
        if (!associatedSymptoms.includes(existingSymptomsList[i])) {
          associatedSymptoms.push(existingSymptomsList[i])
        }
      }
    }

    // 12. Check for contradictions
    const contradictionNotes = detectContradiction(prevStructured, {
      duration: normalizeDurationField(foundDuration),
      severity: foundSeverity
    })

    let finalDuration = normalizeDurationField(foundDuration || prevStructured.duration)
    if (detectAmbiguousDuration(currentText) && !foundDuration) {
      finalDuration = prevStructured.duration || 'Unknown'
    }

    const defaultQuestionState = {
      askedTopics: [],
      answeredTopics: [],
      skippedTopics: [],
      clarificationCount: {},
      currentTopic: null,
      completionStatus: 'IN_PROGRESS'
    }

    // 13. Merge structured history safely
    const mergedStructured = {
      chiefComplaint: chiefComplaint || 'Not provided',
      duration: finalDuration,
      symptoms: primarySymptoms,
      associatedSymptoms: associatedSymptoms,
      location: foundLocation || prevStructured.location || 'Not provided',
      severity: foundSeverity || prevStructured.severity || 'Routine',
      pattern: foundPattern || prevStructured.pattern || 'Not provided',
      pastMedicalHistory: normalizeHistoryField(foundHistory || prevStructured.pastMedicalHistory, 'Not provided'),
      currentMedications: normalizeHistoryField(foundMeds || prevStructured.currentMedications, 'Not provided'),
      allergies: normalizeAllergyField(foundAllergies || prevStructured.allergies),
      relevantNegatives: Array.isArray(prevStructured.relevantNegatives) ? [...prevStructured.relevantNegatives] : [],
      additionalInformation: contradictionNotes.length > 0
        ? (prevStructured.additionalInformation && prevStructured.additionalInformation !== 'Not provided'
            ? `${prevStructured.additionalInformation} | ${contradictionNotes.join(' ')}`
            : contradictionNotes.join(' '))
        : (prevStructured.additionalInformation || 'Not provided'),
      questionState: prevStructured.questionState || defaultQuestionState
    }

    // Check for negative mentions in text and append to relevantNegatives safely
    const negativeChecks = [
      { pattern: /no\s*cough|khasi.*nahi|khansi.*nahi/i, term: 'No cough' },
      { pattern: /no\s*(shortness\s*of\s*breath|breathing\s*difficulty)|saans.*nahi/i, term: 'No difficulty breathing' },
      { pattern: /no\s*chest\s*pain|chhati.*nahi/i, term: 'No chest pain' },
      { pattern: /no\s*vomit(ing)?|ulti.*nahi/i, term: 'No vomiting' },
      { pattern: /no\s*fever|bukhar.*nahi/i, term: 'No fever' },
    ]
    for (const neg of negativeChecks) {
      if (neg.pattern.test(currentText) && !mergedStructured.relevantNegatives.includes(neg.term)) {
        mergedStructured.relevantNegatives.push(neg.term)
      }
    }

    return mergedStructured
  },

  /**
   * Processes a single turn of the patient AI interview:
   * 1. Ingests the patient response.
   * 2. Tries Gemini API if GEMINI_API_KEY is configured.
   * 3. Seamlessly falls back to deterministic clinical NLP if unavailable or on error.
   * 4. Merges extracted clinical entities into existing structured history.
   * 5. Preserves originalPatientResponse verbatim (only sets initial response).
   * 6. Formulates adaptive next question targeting missing information.
   * 7. Enforces strict safety validation.
   */
  async processTurn({ patientMessage, existingCase = {}, conversationHistory = [] }) {
    if (!patientMessage || !patientMessage.trim()) {
      throw new Error('Patient response cannot be empty.')
    }

    const currentText = patientMessage.trim()
    const languageStyle = detectLanguageStyle(currentText)
    const prevStructured = existingCase.structuredHistory || existingCase.structured_history || {}
    const defaultQuestionState = {
      askedTopics: [],
      answeredTopics: [],
      skippedTopics: [],
      clarificationCount: {},
      currentTopic: null,
      completionStatus: 'IN_PROGRESS'
    }
    const prevQuestionState = existingCase.questionState || prevStructured.questionState || defaultQuestionState

    const safetyInquiry = detectPatientSafetyInquiry(currentText, languageStyle)
    if (safetyInquiry) {
      return {
        patientResponse: currentText,
        languageStyle,
        touchOptions: null,
        nextStepGuidance: null,
        extractedInformation: {
          chiefComplaint: prevStructured.chiefComplaint || 'Not provided',
          duration: prevStructured.duration || 'Unknown',
          location: prevStructured.location || 'Not provided',
          severity: prevStructured.severity || 'Routine',
          pattern: prevStructured.pattern || 'Not provided',
          symptoms: Array.isArray(prevStructured.symptoms) ? prevStructured.symptoms : [],
          associatedSymptoms: Array.isArray(prevStructured.associatedSymptoms) ? prevStructured.associatedSymptoms : [],
          pastMedicalHistory: prevStructured.pastMedicalHistory || 'Not provided',
          currentMedications: prevStructured.currentMedications || 'Not provided',
          allergies: prevStructured.allergies || 'Unknown',
          relevantNegatives: Array.isArray(prevStructured.relevantNegatives) ? prevStructured.relevantNegatives : [],
          additionalInformation: prevStructured.additionalInformation || 'Not provided',
          questionState: prevQuestionState
        },
        questionState: prevQuestionState,
        missingInformation: this.determineMissingInfo(prevStructured),
        nextQuestion: safetyInquiry.redirection,
        isComplete: false,
        disclaimer: 'AI-assisted clinical intake assistant. The consulting doctor makes all clinical diagnoses and treatment decisions.'
      }
    }

    let mergedStructured = null
    let geminiSuggestedQuestion = null

    // 1. Attempt Gemini Execution Path if API Key is available
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
      try {
        const geminiResult = await this.callGeminiApi({
          patientMessage: currentText,
          existingCase,
          conversationHistory,
          languageStyle
        })

        const entities = geminiResult.extractedEntities || {}
        geminiSuggestedQuestion = geminiResult.suggestedFollowUp

        const deterministicExtractions = this.extractWithDeterministicFallback({ currentText, prevStructured, languageStyle })

        // Merge Gemini entities with canonicalization into existing structured history
        const existingSymptomsList = Array.isArray(prevStructured.symptoms) ? [...prevStructured.symptoms] : []
        if (Array.isArray(entities.symptoms)) {
          for (const s of entities.symptoms) {
            const canon = canonicalizeSymptom(s)
            if (canon && !existingSymptomsList.includes(canon)) existingSymptomsList.push(canon)
          }
        }
        for (const s of deterministicExtractions.symptoms) {
          if (s && !existingSymptomsList.includes(s)) existingSymptomsList.push(s)
        }

        const existingNegatives = Array.isArray(prevStructured.relevantNegatives) ? [...prevStructured.relevantNegatives] : []
        if (Array.isArray(entities.relevantNegatives)) {
          for (const n of entities.relevantNegatives) {
            const canon = canonicalizeNegative(n)
            if (canon && !existingNegatives.includes(canon)) existingNegatives.push(canon)
          }
        }
        for (const n of deterministicExtractions.relevantNegatives) {
          if (n && !existingNegatives.includes(n)) existingNegatives.push(n)
        }

        let cc = entities.chiefComplaint || deterministicExtractions.chiefComplaint || prevStructured.chiefComplaint || 'Not provided'
        if (cc && cc !== 'Not provided') {
          cc = canonicalizeSymptom(cc) || cc
        }

        // Detect contradictions between previous state and new information
        const contradictionNotes = detectContradiction(prevStructured, {
          duration: normalizeDurationField(entities.duration || deterministicExtractions.duration),
          severity: entities.severity || deterministicExtractions.severity
        })

        let finalDuration = normalizeDurationField(entities.duration || deterministicExtractions.duration || prevStructured.duration)
        if (detectAmbiguousDuration(currentText) && !extractDuration(currentText)) {
          finalDuration = prevStructured.duration || 'Unknown'
        }

        mergedStructured = {
          chiefComplaint: cc,
          duration: finalDuration,
          symptoms: existingSymptomsList,
          associatedSymptoms: Array.isArray(entities.associatedSymptoms) && entities.associatedSymptoms.length > 0
            ? entities.associatedSymptoms.map(s => canonicalizeSymptom(s) || s)
            : (deterministicExtractions.associatedSymptoms || prevStructured.associatedSymptoms || []),
          location: entities.location || deterministicExtractions.location || prevStructured.location || 'Not provided',
          severity: entities.severity || deterministicExtractions.severity || prevStructured.severity || 'Routine',
          pattern: entities.pattern || deterministicExtractions.pattern || prevStructured.pattern || 'Not provided',
          pastMedicalHistory: normalizeHistoryField(entities.pastMedicalHistory || deterministicExtractions.pastMedicalHistory || prevStructured.pastMedicalHistory, 'Not provided'),
          currentMedications: normalizeHistoryField(entities.currentMedications || deterministicExtractions.currentMedications || prevStructured.currentMedications, 'Not provided'),
          allergies: normalizeAllergyField(entities.allergies || deterministicExtractions.allergies || prevStructured.allergies),
          relevantNegatives: existingNegatives,
          additionalInformation: contradictionNotes.length > 0
            ? (prevStructured.additionalInformation && prevStructured.additionalInformation !== 'Not provided'
                ? `${prevStructured.additionalInformation} | ${contradictionNotes.join(' ')}`
                : contradictionNotes.join(' '))
            : (prevStructured.additionalInformation || 'Not provided'),
          questionState: prevQuestionState
        }
      } catch (geminiError) {
        console.warn(`[AiCaseService] Gemini call failed: ${geminiError.message}. Safely executing deterministic clinical NLP fallback.`)
        mergedStructured = this.extractWithDeterministicFallback({ currentText, prevStructured, languageStyle })
      }
    } else {
      // Direct execution of deterministic clinical NLP engine
      mergedStructured = this.extractWithDeterministicFallback({ currentText, prevStructured, languageStyle })
    }

    // 2. Track missing fields
    const missingInfo = this.determineMissingInfo(mergedStructured)

    // 3. Formulate adaptive next question driven by questionState and relevance engine
    const questionCount = conversationHistory.filter(m => m.role === 'assistant' || m.sender === 'ai').length
    let { nextQuestion, isComplete, touchOptions, nextStepGuidance, questionState: newQuestionState } = this.generateAdaptiveQuestion(
      mergedStructured,
      missingInfo,
      questionCount,
      currentText,
      prevQuestionState,
      languageStyle
    )

    // If Gemini suggested a question, enforce semantic deduplication and safety guardrails
    const safetyCheck = detectPatientSafetyInquiry(currentText, languageStyle)
    if (!safetyCheck && !isComplete && geminiSuggestedQuestion && typeof geminiSuggestedQuestion === 'string' && geminiSuggestedQuestion.trim().length > 10) {
      const isDuplicate = isQuestionDuplicateOrKnown(geminiSuggestedQuestion, mergedStructured, prevQuestionState)
      const lower = geminiSuggestedQuestion.toLowerCase()
      const hasForbidden = lower.includes('you have') || lower.includes('diagnos') || lower.includes('prescribe') || lower.includes('take')
      
      if (!isDuplicate && !hasForbidden) {
        nextQuestion = geminiSuggestedQuestion.trim()
      }
    }

    // Persist updated questionState inside mergedStructured
    mergedStructured.questionState = newQuestionState

    const result = {
      patientResponse: currentText,
      languageStyle,
      touchOptions: touchOptions || null,
      nextStepGuidance: nextStepGuidance || null,
      extractedInformation: {
        chiefComplaint: mergedStructured.chiefComplaint,
        duration: mergedStructured.duration,
        location: mergedStructured.location,
        severity: mergedStructured.severity,
        pattern: mergedStructured.pattern,
        symptoms: mergedStructured.symptoms,
        associatedSymptoms: mergedStructured.associatedSymptoms,
        pastMedicalHistory: mergedStructured.pastMedicalHistory,
        currentMedications: mergedStructured.currentMedications,
        allergies: mergedStructured.allergies,
        relevantNegatives: mergedStructured.relevantNegatives,
        additionalInformation: mergedStructured.additionalInformation,
        questionState: newQuestionState
      },
      questionState: newQuestionState,
      missingInformation: missingInfo,
      nextQuestion,
      isComplete,
      disclaimer: 'AI-assisted clinical intake assistant. The consulting doctor makes all clinical diagnoses and treatment decisions.'
    }

    // Enforce safety validation
    if (!this.validateAiOutput(result)) {
      throw new Error('AI output failed clinical safety validation.')
    }

    return result
  }
}

export default AiCaseService
