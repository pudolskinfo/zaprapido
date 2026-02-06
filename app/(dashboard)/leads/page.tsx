"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { Lead, LeadStatus } from "@/lib/types";

const columns: LeadStatus[] = [
  "NEW",
  "QUALIFIED",
  "SCHEDULED",
  "IN_PROGRESS",
  "DONE",
  "LOST"
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false });
      setLeads((data as Lead[]) ?? []);
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Leads</h2>
        <p className="text-sm text-slate-600">Kanban operacional com status do funil.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-6">
        {columns.map((status) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">{status}</h3>
              <span className="badge bg-slate-200 text-slate-600">
                {leads.filter((lead) => lead.status === status).length}
              </span>
            </div>
            <div className="space-y-3">
              {leads
                .filter((lead) => lead.status === status)
                .map((lead) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`} className="block">
                    <div className="card">
                      <p className="text-sm font-semibold text-slate-800">{lead.name ?? "Lead"}</p>
                      <p className="text-xs text-slate-500">{lead.phone}</p>
                      <p className="mt-2 text-xs text-slate-600">
                        {lead.service_type ?? "Serviço pendente"}
                      </p>
                    </div>
                  </Link>
                ))}
              {leads.filter((lead) => lead.status === status).length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-slate-400">
                  Sem leads
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
