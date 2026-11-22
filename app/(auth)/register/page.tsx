"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/custom/auth-form";
import { SubmitButton } from "@/components/custom/submit-button";
import { XperienceLogo } from "@/components/custom/xperience-logo";

import { register, RegisterActionState } from "../actions";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: "idle",
    },
  );

  useEffect(() => {
    if (state.status === "user_exists") {
      toast.error(state.message || "Esta conta já existe.");
    } else if (state.status === "failed") {
      toast.error(state.message || "Falha ao criar conta. Tente novamente.");
    } else if (state.status === "invalid_data") {
      toast.error(state.message || "Por favor, verifique os dados informados.");
    } else if (state.status === "success") {
      toast.success("Conta criada com sucesso!");
      router.push("/");
      router.refresh();
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-8 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-3 px-4 text-center sm:px-16">
          <Link href="/" className="mb-2">
            <XperienceLogo width={160} height={44} />
          </Link>
          <h3 className="text-xl font-semibold dark:text-zinc-50">Criar Conta</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Crie sua conta informando seu e-mail e uma senha
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton>Criar Conta</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Já tem uma conta? "}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Entrar
            </Link>
            {" agora."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
