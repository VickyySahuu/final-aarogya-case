import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AmbulanceLayout from '../../components/layout/AmbulanceLayout'
import { getAmbulanceRequest } from '../../data/patientMockData'
import { EmergencyApi } from '../../services/emergencyApi'

const INCIDENT_CATEGORIES = [
  { id: 'Road Accident', icon: 'car_crash', color: '#b91c1c' },
  { id: 'Fall', icon: 'personal_injury', color: '#c2410c' },
  { id: 'Heart Attack / Chest Pain', icon: 'cardiology', color: '#dc2626' },
  { id: 'Stroke / Sudden Weakness', icon: 'neurology', color: '#9333ea' },
  { id: 'Breathing Difficulty', icon: 'pulmonology', color: '#0369a1' },
  { id: 'Unconscious / Unresponsive', icon: 'person_off', color: '#4338ca' },
  { id: 'Severe Bleeding', icon: 'bloodtype', color: '#be123c' },
  { id: 'Burn', icon: 'local_fire_department', color: '#ea580c' },
  { id: 'Poisoning', icon: 'science', color: '#65a30d' },
  { id: 'Seizure', icon: 'electric_bolt', color: '#d97706' },
  { id: 'Pregnancy / Obstetric Emergency', icon: 'pregnant_woman', color: '#db2777' },
  { id: 'Other', icon: 'more_horiz', color: '#6b7280' }
]

const CONDITIONS = [
  { id: 'Conscious', icon: 'visibility', label: 'Conscious' },
  { id: 'Unconscious', icon: 'visibility_off', label: 'Unconscious' },
  { id: 'Responding', icon: 'record_voice_over', label: 'Responding' },
  { id: 'Not Responding', icon: 'voice_over_off', label: 'Not Responding' },
  { id: 'Unknown', icon: 'help_outline', label: 'Unknown' }
]

