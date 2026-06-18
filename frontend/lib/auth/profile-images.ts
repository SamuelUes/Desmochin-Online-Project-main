export const DEFAULT_PROFILE_IMAGES = [
  "/Profile 1.png",
  "/Profile 2.png",
  "/Profile 3.png",
  "/Profile 4.png",
] as const;

export function getDefaultProfileImage(seed: string) {
  const normalizedSeed = seed.trim().toLowerCase() || "condega";
  const total = Array.from(normalizedSeed).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return DEFAULT_PROFILE_IMAGES[total % DEFAULT_PROFILE_IMAGES.length];
}

export function getProfileImageOrDefault(
  profileImage: string | null | undefined,
  seed: string,
) {
  if (
    profileImage &&
    DEFAULT_PROFILE_IMAGES.includes(
      profileImage as (typeof DEFAULT_PROFILE_IMAGES)[number],
    )
  ) {
    return profileImage;
  }

  return getDefaultProfileImage(seed);
}
