import { PageHeader, ModulePlaceholder } from "@/components/ui";

export function AuditPage() {
  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Append-only, hash-chained record of every state change. Verify chain integrity and export a signed range."
      />
      <ModulePlaceholder module="Module 6" feature="Tamper-evident audit trail" />
    </>
  );
}
