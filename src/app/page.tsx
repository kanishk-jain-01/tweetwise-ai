import AnimateOnScroll from '@/components/ui/animate-on-scroll';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Brain,
    CheckCircle,
    Image as ImageIcon,
    MessageSquare,
    Rocket,
    Shield,
    Sparkles,
    Target,
    Twitter,
    Zap
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Hero Section */}
      <AnimateOnScroll>
        <section className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center py-12 md:py-24 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center max-w-7xl mx-auto">
              <div className="flex flex-col justify-center space-y-8 text-center lg:text-left">
                <div className="space-y-6">
                  {/* Badge */}
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200/50 rounded-full px-4 py-2 text-sm font-medium text-purple-700 mx-auto lg:mx-0 w-fit">
                    <Sparkles className="h-4 w-4" />
                    <span>AI-Powered Tweet Assistant</span>
                  </div>

                  <h1 className="text-5xl font-bold tracking-tight sm:text-6xl xl:text-7xl/none">
                    Craft Perfect 
                    <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Tweets with AI
                    </span>
                  </h1>
                  
                  <p className="max-w-[600px] text-xl text-slate-600 leading-relaxed mx-auto lg:mx-0">
                    Transform your Twitter presence with AI-powered writing assistance, 
                    real-time feedback, and stunning image generation. Write better, engage more.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row justify-center lg:justify-start">
                  <Link href="/auth/register">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3 text-lg"
                    >
                      Start Writing Better Tweets
                      <Rocket className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 px-8 py-3 text-lg"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 justify-center lg:justify-start pt-4">
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-slate-900">90%</div>
                    <div className="text-sm text-slate-600">Error Reduction</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-slate-900">&lt;2s</div>
                    <div className="text-sm text-slate-600">Response Time</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-slate-900">AI</div>
                    <div className="text-sm text-slate-600">Powered</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative group max-w-lg w-full">
                  {/* Enhanced gradient background */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition duration-1000"></div>

                  {/* Tweet image container */}
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden transform transition-all duration-500 group-hover:scale-105">
                    <Image
                      src="/tweet.png"
                      alt="TweetWiseAI dashboard showing AI-powered tweet assistance"
                      width={600}
                      height={400}
                      className="w-full h-auto object-contain"
                      priority
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent pointer-events-none"></div>
                  </div>

                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-2xl text-sm font-medium shadow-xl">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4" />
                      <span>AI Powered</span>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-2xl text-sm font-medium shadow-xl">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Error-Free</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* Features Section */}
      <AnimateOnScroll>
        <section className="py-24 bg-white/50 backdrop-blur-sm">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-6 mb-16">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-blue-200/50 rounded-full px-4 py-2 text-sm font-medium text-blue-700">
                <Target className="h-4 w-4" />
                <span>Powerful Features</span>
              </div>
              
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Everything You Need to 
                <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Master Twitter
                </span>
              </h2>
              
              <p className="max-w-3xl mx-auto text-xl text-slate-600 leading-relaxed">
                From AI-powered writing assistance to stunning image generation, 
                TweetWiseAI provides all the tools you need to create engaging, professional tweets.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
              {/* Feature 1: AI Writing Assistant */}
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">AI Writing Assistant</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Real-time grammar and spell checking powered by GPT-4. 
                    Eliminate errors and improve clarity with intelligent suggestions.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2: Tweet Critique */}
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Tweet Critique</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Get AI-powered analysis of your tweets. Optimize for engagement, 
                    tone, and impact with actionable feedback.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3: AI Image Generation */}
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-200/50 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">AI Image Generation</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Create stunning visuals with DALL-E 3. Choose from Ghibli and 
                    Photo Realistic styles to make your tweets stand out.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4: Twitter Integration */}
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-cyan-50 to-cyan-100/50 hover:from-cyan-100 hover:to-cyan-200/50 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Twitter className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Twitter Integration</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Post directly to Twitter with media upload support. 
                    Seamless integration with your Twitter account.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Features Row */}
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto mt-12">
              {/* Feature 5: Performance */}
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Lightning Fast</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Sub-2-second response times for all AI features. 
                    Optimized for speed without compromising quality.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 6: Security */}
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 to-rose-100/50 hover:from-rose-100 hover:to-rose-200/50 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Secure & Private</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Your data is protected with enterprise-grade security. 
                    Privacy-first approach with encrypted storage.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 7: User Experience */}
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200/50 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Intuitive Design</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Clean, distraction-free interface designed for focus. 
                    Three-panel dashboard for optimal workflow.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

             {/* CTA Section */}
       <AnimateOnScroll>
         <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
           {/* Background pattern */}
           <div className="absolute inset-0 opacity-20">
             <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent bg-[length:60px_60px] bg-[radial-gradient(circle_at_30px_30px,white_2px,transparent_2px)]"></div>
           </div>
          
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-white">
                Ready to Transform Your Twitter Presence?
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
                Join thousands of users who are already creating better tweets with AI assistance. 
                Start your journey to Twitter success today.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row justify-center">
                <Link href="/auth/register">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3 text-lg font-semibold"
                  >
                    Get Started for Free
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>
    </div>
  );
}
