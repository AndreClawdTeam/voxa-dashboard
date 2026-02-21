import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldProps extends ComponentProps<typeof Input> {
  name: string;
  label: string;
  errors?: Record<string, string[]> | null;
}

export function FormField({ name, label, errors, ...inputProps }: FormFieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const fieldErrors = errors?.[name];
  const hasError = fieldErrors !== undefined && fieldErrors.length > 0;

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        aria-describedby={hasError ? errorId : undefined}
        aria-invalid={hasError || undefined}
        {...inputProps}
      />
      {hasError && fieldErrors && (
        <p id={errorId} className="text-sm text-destructive">
          {fieldErrors[0]}
        </p>
      )}
    </div>
  );
}
