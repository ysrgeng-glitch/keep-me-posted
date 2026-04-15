import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ImpactBadge from '../components/common/ImpactBadge'
import RegionTag from '../components/common/RegionTag'
import VerificationBadge from '../components/common/VerificationBadge'
import KPICards from '../components/dashboard/KPICards'
import { formatRelativeTime } from '../utils/scoring'
import { useMarketPrices } from '../hooks/useMarketPrices'

const KNOWN_TRUSTED_SOURCES = new Set([
  'Beef Central', 'Sheep Central', 'MLA News', 'Stock Journal', 'The Land',
  'Farm Online', 'ABC Rural', 'ABC News AU', 'ABC News', 'Grain Central',
  'Weekly Times', 'The Cattle Site', 'Drovers', 'Global Meat News',
  'Beef Magazine', 'AHDB Beef & Lamb', 'USDA AMS Livestock', 'Reuters Trade',
  'Reuters', 'Bloomberg', 'AP', 'AAP', 'The Guardian', 'AgWeb',
  'Australian Financial Review', 'The Australian', 'SBS News',
])
const KNOWN_OFFICIAL_SOURCES = new Set([
  'MLA News', 'ABARES', 'ABS', 'BOM', 'DAFF', 'Australian Government',
  'Department of Agriculture', 'USDA AMS Livestock', 'AHDB Beef & Lamb',
])
function resolveVerification(status, source) {
  if (status === 'UNCONFIRMED' && KNOWN_OFFICIAL_SOURCES.has(source)) return 'VERIFIED_OFFICIAL'
  if (status === 'UNCONFIRMED' && KNOWN_TRUSTED_SOURCES.has(source))  return 'ANALYST_INFERENCE'
  return status
}

// ── Client-side briefing script generator ────────────────────────────────────
// Generates a full spoken briefing from articles loaded in the browser.
// Used when the stored briefing is too short or missing — requires no API key,
// no deployment, and no external service of any kind.

