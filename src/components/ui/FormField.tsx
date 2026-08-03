export function FormField({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  children,
  hint,
  ...inputProps
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  children?: React.ReactNode;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue">) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">
        {label}
        {required ? <span className="text-red-500 ml-0.5">*</span> : null}
      </span>
      {children ?? (
        <input
          type={type}
          name={name}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          {...inputProps}
        />
      )}
      {hint ? <span className="block text-xs text-gray-500 mt-1">{hint}</span> : null}
    </label>
  );
}

export function FormSelect({
  label,
  name,
  required,
  defaultValue,
  options,
  onChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  options: { value: string; label: string }[];
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <FormField label={label} name={name} required={required}>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        onChange={onChange}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export function FormTextarea({
  label,
  name,
  required,
  defaultValue,
  rows = 4,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <FormField label={label} name={name} required={required}>
      <textarea
        name={name}
        required={required}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </FormField>
  );
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}
