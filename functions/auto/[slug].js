// ============================================================================
// /auto/[slug] — Cloudflare Pages Function
// Fernandez Autos — Sweet Cars SRL
// ============================================================================
// Arma la ficha individual de un vehiculo con meta tags (Open Graph) correctas
// para que WhatsApp / Facebook / Google muestren la foto y datos de ESE auto.
//
// Lee de Supabase con la llave PUBLICA de solo-lectura (nunca service_role):
//   - vehiculos_publico (vista): datos del auto por slug
//   - auto_fotos: galeria de fotos del auto
//
// La URL /auto/ford-focus-2019-168 es servida por este archivo gracias a la
// convencion de Pages Functions (carpeta functions/ + [slug].js dinamico).
// ============================================================================

const SB_URL = "https://bjgkmrgkgjpydpanewsa.supabase.co";
const SB_KEY = "sb_publishable_FL_GSYzAfQ507Ve7RVKsKA_njj_gRT6";
const WSP = "5492236249445";
const SITE = "https://fernandezautos.com"; // dominio final (ajustable)

// --- Escapar texto para meterlo seguro en HTML ---
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- Redimensionar imagen de Supabase Storage on-the-fly ---
// Convierte .../object/public/... en .../render/image/public/...?width=&height=&resize=contain
// Defensiva: si no es de Supabase Storage publico, es null, o ya esta transformada, devuelve tal cual.
// resize=contain + height enderezan la orientacion (EXIF) y evitan recortes raros.
function imgTransform(url, width, height, quality) {
  if (!url || typeof url !== "string") return url;
  if (url.indexOf("/render/image/") !== -1) return url;
  const marca = "/storage/v1/object/public/";
  if (url.indexOf(marca) === -1) return url;
  const nueva = url.replace(marca, "/storage/v1/render/image/public/");
  const sep = nueva.indexOf("?") === -1 ? "?" : "&";
  let params = "width=" + width;
  if (height) params += "&height=" + height + "&resize=contain";
  params += "&quality=" + (quality || 70);
  return nueva + sep + params;
}

// --- Formatear precio en pesos argentinos ---
function fmtPrecio(n) {
  if (!n) return "Consultar precio";
  return "$ " + Number(n).toLocaleString("es-AR");
}

