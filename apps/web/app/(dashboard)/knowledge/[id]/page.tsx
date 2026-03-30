import { KBDetailView } from "@/components/knowledge/kb-detail-view";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <KBDetailView kbId={params.id} />;
}
