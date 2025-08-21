import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Predefined array of greeting subtitles for CEOs and business operators
const greetingSubtitles = [
  "Ready to drive strategic outcomes today?",
  "Let's turn insights into actionable plans.",
  "Time to accelerate your business momentum.",
  "What strategic challenge shall we tackle?",
  "Ready to optimize operations and scale?",
  "Let's transform ideas into execution.",
  "How can we leverage your competitive edge?",
  "Time to streamline and amplify results.",
  "Ready to unlock new growth opportunities?",
  "Let's navigate complex decisions together.",
  "What business breakthrough are we pursuing?",
  "Time to maximize operational efficiency.",
  "Ready to execute with precision and speed?",
  "Let's create measurable business impact.",
  "How can we accelerate your vision?",
  "Time to turn strategy into reality.",
  "Ready to optimize performance metrics?",
  "Let's drive sustainable growth initiatives.",
  "What market opportunity shall we explore?",
  "Time to enhance competitive positioning.",
  "Ready to scale operations intelligently?",
  "Let's transform challenges into advantages.",
  "How can we maximize resource allocation?",
  "Time to accelerate decision-making processes.",
  "Ready to innovate and capture value?",
  "Let's optimize your leadership effectiveness.",
  "What strategic pivot needs attention?",
  "Time to enhance organizational capabilities.",
  "Ready to drive customer success metrics?",
  "Let's unlock operational excellence together."
];

export async function GET() {
  try {
    // Generate a random index to select a greeting
    const randomIndex = Math.floor(Math.random() * greetingSubtitles.length);
    const selectedSubtitle = greetingSubtitles[randomIndex];

    return NextResponse.json({ subtitle: selectedSubtitle }, { status: 200 });
  } catch (e) {
    // Fallback to a default greeting if something goes wrong
    return NextResponse.json({ subtitle: "Ready to drive strategic outcomes?" }, { status: 200 });
  }
}
