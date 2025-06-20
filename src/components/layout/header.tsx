import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">TweetWiseAI</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/#features">Features</Link>
            <Link href="/#testimonials">Testimonials</Link>
            <Link href="/pricing">Pricing</Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="grid gap-4 py-6">
                  <Link href="/" className="flex items-center space-x-2">
                    <span className="font-bold">TweetWiseAI</span>
                  </Link>
                  <Link href="/#features" className="flex w-full items-center py-2 text-lg font-semibold">
                    Features
                  </Link>
                  <Link href="/#testimonials" className="flex w-full items-center py-2 text-lg font-semibold">
                    Testimonials
                  </Link>
                  <Link href="/pricing" className="flex w-full items-center py-2 text-lg font-semibold">
                    Pricing
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
} 