type IconProps = {
  className?: string;
};

export function SpadeIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C8.1 6 5 8.9 5 12.3c0 2.5 1.8 4.2 4.2 4.2 1.1 0 2.1-.4 2.8-1.1-.3 2.2-1.2 3.7-2.7 4.6V22h5.4v-2c-1.5-.9-2.4-2.4-2.7-4.6.7.7 1.7 1.1 2.8 1.1 2.4 0 4.2-1.7 4.2-4.2C19 8.9 15.9 6 12 2Z" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M16 20v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M20 20v-2.2a3.5 3.5 0 0 0-2.6-3.4" />
      <path d="M17 2.4a4 4 0 0 1 0 7.2" />
    </svg>
  );
}

export function ChipIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v5" />
      <path d="M12 16v5" />
      <path d="m4.2 7.5 4.3 2.5" />
      <path d="m15.5 14 4.3 2.5" />
      <path d="m4.2 16.5 4.3-2.5" />
      <path d="m15.5 10 4.3-2.5" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2.2 4.8 5.1v5.7c0 4.6 2.9 8.8 7.2 10.5 4.3-1.7 7.2-5.9 7.2-10.5V5.1L12 2.2Zm3.7 8.4-4.4 4.7a1 1 0 0 1-.7.3 1 1 0 0 1-.7-.3l-2-2.1 1.4-1.4 1.3 1.3 3.7-4 1.4 1.5Z" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M2.5 12s3.4-6.2 9.5-6.2 9.5 6.2 9.5 6.2-3.4 6.2-9.5 6.2S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 5.9c.5-.1.9-.1 1.4-.1 6.1 0 9.5 6.2 9.5 6.2a17 17 0 0 1-2.5 3.2" />
      <path d="M6.1 7.2A17.4 17.4 0 0 0 2.5 12s3.4 6.2 9.5 6.2c1.5 0 2.8-.4 4-1" />
      <path d="M9.9 9.9a2.8 2.8 0 0 0 4 4" />
    </svg>
  );
}

export function GoogleIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.4 3-7.2Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6c.8-2.3 3-4.1 5.6-4.1Z"
      />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.3 18v-5.4h1.8l.3-2.1h-2.1V9.2c0-.6.2-1 1.1-1h1.1V6.3c-.2 0-.9-.1-1.7-.1-1.7 0-2.9 1-2.9 2.8v1.5H9v2.1h1.9V18h2.4Z"
      />
    </svg>
  );
}
