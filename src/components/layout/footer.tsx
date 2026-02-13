import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-3">Free Press</h3>
            <p className="text-sm text-muted-foreground">
              Integrity-enforced investigative journalism platform.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-sm">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/feed" className="hover:text-foreground">
                  Feed
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-foreground">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="hover:text-foreground">
                  Feature Requests
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-sm">For Journalists</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/apply" className="hover:text-foreground">
                  Become a Contributor
                </Link>
              </li>
              <li>
                <Link href="/integrity" className="hover:text-foreground">
                  Integrity Standards
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/transparency" className="hover:text-foreground">
                  Transparency
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Free Press. AGPL-3.0 Licensed.
          </p>
          <p className="text-xs text-muted-foreground">
            We are a platform, not a publisher. Content is authored by verified journalists.
          </p>
        </div>
      </div>
    </footer>
  );
}
