'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// CSS class for GSAP entrance targets — avoids JSX re-render resetting inline opacity
/*
 * GSAP entrance: we animate wrappers, never the heading elements themselves.
 * Headings must be visible in initial HTML for crawlers (LCP + indexability).
 * Non-heading elements use opacity:0 start — crawlers tolerate this on body text.
 */
const GSAP_INIT_STYLE = `
  .gsap-hero { opacity: 0; transform: translateY(20px); }
  .gsap-hero-y12 { opacity: 0; transform: translateY(12px); }
  .gsap-hero-fade { opacity: 0; }
`

const DonutCanvas = dynamic(
  () => import('./DonutCanvas').then(m => m.DonutCanvas),
  { ssr: false }
)

gsap.registerPlugin(ScrollTrigger, useGSAP)

// ─── Constants ────────────────────────────────────────────────────────────────
const C = {
  bg: '#050505',
  text: '#eee8de',
  dim: 'rgba(238,232,222,0.5)',
  dimmer: 'rgba(238,232,222,0.25)',
  orange: '#ff4d00',
  orange2: '#ff8c00',
  mono: '"Courier New", Courier, monospace',
  rule: 'rgba(255,255,255,0.06)',
  sectionBg: 'rgba(5,5,5,0.92)',
}

// ─── Lenis smooth scroll ──────────────────────────────────────────────────────
function useLenis() {
  useEffect(() => {
    let lenis: import('lenis').default | null = null
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({ duration: 2.0, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add((time) => lenis!.raf(time * 1000))
      gsap.ticker.lagSmoothing(0)
    })
    return () => { lenis?.destroy() }
  }, [])
}

