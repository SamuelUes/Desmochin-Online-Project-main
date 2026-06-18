type CookieLikeStore = {
  getAll(): Array<{
    name: string;
    value: string;
  }>;
};

export function serializeRequestCookies(cookieStore: CookieLikeStore) {
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}
