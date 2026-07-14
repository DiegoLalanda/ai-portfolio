import type { ComponentType } from "react";
import type { Widget } from "@/types/agent-response";

import { TextWidget } from "./widgets/TextWidget";
import { ExperienceWidget } from "./widgets/ExperienceWidget";
import { ProjectsWidget } from "./widgets/ProjectsWidget";
import { SkillsWidget } from "./widgets/SkillsWidget";
import { TechnologyCloudWidget } from "./widgets/TechnologyCloudWidget";
import { EducationWidget } from "./widgets/EducationWidget";
import { ContactWidget } from "./widgets/ContactWidget";
import { TimelineWidget } from "./widgets/TimelineWidget";
import { CertificationsWidget } from "./widgets/CertificationsWidget";
import { LanguagesWidget } from "./widgets/LanguagesWidget";
import { SoftSkillsWidget } from "./widgets/SoftSkillsWidget";

export interface WidgetComponentProps {
  widget: Widget;
}

/**
 * Único punto de acoplamiento entre `type` (string que manda el backend) y
 * el componente de React que lo renderiza. Agregar un widget nuevo es:
 * crear el componente en `widgets/` + sumar una entrada acá. Nada más del
 * sistema (`WidgetRenderer`, `AgentResponseView`) necesita cambiar.
 *
 * Si `widget.type` no está en este registro, `WidgetRenderer` cae en
 * `FallbackWidget` automáticamente.
 */
export const widgetRegistry: Record<string, ComponentType<WidgetComponentProps>> = {
  text: TextWidget,
  experience: ExperienceWidget,
  projects: ProjectsWidget,
  skills: SkillsWidget,
  "technology-cloud": TechnologyCloudWidget,
  education: EducationWidget,
  contact: ContactWidget,
  timeline: TimelineWidget,
  certifications: CertificationsWidget,
  languages: LanguagesWidget,
  "soft-skills": SoftSkillsWidget,
};
