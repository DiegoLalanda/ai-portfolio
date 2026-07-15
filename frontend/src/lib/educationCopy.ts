import type { Locale } from "@/i18n/types";

interface EducationCopy {
  degree?: string;
  fieldOfStudy?: string;
  status?: string;
  highlights?: string[];
}

const EDUCATION_EN: Record<string, EducationCopy> = {
  "edu-uner-web-development": {
    degree: "University Technician in Web Development",
    fieldOfStudy: "Web Development",
    status: "Completed",
    highlights: [
      "Degree awarded in November 2025.",
      "Final GPA of 9.21.",
    ],
  },
  "edu-isdica-physics-teaching": {
    degree: "Secondary Education Teaching Degree in Physics",
    fieldOfStudy: "Physics",
    status: "Completed",
    highlights: [
      "Teacher training in Physics for secondary school.",
      "Overall GPA of 9.46.",
    ],
  },
};

export function localizeEducationFields<
  T extends {
    id: string;
    degree: string;
    fieldOfStudy: string;
    status: string;
    highlights: string[];
  },
>(item: T, locale: Locale): T {
  if (locale !== "en") return item;
  const copy = EDUCATION_EN[item.id];
  if (!copy) return item;
  return {
    ...item,
    degree: copy.degree ?? item.degree,
    fieldOfStudy: copy.fieldOfStudy ?? item.fieldOfStudy,
    status: copy.status ?? (item.status === "completed" ? "Completed" : item.status),
    highlights: copy.highlights ?? item.highlights,
  } as T;
}
