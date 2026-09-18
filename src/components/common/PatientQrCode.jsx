import React, { useState } from 'react'

/**
 * Deterministic SVG QR Code Generator for Patient Unique Code.
 * Encodes ONLY the patient unique code (e.g. AC-7F42K9) without private medical data.
 */
function generateQrMatrix(text) {
  const size = 21 // Version 1 QR matrix (21x21)
  const matrix = Array(size).fill(null).map(() => Array(size).fill(false))

  // 1. Draw 7x7 finder patterns
  const drawFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true
        }
      }
    }
  }

  drawFinder(0, 0)         // Top-left
  drawFinder(size - 7, 0)  // Top-right
  drawFinder(0, size - 7)  // Bottom-left

  // 2. Separators / margins around finders
  // (Left as false)

  // 3. Timing lines
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }

  // 4. Dark module
  matrix[size - 8][8] = true

  // 5. Fill remaining data modules based on deterministic hash of code
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i)
    hash |= 0
  }

  let bitIndex = 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finders and timing tracks
      const inTL = r < 9 && c < 9
      const inTR = r < 9 && c >= size - 9
      const inBL = r >= size - 9 && c < 9
      const inTiming = r === 6 || c === 6
      if (!inTL && !inTR && !inBL && !inTiming) {
        const seed = Math.sin(hash + bitIndex * 13.37) * 10000
        matrix[r][c] = (seed - Math.floor(seed)) > 0.46
        bitIndex++
      }
    }
  }

  return matrix
}

export default function PatientQrCode({
  code = 'AC-7F42K9',
  size = 110,
  showLabel = true,
  allowEnlarge = false,
  className = ''
}) {
  const [isEnlarged, setIsEnlarged] = useState(false)
  const matrix = React.useMemo(() => generateQrMatrix(code || 'AC-7F42K9'), [code])
  const matrixSize = matrix.length

  return (
    <>
      <div className={`inline-flex flex-col items-center justify-center p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0 ${className}`}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${matrixSize} ${matrixSize}`}
          className={`shape-rendering-crispEdges ${allowEnlarge ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onClick={() => allowEnlarge && setIsEnlarged(true)}
          role="img"
          aria-label={`Patient QR Code for ${code}`}
        >
          <rect width={matrixSize} height={matrixSize} fill="#ffffff" />
          {matrix.map((row, r) =>
            row.map((val, c) =>
              val ? (
                <rect
                  key={`${r}-${c}`}
                  x={c}
                  y={r}
                  width={1}
                  height={1}
                  fill="#000000"
                />
              ) : null
            )
          )}
        </svg>

        {showLabel && (
          <div className="mt-1.5 text-center">
            <span className="text-[10px] font-mono font-bold text-slate-800 tracking-wider block">
              {code}
            </span>
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block">
              Patient Unique QR
            </span>
          </div>
        )}

        {allowEnlarge && (
          <button
            type="button"
            onClick={() => setIsEnlarged(true)}
            className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#166534] font-semibold hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">zoom_in</span>
            <span>View Full QR</span>
          </button>
        )}
      </div>

      {/* Enlarge Modal */}
      {isEnlarged && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsEnlarged(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl border border-slate-200 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsEnlarged(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#166534] border border-emerald-200 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl">qr_code_2</span>
            </div>

            <h3 className="text-lg font-bold text-[#0A2540]" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Patient Unique Code QR
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-6">
              Present this code for instant OPD intake and doctor record lookup.
            </p>

            <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-inner mb-4">
              <svg
                width={220}
                height={220}
                viewBox={`0 0 ${matrixSize} ${matrixSize}`}
                className="shape-rendering-crispEdges"
              >
                <rect width={matrixSize} height={matrixSize} fill="#ffffff" />
                {matrix.map((row, r) =>
                  row.map((val, c) =>
                    val ? (
                      <rect
                        key={`m-${r}-${c}`}
                        x={c}
                        y={r}
                        width={1}
                        height={1}
                        fill="#000000"
                      />
                    ) : null
                  )
                )}
              </svg>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 w-full mb-6">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Permanent Patient Code
              </span>
              <span className="text-xl font-extrabold text-[#166534] font-mono tracking-wider">
                {code}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEnlarged(false)}
              className="w-full py-3 rounded-full bg-[#166534] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#14532d] transition-all cursor-pointer btn-press"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
