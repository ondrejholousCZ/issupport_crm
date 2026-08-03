"use client";

export function CasInput({ defaultValue = "0" }: { defaultValue?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">Čas (hodiny)</span>
      <input
        type="text"
        name="cas"
        defaultValue={defaultValue}
        placeholder="např. 2:30 nebo 3"
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <span className="block text-xs text-gray-500 mt-1">
        Formát 2:30 = 2 h 30 min, nebo celé hodiny (3)
      </span>
    </label>
  );
}
