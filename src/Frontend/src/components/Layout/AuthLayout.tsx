import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="h-screen w-screen overflow-hidden flex antialiased bg-canvas">
      {children}
    </div>
  );
};
