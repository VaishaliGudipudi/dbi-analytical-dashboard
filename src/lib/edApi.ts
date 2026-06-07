import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getEdSnapshotFromDb,
  getPatientWorkspaceDraftFromDb,
  savePatientWorkspaceDraftToDb,
} from "./edDatabase.server";
import type { PatientWorkspaceDraft } from "./edTypes";

export const getEdSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  return getEdSnapshotFromDb();
});

export const getPatientWorkspaceDraft = createServerFn({
  method: "GET",
  validator: (data: { patientId: string }) => data,
}).handler(async ({ data }) => {
  return getPatientWorkspaceDraftFromDb(data.patientId);
});

const workspaceDraftSchema = z.object({
  patientId: z.string(),
  draft: z.object({
    formValues: z.record(z.string()).optional(),
    chiefComplaint: z.string().optional(),
    vitals: z.record(z.string()).optional(),
    orderedItems: z
      .array(
        z.object({
          category: z.enum(["investigation", "medication"]),
          name: z.string(),
          requirement: z.string(),
          notes: z.string(),
        }),
      )
      .optional(),
    nursingAssessments: z
      .array(
        z.object({
          id: z.string(),
          createdAt: z.string(),
          createdBy: z.string(),
          dateTime: z.string(),
          vulnerablePatient: z.boolean(),
          restraints: z.boolean(),
          drugAllergy: z.boolean(),
          fallRisk: z.boolean(),
          bedSore: z.boolean(),
          dvt: z.boolean(),
          yesDetails: z.string(),
          mainComplaintsAndFindings: z.string(),
          pulseRate: z.string(),
          bloodPressure: z.string(),
          temperature: z.string(),
          respiratoryRate: z.string(),
          weightKg: z.string(),
          rbs: z.string(),
          oxygenSaturation: z.string(),
          painScore: z.string(),
          bedSoreGrade: z.string(),
          investigationSent: z.string(),
          statMedications: z.array(
            z.object({
              id: z.string(),
              dateTime: z.string(),
              drugName: z.string(),
              dose: z.string(),
              route: z.string(),
              frequency: z.string(),
              counterSignByDoctor: z.string(),
              sign1By: z.string(),
              sign1Time: z.string(),
              sign2By: z.string(),
              sign2Time: z.string(),
            }),
          ),
          intravenousFluids: z.array(
            z.object({
              id: z.string(),
              fluidName: z.string(),
              serialNumber: z.string(),
              timeStarted: z.string(),
              timeStopped: z.string(),
              signWithName: z.string(),
            }),
          ),
          nurseNotes: z.string(),
          nurseName: z.string(),
          nurseSignature: z.string(),
          signedAt: z.string(),
        }),
      )
      .optional(),
    pathwayOverride: z.string().nullable().optional(),
    outcome: z
      .object({
        shiftedTo: z.string().optional(),
        patientStatus: z.string().optional(),
        provisionalDiagnosis: z.string().optional(),
        course: z.string().optional(),
        carePlan: z.string().optional(),
        summary: z.string().optional(),
      })
      .optional(),
  }),
});

export const savePatientWorkspaceDraft = createServerFn({
  method: "POST",
  validator: (data: z.infer<typeof workspaceDraftSchema>) => workspaceDraftSchema.parse(data),
}).handler(async ({ data }): Promise<PatientWorkspaceDraft> => {
  return savePatientWorkspaceDraftToDb(data.patientId, data.draft);
});
