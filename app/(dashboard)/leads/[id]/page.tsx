"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Input, Textarea } from "@/components/ui";
import { createBrowserClient } from "@/lib/supabase/client";
import { Lead, Message } from "@/lib/types";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [outbound, setOutbound] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createBrowserClient();
      const { data: leadData } = await supabase.from("leads").select("*").eq("id", params.id).single();
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("lead_id", params.id)
        .single();
      const { data: messageData } = conversation
        ? await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: false })
        : { data: [] };

      setLead((leadData as Lead) ?? null);
      setMessages((messageData as Message[]) ?? []);
      setLoading(false);
    };

    load();
  }, [params.id]);

  async function handleHandoff() {
    if (!lead) return;
    const supabase = createBrowserClient();
    await supabase.from("leads").update({ handoff_human: true }).eq("id", lead.id);
    setLead({ ...lead, handoff_human: true });
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead || !outbound.trim()) return;

    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: lead.tenant_id,
        to: lead.phone,
        body: outbound
      })
    });

    if (response.ok) {
      setOutbound("");
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando...</p>;
  }

  if (!lead) {
    return <p className="text-sm text-slate-500">Lead não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{lead.name ?? "Lead"}</h2>
          <p className="text-sm text-slate-600">{lead.phone}</p>
        </div>
        <Button onClick={handleHandoff} disabled={lead.handoff_human}>
          {lead.handoff_human ? "Em atendimento humano" : "Assumir conversa"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="card space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Detalhes</h3>
            <p className="text-sm">Bairro: {lead.neighborhood ?? "Pendente"}</p>
            <p className="text-sm">Serviço: {lead.service_type ?? "Pendente"}</p>
            <p className="text-sm">Urgência: {lead.urgency ?? "Pendente"}</p>
            <p className="text-sm">Status: {lead.status}</p>
          </div>
          <div className="card space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Notas rápidas</h3>
            <Textarea placeholder="Anotações do time" rows={4} disabled value="" />
          </div>
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Histórico de mensagens</h3>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500">Sem mensagens ainda.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.direction === "outbound"
                        ? "rounded-lg bg-slate-900 p-3 text-sm text-white"
                        : "rounded-lg bg-slate-100 p-3 text-sm text-slate-700"
                    }
                  >
                    <p>{message.body}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {new Date(message.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Enviar mensagem</h3>
            <form onSubmit={handleSend} className="space-y-3">
              <Input
                placeholder="Digite uma mensagem..."
                value={outbound}
                onChange={(event) => setOutbound(event.target.value)}
              />
              <Button type="submit">Enviar</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
