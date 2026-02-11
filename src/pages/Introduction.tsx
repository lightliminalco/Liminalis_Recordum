import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, saveProfile } from '../lib/db'

const SLIDES = [
  {
    title: 'You have hidden parts',
    body: "Throughout your life, you've pushed away parts of yourself -- anger, sadness, desires, fears. This is normal. Everyone does it to survive and belong. But those parts didn't disappear.",
    accent: 'from-purple-600 to-violet-500',
  },
  {
    title: 'They became your shadow',
    body: "Carl Jung called these hidden parts your \"shadow self.\" It's not evil -- it's just everything you were taught to hide. Your shadow holds enormous energy: creativity, passion, power. But when ignored, that energy leaks out as anxiety, addiction, self-sabotage, or numbness.",
    accent: 'from-violet-600 to-indigo-500',
  },
  {
    title: 'You are an energy vessel',
    body: "Your body carries this energy every day. When you suppress your shadow, you're capping a volcano -- the pressure has to go somewhere. Substance use, compulsive habits, explosive anger -- these aren't character flaws. They're unintegrated energy finding its own exit.",
    accent: 'from-indigo-600 to-purple-500',
  },
  {
    title: 'This journal is your control valve',
    body: "Here, you'll learn to meet your shadow gently. To listen to what it's been trying to tell you. And step by step, day by day, to redirect that energy from something that controls you into something that empowers you. One small change at a time.",
    accent: 'from-purple-500 to-fuchsia-500',
  },
]

export default function Introduction() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()

  const isLast = currentSlide === SLIDES.length - 1
  const slide = SLIDES[currentSlide]

  async function handleNext() {
    if (!isLast) {
      setCurrentSlide(currentSlide + 1)
      return
    }

    // Mark onboarding as complete
    const existingProfile = await getProfile()
    if (existingProfile) {
      await saveProfile({ ...existingProfile, hasCompletedOnboarding: true })
    }
    navigate('/journal', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-shadow-950 px-6">
      {/* Progress dots */}
      <div className="mb-10 flex gap-2">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === currentSlide
                ? 'w-8 bg-purple-400'
                : i < currentSlide
                  ? 'w-1.5 bg-purple-500/50'
                  : 'w-1.5 bg-purple-800/40'
            }`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="w-full max-w-sm text-center">
        <div
          className={`mx-auto mb-6 h-1 w-16 rounded-full bg-gradient-to-r ${slide.accent}`}
        />
        <h2 className="text-xl font-medium text-purple-100">
          {slide.title}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-purple-300/70">
          {slide.body}
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-12 w-full max-w-sm space-y-3">
        <button
          onClick={handleNext}
          className="w-full rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-600 hover:to-purple-500"
        >
          {isLast ? 'Begin My Journey' : 'Continue'}
        </button>

        {!isLast && (
          <button
            onClick={() => setCurrentSlide(SLIDES.length - 1)}
            className="w-full py-2 text-xs text-purple-500/40 transition-colors hover:text-purple-400/60"
          >
            Skip introduction
          </button>
        )}
      </div>
    </div>
  )
}
