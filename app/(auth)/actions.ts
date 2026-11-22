"use server";

import { z } from "zod";

import { createUser, getUser } from "@/db/queries";

import { signIn } from "./auth";

const authFormSchema = z.object({
  email: z.string().email("Por favor, insira um endereço de e-mail válido."),
  password: z
    .string()
    .min(6, "A senha deve conter no mínimo 6 caracteres."),
});

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  message?: string;
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]?.message;
      return {
        status: "invalid_data",
        message: firstIssue || "Dados informados são inválidos.",
      };
    }

    console.error("LOGIN ACTION ERROR:", error);
    return {
      status: "failed",
      message: "E-mail ou senha incorretos.",
    };
  }
};

export interface RegisterActionState {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
  message?: string;
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    let [user] = await getUser(validatedData.email);

    if (user) {
      return {
        status: "user_exists",
        message: "Já existe uma conta cadastrada com este e-mail.",
      };
    } else {
      await createUser(validatedData.email, validatedData.password);
      await signIn("credentials", {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      return { status: "success" };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]?.message;
      return {
        status: "invalid_data",
        message: firstIssue || "Dados informados são inválidos.",
      };
    }

    console.error("REGISTER ACTION ERROR:", error);
    return {
      status: "failed",
      message: "Ocorreu um erro ao criar a conta. Tente novamente mais tarde.",
    };
  }
};
