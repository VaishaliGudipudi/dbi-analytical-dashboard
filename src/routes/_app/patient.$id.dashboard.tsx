import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeAlert,
  BedDouble,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  HeartPulse,
  Pill,
  Phone,
  ShieldAlert,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAuth } from "@/lib/auth";
import { buildPatientOverview, defaultOverviewTabFor } from "@/lib/careOverview";
import { getEdSnapshot } from "@/lib/edApi";
import { triageMeta } from "@/lib/edTypes";

export const Route = createFileRoute("/_app/patient/$id/dashboard")({
  loader: async ({ params }) => {
    const snapshot = await getEdSnapshot();
    return {
      patient: snapshot.patients.find((item) => item.id === params.id) ?? snapshot.patients[0],
    };
  },
  component: PatientDashboardPage,
});

type DashboardTab = "doctor" | "nurse" | "patient";

const tabMeta: Record<DashboardTab, { label: string; note: string }> = {
  doctor: { label: "Doctor View", note: "Clinical story, trajectory, pathway compliance, and disposition." },
  nurse: { label: "Nurse View", note: "Action-oriented care plan with due tasks, MAR, and bedside priorities." },
  patient: { label: "Patient View", note: "Simple journey view, next steps, medicines, and reassurance." },
};

function PatientDashboardPage() {
  const { patient } = Route.useLoaderData();
  const { user } = useAuth();
  const overview = useMemo(() => buildPatientOverview(patient), [patient]);
  const [tab, setTab] = useState<DashboardTab>(defaultOverviewTabFor(user?.role ?? "doctor"));

  const latestVitals = overview.vitalsTimeline[overview.vitalsTimeline.length - 1];
  const statusMix = [
    { label: "Pending", value: overview.investigations.filter((item) => item.status === "Pending").length, fill: "var(--amber-emerg)" },
    { label: "Ready", value: overview.investigations.filter((item) => item.status === "Ready").length, fill: "var(--coral)" },
    { label: "Reviewed", value: overview.investigations.filter((item) => item.status === "Reviewed").length, fill: "var(--navy)" },
  ];

  return (
    <div className="mx-auto max-w-[1650px] px-6 py-5">
      <div className="mb-5 rounded-[1.75rem] bg-navy px-5 py-5 text-navy-foreground shadow-soft-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/patients" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{overview.patient.name}</h1>
                <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: triageMeta[overview.patient.triage].color }}>
                  {overview.identity.triageLabel}
                </span>
                {overview.identity.mlc ? (
                  <span className="rounded-full bg-red-500/90 px-3 py-1 text-[11px] font-bold text-white">MLC</span>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/75">
                <span>{overview.patient.umr}</span>
                <span className="text-white/35">•</span>
                <span>
                  {overview.patient.age > 0 ? `${overview.patient.age}y` : "Age pending"} / {overview.patient.sex}
                </span>
                <span className="text-white/35">•</span>
                <span>{overview.identity.pathwayLabel}</span>
                <span className="text-white/35">•</span>
                <span>{overview.patient.bed}</span>
                <span className="text-white/35">•</span>
                <span>{overview.arrivalElapsed} since arrival</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/patient/$id/workspace" params={{ id: overview.patient.id }} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20">
              Open Workspace
            </Link>
            <StatusPill label={overview.identity.insurance} tone="steady" />
            <StatusPill label={overview.identity.language} tone="attention" />
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1.4fr_0.95fr]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Identity & Triage Snapshot</div>
              <div className="mt-1 text-lg font-bold text-navy">Single-patient command center</div>
            </div>
            <div className="rounded-2xl bg-secondary/45 px-4 py-2 text-right">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Current Disposition</div>
              <div className="mt-1 text-sm font-bold text-navy">{overview.disposition.current}</div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <IdentityTile title="Attendant" value={overview.identity.attendant.present ? overview.identity.attendant.name : "Not available"} note={overview.identity.attendant.present ? overview.identity.attendant.phone : "No family registered"} icon={<Phone className="h-4 w-4" />} />
            <IdentityTile title="Latest MEWS" value={String(latestVitals.mews)} note={overview.vitalsAlert ? `Vitals overdue: ${overview.lastVitalsDue}` : `Next vitals ${overview.lastVitalsDue}`} icon={<HeartPulse className="h-4 w-4" />} tone={overview.vitalsAlert ? "critical" : "steady"} />
            <IdentityTile title="Doctor / Nurse" value={`${overview.careTeam.doctor} / ${overview.careTeam.nurse}`} note="Primary care team on shift" icon={<UserRound className="h-4 w-4" />} />
            <IdentityTile title="Coverage" value={overview.patientFacing.billing.coverage} note={`Estimate ${overview.patientFacing.billing.estimate}`} icon={<Wallet className="h-4 w-4" />} />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Quick Context</div>
          <div className="mt-2 text-lg font-bold text-navy">{overview.complaints.chiefComplaint}</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{overview.complaints.patientWords}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniBadgeGroup title="Past History" items={overview.complaints.pastHistory} />
            <MiniBadgeGroup title="Current Medications" items={overview.complaints.currentMedications} />
            <MiniBadgeGroup title="Allergies" items={overview.complaints.allergies.length ? overview.complaints.allergies : ["No documented allergies"]} danger={overview.complaints.allergies.length > 0} />
            <MiniBadgeGroup title="Social History" items={[overview.complaints.socialHistory]} />
          </div>
        </section>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 rounded-2xl bg-secondary/35 p-1.5">
        {(Object.keys(tabMeta) as DashboardTab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === key ? "bg-card text-navy shadow-soft" : "text-muted-foreground hover:text-navy"}`}
          >
            {tabMeta[key].label}
          </button>
        ))}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">{tabMeta[tab].note}</p>

      {tab === "doctor" ? <DoctorView overview={overview} statusMix={statusMix} /> : null}
      {tab === "nurse" ? <NurseView overview={overview} /> : null}
      {tab === "patient" ? <PatientView overview={overview} /> : null}
    </div>
  );
}

function DoctorView({
  overview,
  statusMix,
}: {
  overview: ReturnType<typeof buildPatientOverview>;
  statusMix: { label: string; value: number; fill: string }[];
}) {
  const trendData = overview.vitalsTimeline.map((point) => ({
    at: point.at,
    mews: point.mews,
    hr: point.hr,
    spo2: point.spo2,
  }));

  return (
    <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
      <div className="space-y-5">
        <DashboardSection title="Chief Complaint & History" icon={<ClipboardCheck className="h-4 w-4" />}>
          <div className="grid gap-4 lg:grid-cols-2">
            <NarrativeCard label="Presenting complaint" body={overview.complaints.patientWords} />
            <NarrativeCard label="History of present illness" body={overview.complaints.hpi} />
            <NarrativeCard label="Relevant surgical / immunisation" body={`${overview.complaints.surgicalHistory}\n${overview.complaints.immunization}`} />
            <NarrativeCard label="Working diagnosis" body={`${overview.assessment.workingDiagnosis}\nDifferentials: ${overview.assessment.differentials.join(", ")}`} />
          </div>
        </DashboardSection>

        <DashboardSection title="Vitals Timeline" icon={<TrendingUp className="h-4 w-4" />}>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <CompactKpi title="Latest BP" value={`${overview.vitalsTimeline.at(-1)?.sbp}/${overview.vitalsTimeline.at(-1)?.dbp}`} note={overview.vitalsAlert ? "Needs closer monitoring" : "Stable trend"} tone={overview.vitalsAlert ? "critical" : "steady"} />
            <CompactKpi title="Latest HR" value={`${overview.vitalsTimeline.at(-1)?.hr}/min`} note="Compared with prior set" />
            <CompactKpi title="Latest SpO₂" value={`${overview.vitalsTimeline.at(-1)?.spo2}%`} note={overview.vitalsTimeline.at(-1)!.spo2 < 92 ? "Below target" : "Within target"} tone={overview.vitalsTimeline.at(-1)!.spo2 < 92 ? "critical" : "steady"} />
            <CompactKpi title="Last recorded" value={overview.vitalsTimeline.at(-1)?.at ?? "Now"} note={overview.lastVitalsDue} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-bold text-navy">Trajectory view</div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${overview.vitalsAlert ? "bg-red-100 text-red-700" : "bg-mint text-navy"}`}>
                  {overview.vitalsAlert ? "Vitals follow-up overdue" : "Vitals on track"}
                </span>
              </div>
              <ChartContainer
                config={{
                  mews: { label: "MEWS", color: "var(--coral)" },
                  hr: { label: "Heart Rate", color: "var(--navy)" },
                  spo2: { label: "SpO₂", color: "var(--amber-emerg)" },
                }}
                className="h-[260px] w-full"
              >
                <LineChart data={trendData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="at" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={34} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="mews" stroke="var(--color-mews)" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="hr" stroke="var(--color-hr)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="spo2" stroke="var(--color-spo2)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="mb-3 text-sm font-bold text-navy">Recorded vital sets</div>
              <div className="space-y-3">
                {overview.vitalsTimeline.map((point) => (
                  <div key={point.at} className="rounded-2xl border border-border bg-secondary/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-semibold text-navy">{point.at}</div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${point.mews >= 5 ? "bg-red-100 text-red-700" : point.mews >= 3 ? "bg-amber-100 text-amber-800" : "bg-mint text-navy"}`}>
                        MEWS {point.mews}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>BP {point.sbp}/{point.dbp}</span>
                      <span>HR {point.hr}/min</span>
                      <span>RR {point.rr}/min</span>
                      <span>SpO₂ {point.spo2}%</span>
                      <span>Temp {point.temp}°C</span>
                      <span>Pain {point.pain}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Investigations" icon={<FlaskConical className="h-4 w-4" />}>
          <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="mb-3 text-sm font-bold text-navy">Pending / Ready / Reviewed</div>
              <ChartContainer
                config={{
                  Pending: { label: "Pending", color: "var(--amber-emerg)" },
                  Ready: { label: "Ready", color: "var(--coral)" },
                  Reviewed: { label: "Reviewed", color: "var(--navy)" },
                }}
                className="h-[220px] w-full"
              >
                <PieChart>
                  <Pie data={statusMix} dataKey="value" nameKey="label" innerRadius={46} outerRadius={76} paddingAngle={4} />
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="label" />} />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="space-y-3">
              {overview.investigations.map((item) => (
                <div key={item.name} className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-navy">{item.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.plainLabel}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.status === "Pending" ? "bg-amber-100 text-amber-800" : item.status === "Ready" ? "bg-coral/15 text-coral" : "bg-mint text-navy"}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                    <span className={item.abnormal ? "font-semibold text-red-600" : "text-navy"}>{item.value}</span>
                    <span>Normal: {item.range}</span>
                    <span>TAT {item.tat}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{item.note}</div>
                </div>
              ))}
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Medications & Treatment Given" icon={<Pill className="h-4 w-4" />}>
          <div className="grid gap-3 lg:grid-cols-2">
            {overview.medications.map((item) => (
              <div key={`${item.name}-${item.at}`} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-navy">{item.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.dose} • {item.route} • {item.at}
                    </div>
                  </div>
                  {item.overdue ? <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700">Dose watch</span> : null}
                </div>
                <div className="mt-3 text-sm text-navy">{item.purpose}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.protocolNote ? <span className="rounded-full bg-secondary/45 px-2.5 py-1">{item.protocolNote}</span> : null}
                  {item.nextDue ? <span className="rounded-full bg-secondary/45 px-2.5 py-1">Next: {item.nextDue}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="space-y-5">
        <DashboardSection title="Clinical Assessment & Diagnosis" icon={<Activity className="h-4 w-4" />}>
          <div className="space-y-3">
            <NarrativeCard label="Initial assessment" body={overview.assessment.initialNote} />
            <NarrativeCard label="Care plan" body={overview.assessment.carePlan} />
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-sm font-bold text-navy">Specialist consultations</div>
              <div className="mt-3 space-y-3">
                {overview.assessment.consultations.map((consult) => (
                  <div key={consult.specialty} className="rounded-2xl border border-border bg-secondary/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-navy">{consult.specialty}</div>
                      <span className="text-xs text-muted-foreground">Requested {consult.requestedAt}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{consult.response}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Disposition Plan" icon={<BedDouble className="h-4 w-4" />}>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoLine label="Current status" value={overview.disposition.current} />
              <InfoLine label="Location / destination" value={overview.disposition.location} />
              <InfoLine label="Estimated time" value={overview.disposition.estimated} />
              <InfoLine label="Follow-up" value={overview.disposition.followUp ?? overview.disposition.reason ?? "Pending final decision"} />
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Protocol Compliance Checklist" icon={<CheckCircle2 className="h-4 w-4" />}>
          <div className="space-y-3">
            {overview.checklist.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full ${item.complete ? "bg-mint text-navy" : "bg-red-100 text-red-700"}`}>
                    {item.complete ? "✓" : "!"}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-navy">{item.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}

function NurseView({ overview }: { overview: ReturnType<typeof buildPatientOverview> }) {
  const latestVitals = overview.vitalsTimeline.at(-1)!;
  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.9fr]">
      <div className="space-y-5">
        <DashboardSection title="Task List" icon={<ClipboardCheck className="h-4 w-4" />}>
          <div className="space-y-3">
            {overview.nurseTasks.map((task) => (
              <div key={task.title} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-navy">{task.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{task.details}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${task.status === "Due now" ? "bg-red-100 text-red-700" : task.status === "Due soon" ? "bg-amber-100 text-amber-800" : "bg-mint text-navy"}`}>
                    {task.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Due {task.due}</span>
                  <button type="button" className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95">
                    {task.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection title="Medication Administration Record" icon={<Pill className="h-4 w-4" />}>
          <div className="space-y-3">
            {overview.medications.map((medication) => (
              <div key={`${medication.name}-${medication.at}`} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-navy">{medication.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {medication.dose} • {medication.route} • given {medication.at}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-semibold text-navy">{medication.nextDue ?? "No repeat due"}</div>
                    <div className={medication.overdue ? "mt-1 font-bold text-red-600" : "mt-1 text-muted-foreground"}>
                      {medication.overdue ? "Overdue / confirm administration" : "Administration current"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-navy">{medication.purpose}</div>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="space-y-5">
        <DashboardSection title="Current Patient Status" icon={<HeartPulse className="h-4 w-4" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <CompactKpi title="Latest vitals" value={`${latestVitals.sbp}/${latestVitals.dbp}`} note={`HR ${latestVitals.hr} • SpO₂ ${latestVitals.spo2}%`} tone={latestVitals.spo2 < 92 ? "critical" : "steady"} />
            <CompactKpi title="MEWS" value={String(latestVitals.mews)} note={latestVitals.mews >= 5 ? "Escalate to doctor" : "Continue current observation"} tone={latestVitals.mews >= 5 ? "critical" : "steady"} />
            <CompactKpi title="Pain score" value={overview.nursingStatus.latestPain} note="Latest nursing assessment" />
            <CompactKpi title="Consciousness" value={overview.nursingStatus.consciousness} note={`Fall risk ${overview.nursingStatus.fallRisk}`} />
          </div>
        </DashboardSection>

        <DashboardSection title="Patient Communication & Family" icon={<Phone className="h-4 w-4" />}>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="space-y-3 text-sm">
              <InfoLine label="Attendant" value={overview.identity.attendant.present ? overview.identity.attendant.name : "No attendant"} />
              <InfoLine label="Phone" value={overview.identity.attendant.phone} />
              <InfoLine label="Language" value={overview.identity.language} />
              <InfoLine label="Consent status" value="ER consent signed, blood consent pending if transfusion required" />
              <InfoLine label="Patient emotional state" value={overview.patient.triage === 1 ? "Anxious / distressed" : "Cooperative with reassurance"} />
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Isolation / Infection Control" icon={<ShieldAlert className="h-4 w-4" />}>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-start gap-3">
              <BadgeAlert className="mt-0.5 h-5 w-5 text-coral" />
              <div>
                <div className="text-sm font-bold text-navy">{overview.isolation.flag}</div>
                <div className="mt-1 text-xs text-muted-foreground">PPE required: {overview.isolation.ppe}</div>
              </div>
            </div>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}

function PatientView({ overview }: { overview: ReturnType<typeof buildPatientOverview> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.95fr]">
      <div className="space-y-5">
        <DashboardSection title="Where Am I In My Journey" icon={<CalendarClock className="h-4 w-4" />}>
          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {overview.journey.map((step) => (
                <div key={step.label} className={`rounded-2xl border px-4 py-4 ${step.active ? "border-coral bg-coral/10" : step.done ? "border-mint bg-mint/35" : "border-border bg-secondary/15"}`}>
                  <div className="text-sm font-bold text-navy">{step.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {step.done ? "Completed" : step.active ? `In progress${step.eta ? ` • approx ${step.eta}` : ""}` : "Pending"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="My Waiting Time & Next Step" icon={<Activity className="h-4 w-4" />}>
          <div className="grid gap-3 md:grid-cols-3">
            <CompactKpi title="Time since arrival" value={overview.patientFacing.waitTime} note="You are still in the active ER process" />
            <CompactKpi title="Patients ahead" value={String(overview.patientFacing.aheadCount)} note="Only if the next step is queued" />
            <CompactKpi title="Next step" value={overview.patientFacing.nextStep} note="The team will update you again shortly" />
          </div>
        </DashboardSection>

        <DashboardSection title="My Tests & My Medicines" icon={<FlaskConical className="h-4 w-4" />}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-sm font-bold text-navy">Tests ordered for you</div>
              <div className="mt-3 space-y-3">
                {overview.patientFacing.tests.map((test) => (
                  <div key={test.label} className="rounded-2xl border border-border bg-secondary/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-navy">{test.label}</div>
                      <span className="rounded-full bg-secondary/50 px-2.5 py-1 text-[10px] font-bold text-navy">{test.status}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{test.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-sm font-bold text-navy">Medicines already given</div>
              <div className="mt-3 space-y-3">
                {overview.patientFacing.medicineSummary.map((medication) => (
                  <div key={medication.label} className="rounded-2xl border border-border bg-secondary/20 p-3">
                    <div className="font-semibold text-navy">{medication.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{medication.purpose}</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Given at {medication.at}
                      {medication.nextDue ? ` • Next dose ${medication.nextDue}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardSection>
      </div>

      <div className="space-y-5">
        <DashboardSection title="My Doctor, Nurse & Vitals" icon={<UserRound className="h-4 w-4" />}>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoLine label="Doctor" value={overview.careTeam.doctor} />
              <InfoLine label="Nurse" value={overview.careTeam.nurse} />
              <InfoLine label="Bed / location" value={overview.patient.bed} />
              <InfoLine label="Language support" value={overview.identity.language} />
            </div>
            <div className="mt-4 space-y-2">
              {overview.patientFacing.simpleVitals.map((item) => (
                <div key={item.label} className="rounded-2xl bg-secondary/20 px-3 py-3 text-sm text-navy">
                  <span className="font-semibold">{item.label}:</span> {item.summary}
                </div>
              ))}
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Important Instructions" icon={<AlertTriangle className="h-4 w-4" />}>
          <div className="rounded-2xl border border-border bg-white p-4">
            <ul className="space-y-3 text-sm text-navy">
              {overview.patientFacing.instructions.map((instruction) => (
                <li key={instruction} className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-coral" />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection title="Bills & Insurance" icon={<Wallet className="h-4 w-4" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <CompactKpi title="Coverage" value={overview.patientFacing.billing.coverage} note={`Covered ${overview.patientFacing.billing.covered}`} />
            <CompactKpi title="Estimated cost" value={overview.patientFacing.billing.estimate} note={`Out of pocket ${overview.patientFacing.billing.outOfPocket}`} />
          </div>
        </DashboardSection>

        <DashboardSection title="Discharge Guidance" icon={<CheckCircle2 className="h-4 w-4" />}>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="text-sm text-navy">{overview.patientFacing.discharge.summary}</div>
            <div className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Return immediately if</div>
            <ul className="mt-2 space-y-2 text-sm text-navy">
              {overview.patientFacing.discharge.warningSigns.map((warning) => (
                <li key={warning} className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}

function DashboardSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2 text-navy">
        <span className="text-coral">{icon}</span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function IdentityTile({
  title,
  value,
  note,
  icon,
  tone = "steady",
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  tone?: "steady" | "critical";
}) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "critical" ? "border-red-200 bg-red-50/80" : "border-border bg-white/90"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
        <span className={tone === "critical" ? "text-red-600" : "text-coral"}>{icon}</span>
      </div>
      <div className="mt-2 text-sm font-bold text-navy">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{note}</div>
    </div>
  );
}

function MiniBadgeGroup({
  title,
  items,
  danger = false,
}: {
  title: string;
  items: string[];
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${danger ? "bg-red-100 text-red-700" : "bg-secondary/35 text-navy"}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function NarrativeCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-navy">{body}</div>
    </div>
  );
}

function CompactKpi({
  title,
  value,
  note,
  tone = "steady",
}: {
  title: string;
  value: string;
  note: string;
  tone?: "steady" | "critical";
}) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "critical" ? "border-red-200 bg-red-50/80" : "border-border bg-white/90"}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      <div className={`mt-2 text-xl font-bold ${tone === "critical" ? "text-red-700" : "text-navy"}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{note}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-navy">{value}</div>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "steady" | "attention";
}) {
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tone === "steady" ? "bg-mint text-navy" : "bg-amber-100 text-amber-900"}`}>
      {label}
    </span>
  );
}
