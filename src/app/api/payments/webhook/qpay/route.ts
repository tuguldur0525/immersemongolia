// src/app/api/payments/webhook/qpay/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/supabase/prisma'
import { qpay } from '@/lib/payments/qpay'
import { sendPaymentConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'paymentId required' }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status === 'PAID') {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Verify with QPay
    if (payment.qpayInvoiceId) {
      const qpayStatus = await qpay.checkPayment(payment.qpayInvoiceId)

      if (qpayStatus.count > 0 && qpayStatus.paid_amount >= Number(payment.amount)) {
        // Mark payment as paid
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            externalId: qpayStatus.rows[0]?.transaction_id,
          },
        })

        // Activate subscription
        if (payment.subscriptionId) {
          await prisma.subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: 'ACTIVE' },
          })

          // Activate featured if PROFESSIONAL+
          if (payment.subscription && ['PROFESSIONAL', 'ENTERPRISE'].includes(payment.subscription.plan)) {
            const endDate = payment.subscription.endDate
            await prisma.business.updateMany({
              where: { subscriptions: { some: { id: payment.subscriptionId } } },
              data: {
                isFeatured: true,
                featuredUntil: endDate,
                isPremium: true,
              },
            })
          }
        }

        // Send confirmation email
        const user = await prisma.user.findUnique({ where: { id: payment.userId } })
        if (user && payment.invoiceNumber) {
          sendPaymentConfirmationEmail(user.email, {
            invoiceNumber: payment.invoiceNumber,
            amount: Number(payment.amount),
            plan: payment.subscription?.plan || 'Unknown',
            period: payment.subscription?.isAnnual ? 'Жилийн' : 'Сарын',
          }).catch(console.error)
        }

        return NextResponse.json({ success: true, message: 'Payment confirmed' })
      }
    }

    return NextResponse.json({ success: true, message: 'Payment not yet confirmed' })
  } catch (error) {
    console.error('QPay webhook error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// GET for QPay redirect callback
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const paymentId = searchParams.get('paymentId')

  if (paymentId) {
    // Trigger verification
    await POST(request)
  }

  // Redirect to payments page
  return Response.redirect(new URL('/dashboard/business/payments', request.url))
}
