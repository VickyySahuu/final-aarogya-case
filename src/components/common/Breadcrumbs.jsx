import React from 'react'
import { Link } from 'react-router-dom'

export default function Breadcrumbs({ items = [], backTo = '/', backLabel = 'Back' }) {
  return (
    <div className="w-full bg-[#f8fafc] border-b border-slate-200 py-3 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500">
          <Link className="hover:text-[#166534] transition-colors" to="/">Home</Link>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <span className="text-slate-400">/</span>
              {item.to ? (
                <Link className="hover:text-[#166534] transition-colors" to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-semibold text-[#0A2540]">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
        {backTo && (
          <Link 
            className="rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-1.5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium shadow-2xs transition-colors" 
            to={backTo}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>{backLabel}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
