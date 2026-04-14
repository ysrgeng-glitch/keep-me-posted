import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ImpactBadge from '../components/common/ImpactBadge'
import RegionTag from '../components/common/RegionTag'
import VerificationBadge from '../components/common/VerificationBadge'
import FinancialImpact from '../components/common/FinancialImpact'
import KPICards from '../components/dashboard/KPICards'
import { formatRelativeTime, formatDate, getSentimentDescriptor } from '../utils/scoring'
import { useMarketPrices } from '../hooks/useMarketPrices'
import { supabase } from '../lib/supabase'

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

// ── Morning Intelligence Podcast Player ──────────────────────────────────────

function PodcastPlayer({ briefing, refreshBriefing }) {
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
  const startTimeRef   = useRef(0)
  const elapsedAtPause = useRef(0)

  // Strip markdown for TTS
  const ttsText = useMemo(() => {
    if (!briefing?.briefing_text) return ''
    return briefing.briefing_text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/^#{1,3}\s/gm, '')
      .replace(/•\s/g, '. ')
      .replace(/\n{2,}/g, ' ')
      .replace(/\n/g, ' ')
  }, [briefing?.briefing_text])

  const wordCount        = useMemo(() => ttsText.split(/\s+/).filter(Boolean).length, [ttsText])
  const estimatedMinutes = useMemo(() => Math.max(1, Math.round(wordCount / 125)), [wordCount])
  // Briefing is considered "short" (likely the fallback text) if under 200 words
  const isShortBriefing  = wordCount < 200

  useEffect(() => { setTotalSecs(estimatedMinutes * 60) }, [estimatedMinutes])

  // Stop playback when briefing content changes (e.g. after regeneration)
  useEffect(() => {
    window.speechSynthesis?.cancel()
    clearInterval(timerRef.current)
    setPlaying(false); setPaused(false); setProgress(0); setElapsed(0)
    elapsedAtPause.current = 0
  }, [briefing?.id, briefing?.briefing_text])

  // Cleanup on unmount
  useEffect(() => () => {
    window.speechSynthesis?.cancel()
    clearInterval(timerRef.current)
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

  const play = useCallback(() => {
    if (!supported || !ttsText) return
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false); setPlaying(true); startTimer()
      return
    }
    window.speechSynthesis.cancel()
    clearInterval(timerRef.current)
    elapsedAtPause.current = 0
    setElapsed(0); setProgress(0)

    const u = new SpeechSynthesisUtterance(ttsText)
    u.rate  = 0.95
    u.pitch = 1.0
    u.lang  = 'en-AU'
    const voices = window.speechSynthesis.getVoices()
    const auVoice = voices.find(v => v.lang === 'en-AU') || voices.find(v => v.lang.startsWith('en'))
    if (auVoice) u.voice = auVoice
    u.onend   = () => { setPlaying(false); setPaused(false); setProgress(100); stopTimer() }
    u.onerror = () => { setPlaying(false); setPaused(false); stopTimer() }
    utteranceRef.current = u
    window.speechSynthesis.speak(u)
    setPlaying(true); startTimer()
  }, [supported, ttsText, paused, startTimer, stopTimer])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    elapsedAtPause.current = elapsed
    stopTimer(); setPlaying(false); setPaused(true)
  }, [elapsed, stopTimer])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    clearInterval(timerRef.current)
    elapsedAtPause.current = 0
    setPlaying(false); setPaused(false); setProgress(0); setElapsed(0)
  }, [])

  // ── Regenerate briefing by triggering the news-agent ─────────────────────
  // The news-agent (already deployed + working) now includes briefing generation.
  // Calling it here forces a fresh run which will also regenerate today's briefing.
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

    // First: delete today's short briefing so the news-agent will regenerate it
    try {
      const today = new Date().toISOString().split('T')[0]
      await supabase?.from('daily_briefings').delete().eq('briefing_date', today)
    } catch (_) { /* best-effort */ }

    // Then: trigger the news-agent — it runs article ingestion + briefing generation
    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/news-agent`,
        {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey':         anonKey,
            'Content-Type':  'application/json',
          },
          body:   JSON.stringify({}),
          signal: AbortSignal.timeout(180_000), // 3-min timeout (news + briefing generation)
        }
      )
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok !== false) {
        setRegenStatus('ok')
        await refreshBriefing?.()
      } else {
        console.warn('news-agent returned:', data)
        setRegenStatus('error')
      }
    } catch (err) {
      console.error('Regenerate via news-agent failed:', err)
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

                {/* Financial impact on its own line when available */}
                {article.financialImpactLabel && (
                  <div className="high-impact-financial">
                    <FinancialImpact label={article.financialImpactLabel} compact />
                  </div>
                )}

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
          label="SA Lamb"
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
      {latestBriefing && <PodcastPlayer briefing={latestBriefing} refreshBriefing={refreshBriefing} />}

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
