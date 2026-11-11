import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TEMPLATES } from './email-templates/registry'

const send = vi.hoisted(() => vi.fn())
vi.mock('./email-templates/send-email', () => ({ sendTemplateEmail: send }))
import { notifyContactOwners } from './contact-notifications.server'

describe('contact owner notifications', () => {
  beforeEach(() => { send.mockReset(); send.mockResolvedValue({ sent: true }) })
  it('sends to the added owner address', () => {
    expect(TEMPLATES['contact-owner']?.to).toBe('ludmila@consultfin.ru')
  })
  it('preserves the original owner address', () => {
    expect(TEMPLATES['contact-owner-secondary']?.to).toBe('alekseevalv21@mail.ru')
  })
  it('uses separate event keys and visitor reply-to', async () => {
    await notifyContactOwners({ id: 'lead-123', name: 'Тест', email: 'visitor@example.com', message: 'Задача' })
    expect(send).toHaveBeenCalledTimes(2)
    expect(send).toHaveBeenCalledWith('contact-owner', '', expect.objectContaining({ idempotencyKey: 'contact-owner-lead-123', replyTo: 'visitor@example.com' }))
    expect(send).toHaveBeenCalledWith('contact-owner-secondary', '', expect.objectContaining({ idempotencyKey: 'contact-owner-secondary-lead-123' }))
  })
  it('keeps a stored lead successful if email fails', async () => {
    send.mockRejectedValue({ code: 'domain_not_verified' })
    await expect(notifyContactOwners({ id: 'lead-123', name: 'Тест', email: 'visitor@example.com', message: '' })).resolves.toBeUndefined()
  })
})