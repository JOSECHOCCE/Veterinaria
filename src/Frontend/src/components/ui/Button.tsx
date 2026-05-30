import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'tertiary-text';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, style, ...props }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-body)',
    fontSize: '15px',
    fontWeight: 500,
    lineHeight: '1.0',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-on-primary)',
      borderRadius: 'var(--rounded-pill)',
      padding: '10px 20px',
      height: '40px',
      border: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-ink)',
      borderRadius: 'var(--rounded-pill)',
      padding: '9px 19px',
      height: '40px',
      border: '1px solid var(--color-hairline-strong)',
    },
    'tertiary-text': {
      backgroundColor: 'transparent',
      color: 'var(--color-ink)',
      border: 'none',
      padding: 0,
    }
  };

  return (
    <button style={{ ...baseStyle, ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  );
}
