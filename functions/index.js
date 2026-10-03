// ============================================================================
// / (portada) — Cloudflare Pages Function
// Sirve index.html con los últimos 6 autos ya escritos en el HTML, para que
// buscadores e IAs los vean sin ejecutar JavaScript. Ver functions/_lib/stock.js
// ============================================================================
import { inyectarStock } from "./_lib/stock.js";

export function onRequest(context) {
  // Mismo filtro que cargarStock() en index.html
  return inyectarStock(context, "estado=eq.Disponible&order=created_at.desc&limit=6");
}
