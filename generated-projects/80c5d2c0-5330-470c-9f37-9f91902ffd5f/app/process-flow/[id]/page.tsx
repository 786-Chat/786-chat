import { ProcessFlowDetailView } from "@/components/process-flow-detail-view";

export default function ProcessFlowDetailPage({ params }: { params: { id: string } }) {
  return <ProcessFlowDetailView id={params.id} />;
}