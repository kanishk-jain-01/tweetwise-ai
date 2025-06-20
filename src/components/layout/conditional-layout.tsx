'use client';

import { usePathname } from 'next/navigation';
import Footer from './footer';
import Header from './header';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export const ConditionalLayout = ({ children }: ConditionalLayoutProps) => {
  const pathname = usePathname();
  
  // Check if we're on a dashboard page
  const isDashboardPage = pathname?.startsWith('/dashboard');

  if (isDashboardPage) {
    // Dashboard pages: no header/footer, full screen
    return <>{children}</>;
  }

  // Regular pages: include header and footer
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}; 