import type {
  LoginFormValues,
  RegisterFormValues,
} from "@/lib/validations/auth";
import { getBackendBaseUrl } from "@/lib/backend";

type AuthSubmitResult = {
  message: string;
  ok: true;
  user: {
    email: string;
    id: string;
    profileImage: string;
    username: string;
  };
};

async function postAuth<TBody>(endpoint: string, body: TBody) {
  const response = await fetch(`${getBackendBaseUrl()}${endpoint}`, {
    body: JSON.stringify(body),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const data = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "No pudimos procesar la solicitud.");
  }

  return data as AuthSubmitResult;
}

export async function submitLogin(values: LoginFormValues) {
  return postAuth<LoginFormValues>("/api/auth/login", values);
}

export async function submitRegister(
  values: RegisterFormValues,
) {
  return postAuth<RegisterFormValues>("/api/auth/register", values);
}