export async function onRequest(context) {
  const { params } = context;
  const slug = params.slug; // ej: "ford-focus-2019-168"

  // --- Buscar el auto por slug ---
  let auto = null;
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/vehiculos_publico?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const arr = await r.json();
    auto = Array.isArray(arr) && arr.length ? arr[0] : null;
  } catch (e) {
    auto = null;
  }

  // --- Auto no encontrado (vendido, borrado, slug invalido) ---
  if (!auto) {
    return new Response(paginaNoEncontrada(), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // --- Traer galeria de fotos ---
  let fotos = [];
  try {
    const rf = await fetch(
      `${SB_URL}/rest/v1/auto_fotos?select=url&vehiculo_id=eq.${auto.id}&order=orden.asc,created_at.asc`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const ff = await rf.json();
    if (Array.isArray(ff)) fotos = ff.map((f) => f.url).filter(Boolean);
  } catch (e) {}
  if (!fotos.length && auto.foto_portada) fotos = [auto.foto_portada];

  const html = paginaAuto(auto, fotos, slug);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Cache liviano: 5 min en el navegador, revalidable. Mantiene datos frescos.
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

// ============================================================================
// HTML de la ficha del auto
// ============================================================================
function paginaAuto(v, fotos, slug) {
  const nombre = [v.marca, v.modelo, v.anio].filter(Boolean).join(" ");
  const nombreCompleto = [v.marca, v.modelo, v.anio, v.version].filter(Boolean).join(" ");
  const titulo = `${nombreCompleto} — Fernández Autos`;
  // Open Graph: se deja la foto ORIGINAL sin transformar (WhatsApp/Facebook
  // cachean la preview y son quisquillosos con las URLs transformadas).
  const fotoPrincipal = fotos[0] || `${SITE}/og-image-1200x630.png`;
  // Versiones transformadas para mostrar en la pagina (velocidad + orientacion):
  const fotosVista = fotos.map((u) => imgTransform(u, 900, 675, 74)); // principal (4:3)
  const fotosThumb = fotos.map((u) => imgTransform(u, 200, 156, 72)); // miniaturas
  const url = `${SITE}/auto/${slug}`;
  const precioTxt = fmtPrecio(v.precio);
  const reservado = v.estado === "Reservado";

  // Descripcion para meta (WhatsApp / Google)
  const descPartes = [];
  if (v.km) descPartes.push(`${Number(v.km).toLocaleString("es-AR")} km`);
  if (v.transmision) descPartes.push(v.transmision);
  if (v.combustible) descPartes.push(v.combustible);
  descPartes.push(precioTxt);
  const metaDesc = descPartes.join(" · ");

  // Specs visibles en la ficha
  const specs = [
    { label: "Año", val: v.anio },
    { label: "Kilometraje", val: v.km ? Number(v.km).toLocaleString("es-AR") + " km" : "0 km" },
    { label: "Combustible", val: v.combustible },
    { label: "Transmisión", val: v.transmision },
    { label: "Carrocería", val: v.carroceria },
    { label: "Color", val: v.color },
    { label: "Puertas", val: v.puertas ? v.puertas + " puertas" : null },
  ].filter((s) => s.val && s.val !== "—" && s.val !== "");

  const specsHTML = specs
    .map(
      (s) => `<div class="spec">
        <div class="spec-label">${esc(s.label)}</div>
        <div class="spec-val">${esc(s.val)}</div>
      </div>`
    )
    .join("");

  // Galeria
  const thumbsHTML =
    fotos.length > 1
      ? `<div class="thumbs">${fotosThumb
          .map(
            (u, i) =>
              `<img class="thumb ${i === 0 ? "active" : ""}" src="${esc(u)}" onclick="verFoto(${i})" loading="lazy" alt="">`
          )
          .join("")}</div>`
      : "";

  const fotoPrincipalHTML = fotos.length
    ? `<img id="fotoPrincipal" src="${esc(fotosVista[0])}" alt="${esc(nombre)}" class="foto-principal">`
    : `<div class="foto-ph"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c5c1b5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>`;

  const wspMsg = encodeURIComponent(
    `Hola, me interesa el ${nombreCompleto} que vi en la web. ${url}`
  );

  const badgeReservado = reservado
    ? `<span class="badge-reservado">Reservado</span>`
    : "";

  const btnWsp = reservado
    ? `<a href="https://wa.me/${WSP}?text=${wspMsg}" target="_blank" class="btn-wsp">Consultar disponibilidad</a>`
    : `<a href="https://wa.me/${WSP}?text=${wspMsg}" target="_blank" class="btn-wsp">Consultar por WhatsApp</a>`;

  const obsHTML = v.obs
    ? `<div class="obs"><h3>Descripción</h3><p>${esc(v.obs)}</p></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(metaDesc)}">

<!-- Open Graph: lo que WhatsApp / Facebook leen para la miniatura -->
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(nombreCompleto)} — ${esc(precioTxt)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:image" content="${esc(fotoPrincipal)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="Fernández Autos">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(nombreCompleto)} — ${esc(precioTxt)}">
<meta name="twitter:description" content="${esc(metaDesc)}">
<meta name="twitter:image" content="${esc(fotoPrincipal)}">

<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="64x64" href="/favicon-64.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180.png">

<style>
:root{
  --black:#0e0d0b; --white:#fafaf7; --cream:#f4f2ec;
  --accent:#1a4a8a; --muted:#7a7870; --border:#e2dfd5;
  --sans:Arial,sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:var(--sans);background:var(--white);color:var(--black);}

/* HEADER */
header{
  display:flex;align-items:center;justify-content:space-between;
  padding:0 24px;height:60px;background:#fff;
  border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50;
}
header .logo img{height:40px;}
header a.volver{
  font-size:0.9rem;font-weight:500;color:var(--muted);text-decoration:none;
  display:flex;align-items:center;gap:6px;
}
header a.volver:hover{color:var(--black);}

/* LAYOUT */
.ficha{max-width:1080px;margin:0 auto;padding:24px;display:grid;grid-template-columns:1.3fr 1fr;gap:32px;}
@media(max-width:820px){.ficha{grid-template-columns:1fr;gap:20px;}}

/* GALERIA */
.galeria{}
.foto-principal{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;background:var(--cream);display:block;cursor:zoom-in;}
.foto-ph{width:100%;aspect-ratio:4/3;border-radius:12px;background:var(--cream);display:flex;align-items:center;justify-content:center;}
.thumbs{display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:4px;}
.thumb{width:72px;height:56px;object-fit:cover;border-radius:8px;cursor:pointer;flex-shrink:0;border:2px solid transparent;opacity:.7;transition:all .15s;}
.thumb.active,.thumb:hover{border-color:var(--accent);opacity:1;}

/* DATOS */
.datos{}
.marca-label{font-size:0.75rem;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;}
.nombre{font-family:Georgia,serif;font-size:1.7rem;font-weight:700;margin:4px 0 10px;line-height:1.15;}
.precio{font-size:1.9rem;font-weight:700;color:var(--accent);margin-bottom:6px;}
.badge-reservado{display:inline-block;background:#92400e;color:#fff;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;padding:4px 12px;border-radius:20px;margin-bottom:12px;}

.specs{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin:18px 0;}
.spec{background:#fff;padding:12px 14px;}
.spec-label{font-size:0.68rem;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);font-weight:600;margin-bottom:3px;}
.spec-val{font-size:0.95rem;font-weight:600;}

.obs{margin:18px 0;}
.obs h3{font-family:Georgia,serif;font-size:1.05rem;margin-bottom:6px;}
.obs p{font-size:0.92rem;color:#444;line-height:1.5;white-space:pre-line;}

.btn-wsp{
  display:flex;align-items:center;justify-content:center;gap:8px;
  background:#25d366;color:#fff;text-decoration:none;
  padding:14px;border-radius:10px;font-size:1rem;font-weight:600;
  margin-top:8px;width:100%;
}
.btn-compartir{
  display:flex;align-items:center;justify-content:center;gap:8px;
  background:#fff;color:var(--accent);border:1.5px solid var(--border);
  padding:12px;border-radius:10px;font-size:0.92rem;font-weight:600;
  margin-top:10px;width:100%;cursor:pointer;font-family:var(--sans);text-decoration:none;
}
.btn-compartir:hover{border-color:var(--accent);}

/* LIGHTBOX */
.lightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;align-items:center;justify-content:center;}
.lightbox.open{display:flex;}
.lightbox img{max-width:92vw;max-height:88vh;object-fit:contain;}
.lightbox .cerrar{position:absolute;top:20px;right:24px;color:#fff;font-size:2rem;cursor:pointer;background:none;border:none;line-height:1;}

footer{border-top:1px solid var(--border);padding:24px;text-align:center;color:var(--muted);font-size:0.82rem;margin-top:20px;}
footer a{color:var(--accent);text-decoration:none;}
</style>
</head>
<body>

<header>
  <a href="/" class="logo"><img src="/wordmark-navy.svg" alt="Fernández Autos" onerror="this.src='/logo.png'"></a>
  <a href="/stock.html" class="volver">‹ Volver al stock</a>
</header>

<div class="ficha">
  <div class="galeria">
    ${fotoPrincipalHTML}
    ${thumbsHTML}
  </div>

  <div class="datos">
    <div class="marca-label">${esc((v.marca || "").toUpperCase())}</div>
    <h1 class="nombre">${esc([v.modelo, v.anio, v.version].filter(Boolean).join(" "))}</h1>
    ${badgeReservado}
    <div class="precio">${esc(precioTxt)}</div>
    <div class="specs">${specsHTML}</div>
    ${obsHTML}
    ${btnWsp}
    <button class="btn-compartir" onclick="compartir()">Compartir</button>
  </div>
</div>

<footer>
  Fernández Autos — Mar del Plata · <a href="/stock.html">Ver todo el stock</a>
</footer>

<!-- LIGHTBOX -->
<div class="lightbox" id="lightbox" onclick="cerrarLightbox(event)">
  <button class="cerrar" onclick="cerrarLightbox(event)">✕</button>
  <img id="lightboxImg" src="" alt="">
</div>

<script>
// Fotos para mostrar en grande al cambiar (transformadas, orientadas).
const FOTOS = ${JSON.stringify(fotosVista)};
// Fotos originales en alta, para el lightbox (ampliar).
const FOTOS_HD = ${JSON.stringify(fotos)};
const URL_AUTO = ${JSON.stringify(url)};
const TITULO = ${JSON.stringify(nombreCompleto)};

function verFoto(i){
  const main = document.getElementById('fotoPrincipal');
  if(main){ main.src = FOTOS[i]; main.dataset.idx = i; }
  document.querySelectorAll('.thumb').forEach((t,idx)=>t.classList.toggle('active',idx===i));
}

const mainImg = document.getElementById('fotoPrincipal');
if(mainImg){
  mainImg.dataset.idx = 0;
  mainImg.addEventListener('click', ()=>{
    const i = parseInt(mainImg.dataset.idx || '0', 10);
    document.getElementById('lightboxImg').src = FOTOS_HD[i] || mainImg.src;
    document.getElementById('lightbox').classList.add('open');
  });
}
function cerrarLightbox(e){
  if(e.target.id==='lightbox' || e.target.classList.contains('cerrar')){
    document.getElementById('lightbox').classList.remove('open');
  }
}

async function compartir(){
  const datos = { title: TITULO, text: TITULO + ' — Fernández Autos', url: URL_AUTO };
  if(navigator.share){
    try{ await navigator.share(datos); }catch(e){}
  } else {
    try{
      await navigator.clipboard.writeText(URL_AUTO);
      alert('Link copiado al portapapeles');
    }catch(e){
      prompt('Copiá el link:', URL_AUTO);
    }
  }
}
</script>
</body>
</html>`;
}

// ============================================================================
// Pagina 404 (auto no encontrado / vendido)
// ============================================================================
function paginaNoEncontrada() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Auto no disponible — Fernández Autos</title>
<style>
body{font-family:Arial,sans-serif;background:#fafaf7;color:#0e0d0b;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px;}
.box{max-width:420px;}
h1{font-family:Georgia,serif;font-size:1.5rem;margin-bottom:10px;}
p{color:#7a7870;margin-bottom:20px;line-height:1.5;}
a{display:inline-block;background:#1a4a8a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;}
</style>
</head>
<body>
<div class="box">
  <h1>Este auto ya no está disponible</h1>
  <p>Puede que se haya vendido o dado de baja. Mirá el resto de nuestro stock, seguro encontrás algo que te guste.</p>
  <a href="/stock.html">Ver stock disponible</a>
</div>
</body>
</html>`;
}
