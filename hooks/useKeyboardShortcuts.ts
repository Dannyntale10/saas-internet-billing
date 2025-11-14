'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault()
          shortcut.action()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Common shortcuts hook
export function useCommonShortcuts() {
  const router = useRouter()

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      action: () => {
        // Open global search
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true
        })
        document.dispatchEvent(event)
      },
      description: 'Open global search'
    },
    {
      key: 'n',
      ctrl: true,
      action: () => {
        // Open new item modal (context-dependent)
        const newButton = document.querySelector('[data-shortcut="new"]') as HTMLElement
        if (newButton) newButton.click()
      },
      description: 'Create new item'
    },
    {
      key: '/',
      action: () => {
        // Focus search
        const searchInput = document.querySelector('[data-shortcut="search"]') as HTMLInputElement
        if (searchInput) searchInput.focus()
      },
      description: 'Focus search'
    },
    {
      key: 'Escape',
      action: () => {
        // Close modals
        const closeButton = document.querySelector('[data-shortcut="close"]') as HTMLElement
        if (closeButton) closeButton.click()
      },
      description: 'Close modal/dialog'
    }
  ])
}

