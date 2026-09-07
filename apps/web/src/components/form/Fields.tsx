import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="form-error" role="alert">
      {message}
    </p>
  );
}

export function Input({
  label,
  error,
  hint,
  id,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? props.name;
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} aria-invalid={Boolean(error)} {...props} />
      {hint && !error ? <span className="muted">{hint}</span> : null}
      <FormError message={error} />
    </div>
  );
}

export function PasswordInput(props: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} type="password" autoComplete={props.autoComplete ?? 'current-password'} />;
}

export function Textarea({
  label,
  error,
  id,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id ?? props.name;
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <textarea id={inputId} rows={5} aria-invalid={Boolean(error)} {...props} />
      <FormError message={error} />
    </div>
  );
}

export function Select({
  label,
  error,
  id,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const inputId = id ?? props.name;
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <select id={inputId} aria-invalid={Boolean(error)} {...props}>
        {children}
      </select>
      <FormError message={error} />
    </div>
  );
}

export function FileUpload({
  label,
  error,
  id,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} id={id} label={label} error={error} type="file" />;
}

export function Button({
  children,
  loading,
  variant = 'primary',
  ...props
}: {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn btn-${variant}`} disabled={loading || props.disabled} {...props}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}
