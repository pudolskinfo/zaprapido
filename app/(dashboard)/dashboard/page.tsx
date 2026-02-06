"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const sevenDaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString();
};

type KPI = {
  newLeads: number;
  scheduled: number;
  conversionRate: number;
};

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KPI>({ newLeads: 0, scheduled: 0, conversionRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createBrowserClient();
      const since = sevenDaysAgo();

      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id,status,created_at")
        .gte("created_at", since);

      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id,status,created_at")
        .gte("created_at", since);

      if (leadsError || appointmentsError || !leads || !appointments) {
        setLoading(false);
        return;
      }

      const newLeads = leads.length;
      const scheduled = appointments.filter((appt) => appt.status === "scheduled").length;
      const conversions = leads.filter((lead) => ["DONE", "SCHEDULED"].includes(lead.status)).length;
      const conversionRate = newLeads > 0 ? Math.round((conversions / newLeads) * 100) : 0;

      setKpi({ newLeads, scheduled, conversionRate });
      setLoading(false);
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-slate-600">Indicadores básicos dos últimos 7 dias.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Novos leads", value: kpi.newLeads },
          { label: "Agendados", value: kpi.scheduled },
          { label: "Taxa de conversão", value: `${kpi.conversionRate}%` }
        ].map((item) => (
          <div key={item.label} className="card">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{loading ? "-" : item.value}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold">Atalhos rápidos</h3>
        <p className="mt-1 text-sm text-slate-600">
          Acompanhe os leads e crie agendamentos diretamente nas páginas de Leads e Agenda.
        </p>
      </div>
    </div>
  );
}
