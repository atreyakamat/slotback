/** The exact customer message, shown as a chat bubble. */
export function MessagePreview({ body, channelLabel }: { body: string; channelLabel: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border bg-surface-raised p-4">
      <p className="mb-2 text-xs font-medium text-muted">{channelLabel} preview</p>
      <div className="max-w-[300px] whitespace-pre-line rounded-2xl rounded-tl-sm border bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm">
        {body}
      </div>
    </div>
  );
}
