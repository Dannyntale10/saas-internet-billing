'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
        <div className="h-4 w-4 rounded-full bg-white/20 animate-pulse" />
      </div>
    )
  }

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const currentTheme = themes.find((t) => t.value === theme) || themes[0]
  const CurrentIcon = currentTheme.icon

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-center h-10 w-10 rounded-lg',
          'bg-white/10 hover:bg-white/20',
          'border border-white/20 hover:border-white/30',
          'text-white transition-all duration-200',
          'backdrop-blur-sm',
          'hover:scale-110 active:scale-95',
          'shadow-lg hover:shadow-xl'
        )}
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-48 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon
              const isActive = theme === themeOption.value
              
              return (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left',
                    'transition-all duration-200',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    isActive && 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5',
                    isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  )} />
                  <span className={cn(
                    'font-medium text-sm',
                    isActive 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  )}>
                    {themeOption.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

