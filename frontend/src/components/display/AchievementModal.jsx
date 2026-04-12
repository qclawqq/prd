export default function AchievementModal({ achievement, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: 720}}>
        <div className="modal-header">
          <h2>{achievement.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{padding: '24px', maxHeight: '70vh', overflowY: 'auto'}}>
          {achievement.subtitle && (
            <p style={{fontSize: '16px', color: '#666', marginBottom: '16px', fontStyle: 'italic'}}>
              {achievement.subtitle}
            </p>
          )}
          
          {achievement.media_urls?.length > 0 && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px'}}>
              {achievement.media_urls.map((url, i) => (
                <img key={i} src={url} alt="" style={{width: '100%', borderRadius: '8px', objectFit: 'cover'}} />
              ))}
            </div>
          )}
          
          <div style={{lineHeight: 1.8, color: '#333', fontSize: '15px', whiteSpace: 'pre-wrap'}}>
            {achievement.paragraph1}
          </div>
          
          {achievement.conclusion && (
            <div style={{marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid var(--primary)'}}>
              <p style={{fontWeight: 'bold', marginBottom: '8px'}}>结语</p>
              <p style={{color: '#666'}}>{achievement.conclusion}</p>
            </div>
          )}
          
          <p style={{marginTop: '20px', color: '#999', fontSize: '13px'}}>
            撰稿日期：{achievement.write_date}
          </p>
        </div>
      </div>
    </div>
  )
}
