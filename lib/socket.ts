'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('✅ Socket.io connected')
    })

    socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected')
    })

    socket.on('error', (error) => {
      console.error('❌ Socket.io error:', error)
    })
  }

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Event types
export type SocketEvent =
  | 'payment:new'
  | 'payment:update'
  | 'voucher:created'
  | 'voucher:used'
  | 'user:connected'
  | 'user:disconnected'
  | 'stats:update'
  | 'notification:new'

export function subscribeToEvent(
  event: SocketEvent,
  callback: (data: any) => void
) {
  const socketInstance = getSocket()
  if (socketInstance) {
    socketInstance.on(event, callback)
    return () => socketInstance.off(event, callback)
  }
  return () => {}
}

export function unsubscribeFromEvent(
  event: SocketEvent,
  callback: (data: any) => void
) {
  const socketInstance = getSocket()
  if (socketInstance) {
    socketInstance.off(event, callback)
  }
}

