'use client'

// src/app/dashboard/admin/businesses/[id]/edit/page.tsx
import { useParams } from 'next/navigation'
import BusinessEditorForm from '@/components/business/BusinessEditorForm'

export default function AdminEditBusinessPage() {
  const params = useParams<{ id: string }>()

  return (
    <BusinessEditorForm
      mode="edit"
      businessId={params.id}
      adminContext
      backHref="/dashboard/admin/businesses"
      successHref="/dashboard/admin/businesses?success=updated"
    />
  )
}
