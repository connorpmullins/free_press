import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  BarChart3,
  FileCheck,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 md:py-32 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Platform, not publisher
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Journalism with
            <br />
            <span className="text-primary">integrity built in</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A subscription-based platform where independent journalists publish
            first-hand investigative reporting. Revenue flows to journalists, not
            the platform. Integrity is enforced through reputation, not editorial
            control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/feed">
              <Button size="lg" className="gap-2">
                Read the Feed
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/apply">
              <Button size="lg" variant="outline">
                Become a Contributor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background rounded-lg p-6 border">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Verified journalists publish</h3>
              <p className="text-sm text-muted-foreground">
                Contributors verify their identity and publish first-hand
                investigative reporting with required source citations.
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 border">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Integrity is enforced</h3>
              <p className="text-sm text-muted-foreground">
                Reputation scoring, source requirements, and distribution
                controls ensure quality without editorial interference.
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 border">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Revenue goes to reporters</h3>
              <p className="text-sm text-muted-foreground">
                85% of subscription revenue flows directly to journalists,
                weighted by readership and integrity track record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Our principles
          </h2>
          <div className="space-y-4">
            {[
              {
                title: "Truth is a process, not a badge",
                description:
                  'We use "supported," "disputed," and "insufficient sourcing" - never "verified true." Process language is defensible and honest.',
              },
              {
                title: "Verification is publication",
                description:
                  "Any account that publicly validates a claim assumes the same responsibility and consequences as if it had published the claim itself.",
              },
              {
                title: "Identity where it matters",
                description:
                  "Readers can be pseudonymous. Revenue-earning contributors must be verified humans. Bans have real consequences.",
              },
              {
                title: "Incentives over intentions",
                description:
                  "Revenue, distribution, and reputation are tied to demonstrated integrity. Good intentions don't survive scale - incentives do.",
              },
              {
                title: "Everything is auditable",
                description:
                  "Every claim, edit, and action is attributable, versioned, and reversible. No silent memory-holing.",
              },
            ].map((principle) => (
              <div
                key={principle.title}
                className="flex gap-4 p-4 rounded-lg border"
              >
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">{principle.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {principle.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Support real journalism
          </h2>
          <p className="text-muted-foreground mb-8">
            Subscribe for $5/month or $50/year. Your subscription directly funds
            independent investigative reporting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/subscribe">
              <Button size="lg">
                <Users className="h-4 w-4 mr-2" />
                Subscribe Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
