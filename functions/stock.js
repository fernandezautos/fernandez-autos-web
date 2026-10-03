// ============================================================================
// /stock — Cloudflare Pages Function
// Sirve stock.html con todo el stock publicado ya escrito en el HTML, para que
// buscadores e IAs lo vean sin ejecutar JavaScript. Ver functions/_lib/stock.js
// ============================================================================
import { inyectarStock } from "./_lib/stock.js";

export function onRequest(context) {
  // Mismo filtro que stock.html
  return inyectarStock(context, "or=(estado.eq.Disponible,estado.eq.Reservado)&order=created_at.desc");
}
