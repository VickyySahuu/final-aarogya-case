import React from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'

export default function AdminProfilePage() {
  const adminInfo = {
    name: 'Central System Administrator',
    designation: 'Director of Digital Health Infrastructure',
    node: 'Central Operations Node (AAROGYA-CORE)',
    department: 'Digital Health Platform & Operations',
    adminId: 'ADM-2026-HQ-01',
    email: 'admin.hq@aarogyacase.org',
    phone: '+91 (011) 2306-1234',
    accessLevel: 'Super Administrator (Tier 1)',
    lastActive: 'Active Session (Current Node)',
    securityProtocol: 'TLS 1.3 / AES-256 GCM Authenticated',
    twoFactorStatus: 'Hardware Token Verified'
  }

  return (
    <AdminLayout activeNav="Profile">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#58423a] mb-1">
              <Link to="/admin/dashboard" className="hover:underline">Admin Console</Link>
              <span>/</span>
              <span className="font-semibold text-[#191c1e]">Administrator Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
              System Administrator Dossier
            </h1>
            <p className="text-sm text-[#58423a] mt-1">
              Authoritative identity, node credentials, and privilege telemetry for Central Administration Node.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#00501a]/10 text-[#00501a] px-4 py-2 rounded-full text-xs font-bold self-start sm:self-auto shadow-sm">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>Security Tier 1 Authorized</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#7c2800] to-[#5a1e00] text-white flex items-center justify-center text-4xl shadow-md shrink-0">
              <span className="material-symbols-outlined text-[48px]">admin_panel_settings</span>
            </div>
            <div className="flex flex-col text-center sm:text-left flex-grow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {adminInfo.name}
                </h2>
                <span className="px-3 py-1 bg-[#ffdbcf] text-[#380d00] font-bold text-xs rounded-full self-center sm:self-auto font-mono">
                  {adminInfo.adminId}
                </span>
              </div>
              <p className="text-sm font-semibold text-[#7c2800] mt-0.5">{adminInfo.designation}</p>
              <p className="text-xs text-[#58423a] mt-1">{adminInfo.department}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f4f6] text-xs font-semibold text-[#191c1e]">
                  <span className="w-2 h-2 rounded-full bg-[#166534]"></span>
                  {adminInfo.node}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[15px]">security</span>
                  {adminInfo.twoFactorStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <div className="bg-[#f8f9fc] rounded-2xl p-4 border border-slate-100">
              <div className="text-[11px] font-bold text-[#58423a] uppercase tracking-wider mb-1">Official Email</div>
              <div className="text-sm font-semibold text-[#191c1e] font-mono">{adminInfo.email}</div>
            </div>
            <div className="bg-[#f8f9fc] rounded-2xl p-4 border border-slate-100">
              <div className="text-[11px] font-bold text-[#58423a] uppercase tracking-wider mb-1">Direct Secure Line</div>
              <div className="text-sm font-semibold text-[#191c1e] font-mono">{adminInfo.phone}</div>
            </div>
            <div className="bg-[#f8f9fc] rounded-2xl p-4 border border-slate-100">
              <div className="text-[11px] font-bold text-[#58423a] uppercase tracking-wider mb-1">Access Level &amp; Scope</div>
              <div className="text-sm font-semibold text-[#191c1e]">{adminInfo.accessLevel}</div>
            </div>
            <div className="bg-[#f8f9fc] rounded-2xl p-4 border border-slate-100">
              <div className="text-[11px] font-bold text-[#58423a] uppercase tracking-wider mb-1">Current Session Telemetry</div>
              <div className="text-sm font-semibold text-[#00501a] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00501a] animate-pulse"></span>
                {adminInfo.lastActive}
              </div>
            </div>
            <div className="bg-[#f8f9fc] rounded-2xl p-4 border border-slate-100 sm:col-span-2">
              <div className="text-[11px] font-bold text-[#58423a] uppercase tracking-wider mb-1">Cryptographic &amp; Network Security</div>
              <div className="text-xs font-mono text-[#58423a]">{adminInfo.securityProtocol}</div>
            </div>
          </div>
        </div>

        {/* Quick Nav Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#7c2800] text-3xl">dashboard_customize</span>
            <div>
              <h3 className="text-sm font-bold text-[#191c1e]">Return to Central Console</h3>
              <p className="text-xs text-[#58423a]">Manage doctors, hospitals, medicines, diagnostic catalog &amp; fleet.</p>
            </div>
          </div>
          <Link
            to="/admin/dashboard"
            className="px-6 py-2.5 rounded-full bg-[#00501a] hover:bg-[#003e13] text-white text-xs font-bold transition-all shadow-sm"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            Open Admin Dashboard
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}
