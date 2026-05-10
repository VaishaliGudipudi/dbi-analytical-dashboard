import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/reports")({ component: Page });

function Page() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold text-navy capitalize">reports</h1>
      <p className="text-sm text-muted-foreground mb-6">Module coming soon</p>
      <div className="bg-card rounded-2xl shadow-soft p-12 text-center text-muted-foreground">
        The reports module will appear here in a future release.
      </div>
    </div>
  );
}
