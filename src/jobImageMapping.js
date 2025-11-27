// jobImageMapping.js
import { jobFileImages, referenceImages, deliverableImages } from "./previewImports";

// ==========================
// STATIC MAPPINGS
// ==========================
export const jobImageMapping = {
  POC123: {
    jobFile: {
      id: "job-0",
      src: jobFileImages[0],
      name: "Job File",
      type: "job",
    },

    references: referenceImages.slice(0, 6).map((img, i) => ({
      id: `ref-${i + 1}`,
      src: img,
      name: `Reference ${i + 1}`,
      type: "reference",
    })),

    deliverables: deliverableImages.slice(0, 6).map((img, i) => ({
      id: `del-${i + 1}`,
      src: img,
      name: `Deliverable ${i + 1}`,
      type: "deliverable",
    })),

    wip: [],
  },

  POC999: {
    jobFile: {
      id: "job-0",
      src: jobFileImages[1],
      name: "Job File",
      type: "job",
    },

    references: referenceImages.slice(6, 16).map((img, i) => ({
      id: `ref-${i + 1}`,
      src: img,
      name: `Reference ${i + 1}`,
      type: "reference",
    })),

    deliverables: deliverableImages.slice(6, 12).map((img, i) => ({
      id: `del-${i + 1}`,
      src: img,
      name: `Deliverable ${i + 1}`,
      type: "deliverable",
    })),

    wip: [],
  },
};

// ==========================
// DYNAMIC MAPPING SELECTOR
// ==========================
export const getStaticJobMapping = (jobId) => {
  if (!jobId) return jobImageMapping.POC123;

  const lastChar = jobId.trim().slice(-1).toLowerCase();

  // Ends with number → first set
  if (/[0-9]/.test(lastChar)) {
    return jobImageMapping.POC123;
  }

  // Ends with alphabet → second set
  if (/[a-z]/.test(lastChar)) {
    return jobImageMapping.POC999;
  }

  // Fallback → first set
  return jobImageMapping.POC123;
};
