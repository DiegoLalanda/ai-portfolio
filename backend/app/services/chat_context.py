"""Contexto de sesión del dashboard para follow-ups sin repetir temas."""


def build_agent_prompt(
    question: str,
    *,
    shown_widget_types: list[str] | None = None,
    prior_questions: list[str] | None = None,
) -> str:
    """Arma el prompt del visitante con contexto de lo ya visible en el dashboard."""
    sections: list[str] = []

    if shown_widget_types or prior_questions:
        sections.append("## DASHBOARD CONTEXT (follow-up in the same session)")
        if shown_widget_types:
            types = ", ".join(shown_widget_types)
            sections.extend(
                [
                    f"These widget types are ALREADY visible on the dashboard: {types}.",
                    "Do NOT suggest ask-actions that would revisit those topics (e.g. no "
                    '"See projects" if projects is already shown).',
                    "When the VISITOR QUESTION explicitly asks for a topic (experience, projects, "
                    "skills, contact, education, etc.), you MUST call the matching tools and "
                    "include the corresponding widget types in this response — even on follow-ups.",
                    "Only omit widget types that are already visible when the visitor is NOT "
                    "asking for that topic again.",
                    "Set widget_types to the blocks that answer THIS question. "
                    "Do not repeat projects or skills just because their tools ran.",
                    "Prefer suggesting topics that are NOT yet visible.",
                    "Write suggested_actions in the SAME language as the visitor question.",
                ]
            )
        if prior_questions:
            joined = " | ".join(prior_questions[-6:])
            sections.append(f"Prior questions in this session: {joined}")
        sections.append("")

    sections.append("## VISITOR QUESTION")
    sections.append(question.strip())
    return "\n".join(sections)
