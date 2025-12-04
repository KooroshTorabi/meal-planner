/**
 * WebSocket Service for Real-time Alert Delivery
 * Broadcasts alerts to connected kitchen staff users
 * Requirements: 16.2
 */

import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  id: string
  email: string
  role: string
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  userRole?: string
  isAlive?: boolean
}

interface AlertMessage {
  type: 'alert' | 'ping' | 'pong'
  data?: any
}

/**
 * WebSocket server instance for alert broadcasting
 */
let wss: WebSocketServer | null = null

/**
 * Map of connected clients by user ID
 */
const connectedClients = new Map<string, Set<AuthenticatedWebSocket>>()

/**
 * Verify JWT token and extract user information
 */
function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    const decoded = jwt.verify(token, secret) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(server: Server): WebSocketServer {
  if (wss) {
    console.log('WebSocket server already initialized')
    return wss
  }

  wss = new WebSocketServer({ 
    server,
    path: '/ws/alerts',
  })

  console.log('WebSocket server initialized on path /ws/alerts')

  // Handle new connections
  wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
    console.log('New WebSocket connection attempt')

    // Extract token from query string or headers
    const url = new URL(request.url || '', `http://${request.headers.host}`)
    const token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      console.log('WebSocket connection rejected: No token provided')
      ws.close(1008, 'Authentication required')
      return
    }

    // Verify token
    const user = verifyToken(token)
    if (!user) {
      console.log('WebSocket connection rejected: Invalid token')
      ws.close(1008, 'Invalid or expired token')
      return
    }

    // Only kitchen staff and admin can connect
    if (user.role !== 'kitchen' && user.role !== 'admin') {
      console.log(`WebSocket connection rejected: Invalid role ${user.role}`)
      ws.close(1008, 'Only kitchen staff and administrators can receive alerts')
      return
    }

    // Store user information on the WebSocket
    ws.userId = user.id
    ws.userRole = user.role
    ws.isAlive = true

    // Add to connected clients map
    if (!connectedClients.has(user.id)) {
      connectedClients.set(user.id, new Set())
    }
    connectedClients.get(user.id)?.add(ws)

    console.log(`WebSocket connected: User ${user.id} (${user.role})`)

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to alert notification service',
      userId: user.id,
    }))

    // Handle incoming messages
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString()) as AlertMessage
        
        if (data.type === 'ping') {
          ws.isAlive = true
          ws.send(JSON.stringify({ type: 'pong' }))
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    })

    // Handle pong responses for heartbeat
    ws.on('pong', () => {
      ws.isAlive = true
    })

    // Handle disconnection
    ws.on('close', () => {
      console.log(`WebSocket disconnected: User ${user.id}`)
      
      // Remove from connected clients
      const userSockets = connectedClients.get(user.id)
      if (userSockets) {
        userSockets.delete(ws)
        if (userSockets.size === 0) {
          connectedClients.delete(user.id)
        }
      }
    })

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${user.id}:`, error)
    })
  })

  // Set up heartbeat to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss?.clients.forEach((ws: WebSocket) => {
      const authWs = ws as AuthenticatedWebSocket
      
      if (authWs.isAlive === false) {
        console.log(`Terminating dead connection for user ${authWs.userId}`)
        return authWs.terminate()
      }

      authWs.isAlive = false
      authWs.ping()
    })
  }, 30000) // 30 seconds

  // Clean up on server close
  wss.on('close', () => {
    clearInterval(heartbeatInterval)
    connectedClients.clear()
  })

  return wss
}

/**
 * Broadcast alert to all connected kitchen staff users
 */
export function broadcastAlert(alert: any): number {
  if (!wss) {
    console.warn('WebSocket server not initialized, cannot broadcast alert')
    return 0
  }

  let sentCount = 0
  const message = JSON.stringify({
    type: 'alert',
    data: alert,
    timestamp: new Date().toISOString(),
  })

  // Broadcast to all connected kitchen staff and admin users
  wss.clients.forEach((ws: WebSocket) => {
    const authWs = ws as AuthenticatedWebSocket
    
    if (authWs.readyState === WebSocket.OPEN && 
        (authWs.userRole === 'kitchen' || authWs.userRole === 'admin')) {
      try {
        authWs.send(message)
        sentCount++
      } catch (error) {
        console.error(`Error sending alert to user ${authWs.userId}:`, error)
      }
    }
  })

  console.log(`Alert broadcast to ${sentCount} connected clients`)
  return sentCount
}

/**
 * Send alert to specific user(s)
 */
export function sendAlertToUser(userId: string, alert: any): boolean {
  const userSockets = connectedClients.get(userId)
  
  if (!userSockets || userSockets.size === 0) {
    console.log(`No active WebSocket connections for user ${userId}`)
    return false
  }

  const message = JSON.stringify({
    type: 'alert',
    data: alert,
    timestamp: new Date().toISOString(),
  })

  let sent = false
  userSockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message)
        sent = true
      } catch (error) {
        console.error(`Error sending alert to user ${userId}:`, error)
      }
    }
  })

  return sent
}

/**
 * Get count of connected clients
 */
export function getConnectedClientsCount(): number {
  return connectedClients.size
}

/**
 * Get connected clients by role
 */
export function getConnectedClientsByRole(role: 'kitchen' | 'admin'): number {
  let count = 0
  
  wss?.clients.forEach((ws: WebSocket) => {
    const authWs = ws as AuthenticatedWebSocket
    if (authWs.userRole === role && authWs.readyState === WebSocket.OPEN) {
      count++
    }
  })

  return count
}

/**
 * Close WebSocket server
 */
export function closeWebSocketServer(): void {
  if (wss) {
    wss.close(() => {
      console.log('WebSocket server closed')
    })
    wss = null
    connectedClients.clear()
  }
}
