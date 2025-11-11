import React from 'react'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon - Stylized J with road */}
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* J Shape */}
          <path
            d="M30 20 Q30 10 40 10 L60 10 Q70 10 70 20 L70 60 Q70 80 50 80 L40 80 Q30 80 30 70 L30 20 Z"
            fill="#4ADE80"
            className="drop-shadow-lg"
          />
          {/* Road path inside J */}
          <path
            d="M35 25 Q35 20 40 20 L50 20 Q60 25 65 30 L70 35 Q75 40 75 45 L75 55"
            stroke="#22C55E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Road dashes */}
          <line x1="45" y1="22" x2="48" y2="22" stroke="white" strokeWidth="2" />
          <line x1="52" y1="25" x2="55" y2="25" stroke="white" strokeWidth="2" />
          <line x1="58" y1="28" x2="61" y2="28" stroke="white" strokeWidth="2" />
          <line x1="65" y1="32" x2="68" y2="32" stroke="white" strokeWidth="2" />
          <line x1="70" y1="38" x2="73" y2="38" stroke="white" strokeWidth="2" />
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${textSizes[size]} leading-tight`}>
            JENDA
          </span>
          <span className={`font-bold text-white ${textSizes[size]} leading-tight -mt-1`}>
            MOBILITY
          </span>
        </div>
      )}
    </div>
  )
}

