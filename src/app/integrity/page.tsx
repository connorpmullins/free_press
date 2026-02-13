export default function IntegrityPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Integrity Standards</h1>
      <p className="text-muted-foreground">
        Our integrity model prioritizes source quality, correction transparency,
        and accountable moderation over engagement incentives.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Source Expectations</h2>
        <p>
          Contributors should provide primary or verifiable sourcing where possible.
          Incomplete sourcing may trigger labels or distribution penalties.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Corrections and Disputes</h2>
        <p>
          We support structured correction workflows and dispute resolution.
          Significant corrections can impact reputation and visibility.
        </p>
      </section>
    </div>
  );
}
