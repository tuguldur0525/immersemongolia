import { Resend } from 'resend'
import { WelcomeEmail } from './templates/WelcomeEmail'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'Immerse Mongolia <noreply@immersemongolia.mn>'

export async function sendWelcomeEmail(to: string, firstName: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Immerse Mongolia-д тавтай морил, ${firstName}!`,
    react: WelcomeEmail({ firstName, email: to }),
  })
}

export async function sendBusinessApprovedEmail(
  to: string,
  businessName: string,
  businessSlug: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `"${businessName}" бизнесийн профайл нийтлэгдлээ`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>Бизнесийн профайл нийтлэгдлээ</h2>
        <p>"<strong>${businessName}</strong>" Immerse Mongolia-д нийтлэгдлээ.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/business/${businessSlug}">Профайл харах</a>
      </div>
    `,
  })
}

export async function sendPaymentConfirmationEmail(
  to: string,
  params: { invoiceNumber: string; amount: number; plan: string; period: string }
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Төлбөр амжилттай — ${params.invoiceNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>Төлбөр амжилттай</h2>
        <p>Дүн: ₮${params.amount.toLocaleString('mn-MN')}</p>
      </div>
    `,
  })
}

export async function sendClaimStatusEmail(
  to: string,
  businessName: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
) {
  const isApproved = status === 'APPROVED'
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Эзэмшлийн хүсэлт — ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <p>${isApproved ? 'Зөвшөөрөгдлөө' : 'Татгалзагдлаа'}: ${businessName}</p>
        ${reason ? `<p>${reason}</p>` : ''}
      </div>
    `,
  })
}
