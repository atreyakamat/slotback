import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { ImportForm } from "@/components/waitlist/import-form";
import { requireRole } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Import clients" };

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import clients to your waitlist"
        description="Bring in the regulars who'd take an earlier slot. Clients already on file are matched by phone, never duplicated."
        actions={
          <Link href="/app/waitlist" className="text-sm text-accent underline underline-offset-4">
            Back to waitlist
          </Link>
        }
      />
      <Suspense fallback={null}>
        <Gate />
      </Suspense>
    </>
  );
}

async function Gate() {
  await requireRole("OWNER", "ADMIN");
  return (
    <div className="max-w-2xl">
      <ImportForm />
    </div>
  );
}
