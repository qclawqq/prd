import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { CERTIFICATE_HTML } from '../components/display/CertificateTemplate'

export async function generateCertificatePDF(data) {
  let el = document.getElementById('certificate-template')
  if (!el) {
    el = document.createElement('div')
    el.id = 'certificate-template'
    el.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;'
    document.body.appendChild(el)
  }
  el.innerHTML = CERTIFICATE_HTML(data)
  el.style.display = 'block'

  await new Promise(r => setTimeout(r, 100))

  try {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const w = pdf.internal.pageSize.getWidth()
    const h = pdf.internal.pageSize.getHeight()
    pdf.addImage(imgData, 'PNG', 0, 0, w, h)
    pdf.save(`爱心捐助证书_${data.certificateCode}.pdf`)
  } finally {
    el.style.display = 'none'
  }
}
