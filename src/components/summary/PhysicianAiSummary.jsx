import React from 'react'

/**
 * PhysicianAiSummary Component — AAROGYA CASE (SIH26047)
 * 
 * Displays the physician-ready AI Clinical Summary with:
 * - Transparent source traceability on every clinical datum
 * - Objective, non-diagnostic physician draft framing
 * - Clear representation of untouched / missing fields ('Not provided', 'Unknown', 'Not assessed')
 * - Direct comparison with patient verbatim quotes and uploaded records
 */
export default function PhysicianAiSummary({ summary, loading, error, onOpenTimeline, onOpenReports }) {
  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <span className="material-symbols-outlined text-4xl text-[#166534] animate-spin">psychology</span>
        <h4 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
          Synthesizing Physician AI Clinical Summary...
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Correlating citizen intake statements, uploaded records, safety guardrails, and chronological history into a structured physician draft.
        </p>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <span className="material-symbols-outlined text-4xl text-slate-400">clinical_notes</span>
        <h4 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Lexend, sans-serif' }}>
          Clinical Summary Ready for Review
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {error || 'Clinical intake summary is being assembled from case history and triage records.'}
        </p>
      </div>
    )
  }

  const { patient, currentEncounter, medicalBackground, uploadedDocuments = [], relevantPreviousHistory, safetyObservations = [] } = summary

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* 1. Official Physician Draft Clinical Banner */}
      <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl">psychology</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                AI CLINICAL DRAFT SUMMARY
              </span>
              <span className="text-xs font-semibold text-amber-800">
                • Pending Attending Physician Verification
              </span>
            </div>
            <p className="text-xs text-amber-950 mt-1 font-medium leading-relaxed">
              {summary.disclaimer}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-200">
          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">Summary ID</span>
          <span className="text-xs font-mono font-bold text-amber-950">{summary.summaryId}</span>
          <span className="text-[10px] text-amber-700 block mt-0.5">
            {summary.generatedAt ? new Date(summary.generatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Today'}
          </span>
        </div>
      </div>

      {/* 2. Patient & Encounter Metadata Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Citizen Patient</span>
            <span className="text-lg font-bold text-slate-900">{patient?.name}</span>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Unique Code</span>
            <span className="text-xs font-mono font-bold text-[#166534] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-block">
              {patient?.uniqueCode}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Demographics</span>
            <span className="text-xs text-slate-700 font-semibold">{patient?.age} Yrs • {patient?.gender} • Blood: {patient?.bloodGroup}</span>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Encounter Case</span>
            <span className="text-xs font-mono font-bold text-slate-800">{currentEncounter?.caseNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold uppercase tracking-wider">
            {currentEncounter?.lifecycleStage || 'PATIENT CONFIRMED'}
          </span>
        </div>
      </div>

      {/* 3. History of Present Illness (HPI) & Verbatim Response */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#166534] text-xl">history_edu</span>
            <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wider">
              1. History of Present Illness (HPI)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Source: Patient Clinical Intake
          </span>
        </div>

        {/* Verbatim Citizen Voice */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-700">record_voice_over</span>
              Verbatim Citizen Statement
            </span>
            <span className="text-[10px] text-amber-700 font-mono font-semibold">Source: Unaltered patient voice</span>
          </div>
          <p className="text-sm sm:text-base text-slate-900 font-medium italic bg-white p-3.5 rounded-xl border border-amber-200/70">
            "{currentEncounter?.chiefComplaint?.verbatim || 'No verbatim description recorded.'}"
          </p>
        </div>

        {/* Synthesized HPI Narrative */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Physician Narrative Summary
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Source: {currentEncounter?.historyOfPresentIllness?.source || 'Synthesized from patient intake statements'}
            </span>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">
            {currentEncounter?.historyOfPresentIllness?.narrative || 'Intake completed.'}
          </p>
        </div>

        {/* Structured Grid: Chief Complaint, Duration, Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-medium block">Chief Complaint</span>
            <strong className="text-sm font-bold text-slate-900 block mt-0.5">
              {currentEncounter?.chiefComplaint?.structured || 'Not provided'}
            </strong>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              Source: {currentEncounter?.chiefComplaint?.source || 'Patient response'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-medium block">Reported Duration</span>
            <strong className="text-sm font-bold text-slate-900 block mt-0.5">
              {currentEncounter?.duration?.value || 'Unknown'}
            </strong>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              Source: {currentEncounter?.duration?.source || 'Patient response'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-medium block">Intake Severity</span>
            <strong className="text-sm font-bold text-slate-900 block mt-0.5">
              {currentEncounter?.severity?.value || 'Routine'}
            </strong>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              Source: {currentEncounter?.severity?.source || 'Triage engine'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Symptoms & Relevant Negatives (With Source Attribution) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reported Current Symptoms */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#166534] text-xl">symptoms</span>
              <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">
                2. Reported Symptoms ({currentEncounter?.symptoms?.length || 0})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Source: Patient</span>
          </div>

          {(!currentEncounter?.symptoms || currentEncounter.symptoms.length === 0) ? (
            <p className="text-xs text-slate-400 italic">No specific symptoms documented.</p>
          ) : (
            <div className="space-y-2">
              {currentEncounter.symptoms.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#166534]"></span>
                    <strong className="text-slate-900 font-bold">{s.name}</strong>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {s.source || 'Patient response'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relevant Negatives (Clinically Verified Denials) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-700 text-xl">rule</span>
              <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">
                3. Relevant Negatives ({currentEncounter?.relevantNegatives?.length || 0})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Source: Negative Confirmation</span>
          </div>

          {(!currentEncounter?.relevantNegatives || currentEncounter.relevantNegatives.length === 0) ? (
            <p className="text-xs text-slate-400 italic">No explicit negative findings reported during intake.</p>
          ) : (
            <div className="space-y-2">
              {currentEncounter.relevantNegatives.map((n, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[16px]">check_box_outline_blank</span>
                    <strong className="text-slate-900 font-bold">Denies: {n.finding || n}</strong>
                  </div>
                  <span className="text-[10px] text-blue-800 font-mono bg-white px-2 py-0.5 rounded border border-blue-200">
                    {n.source || 'Patient response'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Medical Background: Past History, Medications & Allergies */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#166534] text-xl">medical_information</span>
            <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wider">
              4. Medical Background &amp; Current Medications
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Traceable Provenance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Past Medical History */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Past Medical History</span>
            <strong className="text-sm font-bold text-slate-900 block mt-0.5">
              {medicalBackground?.pastMedicalHistory?.value || 'Not provided'}
            </strong>
            <span className="text-[10px] text-slate-400 font-mono block pt-1">
              Source: {medicalBackground?.pastMedicalHistory?.source || 'Intake record'}
            </span>
          </div>

          {/* Past Surgical History */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Past Surgical History</span>
            <strong className="text-sm font-bold text-slate-900 block mt-0.5">
              {medicalBackground?.pastSurgicalHistory?.value || 'Not reported'}
            </strong>
            <span className="text-[10px] text-slate-400 font-mono block pt-1">
              Source: {medicalBackground?.pastSurgicalHistory?.source || 'Not assessed'}
            </span>
          </div>

          {/* Known Allergies */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Allergies</span>
            <strong className="text-sm font-bold text-slate-900 block mt-0.5">
              {medicalBackground?.allergies?.value || 'Unknown'}
            </strong>
            <span className="text-[10px] text-slate-400 font-mono block pt-1">
              Source: {medicalBackground?.allergies?.source || 'Intake inquiry'}
            </span>
          </div>

          {/* Medications count */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Medications Tracked</span>
            <strong className="text-sm font-bold text-emerald-800 block mt-0.5">
              {medicalBackground?.currentMedications?.length || 0} active/reported
            </strong>
            <span className="text-[10px] text-slate-400 font-mono block pt-1">
              Source: Verbal + Document-extracted
            </span>
          </div>
        </div>

        {/* Detailed Medications List with Provenance */}
        {medicalBackground?.currentMedications && medicalBackground.currentMedications.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Documented &amp; Reported Medications
            </span>
            <div className="space-y-2">
              {medicalBackground.currentMedications.map((m, mIdx) => (
                <div key={mIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#166534] text-lg">medication</span>
                    <div>
                      <strong className="text-slate-900 font-bold">{m.name}</strong>
                      {m.dosage && m.dosage !== '—' && (
                        <span className="text-slate-500 ml-2">Dosage: {m.dosage}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
                    Source: {m.source || 'Patient response'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Uploaded Medical Documents & Findings (Multimodal AI) */}
      {uploadedDocuments.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-700 text-xl">attach_file</span>
              <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wider">
                5. Uploaded Document Findings ({uploadedDocuments.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Multimodal AI Extraction
            </span>
          </div>

          <div className="space-y-3">
            {uploadedDocuments.map((doc, dIdx) => (
              <div key={doc.docId || dIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-blue-600 text-xl">
                      {doc.type?.includes('pdf') || doc.name?.endsWith('.pdf') ? 'picture_as_pdf' : 'image'}
                    </span>
                    <div>
                      <strong className="text-sm text-slate-900 font-bold">{doc.name}</strong>
                      <span className="text-xs text-slate-500 ml-2">Type: {doc.type} • Document Date: {doc.date}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 self-start sm:self-auto">
                    {doc.source}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  <strong className="text-slate-900 font-semibold">Key Observations: </strong>
                  {doc.keyObservations}
                </p>

                {doc.extractedLabResults && doc.extractedLabResults.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {doc.extractedLabResults.map((l, lIdx) => (
                      <span key={lIdx} className="text-[11px] font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800">
                        {l.testName || l.name}: <strong className="text-blue-800">{l.value} {l.unit || ''}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {doc.uncertainItems && doc.uncertainItems.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-700 text-sm">warning</span>
                    <span>Uncertain / partially unclear items detected: {doc.uncertainItems.join(', ')} (Manual inspection recommended)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Relevant Historical Records from Central Registry */}
      {relevantPreviousHistory && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-700 text-xl">history</span>
              <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wider">
                6. Relevant Historical Records (Central Registry)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Source: Unified Medical Timeline
            </span>
          </div>

          {relevantPreviousHistory.highlights && relevantPreviousHistory.highlights.length > 0 ? (
            <div className="space-y-2.5">
              {relevantPreviousHistory.highlights.map((h, hIdx) => (
                <div key={hIdx} className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">{h.category}</span>
                    <strong className="text-slate-900 font-medium block mt-0.5">{h.detail}</strong>
                  </div>
                  <span className="text-[10px] font-mono text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-200 self-start sm:self-auto">
                    {h.source}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No prior registered episodes on file for this citizen.</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            {onOpenTimeline && (
              <button
                type="button"
                onClick={onOpenTimeline}
                className="px-4 py-2 rounded-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-press"
              >
                <span className="material-symbols-outlined text-[16px]">timeline</span>
                <span>OPEN FULL CHRONOLOGICAL TIMELINE</span>
              </button>
            )}
            {onOpenReports && (
              <button
                type="button"
                onClick={onOpenReports}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-press"
              >
                <span className="material-symbols-outlined text-[16px]">lab_panel</span>
                <span>VIEW DIAGNOSTIC REPORTS</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 8. Safety Guardrails & Triage Observations */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700 text-xl">shield</span>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              7. Clinical Safety Guardrails &amp; Observations
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">AAROGYA CASE Protocol</span>
        </div>

        <div className="space-y-2 text-xs">
          {safetyObservations.map((obs, oIdx) => (
            <div
              key={oIdx}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                obs.level === 'WARNING'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-[18px] ${obs.level === 'WARNING' ? 'text-amber-700' : 'text-[#166534]'}`}>
                  {obs.level === 'WARNING' ? 'warning' : 'verified_user'}
                </span>
                <span className="font-medium">{obs.observation || obs}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 shrink-0 bg-white px-2 py-0.5 rounded border border-slate-200">
                {obs.source || 'Safety Layer'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
