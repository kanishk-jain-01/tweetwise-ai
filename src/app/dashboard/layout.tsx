import { authOptions } from '@/lib/auth/auth';
import { Providers } from '@/lib/auth/providers';
import { getServerSession } from 'next-auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <Providers session={session}>
      {children}
    </Providers>
  );
} 