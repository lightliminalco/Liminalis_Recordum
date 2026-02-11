export default function Lifeline() {
  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-light text-purple-100">The Lifeline</h2>
      <p className="mt-1 text-sm text-purple-300/50">
        You are not alone. Help is always available.
      </p>

      <div className="mt-8 space-y-4">
        {/* Universal resources */}
        <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
          <h3 className="text-sm font-medium text-purple-200">
            If you're in crisis right now
          </h3>
          <div className="mt-3 space-y-3">
            <a
              href="tel:988"
              className="flex items-center gap-3 rounded-lg border border-purple-700/20 bg-purple-900/20 p-3 transition-colors hover:border-purple-600/40"
            >
              <span className="text-lg">&#x1f4de;</span>
              <div>
                <p className="text-sm font-medium text-purple-100">
                  988 Suicide &amp; Crisis Lifeline
                </p>
                <p className="text-xs text-purple-400/60">
                  Call or text 988 (US)
                </p>
              </div>
            </a>
            <a
              href="sms:741741&body=HELLO"
              className="flex items-center gap-3 rounded-lg border border-purple-700/20 bg-purple-900/20 p-3 transition-colors hover:border-purple-600/40"
            >
              <span className="text-lg">&#x1f4ac;</span>
              <div>
                <p className="text-sm font-medium text-purple-100">
                  Crisis Text Line
                </p>
                <p className="text-xs text-purple-400/60">
                  Text HELLO to 741741 (US)
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Find local help */}
        <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
          <h3 className="text-sm font-medium text-purple-200">
            Find help in your area
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-purple-400/60">
            These databases are maintained by dedicated organizations and cover
            resources worldwide.
          </p>
          <div className="mt-3 space-y-2">
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-purple-700/20 bg-purple-900/20 p-3 text-sm text-purple-200 transition-colors hover:border-purple-600/40"
            >
              findahelpline.com
              <span className="ml-1 text-xs text-purple-400/40">
                &#x2197; Helplines by country
              </span>
            </a>
            <a
              href="https://www.iasp.info/resources/Crisis_Centres/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-purple-700/20 bg-purple-900/20 p-3 text-sm text-purple-200 transition-colors hover:border-purple-600/40"
            >
              IASP Crisis Centres
              <span className="ml-1 text-xs text-purple-400/40">
                &#x2197; International directory
              </span>
            </a>
          </div>
        </div>

        {/* Encouragement */}
        <div className="rounded-xl border border-amber-800/20 bg-amber-950/10 p-5">
          <p className="text-sm leading-relaxed text-amber-200/60">
            Reaching out for help is one of the strongest things you can do.
            Shadow work can surface difficult emotions -- that's part of the
            process. But you don't have to face the darkest moments alone.
          </p>
        </div>
      </div>
    </div>
  )
}
