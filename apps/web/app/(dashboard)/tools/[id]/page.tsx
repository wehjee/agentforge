import { ToolDetailView } from "@/components/tools/tool-detail-view";

export default function ToolDetailPage({ params }: { params: { id: string } }) {
  return <ToolDetailView toolId={params.id} />;
}
