import type { OrganizationMetadata, UserMetadata } from "@usepreface/protocol";

export const mergeOrganizationMetadata = (
  current: OrganizationMetadata,
  patch?: { readonly name?: string; readonly description?: string | null },
): OrganizationMetadata => {
  const { description, ...rest } = current;
  const nextDescription = patch?.description === undefined ? description : patch.description;
  return {
    ...rest,
    name: patch?.name ?? current.name,
    ...(nextDescription === null || nextDescription === undefined
      ? {}
      : { description: nextDescription }),
  };
};
export const mergeUserMetadata = (
  current: UserMetadata,
  patch: { readonly name?: string; readonly title?: string | null; readonly bio?: string | null },
): UserMetadata => {
  const { title, bio, ...rest } = current;
  const nextTitle = patch.title === undefined ? title : patch.title;
  const nextBio = patch.bio === undefined ? bio : patch.bio;
  return {
    ...rest,
    name: patch.name ?? current.name,
    ...(nextTitle === null || nextTitle === undefined ? {} : { title: nextTitle }),
    ...(nextBio === null || nextBio === undefined ? {} : { bio: nextBio }),
  };
};
