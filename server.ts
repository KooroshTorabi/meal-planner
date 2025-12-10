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
import { logger } from './lib/logger'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      if (!req.url) {
        res.statusCode = 400
        res.end('Bad Request')
        return
      }
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize all notification services
  logger.info('Initializing multi-channel alert delivery services...')
  
  // Initialize WebSocket server for real-time alerts
  initializeWebSocketServer(server)
  
  // Initialize push notification service
  initializePushNotifications()
  
  // Initialize email notification service
  initializeEmailService()
logger.info('All alert delivery services initialized.')

  // Start the server
  server.listen(port, () => {
    logger.info(`> Ready on http://${hostname}:${port}`)
    logger.info(`> WebSocket server ready on ws://${hostname}:${port}/ws/alerts`)
    logger.info(`> Multi-channel alert delivery initialized`)
  })
})