function generateLocalScript(articles, dateLabel) {
  if (!articles || articles.length === 0) return ''
  const high   = articles.filter(a => a.impact === 'HIGH')
  const medium = articles.filter(a => a.impact === 'MEDIUM')
  const low    = articles.filter(a => a.impact === 'LOW')
  const parts  = []

  // INTRO — describe only what actually exists today
  const alertSummary = high.length > 0
    ? `${high.length} critical alert${high.length !== 1 ? 's' : ''} and ${medium.length + low.length} further development${medium.length + low.length !== 1 ? 's' : ''}`
    : `${articles.length} new development${articles.length !== 1 ? 's' : ''}`
  parts.push(
    `Good morning. It is ${dateLabel}. I am your Grasshopper News intelligence analyst. ` +
    `Today's briefing covers ${alertSummary} in the Australian beef and lamb industry.`
  )

  // SECTION ONE — CRITICAL ALERTS (only when high-impact articles exist)
  if (high.length > 0) {
    parts.push(`Moving to critical alerts. ${high.length} development${high.length !== 1 ? 's' : ''} require your immediate attention.`)
    for (const a of high) {
      const reg = (a.regions ?? []).filter(r => r !== 'National').join(' and ') || 'national operations'
      const why = a.whyItMatters ? ` ${a.whyItMatters}` : (a.summary ? ` ${a.summary}` : '')
      const rec = a.strategicRecommendation ? ` Recommendation: ${a.strategicRecommendation}.` : ''
      const stm = a.shortTermImpact ? ` Short-term: ${a.shortTermImpact}.` : ''
      parts.push(`${a.headline}. This affects ${reg}.${why}${stm}${rec}`)
    }
  }

  // SECTION TWO — MARKET INTELLIGENCE (only when relevant articles exist)
  const market = articles
    .filter(a => ['Market & Economy', 'Export / Trade', 'Forecasts / Projections', 'Production Costs'].includes(a.category))
    .slice(0, 5)
  if (market.length > 0) {
    parts.push(`Moving to market intelligence.`)
    for (const a of market) {
      const why = a.whyItMatters ? ` ${a.whyItMatters}` : ''
      const med = a.mediumTermImpact ? ` Looking further ahead: ${a.mediumTermImpact}.` : ''
      parts.push(`${a.headline}.${why}${med}`)
    }
  }

  // SECTION THREE — GLOBAL SIGNALS (only when international articles exist)
  const global = articles
    .filter(a => (a.regions ?? []).some(r => ['Global', 'USA', 'China', 'International', 'NZ', 'EU', 'Brazil'].includes(r)))
    .slice(0, 4)
  if (global.length > 0) {
    parts.push(`Moving to global signals.`)
    for (const a of global) {
      const why = a.whyItMatters ? ` ${a.whyItMatters}` : ''
      parts.push(`${a.headline}.${why}`)
    }
  }

  // SECTION FOUR — DOMESTIC INDUSTRY (only when domestic medium/low articles exist)
  const domestic = [...medium, ...low]
    .filter(a => !(a.regions ?? []).some(r => ['Global', 'USA', 'China', 'Brazil', 'EU'].includes(r)))
    .slice(0, 6)
  if (domestic.length > 0) {
    parts.push(`Moving to domestic industry news.`)
    for (const a of domestic) {
      const why = a.whyItMatters ? ` ${a.whyItMatters}` : (a.summary ? ` ${a.summary}` : '')
      const stm = a.shortTermImpact ? ` Short-term outlook: ${a.shortTermImpact}.` : ''
      parts.push(`${a.headline}.${why}${stm}`)
    }
  }

  // SECTION FIVE — STRATEGIC OUTLOOK (only when enough articles to warrant it)
  if (articles.length >= 4) {
    const topRisk = high[0] ?? medium[0]
    const topOpp  = medium.find(a => (a.sentiment ?? 0) > 0) ?? medium[0]
    if (topRisk || topOpp) {
      parts.push(`Finally, the strategic outlook.`)
      if (topRisk) parts.push(`The biggest risk today: ${topRisk.headline.toLowerCase()}. ${topRisk.strategicRecommendation ?? ''}`)
      if (topOpp && topOpp !== topRisk) parts.push(`The primary opportunity: ${topOpp.headline.toLowerCase()}. ${topOpp.strategicRecommendation ?? ''}`)
    }
  }

  // OUTRO
  parts.push(`That concludes your Grasshopper News briefing for ${dateLabel}. Stay informed, stay ahead.`)

  return parts.filter(Boolean).join(' ')
}

// ── Morning Intelligence Podcast Player ──────────────────────────────────────

