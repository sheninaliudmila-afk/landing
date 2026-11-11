import { Body, Container, Head, Heading, Html, Preview, Text, Link, Hr } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { name?: string; email?: string; message?: string; submissionId?: string }

function ContactOwnerEmail({ name, email, message, submissionId }: Props) {
  return (
    <Html lang="ru" dir="ltr">
      <Head />
      <Preview>Новая заявка на консультацию — {name || 'Посетитель сайта'}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Manrope, Arial, sans-serif', color: '#101111' }}>
        <Container style={{ maxWidth: '560px', padding: '32px 24px' }}>
          <Text style={{ color: '#ec493b', fontWeight: 800 }}>FINCONSULT · Алексеева Людмила</Text>
          <Heading>Новая заявка на консультацию</Heading>
          <Text><strong>Имя:</strong> {name || 'Не указано'}</Text>
          <Text><strong>Почта:</strong> {email ? <Link href={`mailto:${email}`} style={{ color: '#ec493b' }}>{email}</Link> : 'Не указана'}</Text>
          <Text style={{ whiteSpace: 'pre-wrap' }}>{message || 'Посетитель не добавил описание задачи.'}</Text>
          <Hr />
          <Text style={{ color: '#656765', fontSize: '12px' }}>Номер заявки: {submissionId || '—'}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ContactOwnerEmail,
  subject: 'FINCONSULT — новая заявка на консультацию',
  displayName: 'Заявка — основная почта',
  to: 'ludmila@consultfin.ru',
  previewData: { name: 'Посетитель сайта', email: 'visitor@example.com', message: 'Хочу обсудить финансовую стратегию.', submissionId: 'preview' },
} satisfies TemplateEntry

export const secondaryTemplate = {
  ...template,
  displayName: 'Заявка — дополнительная почта',
  to: 'alekseevalv21@mail.ru',
} satisfies TemplateEntry