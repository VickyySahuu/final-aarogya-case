import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import UtilityBar from '../../components/layout/UtilityBar'
import Header from '../../components/layout/Header'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Footer from '../../components/layout/Footer'

export default function EmergencyCallPage() {
  const [callModalOpen, setCallModalOpen] = useState(false)

  return (
    <div className="bg-[#ffffff] font-body text-[#0A2540] flex flex-col min-h-screen antialiased">
      <UtilityBar activeService="Emergency Response" />
      <Header portalBadge="Patient Portal" activeNav="EMERGENCY" />
      <Breadcrumbs 
        items={[
          { label: 'Emergency', to: '/emergency' },
          { label: 'Emergency Call' }
        ]} 
        backTo="/emergency" 
        backLabel="Back" 
      />

      {/* MAIN CONTENT */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col items-center justify-center">
        {/* Title & Subtitle */}
        <div className="text-center max-w-2xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-[#dc2626] font-display text-xs font-bold tracking-wider uppercase mb-3">
            <span className="material-symbols-outlined text-[16px] fill">emergency</span>
            <span>Immediate Assistance</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-[#0A2540] tracking-tight mb-2">
            Emergency Call
          </h1>
          <p className="text-base md:text-lg text-slate-600">
            Call emergency services for immediate help.
          </p>
        </div>

        {/* Centered High-Contrast Institutional Card */}
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-10 flex flex-col items-center text-center relative overflow-hidden">
          {/* Top subtle emergency stripe */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[#dc2626]"></div>

          {/* Phone Emergency Icon in soft red circle */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-red-100 flex items-center justify-center mb-6 shadow-inner border border-red-200">
            <span className="material-symbols-outlined text-[#dc2626] text-[48px] sm:text-[54px] fill">call</span>
          </div>

          {/* Heading & Instructions */}
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0A2540] mb-2">
            Immediate Emergency Dispatch Assistance
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-8 max-w-md">
            Press the button below to initiate an urgent emergency call. Priority routing will connect your session directly to response coordination.
          </p>

          {/* Large Emergency Call Button */}
          <button 
            className="w-full min-h-[4.25rem] px-8 py-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-lg hover:shadow-xl font-display text-base sm:text-lg font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-150 active:scale-[0.99] cursor-pointer focus:outline-none focus:ring-4 focus:ring-red-300 rounded-full" 
            onClick={() => setCallModalOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-[28px] fill">call</span>
            <span>CALL EMERGENCY SERVICES</span>
          </button>

          {/* Explicit Prototype Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 w-full flex items-start justify-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0 mt-0.5">info</span>
            <span className="text-left font-medium">PROTOTYPE / DEMO: Triggers verified emergency call simulation in prototype mode.</span>
          </div>

          {/* Secondary Action Button */}
          <div className="mt-6">
            <Link 
              className="inline-flex items-center gap-1.5 text-sm font-display font-semibold text-slate-700 hover:text-[#0A2540] py-2 px-4 hover:bg-slate-100 transition-colors rounded-full" 
              to="/emergency"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Back to Emergency</span>
            </Link>
          </div>

          {/* Prototype Feedback Simulation Overlay Modal */}
          {callModalOpen && (
            <div className="absolute inset-0 bg-white/98 backdrop-blur-sm p-6 sm:p-8 flex flex-col items-center justify-center text-center z-20">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center mb-4 ring-8 ring-green-50">
                <span className="material-symbols-outlined text-[36px] animate-pulse">ring_volume</span>
              </div>
              <h3 className="font-display font-bold text-xl text-[#0A2540] mb-1">Connecting Emergency Dispatch</h3>
              <p className="text-sm text-slate-600 max-w-xs mb-2">Simulating direct line to local central ambulance & emergency team...</p>
              <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs font-medium mb-6">
                Prototype Verification Mode Active
              </span>
              <button 
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-[#0A2540] font-display font-semibold text-sm transition-colors cursor-pointer rounded-full" 
                onClick={() => setCallModalOpen(false)}
                type="button"
              >
                End Call / Cancel
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
