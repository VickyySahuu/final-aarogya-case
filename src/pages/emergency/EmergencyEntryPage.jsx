import React from 'react'
import { Link } from 'react-router-dom'
import UtilityBar from '../../components/layout/UtilityBar'
import Header from '../../components/layout/Header'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Footer from '../../components/layout/Footer'

export default function EmergencyEntryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-[#0A2540] antialiased">
      <UtilityBar activeService="Emergency Response" />
      <Header portalBadge="Patient Portal" activeNav="EMERGENCY" />
      <Breadcrumbs 
        items={[{ label: 'Emergency' }]} 
        backTo="/" 
        backLabel="Back to Main Portal" 
      />

      {/* MAIN CONTENT */}
      <main className="flex-grow w-full bg-white py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          {/* Title & Subtitle */}
          <div className="text-center max-w-2xl mb-10 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold font-sans text-[#0A2540] tracking-tight">
              Emergency
            </h1>
            <p className="mt-2 text-base sm:text-lg text-slate-600">
              Choose an emergency action.
            </p>
          </div>

          {/* Emergency Action Cards (Exactly Two) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-4xl items-stretch">
            {/* Card 1: Call Emergency Services */}
            <section className="bg-[#f8fafc] rounded-2xl border-2 border-red-100 hover:border-red-300 p-8 sm:p-10 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#dc2626] border border-red-100 flex items-center justify-center mb-6 shadow-xs">
                  <span className="material-symbols-outlined text-[36px] fill">phone_in_talk</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-[#0A2540] uppercase">
                  CALL EMERGENCY SERVICES
                </h2>
                <p className="mt-3 text-slate-600 text-base leading-relaxed">
                  Call emergency services for immediate help.
                </p>
              </div>
              <div className="pt-8">
                <Link 
                  className="w-full h-14 bg-[#dc2626] hover:bg-[#b91c1c] active:scale-[0.99] text-white font-sans font-semibold text-base flex items-center justify-center gap-2.5 shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-red-200 rounded-full px-8 py-3.5" 
                  to="/emergency/call"
                >
                  <span className="material-symbols-outlined text-[22px]">call</span>
                  <span>Call Emergency Services</span>
                </Link>
              </div>
            </section>

            {/* Card 2: Request Ambulance */}
            <section className="bg-[#f8fafc] rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 p-8 sm:p-10 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#166534] border border-emerald-100 flex items-center justify-center mb-6 shadow-xs">
                  <span className="material-symbols-outlined text-[36px] fill">ambulance</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-[#0A2540] uppercase">
                  REQUEST AMBULANCE
                </h2>
                <p className="mt-3 text-slate-600 text-base leading-relaxed">
                  Request and deploy an emergency medical ambulance to your current location.
                </p>
              </div>
              <div className="pt-8">
                <Link 
                  className="w-full h-14 bg-[#166534] hover:bg-[#14532d] active:scale-[0.99] text-white font-sans font-semibold text-base flex items-center justify-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-200 rounded-full px-8 py-3.5" 
                  to="/emergency/request-ambulance"
                >
                  <span>Request Ambulance</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
