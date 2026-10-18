import { createContext, useContext } from "react";

import type { OrganizationDetail } from "@usepreface/protocol/dto";

import * as atoms from "#/atoms/organizations";

import { toMutation } from "./mutation";
import { toQuery } from "./query";

export const OrganizationContext = createContext<OrganizationDetail | null>(null);
export function useOrganization() {
  const detail = useContext(OrganizationContext);
  if (!detail) throw new Error("Organization context is missing");
  return detail;
}
export const useOrganizations = toQuery(atoms.organizationsAtom);
export const useOrganizationDetail = toQuery(atoms.organizationAtom);
export const useMembers = toQuery(atoms.membersAtom);
export const useTeams = toQuery(atoms.teamsAtom);
export const useConnections = toQuery(atoms.connectionsAtom);
export const useDomains = toQuery(atoms.domainsAtom);
export const usePolicy = toQuery(atoms.policyAtom);
export const useMethods = toQuery(atoms.methodsAtom);
export const useReadiness = toQuery(atoms.readinessAtom);
export const useRecovery = toQuery(atoms.recoveryAtom);
export const useConnection = toQuery(atoms.connectionAtom);
export const useCreateOrganization = toMutation(atoms.createOrganizationMutation);
export const useUpdateOrganization = toMutation(atoms.updateOrganizationMutation);
export const useArchiveOrganization = toMutation(atoms.archiveOrganizationMutation);
export const useRestoreOrganization = toMutation(atoms.restoreOrganizationMutation);
export const useLeaveOrganization = toMutation(atoms.leaveOrganizationMutation);
