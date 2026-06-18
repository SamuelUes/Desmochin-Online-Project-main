"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";

import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/buttons/submit-button";
import { loginSchema } from "@/lib/validations/auth";
import type { LoginFormValues } from "@/lib/validations/auth";
import { submitLogin } from "@/services/auth";

type SubmitStatus = {
  message: string;
  type: "error" | "success";
};

export function LoginForm() {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    setSubmitStatus(null);

    try {
      const result = await submitLogin(values);
      setSubmitStatus({
        message: result.message,
        type: "success",
      });
      router.push("/");
      router.refresh();
    } catch (error) {
      setSubmitStatus({
        message:
          error instanceof Error
            ? error.message
            : "No pudimos enviar el formulario. Intentalo nuevamente.",
        type: "error",
      });
    }
  };

  return (
    <AuthPageShell>
      <AuthCard>
        <AuthBrand />

        <div className="mt-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-normal text-white">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-slate-300">Bienvenido de nuevo</p>
        </div>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <AuthField
            autoComplete="email"
            error={errors.email?.message}
            id="email"
            label="Correo electrónico"
            placeholder="ejemplo@correo.com"
            type="email"
            {...register("email")}
          />
          <PasswordField
            autoComplete="current-password"
            error={errors.password?.message}
            id="password"
            label="Contraseña"
            placeholder="••••••••••••"
            {...register("password")}
          />

          <div className="text-right">
            <Link
              className="text-xs font-extrabold text-[#f7b832] transition hover:text-[#ffd86a]"
              href="#recuperar"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <SubmitButton disabled={isSubmitting}>
            {isSubmitting ? "Validando..." : "Iniciar sesión"}
          </SubmitButton>

          {submitStatus ? (
            <p
              className={`text-center text-xs font-semibold ${
                submitStatus.type === "success"
                  ? "text-emerald-300"
                  : "text-red-300"
              }`}
              role="status"
            >
              {submitStatus.message}
            </p>
          ) : null}
        </form>

        <p className="mt-12 text-center text-sm text-slate-300">
          ¿No tienes cuenta?{" "}
          <Link
            className="font-extrabold text-[#f7b832] transition hover:text-[#ffd86a]"
            href="/auth/register"
          >
            Regístrate
          </Link>
        </p>
      </AuthCard>
    </AuthPageShell>
  );
}
