import AnimateOnScroll from '@/components/ui/animate-on-scroll';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <AnimateOnScroll>
      <section className="min-h-[calc(100vh-3.5rem)] w-full flex items-center justify-center py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center max-w-6xl mx-auto">
            <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Craft Perfect Tweets with AI
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0">
                  TweetWiseAI helps you write engaging, error-free tweets. Get
                  real-time feedback, grammar checks, and curation assistance to
                  elevate your Twitter game.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row justify-center lg:justify-start">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full min-[400px]:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full min-[400px]:w-auto"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative group max-w-lg w-full">
                {/* Gradient background for glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                {/* Tweet image container */}
                <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden transform transition-all duration-300 group-hover:scale-105">
                  <Image
                    src="/tweet.png"
                    alt="Example tweet showing TweetWiseAI in action"
                    width={600}
                    height={400}
                    className="w-full h-auto object-contain"
                    priority
                  />

                  {/* Subtle overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                </div>

                {/* Floating badge */}
                <div className="absolute -top-3 -right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                  AI Powered ✨
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AnimateOnScroll>
  );
}
