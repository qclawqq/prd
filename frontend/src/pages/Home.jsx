import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicProjects } from '../api/projects'
import { getPublicStories } from '../api/loveStories'
import { getPublicLoveWall } from '../api/loveWall'
import { getPublicAchievements } from '../api/achievements'
import ProjectCard from '../components/display/ProjectCard'
import AchievementModal from '../components/display/AchievementModal'

export default function Home() {
  const [projects, setProjects] = useState([])
  const [stories, setStories] = useState([])
  const [loveWall, setLoveWall] = useState([])
  const [achievements, setAchievements] = useState([])
  const [selectedAchievement, setSelectedAchievement] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    getPublicProjects().then(setProjects).catch(() => {})
    getPublicStories({ limit: 4 }).then(setStories).catch(() => {})
    getPublicLoveWall().then(setLoveWall).catch(() => {})
    getPublicAchievements({ limit: 3 }).then(setAchievements).catch(() => {})
  }, [])

  useEffect(() => {
    if (loveWall.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide(s => (s + 1) % loveWall.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [loveWall.length])

  return (
    <div className="home-page">
      {/* 爱心宣传墙轮播 */}
      {loveWall.length > 0 && (
        <section className="hero-section">
          <div className="carousel">
            {loveWall.map((item, i) => (
              <div key={item.id} className={`carousel-slide ${i === currentSlide ? 'active' : ''}`}>
                {item.type === 'video' ? (
                  <video src={item.media_url} autoPlay muted loop className="carousel-media" />
                ) : (
                  <img src={item.media_url} alt={item.title || ''} className="carousel-media" />
                )}
                <div className="carousel-overlay">
                  <h2>{item.title || '爱心公益平台'}</h2>
                  <p>{item.description || '奉献爱心，点亮希望'}</p>
                </div>
              </div>
            ))}
            {loveWall.length > 1 && (
              <div className="carousel-dots">
                {loveWall.map((_, i) => (
                  <span key={i} className={`dot ${i === currentSlide ? 'active' : ''}`} onClick={() => setCurrentSlide(i)} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 进行中项目 */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>进行中的募捐项目</h2>
            <Link to="/projects" className="more-link">查看全部 →</Link>
          </div>
          {projects.length === 0 ? (
            <p className="empty-msg">暂无进行中的项目</p>
          ) : (
            <div className="project-grid">
              {projects.slice(0, 6).map(p => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 最新成果 */}
      {achievements.length > 0 && (
        <section className="section alt-bg">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">最新成果展示</h2>
              <Link to="/stories" className="more-link">查看全部 →</Link>
            </div>
            <div className="achievement-grid">
              {achievements.map(a => (
                <div key={a.id} className="achievement-card" onClick={() => setSelectedAchievement(a)} style={{cursor: 'pointer'}}>
                  {a.media_urls?.[0] && <img src={a.media_urls[0]} alt={a.title} className="achievement-thumb" />}
                  <h3>{a.title}</h3>
                  <p className="achievement-sub">{a.subtitle || a.paragraph1?.slice(0, 80)}</p>
                  <p className="achievement-date">{a.write_date}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 爱心故事墙 */}
      {stories.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">爱心故事墙</h2>
            <div className="story-grid">
              {stories.map(s => (
                <div key={s.id} className="story-card">
                  <div className="story-media">
                    {s.type === 'video' ? (
                      <video src={s.media_url} className="story-video" />
                    ) : (
                      <img src={s.media_url} alt={s.title} className="story-img" />
                    )}
                  </div>
                  <div className="story-info">
                    <h3>{s.title}</h3>
                    {s.donor_name && <p className="story-donor">捐赠者：{s.donor_name}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center" style={{marginTop: 20}}>
              <Link to="/stories" className="more-link">查看全部爱心故事 →</Link>
            </div>
          </div>
        </section>
      )}

      {/* 如何参与 */}
      <section className="section join-section">
        <div className="container">
          <h2 className="section-title">如何参与</h2>
          <div className="join-grid">
            <div className="join-card">
              <div className="join-icon">💰</div>
              <h3>捐款 / 捐物</h3>
              <p>选择您关心的项目，用善款或物资支持公益事业</p>
              <Link to="/projects" className="join-btn">立即参与</Link>
            </div>
            <div className="join-card">
              <div className="join-icon">🤝</div>
              <h3>成为志愿者</h3>
              <p>加入我们的志愿者团队，一起传递爱心</p>
              <Link to="/projects" className="join-btn">报名参与</Link>
            </div>
            <div className="join-card">
              <div className="join-icon">📢</div>
              <h3>分享传播</h3>
              <p>将公益项目分享给更多朋友，汇聚更多爱心力量</p>
              <button className="join-btn" onClick={() => navigator.share?.({ title: '爱心公益平台', url: window.location.href }).catch(() => alert('请手动分享链接'))}>立即分享</button>
            </div>
            <div className="join-card">
              <div className="join-icon">📜</div>
              <h3>查询证书</h3>
              <p>输入姓名或电话，查询电子捐赠证书生成进度</p>
              <Link to="/certificates" className="join-btn">立即查询</Link>
            </div>
          </div>
        </div>
      </section>

      {selectedAchievement && (
        <AchievementModal
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  )
}
