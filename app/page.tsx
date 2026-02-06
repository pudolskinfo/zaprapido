import Link from "next/link";
import { Button, SecondaryButton } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">ZapRápido</p>
          <h1 className="text-3xl font-semibold">Automação WhatsApp para prestadores de serviço</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <SecondaryButton>Entrar</SecondaryButton>
          </Link>
          <Link href="/signup">
            <Button>Criar conta</Button>
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Multi-tenant pronto",
            description: "Cada empresa com seu próprio funil e dados isolados via RLS."
          },
          {
            title: "Bot híbrido",
            description: "Menu inicial automático e handoff humano inteligente."
          },
          {
            title: "Painel operacional",
            description: "Kanban, agenda e KPIs essenciais em um só lugar."
          }
        ].map((item) => (
          <div key={item.title} className="card">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
