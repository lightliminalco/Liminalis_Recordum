/** Freeform shadow journaling prompts for experienced users */
export const FREEFORM_PROMPTS = [
  'What did you resist feeling today?',
  'Where did you perform instead of being real?',
  'What emotion did you suppress to keep the peace?',
  'What part of yourself did you hide in a conversation today?',
  'What would you say if no one could judge you?',
  'What desire did you push down today?',
  'Where did you feel small, and what made you shrink?',
  'What anger are you carrying that you haven\'t acknowledged?',
  'What boundary did you fail to set today?',
  'What truth about yourself are you avoiding right now?',
  'What would your shadow say to you if it could speak freely?',
  'Where are you giving your power away?',
  'What mask did you wear today, and what was beneath it?',
  'What are you pretending not to know about yourself?',
  'What would change if you stopped apologizing for who you are?',
  'Where did shame show up today, and what triggered it?',
  'What part of you is starving for expression?',
  'What old wound got reopened today?',
  'If your body could speak, what would it tell you right now?',
  'What are you afraid people would think if they saw the real you?',
  'What pattern are you tired of repeating?',
  'Where did jealousy or envy point you today?',
  'What would your younger self think of how you lived today?',
  'What are you holding onto that no longer serves you?',
  'Where did you abandon yourself today to please someone else?',
  'What conversation are you avoiding, and why?',
  'What would it feel like to let your shadow sit beside you, not behind you?',
  'What do you criticize most in others? What does that mirror in you?',
  'Where did guilt live in your body today?',
  'What would you do if you weren\'t afraid of being seen?',
]

/** Guided journaling steps for newcomers */
export const GUIDED_STEPS = [
  {
    id: 'feeling',
    question: 'How are you feeling right now?',
    hint: 'There are no wrong answers. Just notice what\'s present without judging it.',
    placeholder: 'I feel...',
    optional: false,
  },
  {
    id: 'bothered',
    question: 'What happened today that bothered you, even a little?',
    hint: 'It doesn\'t have to be dramatic. Small irritations often point to deeper patterns. The things that get under your skin are messengers.',
    placeholder: 'What happened was...',
    optional: false,
  },
  {
    id: 'suppressed',
    question: 'When you felt that, what did you want to do but didn\'t?',
    hint: 'Maybe you wanted to speak up, walk away, cry, or scream. The gap between what you felt and what you did is where your shadow lives.',
    placeholder: 'I wanted to...',
    optional: false,
  },
  {
    id: 'pattern',
    question: 'Does this remind you of a pattern? Something that keeps happening?',
    hint: 'Patterns are your shadow trying to get your attention. If the same frustration, fear, or reaction keeps showing up, it\'s asking to be seen.',
    placeholder: 'I\'ve noticed...',
    optional: true,
  },
  {
    id: 'different',
    question: 'What would it look like to respond differently next time?',
    hint: 'Not perfectly. Not heroically. Just one degree of change. What\'s the smallest shift you could make?',
    placeholder: 'Next time I could...',
    optional: false,
  },
]

/** Get today's prompt based on date (cycles through the pool) */
export function getDailyPrompt(): string {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      86400000,
  )
  return FREEFORM_PROMPTS[dayOfYear % FREEFORM_PROMPTS.length]
}

/** Get a random prompt different from the last one used */
export function getRandomPrompt(lastPrompt?: string): string {
  const available = lastPrompt
    ? FREEFORM_PROMPTS.filter((p) => p !== lastPrompt)
    : FREEFORM_PROMPTS
  return available[Math.floor(Math.random() * available.length)]
}
