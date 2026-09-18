import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import DoctorLayout from '../../components/layout/DoctorLayout'

const PROFILE = {
  name: 'Dr. Ramanathan Venkatraman',
  doctorId: 'DOC-1042',
  specialization: 'General Medicine',
  hospital: 'District Civil Hospital',
  room: 'Room 104',
  qualification: 'MBBS, MD (General Medicine)',
  department: 'General Medicine',
  designation: 'Attending Medical Officer',
  email: 'dr.ramanathan@hospital.org',
  phone: '+91 98765 43210',
  shift: 'Morning Session (08:30 – 14:00)',
  experience: '14 Years',
  specializations: ['General Medicine', 'Internal Medicine'],
}

export default function DoctorProfilePage() {
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState(PROFILE)

  return (
    <DoctorLayout activeNav="Profile">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 bg-white shadow-sm">
        <nav className="flex items-center gap-2 text-xs text-[#58423a] font-semibold flex-wrap" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <Link to="/doctor/dashboard" className="hover:text-[#7c2800] flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">home</span>Doctor Portal</Link>
          <span className="material-symbols-outlined text-[14px] text-[#8f7066]">chevron_right</span>
          <span className="text-[#7c2800] font-bold">Doctor Profile</span>
        </nav>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-8 max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-[#455f8a] to-[#00501a] relative">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-full bg-[#00501a] flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white" style={{ fontFamily: 'Lexend, sans-serif' }}>RV</div>
            </div>
          </div>
          <div className="pt-16 pb-6 px-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>{profile.name}</h1>
              <p className="text-base text-[#58423a] mt-1">{profile.specialization} • {profile.hospital}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-[#d6e3ff] text-[#2c4771] rounded-full text-xs font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Doctor ID: {profile.doctorId}</span>
                <span className="px-3 py-1 bg-[#eceef0] text-[#191c1e] rounded-full text-xs font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>{profile.room}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="h-12 px-6 bg-[#455f8a] text-white rounded-full text-[15px] font-semibold flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  <span className="material-symbols-outlined">edit</span>Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={() => setEditing(false)} className="h-12 px-6 bg-[#eceef0] text-[#191c1e] rounded-full text-[15px] font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>Cancel</button>
                  <button onClick={() => setEditing(false)} className="h-12 px-6 bg-[#00501a] text-white rounded-full text-[15px] font-semibold flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    <span className="material-symbols-outlined">save</span>Save Changes
                  </button>
                </>
              )}
              <Link to="/doctor/logout" className="h-12 px-6 bg-[#ffdad6] text-[#93000a] rounded-full text-[15px] font-semibold flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                <span className="material-symbols-outlined">logout</span>Logout
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Professional Information</h3>
            {[
              { label: 'Full Name', value: profile.name, key: 'name' },
              { label: 'Qualification', value: profile.qualification, key: 'qualification' },
              { label: 'Experience', value: profile.experience, key: 'experience' },
              { label: 'Department', value: profile.department, key: 'department' },
              { label: 'Designation', value: profile.designation, key: 'designation' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-[#58423a] uppercase mb-1 block" style={{ fontFamily: 'Lexend, sans-serif' }}>{f.label}</label>
                {editing ? (
                  <input className="w-full h-11 px-4 bg-[#f2f4f6] rounded-xl text-base focus:outline-none focus:bg-white focus:shadow-md" value={profile[f.key]} onChange={e => setProfile({...profile, [f.key]: e.target.value})} />
                ) : (
                  <p className="text-base font-medium text-[#191c1e]">{f.value}</p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-[#191c1e]" style={{ fontFamily: 'Lexend, sans-serif' }}>Contact & Facility</h3>
            {[
              { label: 'Email', value: profile.email, key: 'email' },
              { label: 'Phone', value: profile.phone, key: 'phone' },
              { label: 'Hospital', value: profile.hospital, key: 'hospital' },
              { label: 'Room', value: profile.room, key: 'room' },
              { label: 'Shift', value: profile.shift, key: 'shift' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-[#58423a] uppercase mb-1 block" style={{ fontFamily: 'Lexend, sans-serif' }}>{f.label}</label>
                {editing ? (
                  <input className="w-full h-11 px-4 bg-[#f2f4f6] rounded-xl text-base focus:outline-none focus:bg-white focus:shadow-md" value={profile[f.key]} onChange={e => setProfile({...profile, [f.key]: e.target.value})} />
                ) : (
                  <p className="text-base font-medium text-[#191c1e]">{f.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Specializations */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-[#191c1e] mb-4" style={{ fontFamily: 'Lexend, sans-serif' }}>Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {profile.specializations.map(s => (
              <span key={s} className="px-4 py-2 bg-[#d6e3ff] text-[#2c4771] rounded-full text-sm font-semibold" style={{ fontFamily: 'Lexend, sans-serif' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </DoctorLayout>
  )
}
