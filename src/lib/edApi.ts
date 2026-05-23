import { createServerFn } from "@tanstack/react-start";
import { getEdSnapshotFromDb } from "./edDatabase.server";

export const getEdSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  return getEdSnapshotFromDb();
});
