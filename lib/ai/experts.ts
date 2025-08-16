import type { Agent, AgentKnowledge } from '@/lib/db/schema';

export function buildExpertSystemPrompt({
  agent,
  baseSystem,
  context,
}: {
  agent: Agent;
  baseSystem: string;
  context: AgentKnowledge[];
}) {
  const contextText = context
    .map((c, i) => `# Source ${i + 1}: ${c.title}\n${c.content}`)
    .join('\n\n');

  const header = `You are ${agent.name}.\n\nPersonality: ${agent.personality}\n\nSpecialist Instructions: ${agent.prePrompt}`;

  const rag = contextText
    ? `\n\nRelevant Knowledge Base (may be incomplete; cite assumptions explicitly):\n${contextText}`
    : '';

  const format = `\n\nResponse Requirements:\n- Start with: [${agent.name}]\n- Be concise and actionable.\n- Use short bullets.\n- If there are risks/unknowns, call them out.\n- If giving code or examples, keep them minimal.`;

  return `${baseSystem}\n\n${header}${rag}${format}`;
}

