// ============================================================================
// /motorhomes — Cloudflare Pages Function
// Sección de motorhomes y casas rodantes. No es una página aparte: sirve la
// misma stock.html (mismos filtros, misma grilla) con su propio título, texto y
// descripción para Google, y con la grilla ya filtrada a motorhomes y casas
// rodantes. El JavaScript de stock.html reconoce la ruta y deja el filtro
// "Vehículo" puesto en "Motorhomes y casas rodantes".
// ============================================================================
import { SITE, inyectarStock } from "./_lib/stock.js";

const TITULO = "Motorhomes y casas rodantes en venta en Mar del Plata — Fernandez Autos";
const DESCRIPCION = "Motorhomes y casas rodantes usados en venta en Mar del Plata, con precio, plazas y equipamiento. Financiación y permuta. Fernandez Autos.";
const H1 = "Motorhomes y casas rodantes en venta en Mar del Plata";

export async function onRequest(context) {
  if (context.request.method !== "GET") return context.next();
  // ASSETS.fetch trae el archivo estático sin pasar por functions/stock.js.
  const pagina = await context.env.ASSETS.fetch(new URL("/stock", context.request.url));
  if (!pagina.ok) return pagina;

  const conTextos = new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(TITULO); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute("content", DESCRIPCION); } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute("content", "Motorhomes y casas rodantes — Fernandez Autos"); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute("content", DESCRIPCION); } })
    .on('link[rel="canonical"]', { element(el) { el.setAttribute("href", `${SITE}/motorhomes`); } })
    .on("h1.stock-titulo", { element(el) { el.setInnerContent(H1); } })
    .on("body", { element(el) { el.setAttribute("data-seccion", "motorhomes"); } })
    .transform(pagina);

  return inyectarStock(
    context,
    "or=(estado.eq.Disponible,estado.eq.Reservado)&clase_vehiculo=neq.Auto&order=created_at.desc",
    conTextos
  );
}
