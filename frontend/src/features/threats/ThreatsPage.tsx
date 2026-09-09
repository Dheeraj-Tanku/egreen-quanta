import { PageHeader, ModulePlaceholder } from "@/components/ui";

export function ThreatsPage() {
  return (
    <>
      <PageHeader
        title="Threats & Incidents"
        description="Rule-based + ML detections over signature events, correlated into incidents; triage board and detail."
      />
      <ModulePlaceholder module="Module 3" feature="Alert feed & incident board" />
    </>
  );
}
