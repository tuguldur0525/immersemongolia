'use client'

// src/app/dashboard/admin/businesses/new/page.tsx
import BusinessEditorForm from '@/components/business/BusinessEditorForm'

export default function AdminNewBusinessPage() {
  return (
    <BusinessEditorForm
      mode="create"
      adminContext
      backHref="/dashboard/admin/businesses"
      successHref="/dashboard/admin/businesses?success=created"
    />
  )
}
