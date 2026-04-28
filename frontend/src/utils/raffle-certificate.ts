import toast from 'react-hot-toast';
import type { RaffleWinnerDto } from '@pos/shared';
import { positionLabel } from './raffle-utils';

const MEDAL_HEX: Record<number, string> = {
  1: '#d97706',
  2: '#9ca3af',
  3: '#ea580c',
};
const DEFAULT_HEX = '#0369a1';

export interface BusinessInfo {
  name: string;
  address?: string;
  phone?: string;
}

// Escape HTML text content — prevents malformed HTML if names contain <, >, &
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function printWinnerCertificate(
  winner: RaffleWinnerDto,
  raffleName: string,
  business: BusinessInfo,
): void {
  const color     = MEDAL_HEX[winner.position] ?? DEFAULT_HEX;
  const pos       = positionLabel(winner.position);
  const drawnDate = new Date(winner.drawnAt);
  const dateStr   = drawnDate.toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr   = drawnDate.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

  const businessMeta = [business.address, business.phone].filter(Boolean).join(' · ');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Acta de Sorteo — ${esc(raffleName)}</title>
  <style>
    @page { size: A5 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      width: 100%; max-width: 480px;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
    }
    .top-bar { height: 5px; background: ${color}; }
    .body { padding: 28px 44px 28px; }
    .business {
      text-align: center; margin-bottom: 18px;
      padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;
    }
    .business-name { font-size: 15px; font-weight: 900; color: #0f172a; letter-spacing: -0.01em; }
    .business-meta { font-size: 9px; color: #94a3b8; margin-top: 3px; }
    .eyebrow {
      font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase;
      color: #94a3b8; text-align: center; margin-bottom: 4px;
    }
    .doc-title { font-size: 20px; font-weight: 900; color: #0f172a; text-align: center; margin-bottom: 2px; }
    .raffle-name { font-size: 11px; color: #64748b; text-align: center; font-style: italic; margin-bottom: 20px; }
    .divider { border: none; border-top: 1px solid #f1f5f9; margin: 0 0 20px; }
    .winner-section { text-align: center; margin-bottom: 20px; }
    .certify-text { font-size: 10px; color: #94a3b8; margin-bottom: 14px; }
    .medal {
      display: inline-flex; align-items: center; justify-content: center;
      width: 68px; height: 68px; border-radius: 50%;
      background: ${color}; color: #fff; font-size: 22px; font-weight: 900; margin-bottom: 10px;
    }
    .position-label {
      font-size: 8px; letter-spacing: 0.4em; text-transform: uppercase;
      color: ${color}; font-weight: 700; margin-bottom: 10px;
    }
    .winner-name { font-size: 28px; font-weight: 900; color: #0f172a; line-height: 1.15; margin-bottom: 3px; }
    .winner-phone { font-size: 11px; color: #94a3b8; }
    .details {
      display: flex; justify-content: center; gap: 48px;
      padding: 16px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin: 16px 0;
    }
    .detail { text-align: center; }
    .detail-label { font-size: 7px; letter-spacing: 0.3em; text-transform: uppercase; color: #cbd5e1; margin-bottom: 3px; }
    .detail-value { font-size: 16px; font-weight: 800; color: #1e293b; }
    .prize {
      background: #f0f9ff; border: 1px solid #bae6fd;
      border-radius: 8px; padding: 10px 18px; text-align: center; margin-bottom: 16px;
    }
    .prize-label { font-size: 7px; letter-spacing: 0.3em; text-transform: uppercase; color: #0369a1; margin-bottom: 3px; }
    .prize-value { font-size: 14px; font-weight: 700; color: #0369a1; }
    .sigs { display: flex; gap: 28px; margin-top: 44px; }
    .sig { flex: 1; }
    .sig-line { border-top: 1px solid #cbd5e1; padding-top: 8px; text-align: center; }
    .sig-text { font-size: 7px; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; }
    .timestamp { text-align: center; margin-top: 18px; font-size: 9px; color: #cbd5e1; letter-spacing: 0.05em; }
    @media print {
      body { background: #fff; padding: 0; }
      .card { box-shadow: none; max-width: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="top-bar"></div>
    <div class="body">
      <div class="business">
        <p class="business-name">${esc(business.name)}</p>
        ${businessMeta ? `<p class="business-meta">${esc(businessMeta)}</p>` : ''}
      </div>
      <p class="eyebrow">Acta oficial de</p>
      <h1 class="doc-title">Sorteo</h1>
      <p class="raffle-name">"${esc(raffleName)}"</p>
      <hr class="divider">
      <div class="winner-section">
        <p class="certify-text">Se certifica que el ganador del</p>
        <div class="medal">${winner.position}°</div>
        <p class="position-label">${esc(pos)}</p>
        <p class="winner-name">${esc(winner.customer.name)}</p>
        ${winner.customer.phone ? `<p class="winner-phone">${esc(winner.customer.phone)}</p>` : ''}
      </div>
      <div class="details">
        <div class="detail">
          <p class="detail-label">N° Ticket</p>
          <p class="detail-value">#${winner.ticketNumber}</p>
        </div>
        <div class="detail">
          <p class="detail-label">Fecha</p>
          <p class="detail-value">${dateStr}</p>
        </div>
      </div>
      ${winner.prizeDescription ? `
      <div class="prize">
        <p class="prize-label">Premio</p>
        <p class="prize-value">${esc(winner.prizeDescription)}</p>
      </div>` : ''}
      <div class="sigs">
        <div class="sig"><div class="sig-line"><span class="sig-text">Firma Ganador</span></div></div>
        <div class="sig"><div class="sig-line"><span class="sig-text">Firma Organizador</span></div></div>
      </div>
      <p class="timestamp">${dateStr} · ${timeStr}</p>
    </div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.print();
        window.addEventListener('afterprint', function () { window.close(); });
      }, 350);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=700,height=900,scrollbars=yes');
  if (!win) {
    toast.error('Permite ventanas emergentes en tu navegador para imprimir el certificado.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
