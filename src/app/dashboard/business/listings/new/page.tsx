'use client'

// src/app/dashboard/business/listings/new/page.tsx
import BusinessEditorForm from '@/components/business/BusinessEditorForm'

export default function NewBusinessPage() {
  return (
    <BusinessEditorForm
      mode="create"
      backHref="/dashboard/business/listings"
      successHref="/dashboard/business/listings?success=created"
    />
  )
}
