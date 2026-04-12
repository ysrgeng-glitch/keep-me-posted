import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import NewsFeed from './pages/NewsFeed'
import ArticleDetail from './pages/ArticleDetail'
import Forecast from './pages/Forecast'
import { useNews } from './hooks/useNews'

// Inner app component that has access to router context
function AppInner() {
  const location = useLocation()
  const navigate = useNavigate()

  const {
    articles,
    highImpactArticles,
    loading,
    refresh,
    lastRefreshed,
    filters,
    setFilter,
    resetFilters,
    stats,
    getArticle,
  } = useNews()

  // Global search: update query filter and navigate to news feed
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
      searchQuery={filters.query}
      onSearchChange={handleGlobalSearch}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              highImpactArticles={highImpactArticles}
              stats={stats}
              loading={loading}
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
        {/* Catch-all → dashboard */}
        <Route path="*" element={<Dashboard highImpactArticles={highImpactArticles} stats={stats} loading={loading} />} />
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
