import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { sendWhatsAppMessage, verifySignature } from "@/lib/whatsapp";

export const runtime = "nodejs";

const messageSchema = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional()
});

const webhookSchema = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          value: z.object({
            metadata: z.object({
              phone_number_id: z.string()
            }),
            contacts: z
              .array(
                z.object({
                  wa_id: z.string(),
                  profile: z.object({ name: z.string().optional() }).optional()
                })
              )
              .optional(),
            messages: z.array(messageSchema).optional()
          })
        })
      )
    })
  )
});

const serviceMap: Record<string, string> = {
  "1": "Limpeza",
  "2": "Instalação",
  "3": "Manutenção"
};

const urgencyMap: Record<string, string> = {
  "1": "Hoje",
  "2": "Essa semana",
  "3": "Sem pressa"
};

function initialMenuMessage() {
  return "Olá! 👋 Sou o assistente da ZapRápido. Escolha uma opção:\n1 - Limpeza\n2 - Instalação\n3 - Manutenção";
}

function askNeighborhoodMessage() {
  return "Perfeito! Qual o bairro para o atendimento?";
}

function askUrgencyMessage() {
  return "E a urgência?\n1 - Hoje\n2 - Essa semana\n3 - Sem pressa";
}

function qualifiedMessage() {
  return "Obrigado! Já registrei seu pedido. Um especialista vai te atender em instantes.";
}

function shouldHandoff(body: string) {
  const text = body.toLowerCase();
  return text.includes("desconto") || text.includes("valor");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const env = getServerEnv();

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Unauthorized", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let parsed: z.infer<typeof webhookSchema>;
  try {
    parsed = webhookSchema.parse(JSON.parse(rawBody));
  } catch (error) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const change = parsed.entry[0]?.changes[0];
  const value = change?.value;
  const message = value?.messages?.[0];
  if (!value || !message || !message.text?.body) {
    return NextResponse.json({ status: "ignored" });
  }

  const phoneNumberId = value.metadata.phone_number_id;
  const supabase = createServerClient();

  const { data: channel } = await supabase
    .from("tenant_channels")
    .select("tenant_id")
    .eq("phone_number_id", phoneNumberId)
    .single();

  if (!channel) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
  }

  const contact = value.contacts?.[0];
  const phone = contact?.wa_id ?? message.from;
  const name = contact?.profile?.name ?? null;

  const { data: leadExisting } = await supabase
    .from("leads")
    .select("*")
    .eq("tenant_id", channel.tenant_id)
    .eq("phone", phone)
    .single();

  const lead =
    leadExisting ??
    (
      await supabase
        .from("leads")
        .insert({
          tenant_id: channel.tenant_id,
          name,
          phone,
          status: "NEW",
          handoff_human: false
        })
        .select("*")
        .single()
    ).data;

  if (!lead) {
    return NextResponse.json({ error: "Falha ao criar lead" }, { status: 500 });
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
          tenant_id: channel.tenant_id,
          lead_id: lead.id,
          wa_conversation_id: message.id,
          last_message_at: new Date().toISOString()
        })
        .select("*")
        .single()
    ).data;

  if (!conversation) {
    return NextResponse.json({ error: "Falha ao criar conversa" }, { status: 500 });
  }

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversation.id);

  await supabase.from("messages").insert({
    tenant_id: channel.tenant_id,
    conversation_id: conversation.id,
    direction: "inbound",
    body: message.text.body,
    wa_message_id: message.id
  });

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);

  const textBody = message.text.body.trim();
  const isFirstMessage = (count ?? 0) === 0;
  let updatedLead = lead;
  let responseMessage: string | null = null;
  let handoff = lead.handoff_human || shouldHandoff(textBody);

  if (!lead.service_type) {
    if (/^[1-3]$/.test(textBody)) {
      updatedLead = {
        ...lead,
        service_type: serviceMap[textBody]
      };
      responseMessage = askNeighborhoodMessage();
    } else if (isFirstMessage) {
      responseMessage = initialMenuMessage();
    } else {
      handoff = true;
      responseMessage = qualifiedMessage();
    }
  } else if (!lead.neighborhood) {
    updatedLead = {
      ...lead,
      neighborhood: textBody
    };
    responseMessage = askUrgencyMessage();
  } else if (!lead.urgency) {
    if (/^[1-3]$/.test(textBody)) {
      updatedLead = {
        ...lead,
        urgency: urgencyMap[textBody],
        status: "QUALIFIED"
      };
      responseMessage = qualifiedMessage();
    } else {
      handoff = true;
      responseMessage = qualifiedMessage();
    }
  }

  if (handoff && responseMessage !== qualifiedMessage()) {
    responseMessage = qualifiedMessage();
  }

  const updates: Record<string, unknown> = {
    handoff_human: handoff,
    updated_at: new Date().toISOString()
  };
  if (updatedLead.service_type) updates.service_type = updatedLead.service_type;
  if (updatedLead.neighborhood) updates.neighborhood = updatedLead.neighborhood;
  if (updatedLead.urgency) updates.urgency = updatedLead.urgency;
  if (updatedLead.status) updates.status = updatedLead.status;

  await supabase.from("leads").update(updates).eq("id", lead.id);

  if (responseMessage) {
    await sendWhatsAppMessage(phoneNumberId, phone, responseMessage);
    await supabase.from("messages").insert({
      tenant_id: channel.tenant_id,
      conversation_id: conversation.id,
      direction: "outbound",
      body: responseMessage,
      wa_message_id: null
    });
  }

  return NextResponse.json({ status: "ok" });
}
