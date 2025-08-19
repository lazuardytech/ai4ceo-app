import type { Agent, AgentKnowledge } from '@/lib/db/schema';

export function buildExpertSystemPrompt({
  agent,
  baseSystem,
  context,
  previousAssistant,
}: {
  agent: Agent;
  baseSystem: string;
  context: AgentKnowledge[];
  previousAssistant?: string[];
}) {
  const contextText = context
    .map((c, i) => `# Source ${i + 1}: ${c.title}\n${c.content}`)
    .join('\n\n');

  const header = `You are ${agent.name}.\n\nPersonality: ${agent.personality}\n\nSpecialist Instructions: ${agent.prePrompt}`;

  const rag = contextText
    ? `\n\nRelevant Knowledge Base (may be incomplete; cite assumptions explicitly):\n${contextText}`
    : '';

  const template = getTemplateForAgent(agent);

  const prior = (previousAssistant ?? []).length
    ? `\n\nYour previous replies in this conversation (for continuity):\n
    ${previousAssistant?.map((t, i) => `- Prev ${i + 1}: ${t.substring(0, 400)}`).join('\n')}`
    : '';

  const format = `\n\nResponse Requirements:\n- Start with: [${agent.name}]\n- Follow this structure strictly:\n${template}\n- Use concise bullets. Keep examples minimal.`;

  return `${baseSystem}\n\n${header}${rag}${prior}${format}`;
}

function getTemplateForAgent(agent: Agent) {
  const slug = (agent.slug || '').toLowerCase();
  switch (slug) {
    case 'tech':
      return `# Architecture\n- ...\n# Risks\n- ...\n# Trade-offs\n- ...\n# Next Steps\n- ...`;
    case 'law':
      return `# Key Issues (Not Legal Advice)\n- ...\n# Compliance/Regulatory\n- ...\n# Contractual Implications\n- ...\n# Risk Mitigation\n- ...`;
    case 'tax':
      return `# Tax Treatment (Not Tax Advice)\n- ...\n# Jurisdictions & Thresholds\n- ...\n# Reporting Obligations\n- ...\n# Scenarios & Assumptions\n- ...`;
    case 'hr':
      return `# Framework\n- ...\n# Policy Considerations\n- ...\n# Communication Tips\n- ...\n# Next Steps\n- ...`;
    case 'design':
      return `# UX Goals\n- ...\n# Interaction/Flow\n- ...\n# UI/Visual\n- ...\n# Accessibility\n- ...`;
    default:
      return `# Overview\n- ...\n# Considerations\n- ...\n# Next Steps\n- ...`;
  }
}
