'use client'

// src/app/dashboard/business/listings/[id]/edit/page.tsx
import { useParams } from 'next/navigation'
import BusinessEditorForm from '@/components/business/BusinessEditorForm'

export default function EditBusinessPage() {
  const params = useParams<{ id: string }>()

  return (
    <BusinessEditorForm
      mode="edit"
      businessId={params.id}
      backHref="/dashboard/business/listings"
      successHref="/dashboard/business/listings?success=updated"
    />
  )
}
