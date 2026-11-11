import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function FormField({ label, help, children, className }: { label: string; help?: string; children: ReactNode; className?: string }) {
  return <label className={cn('nogna-ui-form-field', className)}><span>{label}</span>{children}{help && <small>{help}</small>}</label>;
}
