import { ToolDetailView } from "@/components/tools/tool-detail-view";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <ToolDetailView toolId={params.id} />;
}
