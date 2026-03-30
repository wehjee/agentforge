import RunDetailPage from "./_client";

export function generateStaticParams() {
  return [{ id: "_", runId: "_" }];
}

export default function Page() {
  return <RunDetailPage />;
}
