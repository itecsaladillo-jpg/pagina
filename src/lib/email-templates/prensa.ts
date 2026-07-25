const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.itecsaladillo.org.ar'
const ASSETS_URL = 'https://www.itecsaladillo.org.ar'

export function generatePrensaEmailHtml({
  titulo,
  contenidoMedios,
  mediaUrls,
  fecha,
}: {
  titulo: string
  contenidoMedios: string
  mediaUrls?: string[]
  fecha: string
}) {
  const mediaBlock = mediaUrls && mediaUrls.length > 0
    ? `
      <div style="margin: 32px 0; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 16px; font-size: 13px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b;">
          Recursos Multimedia
        </h3>
        <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.5;">
          Descargá el material en alta resolución desde los siguientes enlaces:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            ${mediaUrls.map((url, i) => {
              const ext = url.split('.').pop()?.toLowerCase() || ''
              const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
              const label = isImage ? `📷 Imagen ${i + 1}` : `🎬 Video ${i + 1}`
              const downloadAttr = isImage ? ' download' : ''
              return `
                <td style="padding: 0 4px 8px; width: ${Math.floor(100 / Math.min(mediaUrls.length, 3))}%; vertical-align: top;" class="resp-btn-cell">
                  <a href="${url}" target="_blank"${downloadAttr}
                     style="display: block; padding: 10px 12px; background: #1e293b; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center; white-space: nowrap;">
                    ${label}
                  </a>
                </td>
              `
            }).join('')}
            ${mediaUrls.length < 3 ? `<td style="width: 100%;"></td>` : ''}
          </tr>
        </table>
      </div>
    `
    : ''

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .resp-pad { padding-left: 24px !important; padding-right: 24px !important; }
      .resp-stack { display: block !important; width: 100% !important; }
      .resp-center { text-align: center !important; }
      .resp-hdr-logo { width: 120px !important; margin: 0 auto 12px !important; }
      .resp-hdr-divider { margin: 8px auto !important; }
      .resp-ftr-logo { width: 80px !important; margin: 0 auto 16px !important; }
      .resp-title { font-size: 22px !important; }
      .resp-btn-cell { display: block !important; width: 100% !important; padding: 0 0 8px 0 !important; }
      .resp-btn-cell a { white-space: normal !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 28px 40px;" class="resp-pad">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 160px;" class="resp-stack resp-center">
                    <img src="${ASSETS_URL}/logoitectrans_v2.png"
                         alt="ITEC Saladillo"
                         width="160"
                         class="resp-hdr-logo"
                         style="max-width: 160px; height: auto; display: block; border: 0;" />
                  </td>
                  <td style="text-align: right; vertical-align: middle;" class="resp-stack resp-center">
                    <h1 style="margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8;">
                      ITEC Saladillo
                    </h1>
                    <div style="height: 2px; width: 60px; background: #3b82f6; margin: 8px 0 8px auto;" class="resp-hdr-divider"></div>
                    <p style="margin: 0; font-size: 14px; color: #e2e8f0; font-weight: 300;">
                      Innovación · Tecnología · Emprendedurismo · Ciencia
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td style="padding: 32px 40px 0;" class="resp-pad">
              <span style="display: inline-block; padding: 6px 16px; background: #dbeafe; color: #1d4ed8; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;">
                GACETILLA DE PRENSA — ITEC SALADILLO
              </span>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 20px 40px 8px;" class="resp-pad">
              <h2 style="margin: 0; font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1.3; letter-spacing: -0.02em;" class="resp-title">
                ${titulo}
              </h2>
            </td>
          </tr>

          <!-- Date -->
          <tr>
            <td style="padding: 0 40px 24px;" class="resp-pad">
              <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">
                ${fecha}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 0 40px 24px;" class="resp-pad">
              <div style="font-size: 15px; color: #334155; line-height: 1.7; white-space: pre-wrap;">
                ${contenidoMedios.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>

          <!-- Multimedia -->
          ${mediaBlock ? `<tr><td style="padding: 0 40px 24px;" class="resp-pad">${mediaBlock}</td></tr>` : ''}

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;" class="resp-pad">
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px;" class="resp-pad">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 100px; vertical-align: middle; padding-right: 24px;" class="resp-stack resp-center">
                    <img src="${ASSETS_URL}/logoitectrans_v2.png"
                         alt="ITEC Saladillo"
                         width="100"
                         class="resp-ftr-logo"
                         style="max-width: 100px; height: auto; display: block; border: 0;" />
                  </td>
                  <td style="vertical-align: middle;" class="resp-stack resp-center">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #0f172a;">
                            ITEC Saladillo
                          </p>
                          <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
                            Saladillo, Provincia de Buenos Aires
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <a href="mailto:prensa@itecsaladillo.org.ar" style="color: #2563eb; text-decoration: none; font-size: 13px; font-weight: 500;">
                            prensa@itecsaladillo.org.ar
                          </a>
                          <span style="color: #cbd5e1; margin: 0 8px;">·</span>
                          <a href="https://itecsaladillo.org.ar" target="_blank" style="color: #2563eb; text-decoration: none; font-size: 13px; font-weight: 500;">
                            itecsaladillo.org.ar
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 11px; color: #94a3b8; font-style: italic;">
                            Este comunicado fue enviado exclusivamente a medios de comunicación acreditados.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
