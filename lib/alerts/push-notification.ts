/**
 * Push Notification Service
 * Sends push notifications to kitchen staff devices
 * Requirements: 16.3
 */

import webpush from 'web-push'
import type { Payload } from 'payload'

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Initialize web-push with VAPID keys
 */
export function initializePushNotifications(): void {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@mealplanner.com'

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured. Push notifications will not be available.')
    console.warn('Generate VAPID keys with: npx web-push generate-vapid-keys')
    return
  }

  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  )

  console.log('Push notification service initialized')
}

/**
 * Send push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: any
): Promise<boolean> {
  try {
    const payloadString = JSON.stringify(payload)
    
    await webpush.sendNotification(subscription, payloadString)
    console.log('Push notification sent successfully')
    return true
  } catch (error: any) {
    // Handle expired subscriptions
    if (error.statusCode === 410) {
      console.log('Push subscription expired or invalid')
      return false
    }
    
    console.error('Error sending push notification:', error)
    return false
  }
}

/**
 * Send alert push notification to all kitchen staff users
 */
export async function sendAlertPushNotifications(
  payload: Payload,
  alert: any
): Promise<number> {
  try {
    // Get all active kitchen staff users
    const kitchenUsers = await payload.find({
      collection: 'users',
      where: {
        and: [
          {
            role: {
              equals: 'kitchen',
            },
          },
          {
            active: {
              equals: true,
            },
          },
        ],
      },
    })

    if (kitchenUsers.docs.length === 0) {
      console.log('No active kitchen staff users found for push notifications')
      return 0
    }

    // Get meal order information for the notification
    const mealOrder = typeof alert.mealOrder === 'string'
      ? await payload.findByID({
          collection: 'meal-orders',
          id: alert.mealOrder,
        })
      : alert.mealOrder

    const resident = typeof mealOrder.resident === 'string'
      ? await payload.findByID({
          collection: 'residents',
          id: mealOrder.resident,
        })
      : mealOrder.resident

    const residentName = typeof resident === 'object' && resident !== null ? resident.name : 'Unknown'
    const roomNumber = typeof resident === 'object' && resident !== null ? resident.roomNumber : 'N/A'
    const mealType = mealOrder.mealType.charAt(0).toUpperCase() + mealOrder.mealType.slice(1)

    // Create notification payload
    const notificationPayload = {
      title: 'Urgent Meal Order Alert',
      body: `${mealType} order for ${residentName} (Room ${roomNumber}) requires immediate attention`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        alertId: alert.id,
        mealOrderId: typeof alert.mealOrder === 'string' ? alert.mealOrder : alert.mealOrder.id,
        severity: alert.severity,
        url: `/kitchen/dashboard?alert=${alert.id}`,
      },
      actions: [
        {
          action: 'view',
          title: 'View Order',
        },
        {
          action: 'acknowledge',
          title: 'Acknowledge',
        },
      ],
    }

    let sentCount = 0

    // Send push notification to each kitchen staff user
    for (const user of kitchenUsers.docs) {
      // In a real implementation, you would retrieve the user's push subscriptions
      // from a database collection. For now, we'll check if the user has a pushSubscription field
      const pushSubscriptions = (user as any).pushSubscriptions as PushSubscription[] | undefined

      if (!pushSubscriptions || pushSubscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${user.id}`)
        continue
      }

      // Send to all subscriptions for this user
      for (const subscription of pushSubscriptions) {
        const sent = await sendPushNotification(subscription, notificationPayload)
        if (sent) {
          sentCount++
        }
      }
    }

    console.log(`Push notifications sent to ${sentCount} subscriptions`)
    return sentCount
  } catch (error) {
    console.error('Error sending alert push notifications:', error)
    return 0
  }
}

/**
 * Send push notification to specific user
 */
export async function sendPushNotificationToUser(
  payload: Payload,
  userId: string,
  notificationData: any
): Promise<boolean> {
  try {
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      console.log(`User ${userId} not found`)
      return false
    }

    const pushSubscriptions = (user as any).pushSubscriptions as PushSubscription[] | undefined

    if (!pushSubscriptions || pushSubscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`)
      return false
    }

    let sent = false
    for (const subscription of pushSubscriptions) {
      const result = await sendPushNotification(subscription, notificationData)
      if (result) {
        sent = true
      }
    }

    return sent
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error)
    return false
  }
}

/**
 * Generate VAPID keys (utility function for setup)
 * Run this once to generate keys and add them to .env
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  const vapidKeys = webpush.generateVAPIDKeys()
  console.log('VAPID Public Key:', vapidKeys.publicKey)
  console.log('VAPID Private Key:', vapidKeys.privateKey)
  console.log('\nAdd these to your .env file:')
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
  console.log(`VAPID_SUBJECT=mailto:admin@mealplanner.com`)
  return vapidKeys
}
