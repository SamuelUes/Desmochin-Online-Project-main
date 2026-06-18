"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { forwardRef, useMemo, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { useForm, useWatch } from "react-hook-form";

import { DEFAULT_PROFILE_IMAGES } from "@/lib/auth/profile-images";
import { getBackendBaseUrl } from "@/lib/backend";
import {
  profileUpdateSchema,
  type ProfileUpdateValues,
} from "@/lib/validations/auth";

type ProfileUser = {
  email: string;
  id: string;
  profileImage: string;
  username: string;
};

type ProfilePanelProps = {
  initialUser: ProfileUser;
};

const stats = [
  { label: "Partidas jugadas", value: "128" },
  { label: "Victorias", value: "78" },
  { label: "Puntos", value: "2,430" },
];

const favoriteGames = [
  { image: "/Image-poker.png", name: "Poker" },
  { image: "/Image-desmoche.png", name: "Desmoche" },
  { image: "/Image-solitario.png", name: "Solitario" },
];

export function ProfilePanel({ initialUser }: ProfilePanelProps) {
  const router = useRouter();
  const normalizedInitialUser = {
    ...initialUser,
    profileImage: normalizeProfileImage(initialUser.profileImage),
  };
  const [user, setUser] = useState(normalizedInitialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    control,
  } = useForm<ProfileUpdateValues>({
    defaultValues: {
      email: normalizedInitialUser.email,
      profileImage: normalizedInitialUser.profileImage,
      username: normalizedInitialUser.username,
    },
    resolver: zodResolver(profileUpdateSchema),
  });

  const watchedValues = useWatch({ control });
  const previewUser = useMemo(
    () =>
      isEditing
        ? {
            ...user,
            email: watchedValues.email || user.email,
            profileImage: watchedValues.profileImage || user.profileImage,
            username: watchedValues.username || user.username,
          }
        : user,
    [isEditing, user, watchedValues],
  );

  async function onSubmit(values: ProfileUpdateValues) {
    setServerError(null);
    setServerMessage(null);

    const response = await fetch(`${getBackendBaseUrl()}/api/auth/me`, {
      body: JSON.stringify(values),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });
    const data = (await response.json().catch(() => null)) as
      | { message?: string; user?: ProfileUser }
      | null;

    if (!response.ok || !data?.user) {
      setServerError(data?.message ?? "No pudimos actualizar el perfil.");
      return;
    }

    const nextUser = {
      ...data.user,
      profileImage: normalizeProfileImage(data.user.profileImage),
    };

    setUser(nextUser);
    reset({
      email: nextUser.email,
      profileImage: nextUser.profileImage,
      username: nextUser.username,
    });
    setIsEditing(false);
    setServerMessage(data.message ?? "Perfil actualizado correctamente.");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-7">
        <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#f7d273]">
          Perfil / cuenta
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-normal text-white sm:text-5xl">
          Tu perfil
        </h1>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.82fr]">
        <div className="rounded-[8px] border border-white/[0.14] bg-white/[0.07] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#f7d273] bg-white shadow-[0_0_32px_rgba(247,184,50,0.18)]">
                <Image
                  alt={`Avatar de ${previewUser.username}`}
                  className="object-cover"
                  fill
                  sizes="96px"
                  src={previewUser.profileImage}
                />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-3xl font-extrabold text-white">
                  {previewUser.username}
                </h2>
                <p className="mt-1 break-all text-sm font-medium text-slate-300">
                  {previewUser.email}
                </p>
                {serverMessage ? (
                  <p className="mt-3 text-sm font-bold text-[#f7d273]">
                    {serverMessage}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[#d99c22] bg-[#f7b832]/10 px-5 text-sm font-extrabold text-[#f7d273] transition hover:-translate-y-0.5 hover:bg-[#f7b832]/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7b832]"
              onClick={() => {
                setServerError(null);
                setServerMessage(null);
                setIsEditing((current) => !current);
              }}
              type="button"
            >
              {isEditing ? "Cerrar edicion" : "Editar datos"}
            </button>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <article
                className="rounded-[8px] border border-white/[0.12] bg-[#090f1b]/70 p-4"
                key={stat.label}
              >
                <p className="text-xs font-semibold text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-white">
                  {stat.value}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-7">
            <h3 className="text-sm font-extrabold text-white">
              Juegos favoritos
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {favoriteGames.map((game) => (
                <article
                  className="rounded-[8px] border border-white/[0.1] bg-white/[0.06] p-3 text-center"
                  key={game.name}
                >
                  <div className="relative mx-auto h-16 w-20">
                    <Image
                      alt={game.name}
                      className="object-contain"
                      fill
                      sizes="80px"
                      src={game.image}
                    />
                  </div>
                  <p className="mt-2 text-xs font-bold text-white">
                    {game.name}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <form
          className={`rounded-[8px] border border-white/[0.14] bg-white/[0.065] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition ${
            isEditing ? "opacity-100" : "opacity-80"
          }`}
          onSubmit={handleSubmit(onSubmit)}
        >
          <h2 className="text-xl font-extrabold text-white">Editar datos</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Cambia tu usuario, correo o avatar y veras la vista previa al
            instante.
          </p>

          <div className="mt-5 space-y-4">
            <ProfileField
              disabled={!isEditing || isSubmitting}
              error={errors.username?.message}
              label="Nombre de usuario"
              {...register("username")}
            />
            <ProfileField
              disabled={!isEditing || isSubmitting}
              error={errors.email?.message}
              label="Correo electronico"
              type="email"
              {...register("email")}
            />

            <fieldset disabled={!isEditing || isSubmitting}>
              <legend className="mb-3 text-sm font-bold text-slate-200">
                Foto de perfil
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_PROFILE_IMAGES.map((image) => (
                  <label
                    className="relative cursor-pointer rounded-[8px] border border-white/[0.12] bg-white/[0.05] p-2 has-[:checked]:border-[#f7d273] has-[:checked]:bg-[#f7b832]/15"
                    key={image}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      value={image}
                      {...register("profileImage")}
                    />
                    <span className="relative block aspect-square overflow-hidden rounded-full bg-white">
                      <Image
                        alt=""
                        className="object-cover"
                        fill
                        sizes="64px"
                        src={image}
                      />
                    </span>
                  </label>
                ))}
              </div>
              {errors.profileImage?.message ? (
                <p className="mt-2 text-xs font-semibold text-red-300">
                  {errors.profileImage.message}
                </p>
              ) : null}
            </fieldset>
          </div>

          {serverError ? (
            <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200">
              {serverError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[8px] border border-[#ffd86a] bg-gradient-to-b from-[#ffe079] to-[#d99c22] px-5 text-sm font-extrabold text-[#130d04] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isEditing || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[8px] border border-white/[0.14] bg-white/[0.06] px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isEditing || isSubmitting}
              onClick={() => {
                reset({
                  email: user.email,
                  profileImage: user.profileImage,
                  username: user.username,
                });
                setIsEditing(false);
                setServerError(null);
              }}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

type ProfileFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
};

const ProfileField = forwardRef<HTMLInputElement, ProfileFieldProps>(
  function ProfileField({ error, label, ...props }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-200">{label}</span>
      <input
        ref={ref}
        className="mt-2 min-h-11 w-full rounded-[8px] border border-white/[0.12] bg-[#050914]/75 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-[#f7d273] disabled:cursor-not-allowed disabled:opacity-60"
        {...props}
      />
      {error ? (
        <span className="mt-2 block text-xs font-semibold text-red-300">
          {error}
        </span>
      ) : null}
    </label>
  );
  },
);

function normalizeProfileImage(value: string): ProfileUpdateValues["profileImage"] {
  return DEFAULT_PROFILE_IMAGES.includes(
    value as ProfileUpdateValues["profileImage"],
  )
    ? (value as ProfileUpdateValues["profileImage"])
    : DEFAULT_PROFILE_IMAGES[0];
}
