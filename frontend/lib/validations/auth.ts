import { z } from "zod";

import { DEFAULT_PROFILE_IMAGES } from "@/lib/auth/profile-images";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo electronico es obligatorio.")
    .email("Ingresa un correo electronico valido."),
  password: z
    .string()
    .min(1, "La contrasena es obligatoria.")
    .min(8, "La contrasena debe tener al menos 8 caracteres."),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "El usuario debe tener al menos 3 caracteres.")
      .max(24, "El usuario no puede superar 24 caracteres.")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Usa solo letras, numeros y guion bajo.",
      ),
    email: z
      .string()
      .trim()
      .min(1, "El correo electronico es obligatorio.")
      .email("Ingresa un correo electronico valido."),
    password: z
      .string()
      .min(8, "La contrasena debe tener al menos 8 caracteres.")
      .regex(/[A-Za-z]/, "La contrasena debe incluir una letra.")
      .regex(/[0-9]/, "La contrasena debe incluir un numero."),
    confirmPassword: z.string().min(1, "Confirma tu contrasena."),
    terms: z.boolean().refine((value) => value, {
      message: "Debes aceptar los terminos y condiciones.",
    }),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Las contrasenas no coinciden.",
        path: ["confirmPassword"],
      });
    }
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const profileUpdateSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo electronico es obligatorio.")
    .email("Ingresa un correo electronico valido."),
  profileImage: z.enum(DEFAULT_PROFILE_IMAGES),
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .max(24, "El usuario no puede superar 24 caracteres.")
    .regex(/^[a-zA-Z0-9_]+$/, "Usa solo letras, numeros y guion bajo."),
});

export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
