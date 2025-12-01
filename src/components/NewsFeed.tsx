import { NewsItem } from '../types'
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface NewsFeedProps {
  news: NewsItem[]
  selectedSymbols?: string[]
}

export default function NewsFeed({ news, selectedSymbols = [] }: NewsFeedProps) {
  const filteredNews = selectedSymbols.length > 0
    ? news.filter(item => 
        !item.symbols || item.symbols.length === 0 || 
        item.symbols.some(s => selectedSymbols.includes(s))
      )
    : news

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp size={16} />
      case 'negative': return <TrendingDown size={16} />
      default: return <Minus size={16} />
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981'
      case 'negative': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="news-feed">
      <div className="section-header-inline">
        <h3>
          <Newspaper size={24} />
          Market News
        </h3>
        <span className="news-count">{filteredNews.length} articles</span>
      </div>

      <div className="news-list">
        {filteredNews.map(item => (
          <a 
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-item"
          >
            <div className="news-content">
              <h4>{item.title}</h4>
              <div className="news-meta">
                <span className="news-source">{item.source}</span>
                <span className="news-time">{formatTime(item.publishedAt)}</span>
                {item.sentiment && (
                  <span 
                    className="news-sentiment"
                    style={{ color: getSentimentColor(item.sentiment) }}
                  >
                    {getSentimentIcon(item.sentiment)}
                    {item.sentiment}
                  </span>
                )}
              </div>
              {item.symbols && item.symbols.length > 0 && (
                <div className="news-symbols">
                  {item.symbols.map(symbol => (
                    <span key={symbol} className="symbol-tag">{symbol}</span>
                  ))}
                </div>
              )}
            </div>
            <ExternalLink size={20} className="news-link-icon" />
          </a>
        ))}
      </div>
    </div>
  )
}
