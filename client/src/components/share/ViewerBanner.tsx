interface Props {
  title: string;
}

export default function ViewerBanner({ title }: Props) {
  return (
    <div className="bg-neutral-800 border-b border-neutral-700 px-4 py-2 flex items-center gap-3 shrink-0">
      <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
      <span className="text-neutral-300 text-sm">
        Viewing shared annotation: <strong className="text-white">{title}</strong>
      </span>
      <span className="ml-auto text-neutral-500 text-xs">Toggle layers in the panel →</span>
    </div>
  );
}
