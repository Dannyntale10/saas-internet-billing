import React from 'react'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {/* Stylized J with road motif */}
        <div className="relative">
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Main J shape */}
            <path
              d="M30 10C35 10 40 12 42 18L42 35C42 40 40 42 35 42L25 42C20 42 18 40 18 35L18 25"
              stroke="#76D74C"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Road motif in the curve */}
            <path
              d="M18 30 Q25 35 30 40 Q35 35 42 30"
              stroke="#76D74C"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="4 4"
            />
          </svg>
        </div>
        {/* Text */}
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white">JENDA</span>
          <span className="text-sm font-semibold text-white">MOBILITY</span>
        </div>
      </div>
    </div>
  )
}

