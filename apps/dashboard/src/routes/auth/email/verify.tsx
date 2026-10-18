import { createFileRoute } from "@tanstack/react-router";

import { EmailLink } from "#/components/auth/email-link";
export const Route = createFileRoute("/auth/email/verify")({ component: EmailLink });
