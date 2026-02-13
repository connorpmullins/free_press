export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">
        We collect only data needed to operate subscriptions, contributor
        verification, moderation, and platform security.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data We Process</h2>
        <p>
          Account email, session metadata, subscription status, moderation actions,
          and limited analytics used for platform operations such as read tracking.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Identity Verification</h2>
        <p>
          Contributor verification is processed through Stripe Identity. Free Press
          stores verification status and external reference IDs required for
          compliance and payout eligibility.
        </p>
      </section>
    </div>
  );
}
