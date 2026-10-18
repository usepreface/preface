import { placeholder } from "#/lib/placeholder";

/** Where an organization lives, as shown in the UI (no scheme). */
export function organizationUrl(slug: string): string {
  return `${placeholder.instance.host}/org/${slug}`;
}

/** The prefix drawn before slug inputs. */
export const organizationUrlPrefix = `${placeholder.instance.host}/org/`;

/** A full https URL on this instance, for values people paste into an identity provider. */
export function instanceUrl(path: string): string {
  return `https://${placeholder.instance.host}${path}`;
}
