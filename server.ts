/**
 * Custom Next.js server with WebSocket support
 * Initializes WebSocket server for real-time alert delivery
 */

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initializeWebSocketServer } from './lib/alerts/websocket'
import { initializePushNotifications } from './lib/alerts/push-notification'
import { initializeEmailService } from './lib/alerts/email-notification'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize all notification services
  console.log('Initializing multi-channel alert delivery services...')
  
  // Initialize WebSocket server for real-time alerts
  initializeWebSocketServer(server)
  
  // Initialize push notification service
  initializePushNotifications()
  
  // Initialize email notification service
  initializeEmailService()

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws/alerts`)
    console.log(`> Multi-channel alert delivery initialized`)
  })
})
