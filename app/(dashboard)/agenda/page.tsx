"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Appointment } from "@/lib/types";

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .order("start_at", { ascending: true })
        .limit(50);
      setAppointments((data as Appointment[]) ?? []);
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Agenda</h2>
        <p className="text-sm text-slate-600">Visão diária e semanal simplificada.</p>
      </div>
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="card">Sem agendamentos no momento.</div>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="card flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Lead: {appointment.lead_id}</p>
                <p className="text-xs text-slate-500">
                  {new Date(appointment.start_at).toLocaleString("pt-BR")}
                  {appointment.end_at ? ` - ${new Date(appointment.end_at).toLocaleString("pt-BR")}` : ""}
                </p>
              </div>
              <span className="badge bg-emerald-100 text-emerald-700">{appointment.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
