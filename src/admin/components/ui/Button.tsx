import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva('nogna-ui-button', {
  variants: {
    variant: {
      default: 'nogna-ui-button-default',
      secondary: 'nogna-ui-button-secondary',
      destructive: 'nogna-ui-button-destructive',
      ghost: 'nogna-ui-button-ghost',
    },
    size: {
      default: 'nogna-ui-button-md',
      sm: 'nogna-ui-button-sm',
      lg: 'nogna-ui-button-lg',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';
