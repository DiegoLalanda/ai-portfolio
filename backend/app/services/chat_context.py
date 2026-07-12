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
                    "Do NOT add widgets of those types in this response unless the visitor "
                    "explicitly asks for more detail on that same topic.",
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
