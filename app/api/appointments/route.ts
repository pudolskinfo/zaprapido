import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const appointmentSchema = z.object({
  tenantId: z.string().uuid(),
  leadId: z.string().uuid(),
  startAt: z.string(),
  endAt: z.string().optional(),
  status: z.string().default("scheduled"),
  notes: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = appointmentSchema.parse(await request.json());
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        tenant_id: payload.tenantId,
        lead_id: payload.leadId,
        start_at: payload.startAt,
        end_at: payload.endAt ?? null,
        status: payload.status,
        notes: payload.notes ?? null
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
