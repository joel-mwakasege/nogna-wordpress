import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function PageHeader({ eyebrow, title, actions, className }: { eyebrow?: string; title: string; actions?: ReactNode; className?: string }) {
  return <header className={cn('nogna-ui-page-header', className)}><div>{eyebrow && <p>{eyebrow}</p>}<h1>{title}</h1></div>{actions && <div className="nogna-ui-page-actions">{actions}</div>}</header>;
}
