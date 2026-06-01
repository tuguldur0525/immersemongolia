// src/lib/payments/qpay.ts
import { nanoid } from 'nanoid'

const QPAY_BASE_URL = process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn/v2'
const QPAY_USERNAME = process.env.QPAY_USERNAME!
const QPAY_PASSWORD = process.env.QPAY_PASSWORD!
const QPAY_INVOICE_CODE = process.env.QPAY_INVOICE_CODE!

interface QPaYTokenResponse {
  token_type: string
  refresh_expires_in: number
  refresh_token: string
  access_token: string
  expires_in: number
}

interface QPaYInvoiceResponse {
  invoice_id: string
  qr_text: string
  qr_image: string
  urls: Array<{
    name: string
    description: string
    logo: string
    link: string
  }>
}

interface QPaYCheckResponse {
  count: number
  paid_amount: number
  rows: Array<{
    transaction_id: string
    amount: number
    currency: string
    status: string
    created_date: string
  }>
}

class QPaYClient {
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const response = await fetch(`${QPAY_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${QPAY_USERNAME}:${QPAY_PASSWORD}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) throw new Error(`QPay auth failed: ${response.statusText}`)

    const data: QPaYTokenResponse = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return this.accessToken
  }

  async createInvoice(params: {
    amount: number
    description: string
    callbackUrl: string
    senderInvoiceNo?: string
  }): Promise<QPaYInvoiceResponse> {
    const token = await this.authenticate()
    const invoiceNo = params.senderInvoiceNo || nanoid(16)

    const response = await fetch(`${QPAY_BASE_URL}/invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice_code: QPAY_INVOICE_CODE,
        sender_invoice_no: invoiceNo,
        invoice_receiver_code: 'terminal',
        invoice_description: params.description,
        amount: params.amount,
        callback_url: params.callbackUrl,
      }),
    })

    if (!response.ok) throw new Error(`QPay invoice creation failed: ${response.statusText}`)
    return response.json()
  }

  async checkPayment(invoiceId: string): Promise<QPaYCheckResponse> {
    const token = await this.authenticate()

    const response = await fetch(`${QPAY_BASE_URL}/payment/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ object_type: 'INVOICE', object_id: invoiceId }),
    })

    if (!response.ok) throw new Error(`QPay check failed: ${response.statusText}`)
    return response.json()
  }

  async cancelInvoice(invoiceId: string): Promise<void> {
    const token = await this.authenticate()

    await fetch(`${QPAY_BASE_URL}/invoice/${invoiceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
  }
}

export const qpay = new QPaYClient()

export async function createQPayInvoice(params: {
  amount: number
  description: string
  paymentId: string
}) {
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/qpay?paymentId=${params.paymentId}`

  const invoice = await qpay.createInvoice({
    amount: params.amount,
    description: params.description,
    callbackUrl,
    senderInvoiceNo: params.paymentId,
  })

  return {
    invoiceId: invoice.invoice_id,
    qrCode: invoice.qr_image,
    qrText: invoice.qr_text,
    urls: invoice.urls,
  }
}
