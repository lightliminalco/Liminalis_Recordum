/**
 * Text-based guided meditation content
 *
 * Each meditation is a series of steps the user reads and follows at their own pace.
 * Themed around shadow-light integration, reclaiming energy, and the
 * empress/emperor (inner sovereign) archetype.
 */

export interface MeditationStep {
  instruction: string
  durationHint: string
}

export interface MeditationContent {
  id: string
  title: string
  description: string
  theme: 'shadow-meeting' | 'energy-reclaim' | 'sovereign' | 'integration' | 'release'
  estimatedMinutes: number
  steps: MeditationStep[]
}

export const MEDITATIONS: MeditationContent[] = [
  {
    id: 'meet-your-shadow',
    title: 'Meeting Your Shadow',
    description: 'A gentle first encounter with the parts of you that have been hidden. This is not about fixing -- it\'s about witnessing.',
    theme: 'shadow-meeting',
    estimatedMinutes: 8,
    steps: [
      {
        instruction: 'Close your eyes. Take three slow breaths. With each exhale, let your body settle a little more into wherever you are.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Imagine yourself standing at the edge of a quiet forest at twilight. The light is soft. The air is still. You feel safe here.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Somewhere in the trees, there is a figure. This is your shadow -- the part of you that has been waiting in the dark. It is not dangerous. It is patient.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Without moving closer, simply acknowledge it. Say inwardly: "I see you. I know you\'re there. You don\'t have to hide anymore."',
        durationHint: '1 minute',
      },
      {
        instruction: 'Notice what you feel in your body. Tightness? Warmth? Sadness? Whatever arises is correct. Let it be there without trying to change it.',
        durationHint: '1 minute',
      },
      {
        instruction: 'The figure takes one step closer. Not to threaten -- but to be seen more clearly. What do you notice about it? Does it have a shape, a feeling, a quality?',
        durationHint: '1 minute',
      },
      {
        instruction: 'Say to your shadow: "You have been carrying something for me. I\'m ready to start listening." Sit with whatever response comes -- even if it\'s silence.',
        durationHint: '2 minutes',
      },
      {
        instruction: 'Slowly, gently, let the image dissolve. Take three deep breaths. Feel your body in the present moment. When you\'re ready, open your eyes.',
        durationHint: '30 seconds',
      },
    ],
  },
  {
    id: 'energy-vessel',
    title: 'The Energy Vessel',
    description: 'Learn to feel the energy that lives in your body -- shadow and light both. This meditation helps you sense the "control valve" and begin directing energy intentionally.',
    theme: 'energy-reclaim',
    estimatedMinutes: 10,
    steps: [
      {
        instruction: 'Sit comfortably. Close your eyes. Place one hand on your chest and one on your belly. Breathe naturally and feel the rise and fall.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Imagine your body as a vessel -- a container for energy. Not just physical energy, but emotional energy. Everything you\'ve felt today, this week, this year -- it lives somewhere in this vessel.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Scan from the top of your head down to your feet. Where do you feel heaviness? Where do you feel lightness? Where is there numbness? Just notice.',
        durationHint: '1 minute',
      },
      {
        instruction: 'The heavy places often hold shadow energy -- suppressed emotions, unexpressed truths, old pain. Don\'t judge them. They became heavy because they had nowhere to go.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Now imagine a gentle valve at the center of your chest. This is your control valve. It can open to release pressure, and it can direct energy where it\'s needed.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Slowly begin to open the valve. Not all the way -- just slightly. Feel what wants to move. Maybe it\'s a sigh, a sensation, a memory, or a feeling. Let it flow.',
        durationHint: '2 minutes',
      },
      {
        instruction: 'Now, choose where to send this energy. Not into numbing or destruction -- but into something you need. Clarity. Courage. Compassion. Visualize the energy flowing there.',
        durationHint: '2 minutes',
      },
      {
        instruction: 'Gently close the valve partway. You don\'t need to process everything at once. The valve is yours. You control how much, how fast, how far.',
        durationHint: '1 minute',
      },
      {
        instruction: 'Take three deep breaths. Feel the vessel -- your body -- as something that holds power, not just pain. When you\'re ready, open your eyes.',
        durationHint: '30 seconds',
      },
    ],
  },
  {
    id: 'crown-your-sovereign',
    title: 'Crowning Your Inner Sovereign',
    description: 'Your shadow, once reclaimed, becomes your inner empress or emperor. This meditation transforms the energy of what was hidden into the power of what is chosen.',
    theme: 'sovereign',
    estimatedMinutes: 12,
    steps: [
      {
        instruction: 'Close your eyes and settle into stillness. Let your breath find its own rhythm. There is nowhere you need to be except here.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Imagine a throne room. It is beautiful and strong -- built from everything you\'ve survived. The walls are made of your experiences. The light comes from within.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'The throne is empty. It has been waiting for the part of you that is powerful enough to sit in it. Not the part that performs. Not the part that pleases. The part that is real.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Your shadow enters the room. But now it looks different. It is no longer hiding. It stands tall. It carries the energy of everything you pushed away -- and that energy is immense.',
        durationHint: '1 minute',
      },
      {
        instruction: 'This is your inner sovereign. Your empress. Your emperor. It was never your enemy. It was your power, waiting for you to be ready to claim it.',
        durationHint: '1 minute',
      },
      {
        instruction: 'Watch as your sovereign approaches the throne and sits. Feel what happens in your body. The heaviness may begin to shift into something else. Authority. Presence. Calm strength.',
        durationHint: '2 minutes',
      },
      {
        instruction: 'Say to your sovereign: "I give you a name. I give you a seat at my table. You are not my shame -- you are my power." If you have already named your sovereign, speak that name now.',
        durationHint: '1 minute',
      },
      {
        instruction: 'Feel the energy of integration. Shadow and light are not opposites -- they are two hands of the same body. Your sovereign holds them both.',
        durationHint: '2 minutes',
      },
      {
        instruction: 'Before you leave this room, your sovereign offers you one word. A word for today. Listen. Whatever comes, accept it.',
        durationHint: '1 minute',
      },
      {
        instruction: 'Slowly let the image dissolve. Bring that word with you. Take three deep breaths and open your eyes when you\'re ready.',
        durationHint: '30 seconds',
      },
    ],
  },
  {
    id: 'shadow-light-balance',
    title: 'Balancing Shadow and Light',
    description: 'Neither shadow nor light should dominate. This meditation helps you find the center -- the place where both exist without conflict.',
    theme: 'integration',
    estimatedMinutes: 8,
    steps: [
      {
        instruction: 'Close your eyes. Breathe in slowly for four counts. Hold for two. Exhale for six. Repeat this three times.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Imagine two pools of energy inside you. One is dark, deep, and still -- your shadow. The other is bright, warm, and expansive -- your light.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Notice which pool feels larger right now. Are you more in shadow or more in light? There\'s no wrong answer. Just notice where the balance is today.',
        durationHint: '1 minute',
      },
      {
        instruction: 'If you\'re heavy in shadow, gently invite some light in. Not to erase the shadow, but to illuminate it. Imagine warm light pooling at the edges of the darkness.',
        durationHint: '1 minute',
      },
      {
        instruction: 'If you\'re heavy in light, gently invite some shadow in. Sometimes performing lightness is its own kind of hiding. Let yourself feel what\'s beneath the brightness.',
        durationHint: '1 minute',
      },
      {
        instruction: 'Now imagine the two pools meeting in the center. Where they touch, something new forms -- not dark, not light, but whole. This is integration. This is you, complete.',
        durationHint: '2 minutes',
      },
      {
        instruction: 'Rest in that center point. Feel both energies held in balance. You don\'t have to choose one. You are both. Take three breaths here.',
        durationHint: '1 minute',
      },
      {
        instruction: 'When you\'re ready, open your eyes. Carry this balance with you. It won\'t be perfect -- that\'s not the point. The point is knowing the center exists.',
        durationHint: '30 seconds',
      },
    ],
  },
  {
    id: 'let-it-through',
    title: 'Let It Through',
    description: 'When emotions are too big to hold, this meditation helps you let them pass through rather than getting stuck. For heavy days.',
    theme: 'release',
    estimatedMinutes: 7,
    steps: [
      {
        instruction: 'Sit or lie down. You don\'t have to be composed. You don\'t have to be strong. You just have to be here.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Name what you\'re feeling. Not in detail -- just the core of it. "Grief." "Rage." "Fear." "Exhaustion." Whatever it is, say it inwardly.',
        durationHint: '30 seconds',
      },
      {
        instruction: 'Now say: "This feeling is passing through me. I am not this feeling. I am the vessel it moves through." Repeat this as many times as you need.',
        durationHint: '1 minute',
      },
      {
        instruction: 'Imagine the emotion as water flowing through you. It entered through some old wound, and it will exit when it\'s done. You don\'t have to push it. You don\'t have to hold it. Just let it move.',
        durationHint: '2 minutes',
      },
      {
        instruction: 'If tears come, let them. If anger rises, let it exist. If numbness is all you feel, that\'s okay too. Numbness is the body\'s way of saying "not yet." Respect that.',
        durationHint: '1 minute',
      },
      {
        instruction: 'Place your hand on whatever part of your body feels heaviest. Hold it gently, the way you would hold a child who is hurting. You are both the adult and the child here.',
        durationHint: '1 minute',
      },
      {
        instruction: 'Take five slow breaths. With each exhale, release a little more. You survived today. That is enough. That is more than enough.',
        durationHint: '30 seconds',
      },
    ],
  },
]
