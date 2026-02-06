"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-sm text-slate-600">Acesse o painel ZapRápido.</p>
      </div>
      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Senha</label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="text-sm text-slate-600">
        Ainda não tem conta?{" "}
        <Link className="font-semibold text-slate-900" href="/signup">
          Criar agora
        </Link>
      </p>
    </div>
  );
}
