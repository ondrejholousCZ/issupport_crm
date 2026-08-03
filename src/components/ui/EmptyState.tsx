export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}
