// ============================================================================
// /sitemap.xml — Cloudflare Pages Function
// Mapa del sitio para Google, Bing y las IAs. Se arma solo con el stock del
// momento: cuando entra o se vende un auto, el mapa se actualiza sin tocar nada.
// ============================================================================
import { SITE, esc, traerAutos, urlAuto } from "./_lib/stock.js";

const PAGINAS = [
  { path: "/", prioridad: "1.0", frecuencia: "daily" },
  { path: "/stock", prioridad: "0.9", frecuencia: "daily" },
  { path: "/financiacion", prioridad: "0.7", frecuencia: "monthly" },
  { path: "/consignaciones", prioridad: "0.7", frecuencia: "monthly" },
];

export async function onRequest() {
  const autos = (await traerAutos("or=(estado.eq.Disponible,estado.eq.Reservado)&order=created_at.desc")) || [];

  const urls = [
    ...PAGINAS.map((p) =>
      `<url><loc>${SITE}${p.path}</loc><changefreq>${p.frecuencia}</changefreq><priority>${p.prioridad}</priority></url>`
    ),
    ...autos.filter((v) => v.slug).map((v) => {
      const fecha = v.created_at ? `<lastmod>${String(v.created_at).slice(0, 10)}</lastmod>` : "";
      return `<url><loc>${esc(SITE + urlAuto(v))}</loc>${fecha}<changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
