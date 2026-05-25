export type CopilotIntent =
  | "navigate_route"
  | "open_patient"
  | "navigate_section"
  | "next_step"
  | "previous_step"
  | "open_tool"
  | "apply_vitals"
  | "apply_chief_complaint"
  | "select_pathway"
  | "generate_summary"
  | "get_recommendations"
  | "generate_analytics_chart"
  | "unknown";

export type CopilotAction = {
  intent: CopilotIntent;
  target?: string;
  tool?: string;
  pathway?: string;
  route?: string;
  patient_id?: string;
  patient_name?: string;
  vitals?: Record<string, string>;
  response_text?: string;
  confidence?: number;
};

export type CopilotCommandResult = {
  success: boolean;
  intent: CopilotIntent;
  target?: string;
  tool?: string;
  pathway?: string;
  route?: string;
  patient_id?: string;
  patient_name?: string;
  vitals?: Record<string, string>;
  actions?: CopilotAction[];
  response_text: string;
  confidence: number;
  error?: string;
};

export type CopilotRecommendation = {
  title: string;
  reason: string;
  severity: string;
  action: string;
};

export type CopilotChartSpec = {
  title: string;
  description?: string;
  type: "bar" | "line" | "pie";
  data: Array<Record<string, string | number>>;
  xKey?: string;
  series: Array<{
    key: string;
    label: string;
    color: string;
  }>;
};

export type CopilotChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  chart?: CopilotChartSpec;
  timestamp: string;
};

export type EncounterOrderItem = {
  category: "investigation" | "medication";
  name: string;
  requirement: string;
  notes: string;
};

export type EncounterContext = {
  patientName?: string;
  patientId?: string;
  route: string;
  currentSection?: string;
  pathway?: string;
  chiefComplaint?: string;
  vitals?: Record<string, string>;
  availablePatients?: Array<{ id: string; name: string }>;
  availableSections?: string[];
  availableTools?: string[];
  availablePathways?: string[];
  notes?: string[];
};

export type EncounterBindings = {
  getContext: () => EncounterContext;
  goToSection?: (section: string) => void;
  nextStep?: () => void;
  previousStep?: () => void;
  openTool?: (tool: string) => void;
  applyVitals?: (vitals: Record<string, string>) => void;
  applyChiefComplaint?: (chiefComplaint: string) => void;
  selectPathway?: (pathway: string) => void;
  addOrder?: (item: EncounterOrderItem) => void;
  runBundle?: (bundleId: string) => void;
};

export type RouteBindings = {
  currentRoute: string;
  availableRoutes: string[];
  availablePatients?: Array<{ id: string; name: string; bed?: string; status?: string }>;
  navigateRoute: (route: string) => void;
  openPatient?: (patientId: string) => void;
};

export type AnalyticsBindings = {
  promptHint?: string;
  buildChart: (prompt: string) => Promise<{ chart: CopilotChartSpec; responseText: string } | null>;
};
