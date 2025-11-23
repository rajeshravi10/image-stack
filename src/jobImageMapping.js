// jobImageMapping.js
import { previewImages } from "./previewImports";

// STATIC IMAGE MAPPING FOR 2 MOCK JOBS (15 images each)
export const jobImageMapping = {
  POC123: {
    jobFile: {
      id: "job-0",
      src: previewImages[0],
      name: "Job File",
      type: "job",
    },

    references: [
      { id: "ref-1", src: previewImages[1], name: "Reference 1", type: "reference" },
      { id: "ref-2", src: previewImages[2], name: "Reference 2", type: "reference" },
      { id: "ref-3", src: previewImages[3], name: "Reference 3", type: "reference" },
      { id: "ref-4", src: previewImages[4], name: "Reference 4", type: "reference" },
      { id: "ref-5", src: previewImages[5], name: "Reference 5", type: "reference" },
      { id: "ref-6", src: previewImages[6], name: "Reference 6", type: "reference" },
      { id: "ref-7", src: previewImages[7], name: "Reference 7", type: "reference" },
      { id: "ref-8", src: previewImages[8], name: "Reference 8", type: "reference" },
    ],

    deliverables: [
      { id: "del-1", src: previewImages[9], name: "Deliverable 1", type: "deliverable" },
      { id: "del-2", src: previewImages[10], name: "Deliverable 2", type: "deliverable" },
      { id: "del-3", src: previewImages[11], name: "Deliverable 3", type: "deliverable" },
      { id: "del-4", src: previewImages[12], name: "Deliverable 4", type: "deliverable" },
      { id: "del-5", src: previewImages[13], name: "Deliverable 5", type: "deliverable" },
      { id: "del-6", src: previewImages[14], name: "Deliverable 6", type: "deliverable" },
    ],

    // ⭐ NEW CATEGORY WITH NO IMAGES
    extras: [],  
  },

  POC999: {
    jobFile: {
      id: "job-0",
      src: previewImages[15],
      name: "Job File",
      type: "job",
    },

    references: [
      { id: "ref-1", src: previewImages[16], name: "Reference 1", type: "reference" },
      { id: "ref-2", src: previewImages[0], name: "Reference 2", type: "reference" },
      { id: "ref-3", src: previewImages[1], name: "Reference 3", type: "reference" },
      { id: "ref-4", src: previewImages[2], name: "Reference 4", type: "reference" },
      { id: "ref-5", src: previewImages[3], name: "Reference 5", type: "reference" },
      { id: "ref-6", src: previewImages[4], name: "Reference 6", type: "reference" },
      { id: "ref-7", src: previewImages[5], name: "Reference 7", type: "reference" },
      { id: "ref-8", src: previewImages[6], name: "Reference 8", type: "reference" },
    ],

    deliverables: [
      { id: "del-1", src: previewImages[7], name: "Deliverable 1", type: "deliverable" },
      { id: "del-2", src: previewImages[8], name: "Deliverable 2", type: "deliverable" },
      { id: "del-3", src: previewImages[9], name: "Deliverable 3", type: "deliverable" },
      { id: "del-4", src: previewImages[10], name: "Deliverable 4", type: "deliverable" },
      { id: "del-5", src: previewImages[11], name: "Deliverable 5", type: "deliverable" },
      { id: "del-6", src: previewImages[12], name: "Deliverable 6", type: "deliverable" },
    ],

    // ⭐ NEW EMPTY CATEGORY FOR THIS JOB TOO
    extras: [],  
  },
};

