/**
 * Local pattern recognition engine for Liminalis Recordum
 *
 * Analyzes journal entries to surface recurring themes without any external API.
 * Uses keyword extraction, frequency analysis, and theme grouping.
 * All processing happens locally -- nothing leaves the device.
 */

import type { JournalEntry, Pattern } from './types'

/** Theme categories with associated keywords */
const THEME_MAP: Record<string, { label: string; keywords: string[] }> = {
  anger: {
    label: 'Suppressed anger',
    keywords: [
      'angry', 'anger', 'rage', 'furious', 'frustrated', 'irritated',
      'annoyed', 'resentment', 'resent', 'bitter', 'hostile', 'mad',
    ],
  },
  boundaries: {
    label: 'Boundary struggles',
    keywords: [
      'boundary', 'boundaries', 'said yes', 'couldn\'t say no', 'people pleasing',
      'doormat', 'taken advantage', 'overcommit', 'overextend', 'pushed over',
    ],
  },
  worthlessness: {
    label: 'Self-worth questions',
    keywords: [
      'worthless', 'not enough', 'inadequate', 'unworthy', 'don\'t deserve',
      'imposter', 'fraud', 'fake', 'not good enough', 'failure', 'loser',
    ],
  },
  control: {
    label: 'Control and power',
    keywords: [
      'control', 'powerless', 'helpless', 'trapped', 'stuck',
      'manipulated', 'dominated', 'submissive', 'obey', 'forced',
    ],
  },
  shame: {
    label: 'Shame patterns',
    keywords: [
      'shame', 'ashamed', 'embarrassed', 'humiliated', 'exposed',
      'vulnerable', 'naked', 'judged', 'criticized', 'ridiculed',
    ],
  },
  abandonment: {
    label: 'Fear of abandonment',
    keywords: [
      'abandoned', 'alone', 'lonely', 'rejected', 'left behind',
      'unwanted', 'ignored', 'invisible', 'forgotten', 'discarded',
    ],
  },
  numbing: {
    label: 'Numbing and avoidance',
    keywords: [
      'numb', 'numb out', 'distract', 'scroll', 'drink', 'drinking',
      'smoke', 'high', 'binge', 'avoid', 'escape', 'zone out', 'dissociate',
    ],
  },
  perfectionism: {
    label: 'Perfectionism',
    keywords: [
      'perfect', 'perfectionism', 'mistake', 'error', 'flaw', 'flawed',
      'never good enough', 'standard', 'expectations', 'disappoint',
    ],
  },
  authenticity: {
    label: 'Wearing masks',
    keywords: [
      'mask', 'pretend', 'fake', 'perform', 'act', 'hide', 'hiding',
      'real me', 'true self', 'authentic', 'inauthentic', 'persona',
    ],
  },
  work: {
    label: 'Work and recognition',
    keywords: [
      'work', 'job', 'boss', 'coworker', 'meeting', 'promotion',
      'overlooked', 'undervalued', 'overworked', 'burnout', 'career',
    ],
  },
  relationship: {
    label: 'Relationship dynamics',
    keywords: [
      'partner', 'relationship', 'spouse', 'love', 'argument', 'fight',
      'disconnect', 'intimacy', 'trust', 'betrayal', 'jealous', 'jealousy',
    ],
  },
  family: {
    label: 'Family patterns',
    keywords: [
      'parent', 'mother', 'father', 'family', 'childhood', 'sibling',
      'raised', 'upbringing', 'taught', 'generational', 'inherited',
    ],
  },
}

/** Extract text content from an entry regardless of mode */
function getEntryText(entry: JournalEntry): string {
  if (entry.freeformText) return entry.freeformText.toLowerCase()
  if (entry.guidedResponses) {
    return Object.values(entry.guidedResponses).join(' ').toLowerCase()
  }
  return ''
}

/** Find themes present in a single entry's text */
function detectThemes(text: string): string[] {
  const found: string[] = []
  for (const [themeId, { keywords }] of Object.entries(THEME_MAP)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        found.push(themeId)
        break
      }
    }
  }
  return found
}

/** Analyze entries and return detected patterns */
export function analyzePatterns(entries: JournalEntry[]): Pattern[] {
  if (entries.length < 3) return []

  const themeOccurrences: Record<string, string[]> = {}

  for (const entry of entries) {
    const text = getEntryText(entry)
    const themes = detectThemes(text)
    for (const theme of themes) {
      if (!themeOccurrences[theme]) themeOccurrences[theme] = []
      themeOccurrences[theme].push(entry.id)
    }
  }

  // Only surface patterns that appear in 2+ entries
  const patterns: Pattern[] = []
  for (const [themeId, entryIds] of Object.entries(themeOccurrences)) {
    if (entryIds.length < 2) continue
    const theme = THEME_MAP[themeId]
    const relevantEntries = entries.filter((e) => entryIds.includes(e.id))
    const timestamps = relevantEntries.map((e) => e.timestamp)

    patterns.push({
      id: `pattern-${themeId}`,
      theme: theme.label,
      description: generatePatternMessage(
        themeId,
        entryIds.length,
        entries.length,
      ),
      entryIds,
      firstDetected: Math.min(...timestamps),
      lastSeen: Math.max(...timestamps),
      frequency: entryIds.length,
    })
  }

  return patterns.sort((a, b) => b.frequency - a.frequency)
}

