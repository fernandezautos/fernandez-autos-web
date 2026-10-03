// ============================================================================
// Helpers compartidos para pre-armar el stock en el servidor
// Fernandez Autos
// ============================================================================
// La portada y /stock cargan los autos con JavaScript después de abrir la
// página. Los robots de Google, Bing y las IAs (ChatGPT, Perplexity, etc.)
// muchas veces NO ejecutan JavaScript, así que veían "Cargando autos...".
// Con esto el HTML ya llega con el listado escrito (links a /auto/<slug>) y
// después el JavaScript de la página lo reemplaza como siempre.
//
// Lee de Supabase con la llave PUBLICA de solo-lectura (nunca service_role).
// ============================================================================

export const SB_URL = "https://bjgkmrgkgjpydpanewsa.supabase.co";
export const SB_KEY = "sb_publishable_FL_GSYzAfQ507Ve7RVKsKA_njj_gRT6";
export const SITE = "https://www.fernandezautos.com";

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function fmtPrecio(n, moneda) {
  if (!n) return "Consultar precio";
  return (moneda === "USD" ? "US$ " : "$ ") + Number(n).toLocaleString("es-AR");
}

// Autos publicados. `query` es el filtro/orden de PostgREST.
// Cachea 5 minutos en Cloudflare para no pegarle a Supabase en cada visita.
export async function traerAutos(query) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/vehiculos_publico?select=*&${query}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return Array.isArray(data) ? data : null;
  } catch (e) {
    return null;
  }
}

export function urlAuto(v) {
  return v.slug ? `/auto/${encodeURIComponent(v.slug)}` : `/stock`;
}

// Tarjeta simple, con las mismas clases que usan index.html y stock.html.
export function tarjetaAuto(v) {
  const nombre = [v.marca, v.modelo, v.anio].filter(Boolean).join(" ");
  const detalle = [
    v.km ? Number(v.km).toLocaleString("es-AR") + " km" : "",
    v.transmision,
    v.combustible,
    v.color,
  ].filter(Boolean).join(" · ");
  const foto = v.foto_portada
    ? `<img src="${esc(v.foto_portada)}" alt="${esc(nombre)}" loading="lazy">`
    : `<div class="auto-card-img-ph"></div>`;
  return `<a href="${urlAuto(v)}" class="auto-card">
      <div class="auto-card-img">${foto}
        <span class="auto-tag ${v.tipo === "Nuevo" ? "tag-nuevo" : "tag-usado"}">${v.tipo === "Nuevo" ? "0 km" : "Usado"}</span>
        ${v.estado === "Reservado" ? '<span class="tag-reservado">Reservado</span>' : ""}
      </div>
      <div class="auto-card-body">
        <div class="auto-nombre">${esc(nombre)}</div>
        <div class="auto-detalle">${esc(detalle)}</div>
        <div class="auto-footer">
          <div class="auto-precio">${esc(fmtPrecio(v.precio, v.moneda_precio))}</div>
          <span class="auto-cta">Ver detalle</span>
        </div>
      </div>
    </a>`;
}

// Lista de autos en schema.org (ItemList) para el <head>.
export function itemListJsonLd(autos) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Autos disponibles en Fernandez Autos, Mar del Plata",
    numberOfItems: autos.length,
    itemListElement: autos.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: SITE + urlAuto(v),
      name: [v.marca, v.modelo, v.anio].filter(Boolean).join(" "),
    })),
  };
  // "<" escapado para que ningún dato pueda cerrar el <script>.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

// Toma la página estática (context.next()) y le escribe el stock adentro de
// #autosGrid. Si algo falla devuelve la página tal cual: nunca la rompe.
export async function inyectarStock(context, query) {
  const res = await context.next();
  const tipo = res.headers.get("content-type") || "";
  if (context.request.method !== "GET" || !res.ok || !tipo.includes("text/html")) return res;

  const autos = await traerAutos(query);
  if (!autos || !autos.length) return res;

  const tarjetas = autos.map(tarjetaAuto).join("");
  return new HTMLRewriter()
    .on("#autosGrid", {
      element(el) { el.setInnerContent(tarjetas, { html: true }); },
    })
    .on("head", {
      element(el) { el.append(itemListJsonLd(autos), { html: true }); },
    })
    .transform(res);
}
