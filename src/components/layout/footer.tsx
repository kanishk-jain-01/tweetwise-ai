import { Brain, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/50 bg-white/80 backdrop-blur-sm">
      <div className="container flex flex-col items-center justify-between gap-6 py-12 md:h-32 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-6 md:px-0">
          {/* Brand logo in footer */}
          <div className="flex items-center space-x-3">
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
          </div>
          
          <p className="text-center text-sm leading-loose text-slate-600 md:text-left">
            © {new Date().getFullYear()} TweetWiseAI. Crafting perfect tweets with AI.
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <Link
            href="/#features"
            className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors duration-200"
          >
            Features
          </Link>
          <Link 
            href="/pricing" 
            className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors duration-200"
          >
            Pricing
          </Link>
          <Link 
            href="/privacy" 
            className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors duration-200"
          >
            Privacy
          </Link>
          <Link 
            href="/terms" 
            className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors duration-200"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
