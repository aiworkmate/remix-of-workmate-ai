import { createFileRoute, Navigate } from "@tanstack/react-router";

// Legacy signup route — replaced by the landing experience with an inline auth modal.
export const Route = createFileRoute("/signup")({
  component: () => <Navigate to="/" replace />,
});
