import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by TweetWiseAI. © {new Date().getFullYear()} All Rights
            Reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/#features"
            className="text-sm font-medium hover:underline"
          >
            Features
          </Link>
          <Link href="/pricing" className="text-sm font-medium hover:underline">
            Pricing
          </Link>
          <Link href="/privacy" className="text-sm font-medium hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm font-medium hover:underline">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
