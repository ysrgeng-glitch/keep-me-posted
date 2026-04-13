// ====================================================
// KEEP ME POSTED — useNews Hook
// Reads live data from Supabase when configured,
// falls back to mock data for local development.
// ====================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { mockArticles } from '../data/mockData'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { applyFilters, computeAggregateSentiment, getImpactBreakdown } from '../utils/scoring'

const DEFAULT_FILTERS = {
  impact: 'ALL',
  region: 'ALL',
  category: 'ALL',
  query: '',
  sortBy: 'date',
}

// How many articles to load per page
const PAGE_SIZE = 50

// ── Data fetching ──────────────────────────────────────────────────────────

/**
 * Fetch from Supabase, ordered by published_at desc.
 * Returns articles normalised to the same shape as mockData.
 */
async function fetchFromSupabase() {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      id,
      headline,
      summary,
      why_it_matters,
      category,
      impact,
      regions,
      source,
      source_url,
      published_at,
      short_term_impact,
      medium_term_impact,
      strategic_recommendation,
      confidence_score,
      trending,
      tags,
      sentiment,
      created_at
    `)
    .order('published_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) throw new Error(error.message)

  // Normalise snake_case DB columns to camelCase for the frontend
  return (data ?? []).map((a) => ({
    ...a,
    sourceUrl:               a.source_url,
    publishedAt:             a.published_at,
    shortTermImpact:         a.short_term_impact,
    mediumTermImpact:        a.medium_term_impact,
    strategicRecommendation: a.strategic_recommendation,
    confidenceScore:         a.confidence_score,
  }))
}

/**
 * Fallback: mock data with artificial delay (simulates network)
 */
async function fetchMockData() {
  await new Promise((r) => setTimeout(r, 400))
  return mockArticles
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useNews() {
  const [allArticles, setAllArticles] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [usingLive, setUsingLive]     = useState(false)
  const [filters, setFilters]         = useState(DEFAULT_FILTERS)
  const realtimeRef = useRef(null)

  // ── Initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    load()
    // Cleanup realtime subscription on unmount
    return () => { realtimeRef.current?.unsubscribe() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    setError(null)
    try {
      if (isSupabaseConfigured) {
        const data = await fetchFromSupabase()
        setAllArticles(data)
        setUsingLive(true)
        subscribeToRealtime()
      } else {
        // Local dev / no Supabase credentials — use mock data
        const data = await fetchMockData()
        setAllArticles(data)
        setUsingLive(false)
      }
      setLastRefreshed(new Date())
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to mock data:', err)
      // Graceful fallback
      const data = await fetchMockData()
      setAllArticles(data)
      setUsingLive(false)
      setError(null) // suppress error — mock data is serving
    } finally {
      setLoading(false)
    }
  }

  // ── Realtime subscription — new articles appear without refresh ──────────

  function subscribeToRealtime() {
    if (!supabase) return
    realtimeRef.current?.unsubscribe()

    realtimeRef.current = supabase
      .channel('articles-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'articles' },
        (payload) => {
          const newArticle = payload.new
          setAllArticles((prev) => {
            // Avoid duplicates
            if (prev.some((a) => a.id === newArticle.id)) return prev
            return [newArticle, ...prev]
          })
          setLastRefreshed(new Date())
        },
      )
      .subscribe()
  }

  // ── Filters ──────────────────────────────────────────────────────────────

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // ── Derived data (all memoized) ──────────────────────────────────────────

  const articles = useMemo(
    () => applyFilters(allArticles, filters),
    [allArticles, filters],
  )

  const stats = useMemo(
    () => ({
      total: allArticles.length,
      filtered: articles.length,
      impactBreakdown: getImpactBreakdown(allArticles),
      sentiment: computeAggregateSentiment(allArticles),
      trending: allArticles.filter((a) => a.trending),
    }),
    [allArticles, articles],
  )

  const getArticle = useCallback(
    (id) => allArticles.find((a) => a.id === id) ?? null,
    [allArticles],
  )

  const highImpactArticles = useMemo(
    () =>
      allArticles
        .filter((a) => a.impact === 'HIGH')
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    [allArticles],
  )

  return {
    articles,
    allArticles,
    highImpactArticles,
    loading,
    error,
    usingLive,        // true = live Supabase data, false = mock
    filters,
    setFilter,
    resetFilters,
    refresh: load,
    lastRefreshed,
    stats,
    getArticle,
  }
}
