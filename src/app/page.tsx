import AnimateOnScroll from '@/components/ui/animate-on-scroll';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <AnimateOnScroll>
        <section id="hero" className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Craft Perfect Tweets with AI
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    TweetWiseAI helps you write engaging, error-free tweets. Get
                    real-time feedback, grammar checks, and curation assistance
                    to elevate your Twitter game.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/auth/register">
                    <Button size="lg">Get Started</Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" size="lg">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Example Tweet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Just used TweetWiseAI to draft my latest thread. The
                      grammar check is a lifesaver, and the critique feature
                      gave me some great ideas to improve engagement. Highly
                      recommended! #AI #Twitter #WritingTool
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted-foreground px-3 py-1 text-sm text-background">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Elevate Your Tweets
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our AI-powered tools provide you with everything you need to
                  write compelling and error-free tweets that capture attention
                  and drive engagement.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16">
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Grammar & Spell Check</h3>
                <p className="text-sm text-muted-foreground">
                  Write with confidence. Our real-time checker catches errors
                  and suggests corrections instantly, ensuring your tweets are
                  professional and clear.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Tweet Critique</h3>
                <p className="text-sm text-muted-foreground">
                  Go beyond grammar. Get AI-powered feedback on your tweet&apos;s
                  tone, clarity, and potential engagement to maximize its
                  impact.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Content Curation</h3>
                <p className="text-sm text-muted-foreground">
                  Never run out of ideas. Our curation assistant helps you find
                  relevant topics and generate engaging content based on your
                  interests.
                </p>
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                What Our Users Are Saying
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Trusted by content creators, marketers, and professionals.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        Jane Doe
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Content Creator
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 text-sm">
                  <p>
                    &ldquo;TweetWiseAI has been a game-changer for my content
                    workflow. The critique feature is like having a personal
                    writing coach.&rdquo;
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        Sarah Miller
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Marketing Manager
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 text-sm">
                  <p>
                    &ldquo;I&apos;ve saved so much time and improved the quality of my
                    tweets immensely. The grammar checker is top-notch!&rdquo;
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>MJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        Mark Johnson
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Indie Hacker
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 text-sm">
                  <p>
                    &ldquo;The best tool for anyone serious about their Twitter
                    presence. The AI suggestions are incredibly insightful.&rdquo;
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </AnimateOnScroll>
    </>
  );
}
