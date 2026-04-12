// ====================================================
// KEEP ME POSTED — useNews Hook
// Central data management for news articles.
// Replace fetchArticles() with real API call in production.
// ====================================================

import { useState, useEffect, useMemo, useCallback } from 'react'
import { mockArticles } from '../data/mockData'
import { applyFilters, computeAggregateSentiment, getImpactBreakdown } from '../utils/scoring'

/**
 * Default filter state — all articles, newest first
 */
const DEFAULT_FILTERS = {
  impact: 'ALL',
  region: 'ALL',
  category: 'ALL',
  query: '',
  sortBy: 'date',
}

/**
 * Simulates an async API fetch — swap for real fetch() in production
 * @returns {Promise<Article[]>}
 */
async function fetchArticles() {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 400))
  return mockArticles
}

/**
 * useNews — main data hook
 *
 * Returns articles with filtering, sorting, and derived analytics.
 *
 * Usage:
 *   const { articles, filters, setFilter, stats, loading } = useNews()
 */
export function useNews() {
  const [allArticles, setAllArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  // Initial load
  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchArticles()
      setAllArticles(data)
      setLastRefreshed(new Date())
    } catch (err) {
      setError(err.message ?? 'Failed to load news feed')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update a single filter key
   */
  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  /**
   * Reset all filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  /**
   * Filtered + sorted articles (memoized)
   */
  const articles = useMemo(() => applyFilters(allArticles, filters), [allArticles, filters])

  /**
   * Derived stats across the full unfiltered dataset
   */
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

  /**
   * Get a single article by ID
   */
  const getArticle = useCallback(
    (id) => allArticles.find((a) => a.id === id) ?? null,
    [allArticles],
  )

  /**
   * High-impact articles only (for dashboard feed)
   */
  const highImpactArticles = useMemo(
    () => allArticles.filter((a) => a.impact === 'HIGH').sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    [allArticles],
  )

  return {
    articles,
    allArticles,
    highImpactArticles,
    loading,
    error,
    filters,
    setFilter,
    resetFilters,
    refresh: load,
    lastRefreshed,
    stats,
    getArticle,
  }
}