/** Generate a compassionate but direct pattern message */
function generatePatternMessage(
  themeId: string,
  count: number,
  totalEntries: number,
): string {
  const ratio = count / totalEntries
  const frequent = ratio > 0.5

  const messages: Record<string, string[]> = {
    anger: [
      `You've touched on anger in ${count} entries. That fire isn't weakness -- it's energy that's been capped too long. What would it look like to let it warm you instead of burn you?`,
      `Anger keeps showing up. It's not asking to be eliminated -- it's asking to be heard. When anger has nowhere constructive to go, it turns inward or explodes outward.`,
    ],
    boundaries: [
      `Boundary struggles have appeared ${count} times. Each time you said yes when you meant no, a piece of your energy left with someone else. You can reclaim that.`,
      `You keep noticing where your boundaries bend. That awareness is the first step -- the next is choosing one small 'no' that protects your energy.`,
    ],
    worthlessness: [
      `Questions about your worth have surfaced ${count} times. These aren't truths about you -- they're echoes of old messages. Your shadow carries them, but they don't define you.`,
      `"Not enough" keeps appearing. This is one of the most common shadow patterns. The voice saying you're not enough isn't yours -- it was installed. You can update the programming.`,
    ],
    control: [
      `Feeling powerless has come up ${count} times. When we can't control our external world, the shadow often tries to control internally -- through rigidity, withdrawal, or over-planning.`,
      `Control and power themes keep surfacing. The paradox: true power often comes from releasing the need to control. What would it feel like to let one thing be uncertain today?`,
    ],
    shame: [
      `Shame has appeared in ${count} entries. Shame tells you that you ARE the problem, but that's a lie. You DID something or FELT something -- that's different from being broken.`,
      `Shame keeps visiting. It thrives in silence and darkness. By writing about it here, you're already weakening its grip. Shame cannot survive being witnessed with compassion.`,
    ],
    abandonment: [
      `Fear of being left or forgotten has surfaced ${count} times. This fear often drives people-pleasing, clinginess, or preemptive withdrawal. Your shadow learned this survival strategy early.`,
      `Loneliness and abandonment themes keep appearing. The deepest abandonment is often self-abandonment -- the moments you leave yourself to keep someone else comfortable.`,
    ],
    numbing: [
      `Numbing and avoidance have appeared ${count} times. When shadow energy has no outlet, the body finds its own -- scrolling, substances, food, anything to turn the volume down.`,
      `You keep noticing the urge to escape. That's actually progress -- most people numb without awareness. The energy you're trying to mute is the same energy that can fuel transformation.`,
    ],
    perfectionism: [
      `Perfectionism has surfaced ${count} times. The pursuit of flawlessness is often the shadow's way of protecting you from criticism. But it also prevents you from being seen as you are.`,
      `The need to be perfect keeps showing up. Perfectionism is fear in a productive costume. What would it feel like to let something be good enough?`,
    ],
    authenticity: [
      `Wearing masks has come up ${count} times. Every mask you wear costs energy to maintain. Your shadow holds the real you -- and the real you is who people actually want to know.`,
      `You keep noticing the gap between who you perform and who you are. That gap is where exhaustion lives. Closing it, even by one degree, creates enormous relief.`,
    ],
    work: [
      `Work patterns have appeared ${count} times. If you feel unseen or undervalued at work, notice where you might be doing the same to yourself -- dismissing your own contributions.`,
      `Work keeps surfacing. The dynamics at work often mirror shadow patterns from earlier in life. Who did your boss or coworker remind you of when they triggered you?`,
    ],
    relationship: [
      `Relationship dynamics have surfaced ${count} times. Intimate relationships are the most powerful shadow mirrors. What frustrates you in your partner often reflects something unintegrated in yourself.`,
      `Love and conflict keep appearing. The people closest to us trigger our deepest shadows -- not because they're wrong for us, but because they see past the masks.`,
    ],
    family: [
      `Family patterns have appeared ${count} times. The shadow is often shaped in childhood. Understanding where these patterns started doesn't excuse them -- but it does demystify them.`,
      `Your family keeps showing up in your writing. Generational patterns run deep. By seeing them clearly, you become the one who breaks the cycle.`,
    ],
  }

  const options = messages[themeId] ?? [
    `This theme has appeared ${count} times in your entries. Recurring patterns are your shadow's way of getting your attention.`,
  ]
  return frequent ? options[0] : options[options.length - 1]
}

