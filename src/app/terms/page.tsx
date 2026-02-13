export default function TermsPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">
        Free Press is a platform for integrity-enforced investigative journalism.
        By using this service you agree to use the platform lawfully, avoid abuse,
        and respect contributor and reader rights.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Account Use</h2>
        <p>
          You are responsible for your account activity. We may suspend or remove
          accounts that violate policy, including fraudulent payment behavior,
          coordinated manipulation, harassment, or abuse of moderation workflows.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Content and Integrity</h2>
        <p>
          Contributors are responsible for their published work. Free Press may
          apply labels, request corrections, or remove content based on policy,
          sourcing quality, and moderation outcomes.
        </p>
      </section>
    </div>
  );
}
