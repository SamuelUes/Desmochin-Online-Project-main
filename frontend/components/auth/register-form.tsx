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
import { registerSchema } from "@/lib/validations/auth";
import type { RegisterFormValues } from "@/lib/validations/auth";
import { submitRegister } from "@/services/auth";

type SubmitStatus = {
  message: string;
  type: "error" | "success";
};

export function RegisterForm() {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      password: "",
      terms: false,
      username: "",
    },
    mode: "onTouched",
    resolver: zodResolver(registerSchema),
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    setSubmitStatus(null);

    try {
      const result = await submitRegister(values);
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
            Crear cuenta
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Únete y empieza a jugar
          </p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <AuthField
            autoComplete="username"
            error={errors.username?.message}
            id="username"
            label="Nombre de usuario"
            placeholder="Elige un usuario"
            type="text"
            {...register("username")}
          />
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
            autoComplete="new-password"
            error={errors.password?.message}
            id="password"
            label="Contraseña"
            placeholder="••••••••••••"
            {...register("password")}
          />
          <PasswordField
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            id="confirm-password"
            label="Confirmar contraseña"
            placeholder="••••••••••••"
            {...register("confirmPassword")}
          />

          <label className="flex items-start gap-3 pt-1 text-xs leading-5 text-slate-200">
            <input
              aria-describedby={errors.terms ? "terms-error" : undefined}
              aria-invalid={Boolean(errors.terms)}
              className="mt-0.5 h-4 w-4 shrink-0 appearance-none rounded-[4px] border border-white/35 bg-transparent transition checked:border-[#f7b832] checked:bg-[#f7b832] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7b832]"
              type="checkbox"
              {...register("terms")}
            />
            <span>
              Acepto los{" "}
              <Link
                className="font-semibold text-white transition hover:text-[#f7b832]"
                href="#terminos"
              >
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link
                className="font-semibold text-white transition hover:text-[#f7b832]"
                href="#privacidad"
              >
                Política de Privacidad
              </Link>
            </span>
          </label>
          {errors.terms ? (
            <p
              className="-mt-2 pl-7 text-[11px] font-semibold text-red-300"
              id="terms-error"
            >
              {errors.terms.message}
            </p>
          ) : null}

          <SubmitButton className="mt-3" disabled={isSubmitting}>
            {isSubmitting ? "Validando..." : "Registrarse"}
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
          ¿Ya tienes cuenta?{" "}
          <Link
            className="font-extrabold text-[#f7b832] transition hover:text-[#ffd86a]"
            href="/auth/login"
          >
            Inicia sesión
          </Link>
        </p>
      </AuthCard>
    </AuthPageShell>
  );
}
