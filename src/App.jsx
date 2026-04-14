import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import NewsFeed from './pages/NewsFeed'
import ArticleDetail from './pages/ArticleDetail'
import Forecast from './pages/Forecast'
import { useNews } from './hooks/useNews'

const PAGE_TITLES = {
  '/':         'Grasshopper News | Dashboard',
  '/news':     'Grasshopper News | Intelligence Feed',
  '/forecast': 'Grasshopper News | Forecast & Signals',
}

function AppInner() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? 'Grasshopper News'
    document.title = title
  }, [location.pathname])

  const {
    articles,
    allArticles,
    highImpactArticles,
    loading,
    refresh,
    lastRefreshed,
    usingLive,
    filters,
    setFilter,
    resetFilters,
    stats,
    getArticle,
    latestBriefing,
    refreshBriefing,
  } = useNews()

  function handleGlobalSearch(query) {
    setFilter('query', query)
    if (query && location.pathname !== '/news') {
      navigate('/news')
    }
  }

  return (
    <Layout
      stats={stats}
      loading={loading}
      onRefresh={refresh}
      lastRefreshed={lastRefreshed}
      usingLive={usingLive}
      searchQuery={filters.query}
      onSearchChange={handleGlobalSearch}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              allArticles={allArticles}
              highImpactArticles={highImpactArticles}
              stats={stats}
              loading={loading}
              latestBriefing={latestBriefing}
              refreshBriefing={refreshBriefing}
            />
          }
        />
        <Route
          path="/news"
          element={
            <NewsFeed
              articles={articles}
              filters={filters}
              setFilter={setFilter}
              resetFilters={resetFilters}
              loading={loading}
            />
          }
        />
        <Route
          path="/news/:id"
          element={<ArticleDetail getArticle={getArticle} />}
        />
        <Route
          path="/forecast"
          element={<Forecast />}
        />
        <Route
          path="*"
          element={
            <Dashboard
              allArticles={allArticles}
              highImpactArticles={highImpactArticles}
              stats={stats}
              loading={loading}
              latestBriefing={latestBriefing}
              refreshBriefing={refreshBriefing}
            />
          }
        />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