function PodcastPlayer({ briefing, refreshBriefing, allArticles }) {
  const [playing,       setPlaying]       = useState(false)
  const [paused,        setPaused]        = useState(false)
  const [progress,      setProgress]      = useState(0)
  const [elapsed,       setElapsed]       = useState(0)
  const [totalSecs,     setTotalSecs]     = useState(0)
  const [showTranscript,setShowTranscript]= useState(false)
  const [regenerating,  setRegenerating]  = useState(false)
  const [regenStatus,   setRegenStatus]   = useState(null) // null | 'ok' | 'error'
  const [supported]    = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
  const utteranceRef   = useRef(null)
  const timerRef       = useRef(null)
  const resumeRef      = useRef(null)  // Chrome keepalive interval
  const startTimeRef   = useRef(0)
  const elapsedAtPause = useRef(0)

  // Build the spoken script:
  // 1. Use the stored briefing_text if it has enough content (≥ 50 words)
  // 2. Otherwise generate the full script client-side from the loaded articles —
  //    this requires no API key, no deployment, and works with both mock and live data
  const ttsText = useMemo(() => {
    const strip = (text) => text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/^#{1,3}\s/gm, '')
      .replace(/•\s/g, '. ')
      .replace(/\n{2,}/g, ' ')
      .replace(/\n/g, ' ')
      .trim()

    const stored = briefing?.briefing_text ? strip(briefing.briefing_text) : ''
    const storedWords = stored.split(/\s+/).filter(Boolean).length

    if (storedWords >= 50) return stored   // real briefing — use it

    // Stored text is too short (placeholder / Groq error) — generate locally
    const dateLabel = briefing?.briefing_date
      ? new Date(briefing.briefing_date + 'T00:00:00').toLocaleDateString('en-AU', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
      : new Date().toLocaleDateString('en-AU', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })

    // Filter to last 24 hours before generating locally — same window as the server
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recent = (allArticles ?? []).filter(a => {
      const ts = a.publishedAt ?? a.published_at
      return ts ? new Date(ts) >= cutoff24h : false
    })
    return generateLocalScript(recent, dateLabel)
  }, [briefing?.briefing_text, briefing?.briefing_date, allArticles])

  const wordCount        = useMemo(() => ttsText.split(/\s+/).filter(Boolean).length, [ttsText])
  const estimatedMinutes = useMemo(() => Math.max(1, Math.round(wordCount / 125)), [wordCount])
  // Briefing is considered "short" if the local script also has no content
  const isShortBriefing  = wordCount < 50

  useEffect(() => { setTotalSecs(estimatedMinutes * 60) }, [estimatedMinutes])

  // Stop playback when briefing content changes (e.g. after regeneration)
  useEffect(() => {
    window.speechSynthesis?.cancel()
    clearInterval(timerRef.current)
    clearInterval(resumeRef.current)
    setPlaying(false); setPaused(false); setProgress(0); setElapsed(0)
    elapsedAtPause.current = 0
  }, [briefing?.id, briefing?.briefing_text])

  // Cleanup on unmount
  useEffect(() => () => {
    window.speechSynthesis?.cancel()
    clearInterval(timerRef.current)
    clearInterval(resumeRef.current)
  }, [])

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const total = elapsedAtPause.current + Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsed(total)
      setProgress(Math.min(100, (total / totalSecs) * 100))
    }, 500)
  }, [totalSecs])

  const stopTimer = useCallback(() => { clearInterval(timerRef.current) }, [])

  const startResumeKeepalive = useCallback(() => {
    // Chrome stops speaking silently after ~15 s on long texts.
    // Pausing + immediately resuming every 10 s keeps it alive.
    clearInterval(resumeRef.current)
    resumeRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10_000)
  }, [])

  const stopResumeKeepalive = useCallback(() => {
    clearInterval(resumeRef.current)
  }, [])

  const play = useCallback(() => {
    if (!supported || !ttsText) return
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false); setPlaying(true); startTimer(); startResumeKeepalive()
      return
    }
    window.speechSynthesis.cancel()
    clearInterval(timerRef.current)
    clearInterval(resumeRef.current)
    elapsedAtPause.current = 0
    setElapsed(0); setProgress(0)

    const speak = (voices) => {
      const u = new SpeechSynthesisUtterance(ttsText)
      u.rate  = 1.15   // slightly faster — sounds more like a real presenter
      u.pitch = 1.0
      u.lang  = 'en-AU'

      // Voice priority: Google neural (Chrome) → macOS Premium → any en-AU → any en
      // Google neural voices sound genuinely human; premium macOS voices are close.
      const GOOGLE_PREFERRED = [
        'Google Australian English',
        'Google US English',
        'Google UK English Female',
        'Google UK English Male',
      ]
      const MACOS_PREFERRED = [
        'Karen',      // en-AU, natural on macOS
        'Samantha',   // en-US, very clear on macOS
        'Daniel',     // en-GB, clear
      ]

      const best =
        GOOGLE_PREFERRED.reduce((found, name) => found || voices.find(v => v.name === name), null) ||
        voices.find(v => v.lang === 'en-AU' && (v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Neural'))) ||
        voices.find(v => v.lang.startsWith('en') && (v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Neural'))) ||
        MACOS_PREFERRED.reduce((found, name) => found || voices.find(v => v.name === name), null) ||
        voices.find(v => v.lang === 'en-AU') ||
        voices.find(v => v.lang.startsWith('en'))

      if (best) u.voice = best

      u.onend   = () => { setPlaying(false); setPaused(false); setProgress(100); stopTimer(); stopResumeKeepalive() }
      u.onerror = () => { setPlaying(false); setPaused(false); stopTimer(); stopResumeKeepalive() }
      utteranceRef.current = u
      window.speechSynthesis.speak(u)
      setPlaying(true); startTimer(); startResumeKeepalive()
    }

    // Chrome loads voices asynchronously — wait for them if not ready yet
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      speak(voices)
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        speak(window.speechSynthesis.getVoices())
      }, { once: true })
      // Trigger voice load and speak with default if event never fires (Firefox/Safari)
      setTimeout(() => {
        if (!window.speechSynthesis.speaking) speak(window.speechSynthesis.getVoices())
      }, 200)
    }
  }, [supported, ttsText, paused, startTimer, stopTimer, startResumeKeepalive, stopResumeKeepalive])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    elapsedAtPause.current = elapsed
    stopTimer(); stopResumeKeepalive(); setPlaying(false); setPaused(true)
  }, [elapsed, stopTimer, stopResumeKeepalive])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    clearInterval(timerRef.current)
    clearInterval(resumeRef.current)
    elapsedAtPause.current = 0
    setPlaying(false); setPaused(false); setProgress(0); setElapsed(0)
  }, [])

  // ── Regenerate briefing via daily-briefing?force=true ────────────────────
  // Calls the dedicated briefing function directly with force=true so it:
  //   1. Deletes today's existing briefing (using service-role key server-side)
  //   2. Fetches the last 36 h of articles from the DB
  //   3. Calls Groq to generate a full 900-1,100 word script
  //   4. Stores the result in daily_briefings
  // This avoids the news-agent's slow article-ingestion pipeline and bypasses
  // the anon-key RLS restriction that silently blocked the old delete approach.
  const regenerate = useCallback(async () => {
    if (regenerating) return
    stop()
    setRegenerating(true)
    setRegenStatus(null)

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
      setRegenStatus('error')
      setRegenerating(false)
      return
    }

    // Serialise the articles currently visible on the page.
    // The function uses these directly so it always generates from what the
    // user sees — works with both mock and live data, no DB query needed.
    const articlePayload = (allArticles ?? []).slice(0, 25).map((a) => ({
      id:                      a.id,
      headline:                a.headline,
      summary:                 a.summary,
      whyItMatters:            a.whyItMatters,
      category:                a.category,
      impact:                  a.impact,
      regions:                 a.regions,
      source:                  a.source,
      publishedAt:             a.publishedAt,
      shortTermImpact:         a.shortTermImpact,
      mediumTermImpact:        a.mediumTermImpact,
      strategicRecommendation: a.strategicRecommendation,
      financialImpactLabel:    a.financialImpactLabel,
      financialImpactHigh:     a.financialImpactHigh,
    }))

    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/daily-briefing?force=true`,
        {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey':         anonKey,
            'Content-Type':  'application/json',
          },
          body:   JSON.stringify({ articles: articlePayload }),
          signal: AbortSignal.timeout(120_000), // 2-min timeout — briefing only, no article pipeline
        }
      )
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok !== false) {
        setRegenStatus('ok')
        await refreshBriefing?.()
      } else {
        console.warn('daily-briefing returned:', data)
        setRegenStatus('error')
      }
    } catch (err) {
      console.error('Regenerate via daily-briefing failed:', err)
      setRegenStatus('error')
    } finally {
      setRegenerating(false)
    }
  }, [regenerating, stop, refreshBriefing])

  if (!briefing) return null

  const briefingDate = briefing.briefing_date
    ? new Date(briefing.briefing_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Today'

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="podcast-player">

      {/* Short briefing warning */}
      {isShortBriefing && (
        <div style={{
          background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 'var(--radius-sm)',
          padding: '8px 14px', marginBottom: 8,
          fontSize: '0.8125rem', color: '#92400e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span>⚠️ Briefing appears incomplete ({wordCount} words). The AI script may not have been generated yet — click Regenerate to create a full 7–8 min briefing from today's news.</span>
          <button
            onClick={regenerate}
            disabled={regenerating}
            style={{
              flexShrink: 0, padding: '4px 12px', background: '#f59e0b', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700,
              fontSize: '0.75rem', cursor: regenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {regenerating ? 'Generating…' : 'Regenerate'}
          </button>
        </div>
      )}

      {/* Regeneration status messages */}
      {regenStatus === 'ok' && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '6px 14px', marginBottom: 8, fontSize: '0.8125rem', color: '#166534' }}>
          ✓ New briefing generated — press play to hear today's full intelligence report.
        </div>
      )}
      {regenStatus === 'error' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '6px 14px', marginBottom: 8, fontSize: '0.8125rem', color: '#991b1b' }}>
          ✗ Could not regenerate — the news-agent may still be starting up. Wait 30 seconds and try again. If the issue persists, run: <code style={{ fontSize: '0.75rem' }}>supabase functions deploy news-agent</code>
        </div>
      )}

      {/* Episode header */}
      <div className="podcast-header">
        <div className="podcast-cover">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>

        <div className="podcast-meta">
          <div className="podcast-show">Grasshopper News</div>
          <div className="podcast-episode">Morning Intelligence Brief</div>
          <div className="podcast-date">
            {briefingDate}
            <span className="podcast-divider">·</span>
            {briefing.article_count ?? 0} stories
            <span className="podcast-divider">·</span>
            {wordCount} words
            <span className="podcast-divider">·</span>
            ~{estimatedMinutes} min
          </div>
        </div>

        <div className="podcast-actions">
          {/* Regenerate button */}
          <button
            className="podcast-btn"
            onClick={regenerate}
            disabled={regenerating || playing}
            title="Regenerate today's briefing from current news"
            style={{ fontSize: '0.75rem', padding: '6px 10px', opacity: regenerating ? 0.6 : 1 }}
          >
            {regenerating
              ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span>
              : '↻'}
          </button>

          {!supported && (
            <span className="podcast-unsupported">Audio not supported in this browser</span>
          )}
          {supported && (
            <>
              {(playing || paused) && (
                <button className="podcast-btn podcast-btn--stop" onClick={stop} title="Stop">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                </button>
              )}
              <button
                className={`podcast-btn podcast-btn--main${playing ? ' podcast-btn--playing' : ''}`}
                onClick={playing ? pause : play}
                disabled={regenerating}
                title={playing ? 'Pause' : paused ? 'Resume' : 'Play briefing'}
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {supported && (
        <div className="podcast-progress-wrap">
          <div className="podcast-progress-bar">
            <div className="podcast-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="podcast-time-labels">
            <span>{fmtTime(elapsed)}</span>
            <span style={{ opacity: 0.5 }}>
              {regenerating ? 'Generating new briefing…' : playing ? 'Playing…' : paused ? 'Paused' : 'Ready to play'}
            </span>
            <span>-{fmtTime(Math.max(0, totalSecs - elapsed))}</span>
          </div>
        </div>
      )}

      {/* Transcript toggle + download */}
      <div className="podcast-transcript-toggle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span onClick={() => setShowTranscript(s => !s)} style={{ cursor: 'pointer' }}>
          {showTranscript ? '▲ Hide transcript' : '▼ Show transcript'}
        </span>
        {briefing?.briefing_text && (
          <button
            onClick={() => {
              const dateStr = briefing.briefing_date ?? new Date().toISOString().split('T')[0]
              const blob = new Blob([briefing.briefing_text], { type: 'text/plain;charset=utf-8' })
              const url  = URL.createObjectURL(blob)
              const a    = document.createElement('a')
              a.href = url
              a.download = `grasshopper-news-briefing-${dateStr}.txt`
              a.click()
              URL.revokeObjectURL(url)
            }}
            style={{
              background: 'none', border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)',
              fontSize: '0.75rem', padding: '3px 10px', cursor: 'pointer',
            }}
          >
            ↓ Download transcript
          </button>
        )}
      </div>

      {showTranscript && (
        <div className="podcast-transcript">
          {briefing.briefing_text?.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} style={{ height: 8 }} />
            const isBold   = line.startsWith('**') && line.endsWith('**')
            const clean    = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^•\s/, '')
            const isBullet = line.trimStart().startsWith('•')
            if (isBold)   return <div key={i} className="transcript-heading">{clean}</div>
            if (isBullet) return <div key={i} className="transcript-bullet">• {clean.trimStart().replace(/^•\s?/, '')}</div>
            return <p key={i} className="transcript-para">{clean}</p>
          })}
        </div>
      )}
    </div>
  )
}

// ── Daily Briefing Summary ────────────────────────────────────────────────────

function DailyBriefing({ articles }) {
  const today = useMemo(() => {
    const cutoff = Date.now() - 48 * 60 * 60 * 1000
    return articles.filter((a) => new Date(a.publishedAt) > cutoff)
  }, [articles])

  const high    = today.filter((a) => a.impact === 'HIGH').length
  const medium  = today.filter((a) => a.impact === 'MEDIUM').length
  const sources = [...new Set(today.map((a) => a.source))].slice(0, 3).join(', ')
  const topStory = today.find((a) => a.impact === 'HIGH') ?? today[0]

  const themes = useMemo(() => {
    const tagCounts = {}
    today.forEach((a) => (a.tags ?? []).forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }))
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t)
  }, [today])

  const avgSentiment = today.length
    ? today.reduce((s, a) => s + (a.sentiment ?? 0), 0) / today.length
    : 0
  const outlook = avgSentiment > 0.1 ? 'POSITIVE' : avgSentiment < -0.1 ? 'NEGATIVE' : 'CAUTIOUS'

  if (!topStory) return null

  return (
    <div className="daily-summary">
      <div className="daily-summary-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        Intelligence Briefing — Last 48 Hours
      </div>
      <div className="daily-summary-headline">{topStory.headline}</div>
      <div className="daily-summary-body">
        {today.length} articles monitored from {sources || 'multiple sources'}.
        {high > 0 && ` ${high} high-impact development${high > 1 ? 's' : ''} identified.`}
        {medium > 0 && ` ${medium} medium-impact item${medium > 1 ? 's' : ''} tracked.`}
      </div>
      {themes.length > 0 && (
        <div className="daily-summary-themes">
          {themes.map((t) => <span key={t} className="daily-summary-theme">{t}</span>)}
        </div>
      )}
      <div className={`daily-summary-outlook daily-summary-outlook--${outlook}`}>
        {outlook === 'POSITIVE' ? '▲' : outlook === 'NEGATIVE' ? '▼' : '◆'} Market outlook: {outlook.toLowerCase()}
      </div>
    </div>
  )
}

// ── Latest Intelligence Feed ──────────────────────────────────────────────────

function IconFire() {
  return <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
}
function IconChevronRight() {
  return <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}

function LatestIntelligenceFeed({ articles }) {
  const navigate = useNavigate()
  const items = articles?.slice(0, 8) ?? []

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div className="section-title"><IconFire /> Latest Intelligence</div>
          <button className="section-link" onClick={() => navigate('/news')} style={{ cursor: 'pointer', background: 'none', border: 'none' }}>
            View all <IconChevronRight />
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="high-impact-list">
          {items.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '12px 0' }}>
              No articles yet — the AI agent runs every hour.
            </p>
          )}
          {items.map((article) => (
            <div
              key={article.id}
              className="high-impact-item"
              onClick={() => navigate(`/news/${article.id}`)}
              role="button" tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/news/${article.id}`)}
            >
              <div className={`high-impact-indicator high-impact-indicator--${article.impact}`} />
              <div className="high-impact-body">
                <div className="high-impact-headline">{article.headline}</div>

                <div className="high-impact-foot">
                  <ImpactBadge level={article.impact} />
                  <VerificationBadge status={resolveVerification(article.verificationStatus, article.source)} compact />
                  {(article.regions ?? []).slice(0, 2).map((r) => <RegionTag key={r} region={r} />)}
                  <span className="high-impact-source">{article.source}</span>
                  <span className="high-impact-source" style={{ marginLeft: 'auto' }}>
                    {formatRelativeTime(article.publishedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Trending Topics ────────────────────────────────────────────────────────────

function TrendingTopics({ articles }) {
  const topics = useMemo(() => {
    const counts = {}
    articles.forEach((a) => (a.tags ?? []).forEach((t) => { counts[t] = (counts[t] ?? 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))
  }, [articles])

  if (topics.length === 0) return null

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-title">
          <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
          Trending Topics
        </div>
      </div>
      <div className="card-body">
        <div className="trending-list">
          {topics.map((t, i) => (
            <div key={t.name} className="trending-item">
              <span className="trending-rank">{i + 1}</span>
              <span className="trending-topic-name" style={{ textTransform: 'capitalize' }}>{t.name}</span>
              <span className="trending-count">{t.count} art.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Source Breakdown ────────────────────────────────────────────────────────────

function SourceBreakdown({ articles }) {
  const sources = useMemo(() => {
    const counts = {}
    articles.forEach((a) => { counts[a.source] = (counts[a.source] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [articles])
  const max = sources[0]?.[1] ?? 1

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-title">
          <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
          Sources
        </div>
      </div>
      <div className="card-body">
        <div className="category-breakdown-list">
          {sources.map(([name, count]) => (
            <div key={name} className="category-breakdown-item">
              <span className="category-breakdown-name">{name}</span>
              <div className="category-breakdown-bar-wrap">
                <div className="category-breakdown-bar" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="category-breakdown-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Live Prices Row ────────────────────────────────────────────────────────────

function DirArrow({ direction }) {
  if (!direction || direction === 'flat') return null
  return (
    <span style={{
      marginLeft: 4,
      fontSize: '0.75rem',
      color: direction === 'up' ? 'var(--color-positive)' : 'var(--color-negative)',
      fontWeight: 700,
    }}>
      {direction === 'up' ? '▲' : '▼'}
    </span>
  )
}

function PriceCell({ emoji, label, value, direction, sub, loading }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px', flex: '1 1 140px', minWidth: 0,
    }}>
      <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{emoji}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
          {loading ? <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>Loading…</span> : (value ?? <span style={{ opacity: 0.4 }}>—</span>)}
          {!loading && direction && <DirArrow direction={direction} />}
        </div>
        {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

function LivePricesRow() {
  const { prices, loading, updatedAt } = useMarketPrices()

  const updatedStr = updatedAt
    ? updatedAt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 16,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 16px 0',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)' }}>
          Live Market Prices
        </span>
        {updatedStr && (
          <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
            Updated {updatedStr}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
        <PriceCell
          emoji="🐑"
          label="Lamb"
          value={prices.lamb?.label}
          direction={prices.lamb?.direction}
          sub={prices.lamb?.saleyard ?? 'Saleyard indicator'}
          loading={loading && !prices.lamb}
        />
        <div style={{ width: 1, background: 'var(--border-light)', margin: '6px 0' }} />
        <PriceCell
          emoji="🐄"
          label="Beef EYCI"
          value={prices.beef?.label ?? prices.eyci?.label}
          direction={prices.beef?.direction ?? prices.eyci?.direction}
          sub={(prices.beef?.saleyard ?? prices.eyci?.saleyard) ?? 'Eastern Young Cattle Indicator'}
          loading={loading && !prices.beef && !prices.eyci}
        />
        <div style={{ width: 1, background: 'var(--border-light)', margin: '6px 0' }} />
        <PriceCell
          emoji="💱"
          label="AUD / USD"
          value={prices.audusd?.label}
          direction={prices.audusd?.direction}
          sub="Exchange rate"
          loading={loading && !prices.audusd}
        />
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard({ allArticles, highImpactArticles, stats, loading, latestBriefing, refreshBriefing }) {
  const articles = allArticles ?? []
  // allArticles is already top-10 deduplicated and priority-sorted
  const recentArticles = articles

  return (
    <div>
      {/* Morning Intelligence Podcast */}
      {latestBriefing && <PodcastPlayer briefing={latestBriefing} refreshBriefing={refreshBriefing} allArticles={articles} />}

      {/* Intelligence summary bar */}
      <DailyBriefing articles={articles} />

      {/* KPI Cards */}
      <KPICards stats={stats} articles={articles} />

      {/* Live Prices */}
      <LivePricesRow />

      {/* Main grid */}
      <div className="dashboard-grid">
        <div className="dashboard-main">
          {loading ? <SkeletonFeed /> : <LatestIntelligenceFeed articles={recentArticles} />}
        </div>
        <div className="dashboard-aside">
          <TrendingTopics articles={articles} />
          <SourceBreakdown articles={articles} />
        </div>
      </div>
    </div>
  )
}

function SkeletonFeed() {
  return (
    <div className="card">
      <div className="card-body">
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ marginBottom: 20 }}>
            <div style={{ height: 13, background: 'var(--bg-tertiary)', borderRadius: 4, marginBottom: 8, width: '30%' }} />
            <div style={{ height: 17, background: 'var(--bg-tertiary)', borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 13, background: 'var(--bg-tertiary)', borderRadius: 4, width: '80%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
