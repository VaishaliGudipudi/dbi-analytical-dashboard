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
          abhaId: z.string(),
          dateOfAdmission: z.string(),
          emergencyContactName: z.string(),
          emergencyContactPhone: z.string(),
          emergencyContactRelation: z.string(),
          arrivalMode: z.string(),
          informedBy: z.string(),
          returnToErWithin72Hours: z.string(),
          broughtBy: z.string(),
          ambulanceOrReferralId: z.string(),
          mlcCase: z.string(),
          policeStation: z.string(),
          mlcNumber: z.string(),
          inwardReferral: z.string(),
          referralFacility: z.string(),
          referralReason: z.string(),
          triageCondition: z.string(),
          triageLevel: z.string(),
          mewsScore: z.string(),
          oxygenMode: z.string(),
          gcsEye: z.string(),
          gcsVerbal: z.string(),
          gcsMotor: z.string(),
          vulnerablePatient: z.boolean(),
          restraints: z.boolean(),
          drugAllergy: z.boolean(),
          fallRisk: z.boolean(),
          bedSore: z.boolean(),
          dvt: z.boolean(),
          yesDetails: z.string(),
          chiefComplaint: z.string(),
          mainComplaintsAndFindings: z.string(),
          pulseRate: z.string(),
          bloodPressure: z.string(),
          temperature: z.string(),
          respiratoryRate: z.string(),
          weightKg: z.string(),
          rbs: z.string(),
          oxygenSaturation: z.string(),
          painScore: z.string(),
          airwayStatus: z.string(),
          airwayNotes: z.string(),
          breathingStatus: z.string(),
          breathingNotes: z.string(),
          circulationStatus: z.string(),
          circulationNotes: z.string(),
          disabilityStatus: z.string(),
          disabilityNotes: z.string(),
          exposureStatus: z.string(),
          exposureNotes: z.string(),
          headAssessment: z.string(),
          neckChestAssessment: z.string(),
          upperLimbsAssessment: z.string(),
          lowerLimbsAssessment: z.string(),
          abdomenAssessment: z.string(),
          backAssessment: z.string(),
          pelvisGenitourinaryAssessment: z.string(),
          skinAssessment: z.string(),
          othersAssessment: z.string(),
          bodyMarkingsFront: z.string(),
          bodyMarkingsBack: z.string(),
          focusedHistorySample: z.string(),
          pastMedicalHistory: z.string(),
          surgicalHistory: z.string(),
          familyHistory: z.string(),
          allergicHistory: z.string(),
          immunizationHistory: z.string(),
          reasonForEmergencyAdmission: z.string(),
          lifestyleHabits: z.string(),
          emotionalState: z.string(),
          physiologicalIndicators: z.string(),
          nutritionalAssessment: z.string(),
          bedSoreGrade: z.string(),
          investigationsChart: z.array(
            z.object({
              id: z.string(),
              investigation: z.string(),
              orderedAt: z.string(),
              status: z.string(),
              resultSummary: z.string(),
            }),
          ),
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
