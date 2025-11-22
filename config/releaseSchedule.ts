// Release gating configuration
const RELEASE_DATE_ISO = "2025-11-24T05:00:00.000Z";

const parsedReleaseDate = new Date(RELEASE_DATE_ISO);

if (Number.isNaN(parsedReleaseDate.getTime())) {
  throw new Error("releaseSchedule has an invalid release date");
}

export const releaseSchedule = {
  releaseDate: parsedReleaseDate,
  labels: {
    before: "Pre-release",
    after: "Post-release",
  },
} as const;


