export const AVATARS_BUCKET = "avatars";
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export const AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

const AVATAR_EXTENSIONS: Record<AvatarMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function isSupportedAvatarMimeType(value: string): value is AvatarMimeType {
  return AVATAR_MIME_TYPES.some((mimeType) => mimeType === value);
}

export function validateAvatarFile(file: File) {
  if (!isSupportedAvatarMimeType(file.type)) {
    return "Use somente imagens JPEG, PNG ou WebP.";
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return "A imagem deve possuir no máximo 5 MB.";
  }

  return null;
}

export function createAvatarStoragePath(userId: string, file: File) {
  if (!isSupportedAvatarMimeType(file.type)) {
    throw new Error("Tipo de imagem não suportado.");
  }

  return `${userId}/${crypto.randomUUID()}.${AVATAR_EXTENSIONS[file.type]}`;
}

function getAvatarStoragePath(
  avatarUrl: string,
  supabaseUrl: string,
) {
  try {
    const parsedAvatarUrl = new URL(avatarUrl);
    const parsedSupabaseUrl = new URL(supabaseUrl);
    const supabaseBasePath = parsedSupabaseUrl.pathname.replace(/\/$/, "");
    const publicBucketPath = `${supabaseBasePath}/storage/v1/object/public/${AVATARS_BUCKET}/`;

    if (
      parsedAvatarUrl.origin !== parsedSupabaseUrl.origin ||
      parsedAvatarUrl.search ||
      parsedAvatarUrl.hash ||
      !parsedAvatarUrl.pathname.startsWith(publicBucketPath)
    ) {
      return null;
    }

    const encodedStoragePath = parsedAvatarUrl.pathname.slice(
      publicBucketPath.length,
    );
    const storagePath = decodeURIComponent(encodedStoragePath);
    const pathSegments = storagePath.split("/");

    if (
      pathSegments.length < 2 ||
      pathSegments.some((segment) => !segment) ||
      pathSegments.some(
        (segment) =>
          segment === "." || segment === ".." || segment.includes("\\"),
      )
    ) {
      return null;
    }

    return storagePath;
  } catch {
    return null;
  }
}

export function isAvatarPublicUrl(avatarUrl: string, supabaseUrl: string) {
  return getAvatarStoragePath(avatarUrl, supabaseUrl) !== null;
}

export function getOwnedAvatarStoragePath(
  avatarUrl: string,
  userId: string,
  supabaseUrl: string,
) {
  const storagePath = getAvatarStoragePath(avatarUrl, supabaseUrl);

  if (!storagePath) return null;

  const pathSegments = storagePath.split("/");

  if (pathSegments.length !== 2 || pathSegments[0] !== userId) {
    return null;
  }

  return storagePath;
}
