import type { JargonTerm } from "./core.ts";

export const medicalGlossary: Record<string, JargonTerm> = {
  "invasive ductal carcinoma": {
    term: "Invasive Ductal Carcinoma",
    definition: "Cancer that started in milk ducts and has grown into nearby breast tissue",
    analogy: "Think of it like water that started in a pipe but has now leaked into the surrounding area",
    severity: "concerning",
  },
  "ductal carcinoma": {
    term: "Ductal Carcinoma",
    definition: "Cancer that begins in the milk ducts of the breast",
    severity: "concerning",
  },
  "stage iia": {
    term: "Stage IIA",
    definition: "Early-stage cancer that hasn't spread beyond the breast",
    analogy: "Like a fire that's still contained to one room—serious, but manageable",
    severity: "neutral",
  },
  "stage iib": {
    term: "Stage IIB",
    definition: "Early to moderate stage cancer, may involve lymph nodes",
    severity: "concerning",
  },
  "stage iii": {
    term: "Stage III",
    definition: "Locally advanced cancer that has spread to nearby lymph nodes",
    severity: "alarming",
  },
  "stage iv": {
    term: "Stage IV",
    definition: "Cancer that has spread to other parts of the body",
    severity: "alarming",
  },
  "metastatic": {
    term: "Metastatic",
    definition: "Cancer that has spread from where it started to other parts of the body",
    severity: "alarming",
  },
  "metastasis": {
    term: "Metastasis",
    definition: "The spread of cancer from one part of the body to another",
    severity: "alarming",
  },
  "er+": {
    term: "ER+ (Estrogen Receptor Positive)",
    definition: "Your tumor has receptors for estrogen hormone, which is actually good—it means hormone therapy can help",
    analogy: "Like a lock that has a key—we can use hormone-blocking drugs as treatment",
    severity: "neutral",
  },
  "pr+": {
    term: "PR+ (Progesterone Receptor Positive)",
    definition: "Your tumor has receptors for progesterone hormone, which means hormone therapy can be effective",
    severity: "neutral",
  },
  "her2-": {
    term: "HER2- (HER2 Negative)",
    definition: "Your tumor doesn't have extra HER2 protein",
    analogy: "One less growth signal for the cancer, which is good",
    severity: "neutral",
  },
  "her2+": {
    term: "HER2+ (HER2 Positive)",
    definition: "Your tumor has extra HER2 protein that makes it grow faster, but targeted therapies can block it",
    severity: "concerning",
  },
  "grade 1": {
    term: "Grade 1",
    definition: "Slow-growing cancer cells that look similar to normal cells",
    severity: "neutral",
  },
  "grade 2": {
    term: "Grade 2",
    definition: "Moderate-growing cancer cells",
    severity: "neutral",
  },
  "grade 3": {
    term: "Grade 3",
    definition: "Fast-growing cancer cells that look very different from normal cells",
    severity: "concerning",
  },
  "ki-67": {
    term: "Ki-67",
    definition: "A measurement of how fast cancer cells are dividing (percentage of cells actively growing)",
    severity: "neutral",
  },
  "chemotherapy": {
    term: "Chemotherapy",
    definition: "Medication that kills fast-growing cells throughout your body, including cancer cells",
    severity: "neutral",
  },
  "radiation": {
    term: "Radiation Therapy",
    definition: "Targeted high-energy rays that kill cancer cells in a specific area",
    severity: "neutral",
  },
  "lumpectomy": {
    term: "Lumpectomy",
    definition: "Surgery to remove the tumor and a small amount of surrounding tissue, preserving most of the breast",
    analogy: "Like removing a bad spot from an apple while keeping the rest",
    severity: "neutral",
  },
  "mastectomy": {
    term: "Mastectomy",
    definition: "Surgery to remove the entire breast",
    severity: "concerning",
  },
  "lymph node": {
    term: "Lymph Node",
    definition: "Small bean-shaped organs that filter harmful substances and help fight infection",
    analogy: "Think of them as filter stations in your body's drainage system",
    severity: "neutral",
  },
  "lymphovascular invasion": {
    term: "Lymphovascular Invasion",
    definition: "Cancer cells found in blood or lymph vessels near the tumor",
    severity: "concerning",
  },
  "oncologist": {
    term: "Oncologist",
    definition: "A doctor who specializes in diagnosing and treating cancer",
    severity: "neutral",
  },
  "pathology": {
    term: "Pathology",
    definition: "The study of tissue samples under a microscope to diagnose disease",
    severity: "neutral",
  },
  "biopsy": {
    term: "Biopsy",
    definition: "A procedure to remove a small sample of tissue for examination",
    severity: "neutral",
  },
  "neoadjuvant": {
    term: "Neoadjuvant Therapy",
    definition: "Treatment given before surgery to shrink the tumor",
    severity: "neutral",
  },
  "adjuvant": {
    term: "Adjuvant Therapy",
    definition: "Treatment given after surgery to reduce risk of cancer returning",
    severity: "neutral",
  },
  "prognosis": {
    term: "Prognosis",
    definition: "The likely outcome or course of your disease",
    severity: "neutral",
  },
  "remission": {
    term: "Remission",
    definition: "When cancer signs and symptoms decrease or disappear",
    severity: "neutral",
  },
  "recurrence": {
    term: "Recurrence",
    definition: "When cancer comes back after treatment",
    severity: "concerning",
  },
  "tumor": {
    term: "Tumor",
    definition: "An abnormal mass of tissue; can be benign (not cancer) or malignant (cancer)",
    severity: "neutral",
  },
  "malignant": {
    term: "Malignant",
    definition: "Cancerous; can invade nearby tissue and spread",
    severity: "concerning",
  },
  "benign": {
    term: "Benign",
    definition: "Not cancerous; doesn't spread to other parts of the body",
    severity: "neutral",
  },
  "carcinoma": {
    term: "Carcinoma",
    definition: "Cancer that starts in the skin or tissues that line organs",
    severity: "concerning",
  },
  "immunotherapy": {
    term: "Immunotherapy",
    definition: "Treatment that helps your immune system fight cancer",
    severity: "neutral",
  },
  "targeted therapy": {
    term: "Targeted Therapy",
    definition: "Drugs that target specific proteins in cancer cells",
    severity: "neutral",
  },
  "hormone therapy": {
    term: "Hormone Therapy",
    definition: "Treatment that blocks hormones from fueling cancer growth",
    severity: "neutral",
  },
  "neutropenia": {
    term: "Neutropenia",
    definition: "Low white blood cell count, which increases infection risk",
    severity: "concerning",
  },
  "febrile neutropenia": {
    term: "Febrile Neutropenia",
    definition: "Fever with dangerously low white blood cells—requires immediate medical attention",
    severity: "alarming",
  },
  "port": {
    term: "Port (Port-a-Cath)",
    definition: "A small device placed under the skin to make it easier to give IV medications and draw blood",
    analogy: "Like a permanent doorway for medications, so you don't need repeated needle sticks",
    severity: "neutral",
  },
  "infusion": {
    term: "Infusion",
    definition: "Medication given through an IV directly into your bloodstream",
    severity: "neutral",
  },
  "ct scan": {
    term: "CT Scan",
    definition: "A detailed X-ray that creates cross-sectional images of your body",
    severity: "neutral",
  },
  "mri": {
    term: "MRI",
    definition: "Imaging that uses magnets and radio waves to create detailed pictures of inside your body",
    severity: "neutral",
  },
  "pet scan": {
    term: "PET Scan",
    definition: "Imaging that shows how tissues and organs are functioning, helps detect cancer",
    severity: "neutral",
  },
  "mammogram": {
    term: "Mammogram",
    definition: "X-ray of the breast used to screen for or diagnose breast cancer",
    severity: "neutral",
  },
  "ultrasound": {
    term: "Ultrasound",
    definition: "Imaging that uses sound waves to create pictures of structures inside your body",
    severity: "neutral",
  },
  "reconstruction": {
    term: "Breast Reconstruction",
    definition: "Surgery to rebuild breast shape after mastectomy",
    severity: "neutral",
  },
  "sentinel node": {
    term: "Sentinel Lymph Node",
    definition: "The first lymph node where cancer is likely to spread",
    severity: "neutral",
  },
  "clear margins": {
    term: "Clear Margins",
    definition: "No cancer cells found at the edge of removed tissue—good news, means they got it all",
    severity: "neutral",
  },
  "positive margins": {
    term: "Positive Margins",
    definition: "Cancer cells found at the edge of removed tissue—may need more surgery",
    severity: "concerning",
  },
};
