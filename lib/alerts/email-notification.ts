/**
 * Email Notification Service
 * Sends email notifications to kitchen staff
 * Requirements: 16.4
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { Payload } from 'payload'

let transporter: Transporter | null = null

/**
 * Initialize email transporter with SMTP configuration
 */
export function initializeEmailService(): void {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
  const smtpSecure = process.env.SMTP_SECURE === 'true'
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn('SMTP configuration not complete. Email notifications will not be available.')
    console.warn('Required environment variables: SMTP_HOST, SMTP_USER, SMTP_PASSWORD')
    return
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  })

  // Verify connection
  transporter.verify((error) => {
    if (error) {
      console.error('Email service initialization failed:', error)
      transporter = null
    } else {
      console.log('Email notification service initialized')
    }
  })
}

/**
 * Send email notification
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (!transporter) {
    console.warn('Email transporter not initialized, cannot send email')
    return false
  }

  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@mealplanner.com'

    const info = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text: text || subject,
      html,
    })

    console.log('Email sent successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

/**
 * Generate HTML email template for alert
 */
function generateAlertEmailHTML(
  residentName: string,
  roomNumber: string,
  mealType: string,
  message: string,
  severity: string,
  dashboardUrl: string
): string {
  const severityColor = {
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  }[severity] || '#6b7280'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Urgent Meal Order Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🔔 Urgent Meal Order Alert</h1>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="margin-top: 0; color: #1f2937;">Order Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 120px;">Resident:</td>
          <td style="padding: 8px 0;">${residentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Room:</td>
          <td style="padding: 8px 0;">${roomNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Meal Type:</td>
          <td style="padding: 8px 0;">${mealType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Severity:</td>
          <td style="padding: 8px 0;">
            <span style="background-color: ${severityColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
              ${severity}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; font-weight: bold; color: #92400e;">Alert Message:</p>
      <p style="margin: 8px 0 0 0; color: #78350f;">${message}</p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View in Kitchen Dashboard
      </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p style="margin: 0;">This is an automated notification from the Meal Planner System.</p>
      <p style="margin: 8px 0 0 0;">Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text email for alert
 */
function generateAlertEmailText(
  residentName: string,
  roomNumber: string,
  mealType: string,
  message: string,
  severity: string,
  dashboardUrl: string
): string {
  return `
URGENT MEAL ORDER ALERT

Order Details:
--------------
Resident: ${residentName}
Room: ${roomNumber}
Meal Type: ${mealType}
Severity: ${severity.toUpperCase()}

Alert Message:
${message}

View in Kitchen Dashboard:
${dashboardUrl}

---
This is an automated notification from the Meal Planner System.
Please do not reply to this email.
  `.trim()
}

/**
 * Send alert email notification to all kitchen staff users
 */
export async function sendAlertEmailNotifications(
  payload: Payload,
  alert: any
): Promise<number> {
  if (!transporter) {
    console.warn('Email transporter not initialized, cannot send alert emails')
    return 0
  }

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
      console.log('No active kitchen staff users found for email notifications')
      return 0
    }

    // Get meal order information
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

    // Generate email content
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const dashboardUrl = `${serverUrl}/kitchen/dashboard?alert=${alert.id}`
    
    const subject = `🔔 Urgent ${mealType} Order Alert - ${residentName} (Room ${roomNumber})`
    const html = generateAlertEmailHTML(
      residentName,
      roomNumber,
      mealType,
      alert.message,
      alert.severity,
      dashboardUrl
    )
    const text = generateAlertEmailText(
      residentName,
      roomNumber,
      mealType,
      alert.message,
      alert.severity,
      dashboardUrl
    )

    // Collect email addresses
    const emailAddresses = kitchenUsers.docs
      .map((user) => user.email)
      .filter((email): email is string => !!email)

    if (emailAddresses.length === 0) {
      console.log('No email addresses found for kitchen staff users')
      return 0
    }

    // Send email to all kitchen staff
    const sent = await sendEmail(emailAddresses, subject, html, text)
    
    if (sent) {
      console.log(`Alert email sent to ${emailAddresses.length} kitchen staff members`)
      return emailAddresses.length
    }

    return 0
  } catch (error) {
    console.error('Error sending alert email notifications:', error)
    return 0
  }
}

/**
 * Send email to specific user
 */
export async function sendEmailToUser(
  payload: Payload,
  userId: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (!transporter) {
    console.warn('Email transporter not initialized, cannot send email')
    return false
  }

  try {
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user || !user.email) {
      console.log(`User ${userId} not found or has no email address`)
      return false
    }

    return await sendEmail(user.email, subject, html, text)
  } catch (error) {
    console.error(`Error sending email to user ${userId}:`, error)
    return false
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(testEmail: string): Promise<boolean> {
  if (!transporter) {
    console.error('Email transporter not initialized')
    return false
  }

  const subject = 'Meal Planner System - Email Configuration Test'
  const html = `
    <h1>Email Configuration Test</h1>
    <p>This is a test email from the Meal Planner System.</p>
    <p>If you received this email, your SMTP configuration is working correctly.</p>
  `
  const text = 'This is a test email from the Meal Planner System. If you received this email, your SMTP configuration is working correctly.'

  return await sendEmail(testEmail, subject, html, text)
}
