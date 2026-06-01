import prisma from '@/lib/supabase/prisma'

export async function approveBusiness(
  businessId: string,
  adminId: string,
  action: 'approve' | 'reject',
  reason?: string
) {
  if (action === 'approve') {
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: null,
      },
    })

    if (business.ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: business.ownerId } })
      if (owner) {
        const { sendBusinessApprovedEmail } = await import('@/lib/email')
        sendBusinessApprovedEmail(owner.email, business.nameMn, business.slug).catch(
          console.error
        )
      }
    }

    return { success: true, data: business }
  }

  const business = await prisma.business.update({
    where: { id: businessId },
    data: {
      status: 'PENDING_REVIEW',
      rejectionReason: reason || 'Нэмэлт шалтгаан заагдаагүй',
    },
  })
  return { success: true, data: business }
}
