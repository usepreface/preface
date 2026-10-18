import { createFileRoute } from "@tanstack/react-router";

import { CreateOrganization } from "#/components/organization/create-organization";
export const Route = createFileRoute("/organizations/new")({ component: CreateOrganization });
