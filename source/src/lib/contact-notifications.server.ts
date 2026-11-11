import { sendTemplateEmail } from './email-templates/send-email'

interface ContactNotification { id: string; name: string; email: string; message: string }

export async function notifyContactOwners({ id, ...data }: ContactNotification) {
  const templateData = { ...data, submissionId: id }
  const results = await Promise.allSettled([
    sendTemplateEmail('contact-owner', '', {
      templateData, replyTo: data.email, idempotencyKey: `contact-owner-${id}`,
    }),
    sendTemplateEmail('contact-owner-secondary', '', {
      templateData, replyTo: data.email, idempotencyKey: `contact-owner-secondary-${id}`,
    }),
  ])
  for (const result of results) {
    if (result.status === 'rejected') {
      const error = result.reason
      console.warn('Contact notification unavailable', { submissionId: id, code: error?.code || 'send_failed' })
    }
  }
}