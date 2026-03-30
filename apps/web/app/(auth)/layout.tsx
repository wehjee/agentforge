export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warmWhite">
      <div className="w-full max-w-[400px] px-6">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sage-500">
            <span className="text-[14px] font-bold text-white">AF</span>
          </div>
          <h1 className="font-display text-[22px] font-medium tracking-tight text-slate-900">
            AgentForge
          </h1>
          <p className="mt-1.5 text-[13px] text-slate-400">
            AI Agent Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
