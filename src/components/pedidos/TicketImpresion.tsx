import { Nota } from '../../pages/pedidos/types'

const BASE_URL = 'https://darkgray-chough-136153.hostingersite.com'

export function imprimirNota(nota: Nota) {
  const qrUrl = `${BASE_URL}/pedidos/folio/${nota.folio}`
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUrl)}&size=200x200&margin=4`
  const fecha = new Date(nota.created_at).toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket ${nota.folio}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: 80mm auto;
      margin: 4mm;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #000;
      background: #fff;
      width: 72mm;
    }

    .center { text-align: center; }
    .bold   { font-weight: bold; }
    .lg     { font-size: 15px; }
    .xl     { font-size: 20px; letter-spacing: 1px; }
    .sm     { font-size: 9px; }
    .divider {
      border: none;
      border-top: 1px dashed #000;
      margin: 4px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 1px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }
    th {
      border-bottom: 1px solid #000;
      text-align: left;
      padding: 2px 0;
      font-size: 9px;
      text-transform: uppercase;
    }
    td {
      padding: 2px 0;
      vertical-align: top;
    }
    td.cant { text-align: center; width: 20px; }
    td.cod  { white-space: nowrap; padding-right: 4px; }
    .qr-img { display: block; margin: 6px auto; }
    .badge  {
      display: inline-block;
      border: 1px solid #000;
      padding: 1px 6px;
      font-weight: bold;
      margin: 2px 0;
    }
    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 9px;
      border-top: 1px dashed #000;
      padding-top: 4px;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <p class="center bold lg">Sistema Empresarial</p>
  <p class="center sm">Refacciones y distribución</p>
  <hr class="divider" />

  <!-- FOLIO -->
  <p class="center bold xl">${nota.folio}</p>
  <p class="center sm">${fecha}</p>
  <hr class="divider" />

  <!-- QR -->
  <img class="qr-img" src="${qrImg}" width="140" height="140" alt="QR ${nota.folio}" />
  <p class="center sm">${qrUrl}</p>
  <hr class="divider" />

  <!-- DATOS -->
  <div class="row"><span class="bold">Vendedora:</span><span>${nota.vendedora?.nombre ?? '—'}</span></div>
  <div class="row"><span class="bold">Agente:</span><span>${nota.vendedora?.numero_agente ?? 'Sin asignar'}</span></div>
  <div class="row"><span class="bold">Cliente:</span><span>${nota.nombre_cliente || 'Público en general'}</span></div>
  ${nota.facturacion ? '<p class="badge center">*** REQUIERE FACTURA ***</p>' : ''}
  ${nota.descuento_especial ? '<p class="badge center">*** DESCUENTO ESPECIAL ***</p>' : ''}
  ${nota.notas ? `<p class="sm">Obs: ${nota.notas}</p>` : ''}
  <hr class="divider" />

  <!-- PRODUCTOS -->
  <p class="bold sm">PRODUCTOS (${(nota.items ?? []).length})</p>
  <table>
    <thead>
      <tr>
        <th style="width:52px">Código</th>
        <th>Descripción</th>
        <th style="width:20px;text-align:center">Cant</th>
      </tr>
    </thead>
    <tbody>
      ${(nota.items ?? []).map(it => `
      <tr>
        <td class="cod">${it.codigo}</td>
        <td>${it.nombre}</td>
        <td class="cant">${it.cantidad}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <hr class="divider" />

  <!-- FOOTER -->
  <div class="footer">
    <p>Para cobrar presentar este ticket en caja</p>
    <p class="sm" style="margin-top:3px">Impreso: ${new Date().toLocaleString('es-MX')}</p>
  </div>

</body>
</html>`

  const win = window.open('', '_blank', 'width=400,height=700,scrollbars=yes')
  if (!win) { alert('Permite ventanas emergentes para imprimir'); return }
  win.document.open()
  win.document.write(html)
  win.document.close()
  // Esperar que cargue el QR antes de imprimir
  win.onload = () => { win.focus(); win.print() }
}
