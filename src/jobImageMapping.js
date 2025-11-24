// jobImageMapping.js
import { jobFileImages, referenceImages, deliverableImages } from "./previewImports";

export const jobImageMapping = {
  POC123: {
    jobFile: {
      id: "job-0",
      src: jobFileImages[0],     // 001 from job-files
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

    extras: [],
  },


  POC999: {
    jobFile: {
      id: "job-0",
      src: jobFileImages[1],     // 002 from job-files
      name: "Job File",
      type: "job",
    },

    references: referenceImages.slice(5, 16).map((img, i) => ({
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

    extras: [],
  },
};
