import { createFileRoute, Navigate } from "@tanstack/react-router";

// Legacy login route — the login UI has been replaced by the landing experience
// with an inline auth modal. Authentication itself is unchanged.
export const Route = createFileRoute("/login")({
  component: () => <Navigate to="/" replace />,
});