// ─── Custom cursor ────────────────────────────────────────────────────────────
function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let rx = 0, ry = 0, mx = 0, my = 0
    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', move)
    const loop = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12
      if (dot.current) { dot.current.style.left = mx + 'px'; dot.current.style.top = my + 'px' }
      if (ring.current) { ring.current.style.left = rx + 'px'; ring.current.style.top = ry + 'px' }
      requestAnimationFrame(loop)
    }
    loop()
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <>
      <div ref={dot} className="fixed z-[9999] pointer-events-none"
        style={{ width: 10, height: 10, borderRadius: '50%', background: C.orange, mixBlendMode: 'screen', transform: 'translate(-50%,-50%)' }} />
      <div ref={ring} className="fixed z-[9998] pointer-events-none"
        style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid rgba(255,77,0,0.5)`, transform: 'translate(-50%,-50%)', transition: 'width 0.3s, height 0.3s, border-color 0.3s' }} />
    </>
  )
}

// ─── CSS glow that listens to donut hover events ──────────────────────────────
function DonutGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: Event) => {
      const intensity = (e as CustomEvent<number>).detail
      if (ref.current) {
        ref.current.style.opacity = String(intensity * 0.25)
        ref.current.style.transform = `translate(-50%, -50%) scale(${1 + intensity * 0.3})`
      }
    }
    window.addEventListener('donut-hover', handler)
    return () => window.removeEventListener('donut-hover', handler)
  }, [])
  return (
    <div ref={ref} className="fixed pointer-events-none z-[2]"
      style={{
        left: '50%', top: '45%', width: 600, height: 600,
        transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(circle, rgba(255,77,0,0.18) 0%, rgba(255,140,0,0.08) 40%, transparent 70%)',
        filter: 'blur(20px)',
        opacity: 0,
        transition: 'opacity 0.3s, transform 0.6s',
        borderRadius: '50%',
      }} />
  )
}

// ─── Scanlines ────────────────────────────────────────────────────────────────
function Scanlines() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[5]"
      style={{
        background: 'repeating-linear-gradient(to bottom,transparent 0px,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)',
        opacity: 0.5,
      }} />
  )
}

// ─── HUD corners ─────────────────────────────────────────────────────────────
function HUDCorners() {
  const readout = useRef<HTMLDivElement>(null)
  const coords = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3)
      const y = (-(e.clientY / window.innerHeight) * 2 + 1).toFixed(3)
      if (readout.current)
        readout.current.innerHTML = `X: ${Number(x) >= 0 ? '+' : ''}${x}<br/>Y: ${Number(y) >= 0 ? '+' : ''}${y}<br/>Z: +7.000`
      if (coords.current) {
        const phi = ((e.clientX / window.innerWidth) * 360).toFixed(2).padStart(6, '0')
        const theta = ((e.clientY / window.innerHeight) * 180).toFixed(2).padStart(6, '0')
        coords.current.textContent = `φ ${phi}° · θ ${theta}°`
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <>
      <div id="hud-tl" className="fixed z-[100] pointer-events-none opacity-0" style={{ top: '5rem', left: '3rem' }}>
        <svg width="40" height="40" fill="none"><path d="M40 1H1v39" stroke="rgba(255,77,0,0.35)" strokeWidth="1" /></svg>
      </div>
      <div id="hud-br" className="fixed z-[100] pointer-events-none opacity-0" style={{ bottom: '2.5rem', right: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
        <div ref={readout} style={{ fontFamily: C.mono, fontSize: '0.6rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.22)', lineHeight: 1.8, textAlign: 'right' }}>
          X: +0.000<br />Y: +0.000<br />Z: +7.000
        </div>
        <svg width="40" height="40" fill="none" style={{ transform: 'rotate(180deg)' }}>
          <path d="M40 1H1v39" stroke="rgba(255,77,0,0.35)" strokeWidth="1" />
        </svg>
      </div>
      <div ref={coords} id="hero-coords" className="fixed z-[100] pointer-events-none opacity-0"
        style={{ bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', fontFamily: C.mono, fontSize: '0.6rem', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.18)' }}>
        φ 000.00° · θ 000.00°
      </div>
    </>
  )
}

// ─── Sidebar progress ─────────────────────────────────────────────────────────
function Sidebar() {
  const [active, setActive] = useState(0)
  const labels = ['Hero', 'Features', 'How it works', 'Catalog', 'Start']
  useEffect(() => {
    labels.forEach((_, i) => {
      const el = document.getElementById(`sec-${i + 1}`)
      if (!el) return
      ScrollTrigger.create({
        trigger: el, start: 'top center', end: 'bottom center',
        onToggle: self => { if (self.isActive) setActive(i) },
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div id="sidebar" className="fixed z-[100] opacity-0 hidden lg:flex flex-col gap-5"
      style={{ left: '2.5rem', top: '50%', transform: 'translateY(-50%)' }}>
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-3 cursor-pointer"
          onClick={() => document.getElementById(`sec-${i + 1}`)?.scrollIntoView({ behavior: 'smooth' })}>
          <div style={{ width: active === i ? 32 : 18, height: 1, background: active === i ? C.orange : 'rgba(255,255,255,0.15)', transition: 'width 0.4s, background 0.4s' }} />
          <span style={{ fontFamily: C.mono, fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: active === i ? C.orange : 'rgba(255,255,255,0.2)', transition: 'color 0.4s' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Typewriter ───────────────────────────────────────────────────────────────
const WORDS = ['timeline', 'kanban board', 'habit grid', 'budget tracker', 'focus timer', 'countdown ring']
function Typewriter() {
  const [idx, setIdx] = useState(0)
  const [txt, setTxt] = useState('')
  const [del, setDel] = useState(false)
  useEffect(() => {
    const word = WORDS[idx]
    let t: ReturnType<typeof setTimeout>
    if (!del && txt.length < word.length) t = setTimeout(() => setTxt(word.slice(0, txt.length + 1)), 75)
    else if (!del) t = setTimeout(() => setDel(true), 2200)
    else if (del && txt.length > 0) t = setTimeout(() => setTxt(txt.slice(0, -1)), 38)
    else { setDel(false); setIdx(i => (i + 1) % WORDS.length) }
    return () => clearTimeout(t)
  }, [txt, del, idx])
  return <span style={{ color: C.orange }}>{txt}<span style={{ animation: 'blink 1s step-end infinite' }}>_</span></span>
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav className="fixed top-0 left-0 right-0 z-[200]"
      style={{
        padding: '1.4rem 3rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: scrolled ? `1px solid ${C.rule}` : '1px solid transparent',
        background: scrolled ? 'rgba(5,5,5,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'background 0.4s, border-color 0.4s',
      }}>
      <span style={{ fontFamily: C.mono, fontSize: '0.7rem', letterSpacing: '0.3em', color: 'rgba(238,232,222,0.55)', textTransform: 'uppercase' }}>
        TASKVERSE / 2026
      </span>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-10">
        {['Features', 'How it works', 'Catalog'].map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
            style={{ fontFamily: C.mono, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(238,232,222,0.55)', textDecoration: 'none', transition: 'color 0.2s', padding: '0.5rem 0' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.orange)}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(238,232,222,0.55)')}>
            {l}
          </a>
        ))}
      </div>
      <div className="hidden md:flex items-center gap-4">
        <div id="nav-status" className="flex items-center gap-2 opacity-0"
          style={{ fontFamily: C.mono, fontSize: '0.65rem', letterSpacing: '0.12em', color: C.orange }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.orange, animation: 'blink 1.4s ease-in-out infinite' }} />
          LIVE · AI
        </div>
        <Link href="/login"
          style={{ fontFamily: C.mono, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(238,232,222,0.65)', textDecoration: 'none', padding: '0.65rem 1.4rem', border: '1px solid rgba(255,255,255,0.12)', transition: 'border-color 0.2s, color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,77,0,0.5)'; e.currentTarget.style.color = C.text }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(238,232,222,0.65)' }}>
          Sign in
        </Link>
        <Link href="/register"
          style={{ fontFamily: C.mono, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#050505', background: C.orange, padding: '0.65rem 1.6rem', textDecoration: 'none', transition: 'opacity 0.2s, box-shadow 0.2s', boxShadow: '0 0 0 rgba(255,77,0,0)' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,77,0,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 0 0 rgba(255,77,0,0)' }}>
          Get Started →
        </Link>
      </div>
      {/* Mobile hamburger */}
      <button className="md:hidden" style={{ background: 'none', border: 'none', color: C.text, cursor: 'none', fontSize: '1.2rem' }} onClick={() => setOpen(!open)}>
        {open ? '✕' : '☰'}
      </button>
      {open && (
        <div className="md:hidden fixed inset-x-0 top-[60px] z-[300]"
          style={{ background: 'rgba(5,5,5,0.97)', borderBottom: `1px solid ${C.rule}`, padding: '2rem 2rem' }}>
          {['Features', 'How it works', 'Catalog'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} onClick={() => setOpen(false)}
              style={{ display: 'block', fontFamily: C.mono, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dim, textDecoration: 'none', padding: '0.8rem 0', borderBottom: `1px solid ${C.rule}` }}>
              {l}
            </a>
          ))}
          <Link href="/register" onClick={() => setOpen(false)}
            style={{ display: 'block', marginTop: '1.5rem', fontFamily: C.mono, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#050505', background: C.orange, padding: '1rem', textDecoration: 'none', textAlign: 'center' }}>
            Get Started Free →
          </Link>
        </div>
      )}
    </nav>
  )
}

// ─── Section rule ─────────────────────────────────────────────────────────────
const Rule = () => <div style={{ width: '100%', height: 1, background: C.rule, position: 'relative', zIndex: 10, backgroundColor: C.sectionBg }} />

// ─── Section tag label ────────────────────────────────────────────────────────
const STag = ({ children, cls }: { children: React.ReactNode; cls?: string }) => (
  <p className={`s-tag ${cls ?? ''}`} style={{ fontFamily: C.mono, fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.orange, marginBottom: '1.2rem', opacity: 0, transform: 'translateY(12px)' }}>
    // {children}
  </p>
)

const SecNum = ({ n, cls }: { n: string; cls?: string }) => (
  <div className={`s-num ${cls ?? ''}`} style={{ fontFamily: C.mono, fontSize: '0.58rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.12)', marginBottom: '2.5rem', opacity: 0 }}>
    {n}
  </div>
)

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatCard({ icon, title, desc, stat, statLabel }: { icon: string; title: string; desc: string; stat?: string; statLabel?: string }) {
  return (
    <div className="s-feat-card" style={{ borderTop: `1px solid ${C.rule}`, paddingTop: '2rem', paddingBottom: '2rem', opacity: 0, transform: 'translateY(24px)' }}>
      <div style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.6rem', color: C.text }}>{title}</h3>
      <p style={{ fontSize: '0.82rem', lineHeight: 1.7, color: C.dim, maxWidth: '32ch' }}>{desc}</p>
      {stat && (
        <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: C.orange, lineHeight: 1 }}>{stat}</span>
          <span style={{ fontFamily: C.mono, fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>{statLabel}</span>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LandingPage() {
  useLenis()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Nav status
    gsap.to('#nav-status', { opacity: 1, duration: 1, delay: 1.5 })
    gsap.to('#sidebar', { opacity: 1, duration: 0.8, delay: 1.4 })

    // HUD entrance
    gsap.to('#hud-tl, #hud-br', { opacity: 1, duration: 1, delay: 1.2, stagger: 0.2 })

    // Hero entrance
    gsap.timeline({ delay: 0.3 })
      .to('#hero-eyebrow', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      .fromTo('#hero-title', { y: 30 }, { y: 0, duration: 1.0, ease: 'power3.out' }, '-=0.2')
      .to('#hero-sub', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .to('#hero-meta', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
      .to('#hero-scroll', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
      .to('#hero-coords', { opacity: 1, duration: 0.5 }, '-=0.3')

    // Hide HUD when scrolling past hero
    ScrollTrigger.create({
      trigger: '#sec-2', start: 'top 90%',
      onEnter: () => gsap.to('#hud-tl, #hud-br, #hero-coords, #sidebar', { opacity: 0, duration: 0.4 }),
      onLeaveBack: () => gsap.to('#hud-tl, #hud-br, #hero-coords, #sidebar', { opacity: 1, duration: 0.4 }),
    })

    // Generic reveal for all .rev-up and .rev-stagger
    gsap.utils.toArray<HTMLElement>('.rev-up').forEach(el => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
    })

    // Section 2 — features
    gsap.timeline({ scrollTrigger: { trigger: '#sec-2', start: 'top 60%' } })
      .to('#sec-2 .s-num', { opacity: 1, duration: 0.4 })
      .to('#sec-2 .s-tag', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.1')
      .fromTo('#sec-2 .s-h2', { y: 24 }, { y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.2')
      .to('#sec-2 .s-body', { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
      .to('#sec-2 .s-feat-card', { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, '-=0.1')

    // Section 3 — how it works
    gsap.timeline({ scrollTrigger: { trigger: '#sec-3', start: 'top 65%' } })
      .to('#sec-3 .s-num', { opacity: 1, duration: 0.4 })
      .to('#sec-3 .s-tag', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.1')
      .fromTo('#sec-3 .s-h2', { y: 24 }, { y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.2')
      .to('#sec-3 .s-body', { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
      .to('#sec-3 .s-step', { opacity: 1, y: 0, duration: 0.4, stagger: 0.12, ease: 'power2.out' }, '-=0.2')

    // Section 4 — catalog
    gsap.timeline({ scrollTrigger: { trigger: '#sec-4', start: 'top 65%' } })
      .to('#sec-4 .s-num', { opacity: 1, duration: 0.4 })
      .to('#sec-4 .s-tag', { opacity: 1, y: 0, duration: 0.5 }, '-=0.1')
      .fromTo('#sec-4 .s-h2', { y: 24 }, { y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.2')
      .to('#sec-4 .s-body', { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
      .to('#sec-4 .s-list li', { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }, '-=0.2')

    // Section 5 — CTA
    gsap.timeline({ scrollTrigger: { trigger: '#sec-5', start: 'top 70%' } })
      .to('#sec-5 .s-tag', { opacity: 1, y: 0, duration: 0.5 })
      .fromTo('#sec-5 .s-h2', { y: 28 }, { y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.2')
      .to('#sec-5 .s-body', { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
      .to('#sec-5 .s-cta', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
      .to('#sec-5 .s-proof', { opacity: 1, duration: 0.5 }, '-=0.2')

  }, { scope: containerRef })

  const sectionStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'relative', zIndex: 10,
    background: C.sectionBg,
    backdropFilter: 'blur(2px)',
    ...extra,
  })

  return (
    <div ref={containerRef} style={{ background: C.bg, color: C.text, minHeight: '100vh', overflowX: 'hidden', cursor: 'none' }}>
      <style>{GSAP_INIT_STYLE}</style>
      {/* WebGL donut — fixed behind everything */}
      <DonutCanvas />
      {/* CSS glow layer that reacts to donut hover */}
      <DonutGlow />
      <Scanlines />
      <Cursor />
      <HUDCorners />
      <Sidebar />
      <Nav />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SEC 1 — HERO                                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section id="sec-1" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '7rem 3rem 3rem', position: 'relative', zIndex: 10 }}>
        {/* No background — canvas shows through here */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2vh' }}>
          {/* Topic label */}
          <div id="hero-eyebrow" className="gsap-hero" style={{ fontFamily: C.mono, fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: C.orange, marginBottom: '1.6rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ display: 'inline-block', width: 24, height: 1, background: C.orange }} />
            AI-Powered Todo Platform
            <span style={{ display: 'inline-block', width: 24, height: 1, background: C.orange }} />
          </div>

          {/* Main headline — primary keyword in H1 for SEO, visual brand on first line */}
          <h1 id="hero-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 5rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', textTransform: 'uppercase', textAlign: 'center' }}>
            TaskVerse
            <span style={{ display: 'block', fontSize: 'clamp(0.9rem, 1.5vw, 1.4rem)', fontWeight: 300, letterSpacing: '0.04em', textTransform: 'none', color: 'rgba(238,232,222,0.45)', marginTop: '0.6rem' }}>
              AI Todo That Builds Itself
            </span>
          </h1>

          {/* Slogan — one clear line */}
          <p id="hero-sub" className="gsap-hero" style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: 'clamp(1rem, 2vw, 1.4rem)', fontWeight: 300, color: C.dim, letterSpacing: '0.01em', lineHeight: 1.5 }}>
            The workspace that <span style={{ color: C.orange, fontWeight: 600 }}>builds itself</span> around your goals.
          </p>

          {/* Supporting line with typewriter */}
          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.84rem', color: 'rgba(238,232,222,0.35)', lineHeight: 1.7, fontFamily: C.mono, letterSpacing: '0.04em', opacity: 1 }}>
            Type a goal → AI renders a <Typewriter /> instantly
          </p>

          {/* CTAs */}
          <div id="hero-meta" className="gsap-hero-y12" style={{ display: 'flex', gap: '1.2rem', marginTop: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/register"
              style={{ fontFamily: C.mono, fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#050505', background: C.orange, padding: '0.9rem 2.2rem', textDecoration: 'none', transition: 'opacity 0.2s', boxShadow: '0 0 30px rgba(255,77,0,0.45)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Start Free →
            </Link>
            <Link href="/login"
              style={{ fontFamily: C.mono, fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(238,232,222,0.6)', border: '1px solid rgba(255,255,255,0.12)', padding: '0.9rem 2rem', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,77,0,0.45)'; e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(238,232,222,0.6)' }}>
              Sign in
            </Link>
          </div>

          {/* Trust line */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Free forever', 'No credit card', '2K+ users'].map((t, i) => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: C.mono, fontSize: '0.58rem', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>
                {i > 0 && <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,77,0,0.4)', display: 'inline-block' }} />}
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom — scroll hint + coords */}
        <div id="hero-scroll" className="gsap-hero-y12" style={{ display: 'flex', justifyContent: 'center', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontFamily: C.mono, fontSize: '0.58rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
              ↑ hover the donut to interact ↑
            </span>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float-anim 2.5s ease-in-out infinite' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M3 9l5 5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontFamily: C.mono, fontSize: '0.56rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.14)' }}>
              Scroll to explore
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SEC 2 — FEATURES                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section id="sec-2" style={sectionStyle({ padding: 'clamp(5rem,10vh,8rem) clamp(2rem,5vw,5rem)' })}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: '4rem' }}>
            <SecNum n="01 / 04" />
            <STag>Features</STag>
            <h2 className="s-h2" style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em', maxWidth: '16ch' }}>
              Built different,<br />
              <span style={{ color: C.orange }}>by design.</span>
            </h2>
            <p className="s-body" style={{ marginTop: '1.5rem', fontSize: '0.88rem', lineHeight: 1.8, color: C.dim, maxWidth: '48ch', opacity: 0, transform: 'translateY(14px)' }}>
              TaskVerse isn&apos;t a smarter to-do list. It&apos;s a generative interface engine — the AI assembles the workspace around your intent, not the other way around.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0 3rem' }}>
            <FeatCard
              icon="🪄"
              title="Generative UI"
              desc="Describe any goal in plain language. The AI picks from 11 purpose-built components and assembles a custom interface — streamed live via SSE."
              stat="11"
              statLabel="AI components"
            />
            <FeatCard
              icon="⚡"
              title="XP & Leveling"
              desc="Earn 20 XP for every completed task. Hit 500 XP to level up. Confetti fires on level-up. Gamification that actually motivates."
              stat="500"
              statLabel="XP per level"
            />
            <FeatCard
              icon="🔥"
              title="Daily Streaks"
              desc="Your streak counter resets if you miss a day. A flame badge tracks your current run. Come back every day or lose it all."
              stat="7×"
              statLabel="streak multiplier"
            />
            <FeatCard
              icon="🤖"
              title="Gemini 1.5 Flash"
              desc="Google's fastest multimodal model generates declarative JSON specs validated by Zod — never raw executable code. Zero prompt injection risk."
              stat="480ms"
              statLabel="avg generation"
            />
            <FeatCard
              icon="🔒"
              title="Secure by design"
              desc="AI output is validated against a strict Zod schema before hitting the renderer. The component registry is the second security boundary."
              stat="0"
              statLabel="code injection risk"
            />
            <FeatCard
              icon="📌"
              title="Pin any canvas"
              desc="Save any AI-generated layout as a named canvas. Your Europe trip board, study plan, and sprint backlog — persisted exactly as the AI built them."
              stat="∞"
              statLabel="saved canvases"
            />
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: C.rule, position: 'relative', zIndex: 10, backgroundColor: C.sectionBg }} />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SEC 3 — HOW IT WORKS                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section id="sec-3" style={sectionStyle({ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' })}>
        {/* Left — text */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(4rem,8vh,7rem) clamp(3rem,5vw,5rem)', borderRight: `1px solid ${C.rule}` }}>
          <SecNum n="02 / 04" />
          <STag>How it works</STag>
          <h2 className="s-h2" style={{ fontSize: 'clamp(2rem,3.5vw,3.2rem)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Type it.<br />
            Watch it <span style={{ color: C.orange }}>build.</span>
          </h2>
          <p className="s-body" style={{ fontSize: '0.86rem', lineHeight: 1.8, color: C.dim, maxWidth: '36ch', marginBottom: '3rem', opacity: 0, transform: 'translateY(14px)' }}>
            Four steps from intent to rendered interface — no template to pick, no fields to fill.
          </p>

          {[
            { n: '01', title: 'Type your goal', body: 'Write anything — "plan my Europe trip", "study for finals", "track morning habits", "budget for wedding".' },
            { n: '02', title: 'AI selects components', body: 'Gemini 1.5 Flash picks from 11 components and returns a Zod-validated JSON LayoutSpec in real-time via SSE.' },
            { n: '03', title: 'Interface streams in', body: 'The GenUI renderer maps each spec node to a real React component. You watch it appear piece by piece.' },
            { n: '04', title: 'Save & come back', body: 'Pin any canvas by name. Your boards persist exactly as the AI built them. Edit tasks directly inside.' },
          ].map(s => (
            <div key={s.n} className="s-step" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.8rem', opacity: 0, transform: 'translateY(16px)' }}>
              <span style={{ fontFamily: C.mono, fontSize: '0.58rem', letterSpacing: '0.2em', color: C.orange, paddingTop: '0.1rem', flexShrink: 0 }}>{s.n}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.7, color: C.dim }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right — terminal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 3rem' }}>
          <div style={{ width: '100%', maxWidth: 440, border: `1px solid ${C.rule}`, padding: '2rem', fontFamily: C.mono, fontSize: '0.72rem', lineHeight: 2.2, background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ color: 'rgba(255,77,0,0.5)', fontSize: '0.56rem', letterSpacing: '0.25em', marginBottom: '1.5rem', borderBottom: `1px solid ${C.rule}`, paddingBottom: '1rem' }}>
              TASKVERSE · GENUI ENGINE · v2.0 · LIVE
            </div>
            <div><span style={{ color: C.orange }}>❯</span> <span style={{ color: C.text }}>Plan my Europe trip in March</span></div>
            <div style={{ color: C.dimmer, paddingLeft: '1.2rem' }}>  Parsing intent...</div>
            <div style={{ color: C.dimmer, paddingLeft: '1.2rem' }}>  Selecting components...</div>
            <div style={{ height: '0.5rem' }} />
            <div><span style={{ color: '#4ade80' }}>✓</span> <span style={{ color: 'rgba(255,255,255,0.5)' }}>Timeline</span> → <span style={{ color: C.text }}>rendered</span></div>
            <div><span style={{ color: '#4ade80' }}>✓</span> <span style={{ color: 'rgba(255,255,255,0.5)' }}>BudgetTracker</span> → <span style={{ color: C.text }}>rendered</span></div>
            <div><span style={{ color: '#4ade80' }}>✓</span> <span style={{ color: 'rgba(255,255,255,0.5)' }}>ChecklistGroup</span> → <span style={{ color: C.text }}>rendered</span></div>
            <div style={{ height: '0.5rem' }} />
            <div style={{ color: C.dimmer, paddingLeft: '1.2rem' }}>  Stream complete · 480ms</div>
            <div style={{ height: '0.8rem' }} />
            <div style={{ borderTop: `1px solid ${C.rule}`, paddingTop: '1rem' }}>
              <div style={{ color: 'rgba(255,77,0,0.7)', fontSize: '0.58rem', letterSpacing: '0.2em' }}>CANVAS SAVED · +20 XP EARNED</div>
              <div style={{ color: 'rgba(255,140,0,0.6)', fontSize: '0.58rem', letterSpacing: '0.2em' }}>STREAK: 7 DAYS 🔥 · LEVEL 12</div>
            </div>
            <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: C.orange }}>❯</span>
              <span style={{ color: 'rgba(255,255,255,0.12)', animation: 'blink 1s step-end infinite' }}>_</span>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: C.rule, position: 'relative', zIndex: 10, backgroundColor: C.sectionBg }} />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SEC 4 — COMPONENT CATALOG                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section id="sec-4" style={sectionStyle({ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '80vh' })}>
        {/* Right side gets content, left is visual */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 3rem', borderRight: `1px solid ${C.rule}`, flexWrap: 'wrap', gap: '0' }}>
          {[
            { name: 'TaskCard', icon: '☑️' },
            { name: 'KanbanBoard', icon: '📋' },
            { name: 'Timeline', icon: '📅' },
            { name: 'HabitGrid', icon: '🟩' },
            { name: 'CalendarView', icon: '📆' },
            { name: 'CountdownRing', icon: '⏱️' },
            { name: 'BudgetTracker', icon: '💰' },
            { name: 'FocusTimer', icon: '🍅' },
            { name: 'ProgressDashboard', icon: '📊' },
            { name: 'ChecklistGroup', icon: '✅' },
            { name: 'TaskList', icon: '📝' },
          ].map(({ name, icon }) => (
            <div key={name}
              style={{ width: '50%', padding: '1.2rem 0', borderBottom: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', gap: '0.8rem' }}
              onMouseEnter={e => { (e.currentTarget.querySelector('.comp-name') as HTMLElement).style.color = C.orange }}
              onMouseLeave={e => { (e.currentTarget.querySelector('.comp-name') as HTMLElement).style.color = C.dim }}>
              <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{icon}</span>
              <span className="comp-name" style={{ fontFamily: C.mono, fontSize: '0.65rem', letterSpacing: '0.06em', color: C.dim, transition: 'color 0.2s' }}>{name}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(4rem,8vh,7rem) clamp(3rem,5vw,5rem)' }}>
          <SecNum n="03 / 04" />
          <STag>Component Catalog</STag>
          <h2 className="s-h2" style={{ fontSize: 'clamp(2rem,3.5vw,3.2rem)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            11 components.<br />
            <span style={{ color: C.orange }}>One AI picks.</span>
          </h2>
          <p className="s-body" style={{ fontSize: '0.86rem', lineHeight: 1.8, color: C.dim, maxWidth: '36ch', marginBottom: '2.5rem', opacity: 0, transform: 'translateY(14px)' }}>
            Every component is purpose-built. The AI decides which combination fits your goal — you never open a template picker again.
          </p>

          <ul className="s-list" style={{ listStyle: 'none', borderTop: `1px solid ${C.rule}` }}>
            {[
              ['Zod-validated specs', 'Every AI response is schema-checked before render'],
              ['Component registry', 'Unknown component names are silently dropped (security)'],
              ['SSE streaming', 'Components appear progressively as Gemini generates'],
              ['Pinnable canvases', 'Save any generated layout by intent name'],
            ].map(([title, desc]) => (
              <li key={title} style={{ padding: '1rem 0', borderBottom: `1px solid ${C.rule}`, opacity: 0, transform: 'translateY(12px)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <span style={{ color: C.orange, flexShrink: 0, paddingTop: '0.1rem' }}>→</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.2rem' }}>{title}</div>
                    <div style={{ fontSize: '0.74rem', color: C.dimmer, lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div style={{ height: 1, background: C.rule, position: 'relative', zIndex: 10, backgroundColor: C.sectionBg }} />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SEC 5 — STATS + CTA                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section id="sec-5" style={sectionStyle()}>
        {/* Stats row */}
        <div style={{ borderBottom: `1px solid ${C.rule}`, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { n: '11', l: 'AI Components' },
            { n: '2K+', l: 'Active Users' },
            { n: '99%', l: 'Uptime SLA' },
            { n: '480ms', l: 'Avg Gen Time' },
          ].map(({ n, l }) => (
            <div key={l} className="rev-up" style={{ padding: '3rem 2rem', borderRight: `1px solid ${C.rule}`, textAlign: 'center', opacity: 0, transform: 'translateY(20px)' }}>
              <div style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 900, color: C.orange, lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: C.mono, fontSize: '0.56rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: '0.6rem' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'clamp(5rem,12vh,9rem) 3rem' }}>
          <STag cls="s-tag">Get started free</STag>
          <h2 className="s-h2" style={{ fontSize: 'clamp(2.4rem,5vw,5.5rem)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', textTransform: 'uppercase', marginBottom: '1.8rem', maxWidth: '18ch' }}>
            Build your<br />
            <span style={{ color: C.orange }}>perfect workspace.</span>
          </h2>
          <p className="s-body" style={{ fontSize: '0.9rem', lineHeight: 1.8, color: C.dim, maxWidth: '44ch', marginBottom: '3rem', opacity: 0, transform: 'translateY(14px)' }}>
            Free forever. No credit card. The AI assembles the interface — you just describe what you need.
          </p>
          <div className="s-cta" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', opacity: 0, transform: 'translateY(14px)' }}>
            <Link href="/register"
              style={{ fontFamily: C.mono, fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#050505', background: C.orange, padding: '1.1rem 2.5rem', textDecoration: 'none', boxShadow: '0 0 40px rgba(255,77,0,0.45)', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Start for free →
            </Link>
            <Link href="/login"
              style={{ fontFamily: C.mono, fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.dimmer, textDecoration: 'none', border: `1px solid ${C.rule}`, padding: '1.1rem 2rem', transition: 'border-color 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,77,0,0.4)'; e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.color = C.dimmer }}>
              Sign in
            </Link>
          </div>
          <div className="s-proof" style={{ marginTop: '3rem', display: 'flex', gap: '3rem', justifyContent: 'center', flexWrap: 'wrap', opacity: 0 }}>
            {['Next.js 15', 'NestJS', 'MongoDB Atlas', 'Gemini 1.5 Flash', 'Upstash Redis'].map(t => (
              <span key={t} style={{ fontFamily: C.mono, fontSize: '0.54rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.14)' }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ── */}
      <footer style={{ position: 'relative', zIndex: 10, background: C.sectionBg, borderTop: `1px solid ${C.rule}`, padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontFamily: C.mono, fontSize: '0.56rem', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>
          TASKVERSE / {new Date().getFullYear()} · GENERATIVE UI PLATFORM
        </span>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'GitHub', href: 'https://github.com/taskverse' },
            { label: 'Contact', href: 'mailto:hello@taskverse.app' },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{ fontFamily: C.mono, fontSize: '0.54rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.orange)}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}>
              {label}
            </a>
          ))}
        </div>
      </footer>

      <style jsx global>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes float-anim { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-7px) } }
        * { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:auto; }
        body { overflow-x:hidden; }
        /* Fix duplicate id warning — only the last id in a tag is used by browser, React dedupes */
      `}</style>
    </div>
  )
}