/** Generate a daily action suggestion based on the most recent entry */
export function generateDailyAction(
  entry: JournalEntry,
  _patterns: Pattern[],
  shadowName: string,
): string {
  const text = getEntryText(entry)
  const themes = detectThemes(text)

  // Specific actions for detected themes
  const themeActions: Record<string, string[]> = {
    anger: [
      `Tomorrow, when you feel that spark of anger, pause for three breaths before responding. Let ${shadowName}'s fire inform you, not drive you.`,
      `Notice one moment of irritation tomorrow and ask: "What boundary just got crossed?" Name it, even if only to yourself.`,
    ],
    boundaries: [
      `Tomorrow, practice one small 'no.' It can be to an email, a request, or an expectation. Feel what it's like to protect your space.`,
      `When someone asks something of you tomorrow, wait five seconds before answering. That pause is where your authentic response lives.`,
    ],
    worthlessness: [
      `Tomorrow, catch one self-critical thought and reframe it. Not with empty positivity, but with accuracy. Replace "I'm not enough" with "I'm learning."`,
      `Write down one thing you did well today, no matter how small. ${shadowName} needs to see evidence against the old story.`,
    ],
    numbing: [
      `Tomorrow, when you reach for your numbing tool of choice, pause for 60 seconds. Just notice the feeling underneath the urge. You don't have to do anything -- just notice.`,
      `Replace one numbing session tomorrow with 5 minutes of sitting with whatever you're feeling. ${shadowName} has something to tell you.`,
    ],
    shame: [
      `Tomorrow, share one imperfect thing about yourself with someone you trust. Shame loses power when it's witnessed by someone who doesn't flinch.`,
      `Notice when shame shows up tomorrow and silently say: "I see you. You're trying to protect me. But I don't need this protection anymore."`,
    ],
    authenticity: [
      `Tomorrow, let one opinion out that you'd normally keep to yourself. Start small -- what you really think about lunch, a movie, a decision. Practice being real.`,
      `Notice one moment tomorrow where you start to perform. Instead of masking, try saying what's actually on your mind. Even once is enough.`,
    ],
    control: [
      `Tomorrow, intentionally leave one thing unfinished or imperfect. Notice how your body responds. The discomfort is ${shadowName} learning to let go.`,
      `When something doesn't go as planned tomorrow, try saying "interesting" instead of "this is wrong." Small language shifts change the relationship with control.`,
    ],
    perfectionism: [
      `Tomorrow, do one thing at 80% instead of 100%. Send the email without re-reading it five times. Turn in the work before it's perfect. Notice what happens.`,
      `Celebrate one mistake tomorrow. Literally. Say "good, I'm human." ${shadowName} needs to learn that imperfection is safe.`,
    ],
    abandonment: [
      `Tomorrow, do one thing that's just for you, without checking if anyone notices or approves. Start being the person who doesn't leave yourself.`,
      `Notice when you seek reassurance tomorrow. Instead of asking someone else, try giving it to yourself first. "I'm here. I'm not going anywhere."`,
    ],
    relationship: [
      `Tomorrow, when your partner or friend triggers you, pause and ask: "Is this about them, or about something older?" The answer might surprise you.`,
      `Express one unspoken need to someone tomorrow. It doesn't have to be big. "I'd appreciate it if..." is enough.`,
    ],
    work: [
      `Tomorrow at work, acknowledge one of your own contributions before anyone else does. Don't wait for external validation -- give it to yourself.`,
      `If you feel overlooked tomorrow, ask yourself: "Am I also overlooking myself?" Sometimes we teach others how to treat us.`,
    ],
    family: [
      `Tomorrow, notice one moment where you react like a child rather than the adult you are. That's a family pattern. Name it, and you loosen its grip.`,
      `When a family pattern surfaces tomorrow, remind yourself: "This was their story. I'm writing a new one."`,
    ],
  }

  if (themes.length > 0) {
    const primaryTheme = themes[0]
    const actions = themeActions[primaryTheme]
    if (actions) {
      return actions[Math.floor(Math.random() * actions.length)]
    }
  }

  // General fallback actions
  const generalActions = [
    `Tomorrow, notice one emotion you'd normally push away. Don't fix it. Don't judge it. Just let it exist for 30 seconds. ${shadowName} is speaking -- listen.`,
    `Choose one moment tomorrow to be completely honest with yourself about what you're feeling. Write it down if you can. Awareness is the first act of integration.`,
    `Tomorrow, do one thing differently in a situation that usually plays out the same way. Even a tiny change breaks the pattern.`,
    `Notice one moment tomorrow where you feel energy rising -- anger, excitement, anxiety. Instead of suppressing it, let ${shadowName} guide you. Where does the energy want to go?`,
    `Tomorrow, speak one kind truth to yourself that you usually don't. Not flattery -- truth. "${shadowName} carried this for me, and I can carry it now."`,
  ]

  return generalActions[Math.floor(Math.random() * generalActions.length)]
}
