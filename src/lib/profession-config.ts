/**
 * Profession/track options and their default tags + optional copy.
 * Used for onboarding, settings, and branding.
 */

export type ProfessionId =
  | "data_science"
  | "software_engineering"
  | "product"
  | "design"
  | "other";

export interface ProfessionOption {
  id: ProfessionId;
  label: string;
}

export interface ProfessionCopy {
  titleSuffix: string;
  description: string;
  navBrand: string;
}

const DEFAULT_TAGS_BY_PROFESSION: Record<
  ProfessionId,
  { name: string; slug: string }[]
> = {
  data_science: [
    { name: "SQL", slug: "sql" },
    { name: "ML", slug: "ml" },
    { name: "Stats", slug: "stats" },
    { name: "Python", slug: "python" },
    { name: "Behavioral", slug: "behavioral" },
  ],
  software_engineering: [
    { name: "System Design", slug: "system-design" },
    { name: "Algorithms", slug: "algorithms" },
    { name: "Coding", slug: "coding" },
    { name: "Behavioral", slug: "behavioral" },
    { name: "Other", slug: "other" },
  ],
  product: [
    { name: "Product Sense", slug: "product-sense" },
    { name: "Analytics", slug: "analytics" },
    { name: "Strategy", slug: "strategy" },
    { name: "Behavioral", slug: "behavioral" },
    { name: "Other", slug: "other" },
  ],
  design: [
    { name: "Portfolio", slug: "portfolio" },
    { name: "UX", slug: "ux" },
    { name: "Whiteboard", slug: "whiteboard" },
    { name: "Behavioral", slug: "behavioral" },
    { name: "Other", slug: "other" },
  ],
  other: [
    { name: "Technical", slug: "technical" },
    { name: "Behavioral", slug: "behavioral" },
    { name: "Other", slug: "other" },
  ],
};

const COPY_BY_PROFESSION: Record<ProfessionId, ProfessionCopy> = {
  data_science: {
    titleSuffix: "Data Science",
    description: "Track study sessions and prep for data science interviews",
    navBrand: "DS Prep",
  },
  software_engineering: {
    titleSuffix: "Software Engineering",
    description: "Track study sessions and prep for software engineering interviews",
    navBrand: "SWE Prep",
  },
  product: {
    titleSuffix: "Product",
    description: "Track study sessions and prep for product interviews",
    navBrand: "Product Prep",
  },
  design: {
    titleSuffix: "Design",
    description: "Track study sessions and prep for design interviews",
    navBrand: "Design Prep",
  },
  other: {
    titleSuffix: "Interview Prep",
    description: "Track study sessions and interview prep",
    navBrand: "Prep Tracker",
  },
};

export const PROFESSION_OPTIONS: ProfessionOption[] = [
  { id: "data_science", label: "Data Science" },
  { id: "software_engineering", label: "Software Engineering" },
  { id: "product", label: "Product" },
  { id: "design", label: "Design" },
  { id: "other", label: "Other" },
];

export function getDefaultTagsForProfession(
  professionId: ProfessionId
): { name: string; slug: string }[] {
  return DEFAULT_TAGS_BY_PROFESSION[professionId] ?? DEFAULT_TAGS_BY_PROFESSION.other;
}

export function getCopyForProfession(professionId: ProfessionId): ProfessionCopy {
  return COPY_BY_PROFESSION[professionId] ?? COPY_BY_PROFESSION.other;
}

/** Treat null/legacy as data_science for copy and defaults */
export function resolveProfession(profession: string | null | undefined): ProfessionId {
  if (
    profession === "data_science" ||
    profession === "software_engineering" ||
    profession === "product" ||
    profession === "design" ||
    profession === "other"
  ) {
    return profession;
  }
  return "data_science";
}

export function isProfessionId(value: string): value is ProfessionId {
  return PROFESSION_OPTIONS.some((p) => p.id === value);
}
