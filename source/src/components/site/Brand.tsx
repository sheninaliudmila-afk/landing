export function BrandMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M2 26V16h5v10H2Zm9 0V9h5v17h-5Zm9 0V2h5v24h-5Z" fill="currentColor" />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="flex items-center gap-2.5 text-[1.05rem] font-extrabold tracking-tight">
      <BrandMark className="size-6 text-primary" />
      <span>
        FIN<span className="text-muted-foreground">CONSULT</span>
      </span>
    </span>
  );
}
