// jobImageMapping.js
import {
  jobFileImages,
  referenceImages,
  deliverableImages,
} from "./previewImports";

// Dummy generators
const getDummyReferenceCode = (i) => `REFCODE_${i + 1}`;
const getDummyDeliverableCode = (i) => `D_VC${i + 1}_AR${i + 1}`;

export const jobImageMapping = {
  POC123: {
    jobFile: {
      id: "job-0",
      src: jobFileImages[0],
      name: "VC1", // dummy view code
      type: "job",
    },

    references: referenceImages.slice(0, 6).map((img, i) => ({
      id: `ref-${i + 1}`,
      src: img,
      name: getDummyReferenceCode(i), // REFCODE_1, REFCODE_2...
      type: "reference",
    })),

    deliverables: deliverableImages.slice(0, 6).map((img, i) => ({
      id: `del-${i + 1}`,
      src: img,
      name: getDummyDeliverableCode(i), // D_VC1_AR1, D_VC2_AR2...
      type: "deliverable",
    })),

    wip: [],
  },

  POC999: {
    jobFile: {
      id: "job-0",
      src: jobFileImages[1],
      name: "VC2",
      type: "job",
    },

    references: referenceImages.slice(6, 16).map((img, i) => ({
      id: `ref-${i + 1}`,
      src: img,
      name: getDummyReferenceCode(i), // REFCODE_1...REFCODE_10
      type: "reference",
    })),

    deliverables: deliverableImages.slice(6, 12).map((img, i) => ({
      id: `del-${i + 1}`,
      src: img,
      name: getDummyDeliverableCode(i),
      type: "deliverable",
    })),

    wip: [],
  },
};

// ==========================
// DYNAMIC SELECTOR
// ==========================
export const getStaticJobMapping = (jobId) => {
  if (!jobId) return jobImageMapping.POC123;

  const lastChar = jobId.trim().slice(-1).toLowerCase();

  if (/[0-9]/.test(lastChar)) return jobImageMapping.POC123;

  if (/[a-z]/.test(lastChar)) return jobImageMapping.POC999;

  return jobImageMapping.POC123;
};
