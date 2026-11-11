import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="status" className={cn('nogna-ui-alert', className)} {...props} />;
}
