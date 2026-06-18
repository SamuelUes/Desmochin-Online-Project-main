import { getBackendBaseUrl } from "@/lib/backend";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

type AuthUser = {
  email: string;
  id: string;
  profileImage: string;
  username: string;
};

export async function getCurrentAuthUser(cookieHeader = "") {
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);

  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  const response = await fetch(`${getBackendBaseUrl()}/api/auth/me`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json().catch(() => null)) as
    | { user?: AuthUser }
    | null;

  return data?.user ?? null;
}
