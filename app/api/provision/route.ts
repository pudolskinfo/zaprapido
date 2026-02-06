import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  userId: z.string().uuid(),
  tenantName: z.string().min(2),
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const supabase = createServerClient();

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({ name: payload.tenantName })
      .select("id")
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: tenantError?.message ?? "Erro ao criar tenant." }, { status: 500 });
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: payload.userId,
      tenant_id: tenant.id,
      email: payload.email,
      role: "owner"
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ tenantId: tenant.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
