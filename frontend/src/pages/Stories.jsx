import { useEffect, useState } from 'react'
import { getPublicStories } from '../api/loveStories'

export default function Stories() {
  const [stories, setStories] = useState([])
  const [page, setPage] = useState(1)
  const limit = 12

  useEffect(() => {
    getPublicStories({ page, limit }).then(setStories).catch(() => {})
  }, [page])

  return (
    <div className="page stories-page">
      <div className="container">
        <h1 className="page-title">爱心故事</h1>
        <p className="page-desc">每一份爱心都值得被铭记，每一次善举都在改变世界。</p>
        {stories.length === 0 ? (
          <p className="empty-msg">暂无爱心故事</p>
        ) : (
          <>
            <div className="story-grid-full">
              {stories.map(s => (
                <div key={s.id} className="story-card-full">
                  <div className="story-media">
                    {s.type === 'video' ? (
                      <video src={s.media_url} controls className="story-video-full" />
                    ) : (
                      <img src={s.media_url} alt={s.title} className="story-img-full" />
                    )}
                  </div>
                  <div className="story-body">
                    <h3>{s.title}</h3>
                    {s.donor_name && <p className="story-donor">捐赠者：{s.donor_name}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
              <span>第 {page} 页</span>
              <button disabled={stories.length < limit} onClick={() => setPage(p => p + 1)}>下一页</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