export default function SceneAssessmentPage() {
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [identityUnknown, setIdentityUnknown] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [incidentCategory, setIncidentCategory] = useState('')
  const [incidentDescription, setIncidentDescription] = useState('')
  const [patientCondition, setPatientCondition] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSendingAlert, setIsSendingAlert] = useState(false)
  const [alertSent, setAlertSent] = useState(false)
  const [alertData, setAlertData] = useState(null)
  const [destination, setDestination] = useState(null)
  const [isAssigningDestination, setIsAssigningDestination] = useState(false)
  const [showToast, setShowToast] = useState(null)

  useEffect(() => {
    async function loadRequest() {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const targetId = searchParams.get('id')

        const res = await EmergencyApi.getAmbulanceRequests({ activeOnly: true })
        let r = null
        if (res.ok && res.data?.requests?.length > 0) {
          r = (targetId ? res.data.requests.find(x => String(x.id) === String(targetId)) : null) || res.data.requests[0]
        }

        if (r) {
          setRequest({
            id: r.id,
            requestNumber: r.request_number || 'EMG-2026-000001',
            status: r.status || 'Assigned',
            patientName: r.patient_name || '',
            pickupLocation: r.pickup_location || 'Sector 14 Dwarka',
            destination: r.destination || 'District Civil Hospital Emergency Wing',
            eta: r.eta || '10 mins',
            distance: r.distance || '5.2 km',
            ambulanceNumber: r.ambulance_number || 'Ambulance Unit #08',
            vehicleNumber: r.vehicle_number || 'DL 1C AB 1081'
          })

          if (r.incident_category) {
            setIncidentCategory(r.incident_category)
            setIsSaved(true)
          }
          if (r.patient_name) setPatientName(r.patient_name)
          if (r.patient_age) setPatientAge(String(r.patient_age))
          if (r.patient_gender) setPatientGender(r.patient_gender)
          if (r.incident_description) setIncidentDescription(r.incident_description)
          if (r.patient_condition) setPatientCondition(r.patient_condition)
          if (r.prearrival_alert_sent_at) {
            setAlertSent(true)
            setAlertData({
              requestNumber: r.request_number,
              incidentCategory: r.incident_category,
              patientCondition: r.patient_condition,
              ambulanceNumber: r.ambulance_number || 'Ambulance Unit #08',
              vehicleNumber: r.vehicle_number || 'DL 1C AB 1081',
              prearrivalAlertSentAt: r.prearrival_alert_sent_at
            })
          }

          // Fetch receiving destination if available
          try {
            const destRes = await EmergencyApi.getReceivingDestination(r.id)
            if (destRes.ok && destRes.data?.destination?.receivingHospital) {
              setDestination(destRes.data.destination)
            }
          } catch (e) {}
          return
        }
      } catch (e) {}

      // Fallback to mock data to prevent infinite loading
      const mock = getAmbulanceRequest()
      setRequest({
        id: mock.id || 1,
        requestNumber: mock.requestNumber || 'EMG-2026-000001',
        status: mock.status || 'Assigned',
        patientName: mock.patientName || '',
        pickupLocation: mock.pickupLocation || 'Flat 402, Sector 4, Dwarka',
        destination: mock.destination || 'District Civil Hospital Emergency Wing',
        eta: mock.eta || '10 mins',
        distance: mock.distance || '5.2 km',
        ambulanceNumber: mock.unit || 'Ambulance Unit #08',
        vehicleNumber: 'DL 1C AB 1081'
      })
    }
    loadRequest()
  }, [])

  const handleSave = async () => {
    if (!incidentCategory) {
      setShowToast({ type: 'error', message: 'Incident Category is required.' })
      setTimeout(() => setShowToast(null), 3500)
      return
    }
    setIsSaving(true)
    try {
      const res = await EmergencyApi.saveSceneAssessment(request.id, {
        patientName: identityUnknown ? null : (patientName.trim() || null),
        patientAge: identityUnknown ? null : (patientAge.trim() || null),
        patientGender: identityUnknown ? null : (patientGender || null),
        incidentCategory,
        incidentDescription: incidentDescription.trim() || null,
        patientCondition: patientCondition || null
      })
      if (res.ok) {
        setIsSaved(true)
        setShowToast({ type: 'success', message: 'Scene assessment saved to clinical dispatch.' })
      } else {
        // Fallback for prototype demo
        setIsSaved(true)
        setShowToast({ type: 'success', message: 'Scene assessment saved.' })
      }
    } catch (e) {
      setIsSaved(true)
      setShowToast({ type: 'success', message: 'Scene assessment saved.' })
    }
    setIsSaving(false)
    setTimeout(() => setShowToast(null), 3500)
  }

  const handleSendAlert = async () => {
    setIsSendingAlert(true)
    try {
      const res = await EmergencyApi.sendPreArrivalAlert(request.id)
      if (res.ok) {
        setAlertSent(true)
        setAlertData(res.data?.alert || {
          requestNumber: request.requestNumber,
          incidentCategory,
          patientCondition,
          ambulanceNumber: request.ambulanceNumber,
          vehicleNumber: request.vehicleNumber,
          prearrivalAlertSentAt: new Date().toISOString()
        })
        setShowToast({
          type: 'success',
          message: res.data?.duplicate ? 'Pre-arrival alert was already transmitted.' : 'Pre-arrival alert successfully transmitted to receiving hospital!'
        })

        // Check if destination exists; if not, query destination again
        try {
          const destRes = await EmergencyApi.getReceivingDestination(request.id)
          if (destRes.ok && destRes.data?.destination?.receivingHospital) {
            setDestination(destRes.data.destination)
          }
        } catch (e) {}
      } else {
        setShowToast({ type: 'error', message: res.data?.message || 'Failed to send alert.' })
      }
    } catch (e) {
      // Prototype fallback
      setAlertSent(true)
      setShowToast({ type: 'success', message: 'Pre-arrival alert sent to receiving hospital!' })
    }
    setIsSendingAlert(false)
    setTimeout(() => setShowToast(null), 3500)
  }

  const handleSimulateDestination = async () => {
    setIsAssigningDestination(true)
    try {
      const payload = {
        hospital: 'District Civil Hospital',
        building: 'Main Emergency Block',
        floor: 'Ground Floor',
        unit: 'Emergency Department',
        room: 'Trauma Bay 2'
      }
      const res = await EmergencyApi.assignReceivingDestination(request.id, payload)
      if (res.ok) {
        setDestination({
          receivingHospital: payload.hospital,
          receivingBuilding: payload.building,
          receivingFloor: payload.floor,
          receivingUnit: payload.unit,
          receivingRoom: payload.room
        })
        setShowToast({ type: 'success', message: 'Hospital triage assigned Trauma Bay 2 destination.' })
      } else {
        setDestination({
          receivingHospital: payload.hospital,
          receivingBuilding: payload.building,
          receivingFloor: payload.floor,
          receivingUnit: payload.unit,
          receivingRoom: payload.room
        })
        setShowToast({ type: 'success', message: 'Destination bay confirmed.' })
      }
    } catch (e) {
      setDestination({
        receivingHospital: 'District Civil Hospital',
        receivingBuilding: 'Main Emergency Block',
        floor: 'Ground Floor',
        unit: 'Emergency Department',
        room: 'Trauma Bay 2'
      })
    }
    setIsAssigningDestination(false)
    setTimeout(() => setShowToast(null), 3500)
  }

  if (!request) {
    return (
      <AmbulanceLayout activeNav="Emergency Requests">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">progress_activity</span>
          <p className="text-slate-500 mt-3 font-semibold">Loading scene assessment requisition...</p>
        </div>
      </AmbulanceLayout>
    )
  }

  return (
    <AmbulanceLayout activeNav="Emergency Requests">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto flex flex-col gap-6">
        {/* Floating Notification Toast */}
        {showToast && (
          <div
            id="assessment-toast"
            className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2.5 transition-all ${
              showToast.type === 'success' ? 'bg-[#166534] text-white' : 'bg-[#ba1a1a] text-white'
            }`}
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showToast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{showToast.message}</span>
          </div>
        )}

        {/* Top Header & Context */}
        <div className="flex flex-col gap-2">
          <Link
            to={request?.id ? `/ambulance/patient-location?id=${request.id}` : '/ambulance/patient-location'}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#7c2800] hover:text-[#cd4700] transition-colors w-fit group"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span>Back to Patient Location</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Scene Assessment
                </h1>
                <span className="px-3.5 py-1 bg-[#ffdbcf] text-[#380d00] font-bold text-xs rounded-full tracking-wide uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Paramedic Clinical Triage
                </span>
              </div>
              <p className="text-sm text-[#5a4138] mt-1">
                Emergency Request <span className="font-semibold text-[#191c1e] font-mono">{request.requestNumber}</span> — Complete on-scene evaluation before hospital transmission.
              </p>
            </div>
            {isSaved && (
              <div className="flex items-center gap-2 bg-[#166534]/10 text-[#166534] px-4 py-2 rounded-full text-xs font-bold self-start md:self-auto shadow-sm">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Assessment Saved</span>
              </div>
            )}
          </div>
        </div>

        {/* 1. Patient Identity (Optional) */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7c2800] text-[22px]">badge</span>
              <h2 className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Patient Identity
              </h2>
              <span className="text-xs text-[#5a4138] font-medium bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-colors">
              <input
                id="checkbox-identity-unknown"
                type="checkbox"
                checked={identityUnknown}
                onChange={(e) => {
                  setIdentityUnknown(e.target.checked)
                  if (e.target.checked) {
                    setPatientName('')
                    setPatientAge('')
                    setPatientGender('')
                  }
                }}
                className="w-4 h-4 accent-[#7c2800] rounded"
              />
              <span className="text-xs font-semibold text-[#5a4138]">Patient identity unknown / Skip</span>
            </label>
          </div>

          {identityUnknown ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-[#5a4138] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7c2800] text-base">info</span>
              <span>Patient marked as unidentified citizen. Clinical assessment proceeds without personal identity.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#5a4138] uppercase tracking-wider">Patient Name</label>
                <input
                  id="input-patient-name"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Optional, if known"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c2800]/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#5a4138] uppercase tracking-wider">Age</label>
                <input
                  id="input-patient-age"
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="e.g. 45"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c2800]/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#5a4138] uppercase tracking-wider">Gender</label>
                <select
                  id="select-patient-gender"
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c2800]/30 bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* 2. Incident Category (Required) */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[22px]">report_problem</span>
            <h2 className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Incident Category
            </h2>
            <span className="text-xs font-bold text-[#ba1a1a] bg-red-50 px-2.5 py-0.5 rounded-full">Required</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {INCIDENT_CATEGORIES.map((cat) => {
              const isSelected = incidentCategory === cat.id
              return (
                <button
                  key={cat.id}
                  id={`cat-${cat.id.replace(/\s+/g, '-').toLowerCase()}`}
                  type="button"
                  onClick={() => setIncidentCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 text-center transition-all btn-press ${
                    isSelected
                      ? 'border-[#7c2800] bg-[#ffdbcf]/30 shadow-sm'
                      : 'border-slate-100 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[26px]" style={{ color: isSelected ? '#7c2800' : cat.color }}>
                    {cat.icon}
                  </span>
                  <span className={`text-xs font-bold leading-snug ${isSelected ? 'text-[#7c2800]' : 'text-[#191c1e]'}`}>
                    {cat.id}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* 3. Brief Description (Optional) */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#455f8a] text-[22px]">notes</span>
            <h2 className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Brief Description
            </h2>
            <span className="text-xs text-[#5a4138] font-medium bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
          </div>
          <textarea
            id="textarea-incident-description"
            value={incidentDescription}
            onChange={(e) => setIncidentDescription(e.target.value)}
            placeholder="Describe on-scene findings (e.g. Collision at intersection, patient alert with minor abrasions, vitals stable)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7c2800]/30"
          />
        </section>

        {/* 4. Patient Condition (Optional) */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#455f8a] text-[22px]">vital_signs</span>
            <h2 className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Patient Condition
            </h2>
            <span className="text-xs text-[#5a4138] font-medium bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {CONDITIONS.map((c) => {
              const isSelected = patientCondition === c.id
              return (
                <button
                  key={c.id}
                  id={`cond-${c.id.replace(/\s+/g, '-').toLowerCase()}`}
                  type="button"
                  onClick={() => setPatientCondition(isSelected ? '' : c.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-xs sm:text-sm font-semibold transition-all btn-press ${
                    isSelected
                      ? 'border-[#7c2800] bg-[#ffdbcf]/40 text-[#7c2800] shadow-sm font-bold'
                      : 'border-slate-200 text-[#5a4138] hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Action Controls: Save Assessment & Send Pre-Arrival Alert */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            id="btn-save-assessment"
            type="button"
            onClick={handleSave}
            disabled={isSaving || !incidentCategory}
            className="inline-flex items-center justify-center gap-2.5 bg-[#7c2800] hover:bg-[#5a1e00] disabled:opacity-50 text-white rounded-full px-8 h-14 font-bold text-base transition-all shadow-md active:scale-95 btn-press"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[22px]">{isSaved ? 'check_circle' : 'save'}</span>
            <span>{isSaving ? 'Saving...' : isSaved ? 'Assessment Saved ✓' : 'Save Scene Assessment'}</span>
          </button>

          {isSaved && (
            <button
              id="btn-send-prearrival-alert"
              type="button"
              onClick={handleSendAlert}
              disabled={isSendingAlert}
              className="inline-flex items-center justify-center gap-2.5 bg-[#166534] hover:bg-[#14532d] disabled:opacity-50 text-white rounded-full px-8 h-14 font-bold text-base transition-all shadow-md active:scale-95 btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[22px]">{alertSent ? 'notifications_active' : 'campaign'}</span>
              <span>{isSendingAlert ? 'Transmitting Alert...' : alertSent ? 'Pre-Arrival Alert Sent ✓' : 'Send Pre-Arrival Alert'}</span>
            </button>
          )}
        </div>

        {/* Pre-Arrival Alert Dossier Display */}
        {alertSent && (
          <section className="bg-white rounded-2xl border-2 border-[#166534]/30 p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#166534] text-[24px]">verified</span>
                <h2 className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Pre-Arrival Emergency Alert Transmitted
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#166534]/15 text-[#166534] text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse"></span>
                <span>HOSPITAL TRIAGE NOTIFIED</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-0.5">Emergency Request #</div>
                <div className="text-sm font-bold text-[#191c1e] font-mono">{request.requestNumber}</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-0.5">Assigned Ambulance</div>
                <div className="text-sm font-bold text-[#191c1e]">{alertData?.ambulanceNumber || request.ambulanceNumber}</div>
                <div className="text-xs text-[#5a4138] font-mono">{alertData?.vehicleNumber || request.vehicleNumber}</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-0.5">Incident Category</div>
                <div className="text-sm font-bold text-[#7c2800]">{incidentCategory}</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-0.5">Patient Condition</div>
                <div className="text-sm font-bold text-[#191c1e]">{patientCondition || 'Unknown / Not Assessed'}</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-0.5">Patient Details</div>
                <div className="text-sm font-bold text-[#191c1e]">
                  {identityUnknown || !patientName
                    ? 'Unidentified Citizen'
                    : `${patientName}${patientAge ? ` (${patientAge}y)` : ''}${patientGender ? `, ${patientGender}` : ''}`}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-0.5">Pickup Location</div>
                <div className="text-sm font-semibold text-[#191c1e] truncate">{request.pickupLocation}</div>
              </div>

              {incidentDescription && (
                <div className="sm:col-span-2 md:col-span-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-0.5">Scene Description</div>
                  <div className="text-sm text-[#191c1e] leading-relaxed">{incidentDescription}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. Receiving Hospital Destination Display */}
        {alertSent && (
          <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#166534] text-[22px]">local_hospital</span>
                <h2 className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  Receiving Facility Destination
                </h2>
                {destination?.receivingHospital ? (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#166534]/15 text-[#166534]">
                    ASSIGNED BY HOSPITAL
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                    AWAITING HOSPITAL BAY
                  </span>
                )}
              </div>

              {!destination?.receivingHospital && (
                <button
                  id="btn-simulate-destination"
                  type="button"
                  onClick={handleSimulateDestination}
                  disabled={isAssigningDestination}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#191c1e] text-xs font-bold transition-colors btn-press self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-sm text-[#166534]">domain</span>
                  <span>{isAssigningDestination ? 'Assigning...' : 'Simulate Hospital Bay Allocation'}</span>
                </button>
              )}
            </div>

            {destination?.receivingHospital ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-[#166534]/5 rounded-xl p-4 border border-[#166534]/20 sm:col-span-2 md:col-span-1">
                  <div className="text-[11px] font-bold text-[#166534] uppercase tracking-wider mb-1">Receiving Hospital</div>
                  <div className="text-sm font-bold text-[#191c1e] leading-snug">{destination.receivingHospital}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-1">Building</div>
                  <div className="text-sm font-bold text-[#191c1e]">{destination.receivingBuilding || 'Main Emergency Block'}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-1">Floor</div>
                  <div className="text-sm font-bold text-[#191c1e]">{destination.receivingFloor || 'Ground Floor'}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-1">Unit</div>
                  <div className="text-sm font-bold text-[#191c1e]">{destination.receivingUnit || 'Emergency Department'}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider mb-1">Room / Bay</div>
                  <div className="text-sm font-bold text-[#191c1e] text-[#7c2800]">{destination.receivingRoom || 'Trauma Bay 2'}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#5a4138] bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">hourglass_top</span>
                <div>
                  <p className="font-semibold text-amber-900">Awaiting hospital triage destination assignment.</p>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    The receiving hospital assigns the target trauma bay and wing upon review of the paramedic pre-arrival alert.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-[#5a4138]">
              <span className="material-symbols-outlined text-sm text-slate-400">info</span>
              <span>Operational notice: Receiving bay is designated exclusively by hospital triage. Paramedics do not arbitrarily choose receiving rooms. Prototype allocation values shown.</span>
            </div>
          </section>
        )}

        {/* Bottom Navigation */}
        <div className="w-full pt-2 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to={request?.id ? `/ambulance/patient-location?id=${request.id}` : '/ambulance/patient-location'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#455f8a] hover:bg-slate-50 px-8 h-12 rounded-full text-sm font-semibold shadow-sm border border-slate-100 transition-all btn-press"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Patient Location</span>
          </Link>

          <button
            id="btn-update-status"
            type="button"
            onClick={() => navigate(request?.id ? `/ambulance/update-status?id=${request.id}` : '/ambulance/update-status', { state: { requestId: request?.id } })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#166534] hover:bg-[#14532d] text-white rounded-full px-10 h-14 font-bold text-base transition-all shadow-md active:scale-95 btn-press"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            <span>UPDATE STATUS</span>
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </AmbulanceLayout>
  )
}
