import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const runtime = "nodejs";

const payloadSchema = z.object({
  tenantId: z.string().uuid(),
  to: z.string().min(6),
  body: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const supabase = createServerClient();

    const { data: channel } = await supabase
      .from("tenant_channels")
      .select("id, phone_number_id")
      .eq("tenant_id", payload.tenantId)
      .single();

    if (!channel) {
      return NextResponse.json({ error: "Canal não configurado." }, { status: 404 });
    }

    const { data: leadExisting } = await supabase
      .from("leads")
      .select("*")
      .eq("tenant_id", payload.tenantId)
      .eq("phone", payload.to)
      .single();

    const lead =
      leadExisting ??
      (
        await supabase
          .from("leads")
          .insert({
            tenant_id: payload.tenantId,
            phone: payload.to,
            status: "NEW",
            handoff_human: true
          })
          .select("*")
          .single()
      ).data;

    if (!lead) {
      return NextResponse.json({ error: "Erro ao criar lead." }, { status: 500 });
    }

    const { data: conversationExisting } = await supabase
      .from("conversations")
      .select("*")
      .eq("lead_id", lead.id)
      .single();

    const conversation =
      conversationExisting ??
      (
        await supabase
          .from("conversations")
          .insert({
            tenant_id: payload.tenantId,
            lead_id: lead.id,
            wa_conversation_id: null,
            last_message_at: new Date().toISOString()
          })
          .select("*")
          .single()
      ).data;

    if (!conversation) {
      return NextResponse.json({ error: "Erro ao criar conversa." }, { status: 500 });
    }

    await sendWhatsAppMessage(channel.phone_number_id, payload.to, payload.body);

    await supabase.from("messages").insert({
      tenant_id: payload.tenantId,
      conversation_id: conversation.id,
      direction: "outbound",
      body: payload.body,
      wa_message_id: null
    });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    return NextResponse.json({ status: "sent" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
