"use client";

import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";

import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: string;
  label: string;
};

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ error, id, label, ...props }, ref) {
    const [isVisible, setIsVisible] = useState(false);
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <label
        className="block text-[11px] font-medium text-slate-300"
        htmlFor={id}
      >
        {label}
        <span
          className={`mt-2 flex h-11 items-center rounded-[8px] border bg-white/[0.035] transition focus-within:bg-white/[0.055] focus-within:ring-2 ${
            error
              ? "border-red-400/70 focus-within:border-red-300 focus-within:ring-red-400/20"
              : "border-white/14 focus-within:border-[#f7b832]/70 focus-within:ring-[#f7b832]/20"
          }`}
        >
          <input
            aria-describedby={errorId}
            aria-invalid={Boolean(error)}
            id={id}
            ref={ref}
            type={isVisible ? "text" : "password"}
            className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-slate-500"
            {...props}
          />
          <button
            aria-label={isVisible ? "Ocultar contrasena" : "Mostrar contrasena"}
            className="flex h-full w-11 items-center justify-center text-slate-400 transition hover:text-[#f7b832] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7b832]"
            onClick={() => setIsVisible((current) => !current)}
            type="button"
          >
            {isVisible ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </span>
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
