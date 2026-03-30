import { KBDetailView } from "@/components/knowledge/kb-detail-view";

export default function KBDetailPage({ params }: { params: { id: string } }) {
  return <KBDetailView kbId={params.id} />;
}
