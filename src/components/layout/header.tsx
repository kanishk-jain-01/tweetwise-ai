import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Brain, Menu, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-3 group transition-all duration-300">
            {/* AI Icon with gradient background */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 p-2 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </div>
            
            {/* Brand name with gradient text */}
            <div className="flex items-center space-x-1">
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                TweetWise
              </span>
              <span className="font-bold text-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                AI
              </span>
              <Sparkles className="h-4 w-4 text-purple-500 ml-1" />
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-purple-50">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-white/95 backdrop-blur-md">
                <div className="grid gap-4 py-6">
                  <Link href="/" className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 p-2 rounded-lg">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        TweetWise
                      </span>
                      <span className="font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                        AI
                      </span>
                      <Sparkles className="h-3 w-3 text-purple-500" />
                    </div>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <nav className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              asChild 
              className="hover:bg-purple-50 hover:text-purple-700 transition-colors"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button 
              asChild 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
