import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/patients")({ component: Page });

function Page() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold text-navy capitalize">patients</h1>
      <p className="text-sm text-muted-foreground mb-6">Module coming soon</p>
      <div className="bg-card rounded-2xl shadow-soft p-12 text-center text-muted-foreground">
        The patients module will appear here in a future release.
      </div>
    </div>
  );
}
