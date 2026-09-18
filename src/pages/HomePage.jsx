import React from 'react'
import { Link } from 'react-router-dom'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'
import UtilityBar from '../components/layout/UtilityBar'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function HomePage() {
  return (
    <div className="bg-[#F8FAFC] text-brand-textPrimary min-h-screen flex flex-col selection:bg-brand-primary selection:text-white">
      {/* Shared Official Utility Bar */}
      <UtilityBar activeService="Healthcare Digital Platform" />

      {/* Shared Brand Header */}
      <Header portalBadge="Unified Gateway" subtitle="Healthcare Digital Platform" activeNav="HOME" />

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow">
        {/* 4. ENTRY INTRODUCTION / HERO STRIP */}
        <section className="bg-gradient-to-b from-white to-[#F1F5F9] border-b border-brand-border py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center md:text-left md:flex md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-50 text-brand-primary border border-blue-200/80 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Unified Healthcare Access Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
                AAROGYA CASE
              </h1>
              <p className="text-base sm:text-lg font-medium text-brand-textSecondary mt-1.5 max-w-2xl">
                Healthcare Digital Platform
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="inline-block text-right">
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block">Service Category</span>
                <span className="text-sm font-semibold text-brand-navy bg-white px-3.5 py-1.5 rounded border border-slate-300 shadow-xs inline-block mt-1">
                  National Digital Health Gateway
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. MAIN PORTAL SELECTION (PRIMARY SECTION) */}
        <section id="portals" className="py-12 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="border-b border-slate-200 pb-4 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-brand-navy tracking-tight">
                Choose Your Portal
              </h2>
              <p className="text-sm text-brand-textMuted mt-1">
                Select your specific operational role or service gateway to continue to your verified workspace.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              6 Active Service Gateways
            </div>
          </div>

          {/* PORTAL GRID: Desktop 3x2, Tablet 2x3, Mobile 1x6 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* 1. Patient Portal */}
            <Link to="/patient" className="portal-card bg-white rounded-lg border border-brand-cardBorder p-6 flex items-center justify-between text-left group">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-md bg-blue-50 text-brand-primary flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gateway 01</span>
                  <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-primary transition-colors">
                    PATIENT PORTAL
                  </h3>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

            {/* 2. Doctor Portal */}
            <Link to="/doctor/login" className="portal-card bg-white rounded-lg border border-brand-cardBorder p-6 flex items-center justify-between text-left group">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-md bg-sky-50 text-brand-primary flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    <circle cx="12" cy="10" r="3" strokeWidth="2"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 13v6m-3-3h6"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gateway 02</span>
                  <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-primary transition-colors">
                    DOCTOR PORTAL
                  </h3>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

            {/* 3. Pharmacy Portal */}
            <Link to="/pharmacy" className="portal-card bg-white rounded-lg border border-brand-cardBorder p-6 flex items-center justify-between text-left group">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gateway 03</span>
                  <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-primary transition-colors">
                    PHARMACY PORTAL
                  </h3>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

            {/* 4. Diagnostic / Scan Portal */}
            <Link to="/diagnostic" className="portal-card bg-white rounded-lg border border-brand-cardBorder p-6 flex items-center justify-between text-left group">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-md bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gateway 04</span>
                  <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-primary transition-colors">
                    DIAGNOSTIC / SCAN PORTAL
                  </h3>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

            {/* 5. Ambulance Portal */}
            <Link to="/ambulance" className="portal-card bg-white rounded-lg border border-brand-cardBorder p-6 flex items-center justify-between text-left group">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-md bg-amber-50 text-amber-900 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h11v11H3V5zm11 3h4l3 3v5h-7V8zm-8 3h4m-2-2v4"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gateway 05</span>
                  <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-primary transition-colors">
                    AMBULANCE PORTAL
                  </h3>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

            {/* 6. Admin Portal */}
            <Link to="/admin" className="portal-card bg-white rounded-lg border border-brand-cardBorder p-6 flex items-center justify-between text-left group">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-200">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gateway 06</span>
                  <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-primary transition-colors">
                    ADMIN PORTAL
                  </h3>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

          </div>
        </section>

        {/* 6. EMERGENCY SECTION (Clearly Distinct with Restrained Red Treatment) */}
        <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-xl bg-brand-emergencyLight border-2 border-brand-emergencyBorder p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-brand-emergency text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div>
                  <div className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-brand-emergency bg-red-100 px-2 py-0.5 rounded mb-1">
                    Immediate Response System
                  </div>
                  <h2 className="text-2xl font-extrabold text-red-950 tracking-tight">
                    EMERGENCY
                  </h2>
                  <p className="text-sm font-medium text-red-900/90 mt-1">
                    For immediate emergency assistance.
                  </p>
                </div>
              </div>

              {/* Exactly Two Emergency Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0 lg:w-auto w-full">
                <Link to="/emergency/call" className="emergency-btn bg-brand-emergency text-white hover:bg-brand-emergencyHover px-6 py-4 rounded-lg font-bold text-sm tracking-wide flex items-center justify-center space-x-3 shadow-sm focus:ring-4 focus:ring-red-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <span>CALL EMERGENCY SERVICES</span>
                </Link>

                <Link to="/emergency/request-ambulance" className="emergency-btn bg-white text-brand-emergency border-2 border-brand-emergency hover:bg-red-50 px-6 py-4 rounded-lg font-bold text-sm tracking-wide flex items-center justify-center space-x-3 shadow-xs focus:ring-4 focus:ring-red-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>REQUEST AMBULANCE</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 7. INSTITUTIONAL INFORMATION SECTION (4 Balanced Columns) */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-brand-border p-8 shadow-xs">
            <div className="border-b border-slate-200 pb-4 mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Platform Specifications</span>
              <h2 className="text-xl font-bold text-brand-navy tracking-tight mt-0.5">AAROGYA CASE System Architecture</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Column 1: DATA & PRIVACY */}
              <div className="flex flex-col space-y-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">
                  DATA & PRIVACY
                </h3>
                <p className="text-sm text-brand-textSecondary leading-relaxed">
                  Privacy and careful handling of healthcare information are important design principles of AAROGYA CASE.
                </p>
              </div>

              {/* Column 2: EMERGENCY SUPPORT */}
              <div className="flex flex-col space-y-3">
                <div className="w-10 h-10 rounded-md bg-red-50 text-brand-emergency flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">
                  EMERGENCY SUPPORT
                </h3>
                <p className="text-sm text-brand-textSecondary leading-relaxed">
                  Access emergency services or request ambulance assistance through the Emergency section.
                </p>
              </div>

              {/* Column 3: ACCESSIBILITY */}
              <div className="flex flex-col space-y-3">
                <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="4" r="2" strokeWidth="2"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M12 8v8m0 0l-3 5m3-5l3 5"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">
                  ACCESSIBILITY
                </h3>
                <p className="text-sm text-brand-textSecondary leading-relaxed">
                  Designed for clear navigation, readable content and accessible digital healthcare interactions.
                </p>
              </div>

              {/* Column 4: CONNECTED HEALTHCARE */}
              <div className="flex flex-col space-y-3">
                <div className="w-10 h-10 rounded-md bg-indigo-50 text-brand-primary flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">
                  CONNECTED HEALTHCARE
                </h3>
                <p className="text-sm text-brand-textSecondary leading-relaxed">
                  AAROGYA CASE connects patients, doctors, diagnostic services, pharmacy services and ambulance support in one platform.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Shared Unified Footer */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  )
}
