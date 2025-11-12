import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'icon-only' | 'text-only'
}

export default function Logo({ 
  className = '', 
  showText = true, 
  size = 'md',
  variant = 'default'
}: LogoProps) {
  const sizeClasses = {
    sm: { image: 'h-10 w-10', text: 'text-xl' },
    md: { image: 'h-14 w-14', text: 'text-2xl' },
    lg: { image: 'h-20 w-20 sm:h-24 sm:w-24', text: 'text-3xl sm:text-4xl' },
    xl: { image: 'h-28 w-28 sm:h-32 sm:w-32', text: 'text-4xl sm:text-5xl' }
  }

  const currentSize = sizeClasses[size]

  // Icon only variant
  if (variant === 'icon-only') {
    return (
      <div className={`${currentSize.image} relative flex-shrink-0 ${className}`}>
        <Image
          src="/logo.jpg"
          alt="JENDA MOBILITY Logo"
          fill
          className="object-contain"
          priority
          quality={95}
        />
      </div>
    )
  }

  // Text only variant
  if (variant === 'text-only') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={`font-bold text-white ${currentSize.text} leading-tight`}>
          JENDA
        </span>
        <span className={`font-bold text-white ${currentSize.text} leading-tight -mt-1`}>
          MOBILITY
        </span>
      </div>
    )
  }

  // Default variant with logo and text
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <div className={`${currentSize.image} relative flex-shrink-0`}>
        <Image
          src="/logo.jpg"
          alt="JENDA MOBILITY Logo"
          fill
          className="object-contain drop-shadow-lg"
          priority
          quality={95}
        />
      </div>
      
      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${currentSize.text} leading-tight drop-shadow-md`}>
            JENDA
          </span>
          <span className={`font-bold text-white ${currentSize.text} leading-tight -mt-1 drop-shadow-md`}>
            MOBILITY
          </span>
        </div>
      )}
    </div>
  )
}
