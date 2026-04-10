// 爱心捐助证书 HTML 模板（隐藏）
// 使用时渲染到此 div，由 html2canvas + jsPDF 生成 PDF
export const CERTIFICATE_HTML = (data) => `
<div style="
  width: 842px;
  height: 595px;
  background: linear-gradient(135deg, #fff8f0, #fff0e8);
  border: 3px double #c0392b;
  padding: 50px 60px;
  font-family: 'SimSun', 'STSong', serif;
  color: #333;
  box-sizing: border-box;
  position: relative;
">
  <!-- 顶部装饰 -->
  <div style="text-align:center; margin-bottom:10px;">
    <div style="font-size:13px; color:#888; letter-spacing:4px;">巴 马 瑶 族 自 治 县</div>
    <div style="font-size:22px; color:#c0392b; font-weight:bold; letter-spacing:6px; margin-top:4px;">佳妮艺术支教教育服务中心</div>
  </div>

  <hr style="border:none; border-top:2px solid #c0392b; margin:8px 0;" />

  <!-- 主标题 -->
  <div style="text-align:center; margin:20px 0;">
    <div style="font-size:36px; font-weight:bold; color:#c0392b; letter-spacing:8px;">爱心捐助证书</div>
  </div>

  <!-- 荣誉词 -->
  <div style="text-align:center; font-size:14px; color:#666; margin-bottom:30px; line-height:1.8;">
    感谢您对公益事业的无私奉献，特此证明您于 <b>${data.date || ''}</b> 参与了<br/>
    「<b>${data.projectTitle || '公益项目'}</b>」爱心捐赠活动，<br/>
    捐赠内容：<b>${data.content || ''}</b>。
  </div>

  <!-- 捐赠人信息 -->
  <div style="font-size:16px; line-height:2.2; margin-bottom:30px; padding:0 40px;">
    <div style="display:flex; align-items:center;">
      <span style="width:80px; color:#666;">捐赠者：</span>
      <span style="font-size:20px; font-weight:bold; color:#c0392b; border-bottom:1px solid #c0392b; padding-bottom:2px;">${data.donorName || '匿名爱心人士'}</span>
    </div>
    <div style="display:flex; align-items:center; margin-top:8px;">
      <span style="width:80px; color:#666;">项目名：</span>
      <span>${data.projectTitle || ''}</span>
    </div>
    <div style="display:flex; align-items:center; margin-top:8px;">
      <span style="width:80px; color:#666;">捐赠内容：</span>
      <span>${data.content || ''}</span>
    </div>
  </div>

  <!-- 底部信息 -->
  <div style="display:flex; justify-content:space-between; align-items:flex-end; padding:0 20px; margin-top:20px;">
    <div style="text-align:center;">
      <div style="font-size:13px; color:#888; margin-bottom:4px;">发证日期</div>
      <div style="font-size:14px;">${data.date || ''}</div>
    </div>
    <div style="text-align:center;">
      <!-- 公章占位 -->
      <div style="width:100px; height:100px; border:2px solid #c0392b; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 4px;">
        <div style="text-align:center;">
          <div style="font-size:11px; color:#c0392b; font-weight:bold;">爱心公益</div>
          <div style="font-size:10px; color:#c0392b;">认证</div>
        </div>
      </div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:13px; color:#888; margin-bottom:4px;">证书编号</div>
      <div style="font-size:13px; color:#c0392b;">${data.certificateCode || ''}</div>
    </div>
  </div>

  <!-- 底部机构 -->
  <div style="text-align:center; margin-top:20px; font-size:12px; color:#aaa;">
    巴马瑶族自治县佳妮艺术支教教育服务中心 · 奉献爱心，点亮希望
  </div>
</div>
`

// 创建隐藏的 DOM 元素用于渲染
export function renderCertificateDOM(data) {
  const el = document.getElementById('certificate-template')
  if (!el) return null
  el.innerHTML = CERTIFICATE_HTML(data)
  el.style.display = 'block'
  el.style.position = 'fixed'
  el.style.left = '-9999px'
  el.style.top = '0'
  el.style.zIndex = '-1'
  return el
}

export function removeCertificateDOM() {
  const el = document.getElementById('certificate-template')
  if (el) el.style.display = 'none'
}
