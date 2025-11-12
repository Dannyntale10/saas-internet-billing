import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-95',
          'min-h-[44px] sm:min-h-0', // Mobile-friendly tap targets
          {
            'bg-brand-green text-white hover:bg-brand-green/90 shadow-lg hover:shadow-xl btn-glow': variant === 'default' || variant === 'gradient',
            'bg-gradient-to-r from-brand-green to-green-500 text-white hover:from-brand-green/90 hover:to-green-500/90 shadow-lg hover:shadow-xl btn-glow': variant === 'gradient',
            'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent': variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl': variant === 'destructive',
            'h-9 px-3 text-sm sm:h-9': size === 'sm',
            'h-10 px-4 py-2 sm:h-10': size === 'md',
            'h-12 px-8 text-lg sm:h-12': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }

