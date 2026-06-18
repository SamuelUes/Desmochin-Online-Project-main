import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField({ error, id, label, ...props }, ref) {
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <label
        className="block text-[11px] font-medium text-slate-300"
        htmlFor={id}
      >
        {label}
        <input
          aria-describedby={errorId}
          aria-invalid={Boolean(error)}
          id={id}
          ref={ref}
          className={`mt-2 h-11 w-full rounded-[8px] border bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:bg-white/[0.055] focus:ring-2 ${
            error
              ? "border-red-400/70 focus:border-red-300 focus:ring-red-400/20"
              : "border-white/14 focus:border-[#f7b832]/70 focus:ring-[#f7b832]/20"
          }`}
          {...props}
        />
        {error ? (
          <span
            className="mt-2 block text-[11px] font-semibold text-red-300"
            id={errorId}
          >
            {error}
          </span>
        ) : null}
      </label>
    );
  },
);
