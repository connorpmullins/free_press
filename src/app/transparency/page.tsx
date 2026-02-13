export default function TransparencyPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Transparency</h1>
      <p className="text-muted-foreground">
        Free Press publishes moderation and integrity decisions with clear rationale
        and auditability.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Labeling and Corrections</h2>
        <p>
          Integrity labels and corrections are applied based on documented policy,
          source completeness, and dispute outcomes. We preserve correction history.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Moderation Actions</h2>
        <p>
          Flags, disputes, and administrative actions are logged for accountability.
          Appeals and review pathways are available where applicable.
        </p>
      </section>
    </div>
  );
}
