import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/analytics-v3", replace: true });
  },
  component: LandingRedirect,
});

function LandingRedirect() {
  return null;
}
