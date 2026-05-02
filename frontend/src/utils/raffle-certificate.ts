import toast from 'react-hot-toast';
import type { RaffleWinnerDto } from '@pos/shared';
import { escapeHtml as esc, resolveUploadUrl } from './print';

export interface BusinessInfo {
  name:     string;
  address?: string;
  phone?:   string;
  logoUrl?: string | null;
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
}

// Corner ornament — red L-bracket style
function corner(pos: 'tl' | 'tr' | 'bl' | 'br'): string {
  const isTop    = pos === 'tl' || pos === 'tr';
  const isLeft   = pos === 'tl' || pos === 'bl';
  const top      = isTop  ? '10mm' : 'auto';
  const bottom   = isTop  ? 'auto' : '10mm';
  const left     = isLeft ? '10mm' : 'auto';
  const right    = isLeft ? 'auto' : '10mm';
  const bTop     = isTop  ? '3px solid #DC2626' : 'none';
  const bBottom  = isTop  ? 'none' : '3px solid #DC2626';
  const bLeft    = isLeft ? '3px solid #DC2626' : 'none';
  const bRight   = isLeft ? 'none' : '3px solid #DC2626';
  return `<div style="position:absolute;top:${top};bottom:${bottom};left:${left};right:${right};` +
    `width:12mm;height:12mm;border-top:${bTop};border-bottom:${bBottom};` +
    `border-left:${bLeft};border-right:${bRight}"></div>`;
}

