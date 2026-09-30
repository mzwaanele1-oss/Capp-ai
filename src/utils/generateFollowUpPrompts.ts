import { FollowUpPrompt } from '../types';

/**
 * Intelligently analyzes the last assistant message and its context
 * to dynamically generate 2-3 relevant follow-up prompt suggestions.
 */
export function generateFollowUpPrompts(
  assistantText: string,
  userPrompt?: string
): FollowUpPrompt[] {
  if (!assistantText || assistantText.trim().length < 15) {
    return [];
  }

  const text = assistantText.trim();
  const lowerText = text.toLowerCase();
  const lowerUser = (userPrompt || '').toLowerCase();
  const suggestions: FollowUpPrompt[] = [];

  // Helper to add unique suggestion
  const addSuggestion = (
    label: string,
    prompt: string,
    icon: FollowUpPrompt['icon'] = 'sparkles'
  ) => {
    if (suggestions.length >= 3) return;
    const exists = suggestions.some(
      (s) =>
        s.label.toLowerCase() === label.toLowerCase() ||
        s.prompt.toLowerCase() === prompt.toLowerCase()
    );
    if (!exists) {
      suggestions.push({
        id: `fu-${suggestions.length + 1}-${label.slice(0, 15).replace(/\s+/g, '-').toLowerCase()}`,
        label,
        prompt,
        icon,
      });
    }
  };

  // 1. Detect if the assistant concluded with a question or offer (e.g. "Would you like me to...", "Shall we explore...", "Do you want...")
  const questionMatches = [
    /(?:would you like (?:me to )?|do you want (?:me to )?|shall we |should I |want me to )([^?]+)\?/i,
    /(?:let me know if you(?:'d| would) like (?:me to )?)([^.!\n]+)/i,
    /(?:feel free to ask if you (?:want|need) )([^.!\n]+)/i,
  ];

  for (const regex of questionMatches) {
    const match = text.match(regex);
    if (match && match[1]) {
      let subject = match[1].trim();
      // clean trailing punctuation or conversational filler
      subject = subject.replace(/^(to\s+|explore\s+|see\s+)/i, '');
      if (subject.length > 5 && subject.length < 90) {
        const shortLabel = `Yes, ${subject.slice(0, 36)}${subject.length > 36 ? '...' : ''}`;
        addSuggestion(
          capitalize(shortLabel),
          `Yes, please ${subject}. Provide clear explanations and practical examples.`,
          'help'
        );
        break;
      }
    }
  }

  // 2. Code Block Analysis
  const hasCodeBlock = /```(?:[a-zA-Z0-9_-]+)?[\s\S]*?```/.test(text);
  const detectedLangMatch = text.match(/```([a-zA-Z0-9_-]+)/);
  const codeLang = detectedLangMatch ? detectedLangMatch[1].toLowerCase() : '';

  if (hasCodeBlock) {
    // Code specific follow-ups
    if (codeLang.includes('react') || codeLang.includes('tsx') || codeLang.includes('jsx') || lowerText.includes('hook') || lowerText.includes('component')) {
      addSuggestion(
        'Add error handling & state',
        'Can you show how to add robust error boundaries, loading states, and edge-case handling for this React component?',
        'code'
      );
      addSuggestion(
        'Write unit tests',
        'Can you write comprehensive unit tests using React Testing Library and Vitest/Jest for this code?',
        'list'
      );
    } else if (codeLang.includes('sql') || lowerText.includes('query') || lowerText.includes('database') || lowerText.includes('postgres')) {
      addSuggestion(
        'Optimize query performance',
        'How can we optimize this SQL query with indexing, execution plans, and best performance practices?',
        'code'
      );
      addSuggestion(
        'Add migrations & schema',
        'Can you show how to write the migration schema and sample data seeding for this structure?',
        'list'
      );
    } else if (codeLang.includes('py') || codeLang.includes('python')) {
      addSuggestion(
        'Add type hints & docstrings',
        'Can you refactor this Python code to include PEP 484 type hints, docstrings, and robust exception handling?',
        'code'
      );
      addSuggestion(
        'Write pytest test suite',
        'Write a complete pytest test suite covering both typical cases and edge cases with mocking where necessary.',
        'list'
      );
    } else {
      addSuggestion(
        'Add unit tests',
        'Can you write comprehensive unit tests with edge cases and mock data for this implementation?',
        'code'
      );
      addSuggestion(
        'Explain step-by-step',
        'Can you walk me through this code step-by-step and explain the key logic decisions?',
        'help'
      );
    }

    addSuggestion(
      'Edge cases & performance',
      'What are the critical edge cases or bottlenecks in this code, and how can we optimize performance?',
      'lightbulb'
    );
  }

  // 3. Troubleshooting & Debugging Detection
  if (
    lowerText.includes('error:') ||
    lowerText.includes('fix:') ||
    lowerText.includes('troubleshoot') ||
    lowerText.includes('root cause') ||
    lowerUser.includes('bug') ||
    lowerUser.includes('error') ||
    lowerUser.includes('fail')
  ) {
    addSuggestion(
      'Alternative fix if this fails',
      'If this approach still doesn’t resolve the error, what are the next diagnostic steps and alternative fixes?',
      'help'
    );
    addSuggestion(
      'Prevent future occurrences',
      'What architectural or validation patterns can we put in place to permanently prevent this issue in the future?',
      'lightbulb'
    );
  }

  // 4. Comparison, Alternatives & Trade-offs
  if (
    lowerText.includes('trade-off') ||
    lowerText.includes('pros and cons') ||
    lowerText.includes('versus') ||
    lowerText.includes('vs.') ||
    lowerText.includes('alternative') ||
    lowerText.includes('advantages')
  ) {
    addSuggestion(
      'Which option is recommended?',
      'Given typical production requirements (cost, maintainability, performance), which option would you recommend and why?',
      'lightbulb'
    );
    addSuggestion(
      'Compare trade-offs summary',
      'Can you summarize the pros, cons, and operational trade-offs of each option in a quick comparison table?',
      'list'
    );
  }

  // 5. Lists, Steps & Strategies (e.g. "1.", "Step 1", bullet points)
  const hasNumberedList = /(?:^|\n)\s*(?:1\.|step\s*1)/i.test(text);
  if (hasNumberedList) {
    addSuggestion(
      'Deep dive into Step 1',
      'Can you elaborate further on Step 1 with a concrete implementation guide and examples?',
      'arrow'
    );
    addSuggestion(
      'Actionable checklist & timeline',
      'Can you turn these recommendations into an actionable step-by-step checklist with estimated effort and priorities?',
      'list'
    );
  }

  // 6. Creative Writing / Marketing / Copywriting
  if (
    lowerUser.includes('write') ||
    lowerUser.includes('draft') ||
    lowerUser.includes('email') ||
    lowerUser.includes('post') ||
    lowerUser.includes('pitch') ||
    lowerText.includes('subject:') ||
    lowerText.includes('dear ')
  ) {
    addSuggestion(
      'Make it more concise',
      'Can you make this draft 30% more concise, punchy, and direct while preserving the key message?',
      'file'
    );
    addSuggestion(
      '3 tone variations',
      'Can you provide 3 alternative versions of this in different tones (e.g., casual/friendly, executive/formal, and persuasive/bold)?',
      'sparkles'
    );
  }

  // 7. Extract Prominent Topic Entities (e.g. bolded words or prominent headers)
  const boldMatches = Array.from(text.matchAll(/\*\*([A-Za-z0-9\s_-]{3,28})\*\*/g))
    .map((m) => m[1].trim())
    .filter((w) => {
      const low = w.toLowerCase();
      return (
        !['note', 'example', 'tip', 'step', 'summary', 'conclusion', 'pro', 'con', 'pros', 'cons', 'key', 'important'].includes(low) &&
        !low.includes('step') &&
        w.length > 3
      );
    });

  if (boldMatches.length > 0 && suggestions.length < 3) {
    const topic = boldMatches[0];
    addSuggestion(
      `Elaborate on ${topic}`,
      `Can you explain more about ${topic} with a concrete practical example?`,
      'sparkles'
    );
  }

  // 8. General High-Value Fallbacks to ensure exactly 2 or 3 distinct prompts
  const generalFallbacks: FollowUpPrompt[] = [
    {
      id: 'fu-fallback-1',
      label: 'Give a real-world example',
      prompt: 'Can you provide a realistic, concrete real-world example illustrating this in action?',
      icon: 'sparkles',
    },
    {
      id: 'fu-fallback-2',
      label: 'What are common pitfalls?',
      prompt: 'What are the most common pitfalls, mistakes, or misconceptions people encounter here, and how can they be avoided?',
      icon: 'lightbulb',
    },
    {
      id: 'fu-fallback-3',
      label: 'What should we do next?',
      prompt: 'Based on this, what are the recommended immediate next steps or follow-up actions to take?',
      icon: 'arrow',
    },
  ];

  for (const fallback of generalFallbacks) {
    if (suggestions.length >= 3) break;
    addSuggestion(fallback.label, fallback.prompt, fallback.icon);
  }

  // Return exactly 2 or 3 prompts
  return suggestions.slice(0, 3);
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
