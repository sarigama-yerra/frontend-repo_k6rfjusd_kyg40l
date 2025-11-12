import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Feather, Sparkles, Verified, Copy, Check, Cpu } from 'lucide-react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

// Lazy-load Spline so the heavy 3D bundle isn't fetched until explicitly enabled
const LazySpline = lazy(() => import('@splinetool/react-spline'))

function Stat({ label, value, children }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 min-w-0">
      <div className="text-xs uppercase tracking-wider text-white/60 truncate">{label}</div>
      {children ? (
        children
      ) : (
        <div className="text-white font-semibold mt-1 break-all text-sm">{value}</div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-fuchsia-300" /> {title}
      </h2>
      <div className="text-white/80 leading-relaxed space-y-4 text-base md:text-lg">
        {children}
      </div>
    </section>
  )
}

function formatAddress(addr) {
  if (!addr || typeof addr !== 'string') return addr
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update)
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update)
    }
  }, [])
  return reduced
}

function Copyable({ text, display, className = '' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }
  return (
    <div className={`group inline-flex items-center gap-2 mt-1 ${className}`}>
      <span className="text-white font-semibold break-all text-sm">{display}</span>
      <button
        aria-label="Copy"
        onClick={copy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-white/10 hover:bg-white/20 border border-white/10"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function App() {
  const [collection, setCollection] = useState(null)
  const prefersReduced = usePrefersReducedMotion()

  // Default to static to avoid any lag; users can opt-in to animation
  const [performanceMode, setPerformanceMode] = useState(false)

  // Track if hero is actually on screen; only then consider loading 3D
  const heroRef = useRef(null)
  const [heroInView, setHeroInView] = useState(false)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHeroInView(true)
            // We only need to know once
            observer.disconnect()
            break
          }
        }
      },
      { root: null, threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Respect reduced motion by forcing static mode
    if (prefersReduced) setPerformanceMode(false)
  }, [prefersReduced])

  useEffect(() => {
    fetch(`${API_BASE}/api/collection`).then(res => res.json()).then(setCollection).catch(() => {})
  }, [])

  const fullAddress = collection?.contract_address || '0x20a0cc3d86a6fbf803d4b448b200df3288a9104b'
  const shortAddress = useMemo(() => formatAddress(fullAddress), [fullAddress])

  // Only render heavy 3D when: user enabled + hero visible + not reduced motion
  const enable3D = performanceMode && heroInView && !prefersReduced

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col">
      {/* Hero */}
      <div ref={heroRef} className="relative h-[56vh] md:h-[72vh] w-full overflow-hidden will-change-auto">
        {enable3D ? (
          <Suspense fallback={null}>
            <LazySpline
              scene="https://prod.spline.design/44zrIZf-iQZhbQNQ/scene.splinecode"
              style={{ width: '100%', height: '100%' }}
            />
          </Suspense>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-700/40 via-black to-black" />
        )}

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black" />

        {/* Performance toggle */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setPerformanceMode(v => !v)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs"
            title={performanceMode ? 'Switch to static to improve performance' : 'Enable animated hero (heavier)'}
          >
            <Cpu className="w-4 h-4" /> {performanceMode ? 'Animated' : 'Static'} Hero
          </button>
        </div>

        <div className="absolute inset-0 flex items-end md:items-end">
          <div className="max-w-6xl mx-auto px-6 pb-10 w-full">
            {/* Keep animations minimal to reduce jank */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs mb-3">
                <Verified className="w-4 h-4 text-emerald-300" /> Official Collection
              </div>
              <h1 className="text-3xl md:text-6xl font-bold tracking-tight">
                The Clucker’s Collective
              </h1>
              <p className="mt-4 max-w-2xl text-white/80 text-sm md:text-base">
                Our most ambitious and collectible NFT series, available now on OpenSea.
              </p>

              <div className="mt-6 grid grid-cols-2 md:flex gap-3 text-sm">
                <Stat label="Minting" value="Lazy Minting" />
                <Stat label="Network" value={collection?.network || 'Polygon'} />
                <Stat label="Contract">
                  <Copyable text={fullAddress} display={shortAddress} />
                </Stat>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href={collection?.opensea_url || 'https://opensea.io/collection/the-cluckers-collective'} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-600 transition">
                  Explore on OpenSea <ExternalLink className="w-4 h-4" />
                </a>
                <a href="#about" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
                  Learn More
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <Section title="About The Clucker's Collective">
        <p>
          Welcome to The Clucker's Collective, an exclusive digital art project where we reimagine the familiar—and often comical—poultry experience for the Web3 world.
        </p>
        <p>
          The concept is simple yet absurdly creative: every chicken has a story, and it's definitely not what you think. The flagship NFT, aptly named "Iam Not a Dead Chicken Iam The Food Chicken", embodies our playful rebellion against the ordinary. This is art that is meant to be fun, visually striking, and a little bit subversive.
        </p>
      </Section>

      {/* Quality Section */}
      <Section title="Our Commitment to Quality">
        <ul className="list-disc pl-5 space-y-2">
          <li>Best Quality PNGs: Minted with high-fidelity PNG files for crisp detail, vibrant colors, and transparent backgrounds where applicable.</li>
          <li>Best Art: Unique character design and narrative — each piece is an original, collectible work of digital art.</li>
        </ul>
      </Section>

      {/* Lazy Minting */}
      <Section title="Built with Lazy Minting Technology">
        <p>
          To ensure maximum accessibility and efficiency, this entire collection was deployed using the Lazy Minting method. Your NFT is securely listed and authorized by us, but the official creation on the blockchain is delayed until the moment of purchase.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Lower Barrier for Creators: Gas fees are deferred to sale time, enabling more unique items without upfront risk.</li>
          <li>Blockchain Efficiency: Only minted when sold, reducing unnecessary transactions and minimizing environmental footprint.</li>
          <li>You Own the Moment: The buyer covers the gas fee during purchase and becomes the official first-time minter.</li>
        </ul>
      </Section>

      {/* Details */}
      <Section title="Collection Details">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="text-white/70">Collection Name</div>
            <div className="text-white font-medium">The Clucker's Collective</div>
          </div>
          <div className="space-y-2">
            <div className="text-white/70">Network</div>
            <div className="text-white font-medium">{collection?.network || 'Polygon'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-white/70">Deployment Contract Address</div>
            <div className="text-white font-medium break-all">
              <Copyable text={fullAddress} display={fullAddress} className="mt-0" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-white/70">OpenSea</div>
            <a className="inline-flex items-center gap-2 text-fuchsia-300 hover:text-fuchsia-200" href={collection?.opensea_url || 'https://opensea.io/collection/the-cluckers-collective'} target="_blank">
              View the Collection <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Section>

      {/* Entrepreneurial Use */}
      <Section title="More Than Just Art: A Mascot for the Entrepreneurial Spirit">
        <p>
          Beyond its artistic merit, "The Immortal Clucker" is designed with the entrepreneurial spirit in mind. Imagine this NFT as the digital mascot for your chicken center, restaurant, or pub. It's quirky, memorable, and instantly recognizable.
        </p>
        <p>
          Use it in your branding, digital menus, social media campaigns, or even as a unique conversation starter in your physical space. It injects personality and a playful edge that customers will love and remember.
        </p>
      </Section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/70">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4" /> The Clucker's Collective
          </div>
          <div className="text-sm">© {new Date().getFullYear()} Clucker’s Collective — All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
