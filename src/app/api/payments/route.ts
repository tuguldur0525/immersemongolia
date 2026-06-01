// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { createQPayInvoice } from '@/lib/payments/qpay'
import { nanoid } from 'nanoid'
import { addMonths, addYears } from 'date-fns'

const createPaymentSchema = z.object({
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  isAnnual: z.boolean().default(false),
  businessId: z.string().uuid().optional(),
  method: z.enum(['QPAY', 'BANK_CARD', 'BANK_TRANSFER', 'INVOICE']),
})

// Plan prices in MNT
const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  FREE: { monthly: 0, annual: 0 },
  STARTER: { monthly: 49000, annual: 490000 },
  PROFESSIONAL: { monthly: 99000, annual: 990000 },
  ENTERPRISE: { monthly: 199000, annual: 1990000 },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    })
    if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const { plan, isAnnual, businessId, method } = createPaymentSchema.parse(body)

    const prices = PLAN_PRICES[plan]
    const amount = isAnnual ? prices.annual : prices.monthly
    const invoiceNumber = `IM-${Date.now()}-${nanoid(6).toUpperCase()}`

    // Create subscription period
    const startDate = new Date()
    const endDate = isAnnual ? addYears(startDate, 1) : addMonths(startDate, 1)

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: dbUser.id,
        businessId,
        plan,
        status: amount === 0 ? 'ACTIVE' : 'PENDING_PAYMENT',
        isAnnual,
        startDate,
        endDate,
        renewalDate: endDate,
        priceAtPurchase: amount,
        currency: 'MNT',
      },
    })

    if (amount === 0) {
      return NextResponse.json({ success: true, data: { subscription, paymentRequired: false } })
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        userId: dbUser.id,
        method,
        status: 'PENDING',
        amount,
        currency: 'MNT',
        description: `Immerse Mongolia ${plan} plan - ${isAnnual ? 'Annual' : 'Monthly'}`,
        invoiceNumber,
      },
    })

    // Generate QPay invoice
    if (method === 'QPAY') {
      const qpayData = await createQPayInvoice({
        amount,
        description: `Immerse Mongolia ${plan} - ${isAnnual ? 'Жилийн' : 'Сарын'} захиалга`,
        paymentId: payment.id,
      })

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          qpayInvoiceId: qpayData.invoiceId,
          qpayQrCode: qpayData.qrCode,
          externalId: qpayData.invoiceId,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          payment: { ...payment, qpayQrCode: qpayData.qrCode },
          subscription,
          qpay: qpayData,
          paymentRequired: true,
        },
      })
    }

    // For other methods, return invoice details
    return NextResponse.json({
      success: true,
      data: {
        payment,
        subscription,
        invoiceNumber,
        paymentRequired: true,
        bankDetails: {
          bankName: 'Голомт банк',
          accountName: 'Иммэрс Монголиа ХХК',
          accountNumber: process.env.BANK_ACCOUNT_NUMBER,
          reference: invoiceNumber,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('POST /api/payments:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    })

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId: dbUser!.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          subscription: { select: { plan: true, isAnnual: true, startDate: true, endDate: true } },
        },
      }),
      prisma.payment.count({ where: { userId: dbUser!.id } }),
    ])

    return NextResponse.json({
      success: true,
      data: { payments, total, page, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET /api/payments:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
