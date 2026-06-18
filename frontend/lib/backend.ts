declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const DEFAULT_BACKEND_URL = 'http://localhost:3000';

export function getBackendBaseUrl() {
  // Use internal URL for server-side, public URL for client-side
  if (typeof window === 'undefined' && process?.env?.BACKEND_INTERNAL_URL) {
    return process.env.BACKEND_INTERNAL_URL.replace(/\/$/, '');
  }
  return (
    process?.env?.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
    DEFAULT_BACKEND_URL
  );
}

export function getBackendSocketUrl() {
  return (
    process?.env?.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, '') ??
    getBackendBaseUrl()
  );
}
