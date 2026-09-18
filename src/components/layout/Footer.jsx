import React from 'react'
import { Link } from 'react-router-dom'
import officialEmblem from '@stitch/aarogya_case_official_emblem.png_1/screen.png'

export default function Footer() {
  return (
    <footer className="w-full bg-[#0A2540] text-slate-300 border-t border-slate-800 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Top Grid Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
          
          {/* Group 1: AAROGYA CASE */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider pb-2 border-b border-slate-700/60">
              AAROGYA CASE
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link to="/" className="hover:text-white transition-colors duration-150">About AAROGYA CASE</Link></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors duration-150">How It Works</a></li>
              <li><a href="#services" className="hover:text-white transition-colors duration-150">Healthcare Services</a></li>
              <li><a href="#help" className="hover:text-white transition-colors duration-150">Help Desk</a></li>
            </ul>
          </div>

          {/* Group 2: PATIENT SERVICES */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider pb-2 border-b border-slate-700/60">
              PATIENT SERVICES
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link to="/" className="hover:text-white transition-colors duration-150">Patient Portal</Link></li>
              <li><a href="#appointments" className="hover:text-white transition-colors duration-150">Appointments</a></li>
              <li><a href="#health-records" className="hover:text-white transition-colors duration-150">Health Records</a></li>
              <li><a href="#reports" className="hover:text-white transition-colors duration-150">Reports</a></li>
              <li><Link to="/emergency" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Emergency Services</Link></li>
            </ul>
          </div>

          {/* Group 3: HEALTHCARE PORTALS */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider pb-2 border-b border-slate-700/60">
              HEALTHCARE PORTALS
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#doctor-portal" className="hover:text-white transition-colors duration-150">Doctor Portal</a></li>
              <li><a href="#pharmacy-portal" className="hover:text-white transition-colors duration-150">Pharmacy Portal</a></li>
              <li><a href="#diagnostic-portal" className="hover:text-white transition-colors duration-150">Diagnostic Portal</a></li>
              <li><Link to="/emergency/request-ambulance" className="hover:text-white transition-colors duration-150">Ambulance Portal</Link></li>
            </ul>
          </div>

          {/* Group 4: HELP & ACCESSIBILITY */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider pb-2 border-b border-slate-700/60">
              HELP & ACCESSIBILITY
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#accessibility" className="hover:text-white transition-colors duration-150">Accessibility</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors duration-150">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors duration-150">Terms of Use</a></li>
              <li><a href="#emergency-info" className="hover:text-white transition-colors duration-150">Emergency Info</a></li>
            </ul>
          </div>

          {/* Area 5: Compact AAROGYA CASE Branding / Prototype Area */}
          <div className="space-y-3 bg-[#081e35] p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center space-x-3">
              <img 
                src={officialEmblem} 
                alt="AAROGYA CASE Emblem" 
                className="w-10 h-10 object-contain rounded-full bg-white p-0.5"
              />
              <div>
                <div className="text-sm font-bold text-white leading-tight">AAROGYA CASE</div>
                <div className="text-[11px] text-slate-400">Digital Platform</div>
              </div>
            </div>
            <div className="text-xs text-slate-300 font-medium">
              Healthcare Digital Platform
            </div>
            <div className="inline-block bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[11px] font-medium px-2 py-0.5 rounded">
              Project Prototype
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Unified digital health portal prototype for healthcare coordination.
            </p>
          </div>

        </div>

        {/* Lower Bar */}
        <div className="mt-8 pt-6 flex flex-col md:flex-row md:items-center md:justify-between text-xs text-slate-400 gap-4">
          <div>
            <span className="font-semibold text-slate-300">© AAROGYA CASE</span> — Healthcare Digital Platform
            <span className="mx-2 text-slate-600">|</span>
            <span>Project Prototype</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span>Secure Digital Infrastructure</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">Toll-Free: 112 / 108</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
