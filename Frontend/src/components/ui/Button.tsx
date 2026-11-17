import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'default' | 'primary' | 'link'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  full?: boolean
}

export function Button({
  variant = 'default',
  full = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [
    variant === 'primary' ? 'primary' : '',
    variant === 'link' ? 'link' : '',
    full ? 'full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <button type={type} className={classes} {...props} />
}
