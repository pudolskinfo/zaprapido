"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { createBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      setError("Não foi possível criar usuário.");
      return;
    }

    const response = await fetch("/api/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tenantName, email })
    });

    if (!response.ok) {
      const payload = await response.json();
      setLoading(false);
      setError(payload.error ?? "Falha ao provisionar tenant.");
      return;
    }

    setLoading(false);
    window.location.href = "/dashboard";
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="text-sm text-slate-600">Configure sua empresa rapidamente.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSignup}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Empresa</label>
          <Input value={tenantName} onChange={(e) => setTenantName(e.target.value)} required />
        </div>
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
          {loading ? "Criando..." : "Criar conta"}
        </Button>
      </form>
      <p className="text-sm text-slate-600">
        Já tem conta?{" "}
        <Link className="font-semibold text-slate-900" href="/login">
          Entrar
        </Link>
      </p>
    </div>
  );
}