export function printWinnerCertificate(
  winner: RaffleWinnerDto,
  raffleName: string,
  business: BusinessInfo,
): void {
  const drawnDate = new Date(winner.drawnAt);
  const dateStr   = drawnDate.toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });

  const logoSrc = business.logoUrl ? resolveUploadUrl(business.logoUrl) : null;

  const logoBlock = logoSrc
    ? `<img src="${esc(logoSrc)}" alt="" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid #DC2626">`
    : `<div style="width:52px;height:52px;border-radius:50%;background:#DC2626;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:900;font-family:'Montserrat',sans-serif;flex-shrink:0">${esc(initials(business.name))}</div>`;

  const prizeBlock = winner.prizeDescription
    ? `<div style="width:100%;margin:10px 0 14px">
         <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
           <div style="flex:1;height:1px;background:#DC2626;opacity:0.4"></div>
           <div style="width:5px;height:5px;border:1.5px solid #DC2626;transform:rotate(45deg);opacity:0.6"></div>
           <div style="flex:1;height:1px;background:#DC2626;opacity:0.4"></div>
         </div>
         <div style="text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:19px;font-weight:700;font-style:italic;color:#DC2626;letter-spacing:0.01em">${esc(winner.prizeDescription)}</div>
         <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
           <div style="flex:1;height:1px;background:#DC2626;opacity:0.4"></div>
           <div style="width:5px;height:5px;border:1.5px solid #DC2626;transform:rotate(45deg);opacity:0.6"></div>
           <div style="flex:1;height:1px;background:#DC2626;opacity:0.4"></div>
         </div>
       </div>`
    : '';

  const addressLine = business.address
    ? `<span style="font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#94a3b8">${esc(business.address)}</span>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Certificado de Premio — ${esc(raffleName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Montserrat:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 landscape; margin: 0; }
    *, *::before, *::after {
      margin: 0; padding: 0; box-sizing: border-box;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    html, body {
      width: 297mm;
      height: 210mm;
      overflow: hidden;
      background: #FAF7F0;
    }
    body {
      position: relative;
      display: flex;
      align-items: stretch;
    }
    @media print {
      html, body { width: 297mm; height: 210mm; }
    }
  </style>
</head>
<body>

  <!-- Outer border frame -->
  <div style="position:absolute;inset:8mm;border:2px solid #DC2626;z-index:1;pointer-events:none"></div>
  <div style="position:absolute;inset:10.5mm;border:1px solid #DC2626;opacity:0.3;z-index:1;pointer-events:none"></div>

  <!-- Corner ornaments -->
  ${corner('tl')}${corner('tr')}${corner('bl')}${corner('br')}

  <!-- Watermark -->
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);
    font-family:'Playfair Display',Georgia,serif;font-size:64pt;font-weight:700;
    color:#DC2626;opacity:0.05;white-space:nowrap;z-index:0;letter-spacing:0.08em;
    pointer-events:none;user-select:none">${esc(business.name)}</div>

  <!-- Certificate content -->
  <div style="position:relative;z-index:2;width:100%;display:flex;flex-direction:column;
    align-items:center;justify-content:space-between;padding:16mm 22mm 14mm">

    <!-- ── Top: header + central block, centered in the remaining vertical space ── -->
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;
      justify-content:center;gap:14px;width:100%">

      <!-- Header -->
      <div style="display:flex;align-items:center;gap:12px">
        ${logoBlock}
        <div>
          <div style="font-family:'Montserrat',sans-serif;font-size:16px;font-weight:900;
            color:#1A1A2E;letter-spacing:-0.01em;line-height:1.2">${esc(business.name)}</div>
          ${addressLine}
        </div>
      </div>

      <!-- Central block — 480px column -->
      <div style="width:480px;display:flex;flex-direction:column;align-items:center">

        <div style="display:flex;align-items:center;gap:10px;width:100%;margin-bottom:6px">
          <div style="flex:1;height:1px;background:#DC2626;opacity:0.4"></div>
          <span style="font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:0.35em;
            text-transform:uppercase;color:#DC2626;font-weight:700;white-space:nowrap">Certificado de Premio</span>
          <div style="flex:1;height:1px;background:#DC2626;opacity:0.4"></div>
        </div>

        <div style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;
          font-size:48px;font-weight:700;font-style:italic;color:#1A1A2E;line-height:1;
          margin-bottom:4px;text-align:center">¡Felicidades!</div>

        <div style="font-family:'Playfair Display',Georgia,serif;font-size:12px;font-style:italic;
          color:#94a3b8;margin-bottom:8px;text-align:center">Se otorga el presente reconocimiento a</div>

        <div style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;
          font-size:35px;font-weight:700;color:#DC2626;text-align:center;line-height:1.1;
          margin-bottom:8px;letter-spacing:-0.01em">${esc(winner.customer.name)}</div>

        <p style="font-family:'Montserrat',sans-serif;font-size:11px;color:#475569;
          text-align:center;line-height:1.55;margin-bottom:4px">
          El equipo completo le extiende la más sincera felicitación.
          Como ganador del sorteo <strong style="color:#DC2626">${esc(raffleName)}</strong>,
          ha sido acreedor del siguiente premio:
        </p>

        ${prizeBlock}

      </div>
    </div>

    <!-- ── Footer — siempre al fondo ── -->
    <div style="display:flex;align-items:flex-end;justify-content:space-between;
      width:100%;border-top:1px solid #e5e7eb;padding-top:10px">

      <div>
        <div style="font-family:'Montserrat',sans-serif;font-size:8px;letter-spacing:0.25em;
          text-transform:uppercase;color:#94a3b8;margin-bottom:3px">Fecha del sorteo</div>
        <div style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;
          color:#1A1A2E">${dateStr}</div>
      </div>

      <div style="text-align:right">
        <div style="width:140px;height:1px;background:#1A1A2E;margin-left:auto;margin-bottom:4px;margin-top:22px"></div>
        <div style="font-family:'Montserrat',sans-serif;font-size:8px;letter-spacing:0.25em;
          text-transform:uppercase;color:#94a3b8">Firma y sello</div>
      </div>

    </div>
  </div>

  <script>
    (function () {
      var delay = ${logoSrc ? 700 : 400};
      window.addEventListener('load', function () {
        setTimeout(function () {
          window.focus();
          window.print();
          window.addEventListener('afterprint', function () { window.close(); });
        }, delay);
      });
    })();
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank', 'width=1050,height=780,scrollbars=yes');
  if (!win) {
    URL.revokeObjectURL(url);
    toast.error('Permite ventanas emergentes en tu navegador para imprimir el certificado.');
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
