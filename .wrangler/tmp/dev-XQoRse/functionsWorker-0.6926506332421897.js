var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-RxrWQX/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// .wrangler/tmp/pages-rjBIS7/functionsWorker-0.6926506332421897.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
function stripCfConnectingIPHeader2(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader2, "stripCfConnectingIPHeader");
__name2(stripCfConnectingIPHeader2, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader2.apply(null, argArray)
    ]);
  }
});
var SB_URL = "https://bjgkmrgkgjpydpanewsa.supabase.co";
var SB_KEY = "sb_publishable_FL_GSYzAfQ507Ve7RVKsKA_njj_gRT6";
var SITE = "https://www.fernandezautos.com";
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(esc, "esc");
__name2(esc, "esc");
function imgTransform(url, width, height, quality) {
  return url;
}
__name(imgTransform, "imgTransform");
__name2(imgTransform, "imgTransform");
function fmtPrecio(n, moneda) {
  if (!n)
    return "Consultar precio";
  const simbolo = moneda === "USD" ? "US$" : "$";
  return simbolo + " " + Number(n).toLocaleString("es-AR");
}
__name(fmtPrecio, "fmtPrecio");
__name2(fmtPrecio, "fmtPrecio");
function versionLimpia(modelo, version) {
  if (!version)
    return "";
  if (!modelo)
    return version;
  const m = String(modelo).trim().toLowerCase();
  const vv = String(version).trim();
  if (vv.toLowerCase().startsWith(m)) {
    const resto = vv.slice(m.length).replace(/^[\s\-–—]+/, "").trim();
    return resto || "";
  }
  return vv;
}
__name(versionLimpia, "versionLimpia");
__name2(versionLimpia, "versionLimpia");
async function onRequest(context) {
  const { params } = context;
  const slug = params.slug;
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
  if (!auto) {
    return new Response(paginaNoEncontrada(), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
  let fotos = [];
  try {
    const rf = await fetch(
      `${SB_URL}/rest/v1/auto_fotos?select=url&vehiculo_id=eq.${auto.id}&order=orden.asc,created_at.asc`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const ff = await rf.json();
    if (Array.isArray(ff))
      fotos = ff.map((f) => f.url).filter(Boolean);
  } catch (e) {
  }
  if (!fotos.length && auto.foto_portada)
    fotos = [auto.foto_portada];
  const html = paginaAuto(auto, fotos, slug);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Cache liviano: 5 min en el navegador, revalidable. Mantiene datos frescos.
      "Cache-Control": "public, max-age=300, s-maxage=300"
    }
  });
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
function paginaAuto(v, fotos, slug) {
  const nombre = [v.marca, v.modelo, v.anio].filter(Boolean).join(" ");
  const vLimpia = versionLimpia(v.modelo, v.version);
  const nombreCompleto = [v.marca, v.modelo, v.anio, vLimpia].filter(Boolean).join(" ");
  const titulo = `${nombreCompleto} \u2014 Fernandez Autos, Mar del Plata`;
  const fotoPrincipal = fotos[0] || `${SITE}/og-image-1200x630.png`;
  const fotosVista = fotos.map((u) => imgTransform(u, 900, 675, 74));
  const fotosThumb = fotos.map((u) => imgTransform(u, 200, 156, 72));
  const url = `${SITE}/auto/${slug}`;
  const precioTxt = fmtPrecio(v.precio, v.moneda_precio);
  const reservado = v.estado === "Reservado";
  const descPartes = [];
  if (v.km)
    descPartes.push(`${Number(v.km).toLocaleString("es-AR")} km`);
  if (v.transmision)
    descPartes.push(v.transmision);
  if (v.combustible)
    descPartes.push(v.combustible);
  descPartes.push(precioTxt);
  const metaDesc = descPartes.join(" \xB7 ");
  let seoDesc = `${nombreCompleto} ${v.tipo === "Nuevo" ? "0km" : "usado"} en venta en Fernandez Autos, Mar del Plata. ${metaDesc}.`;
  if (seoDesc.length > 158)
    seoDesc = seoDesc.slice(0, 157).replace(/\s+\S*$/, "") + "\u2026";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: nombreCompleto,
    url,
    image: fotos.length ? fotos.slice(0, 10) : void 0,
    brand: v.marca ? { "@type": "Brand", name: v.marca } : void 0,
    model: v.modelo || void 0,
    vehicleConfiguration: vLimpia || void 0,
    vehicleModelDate: v.anio ? String(v.anio) : void 0,
    itemCondition: v.tipo === "Nuevo" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    mileageFromOdometer: { "@type": "QuantitativeValue", value: Number(v.km) || 0, unitCode: "KMT" },
    fuelType: v.combustible || void 0,
    vehicleTransmission: v.transmision || void 0,
    bodyType: v.carroceria || void 0,
    color: v.color || void 0,
    numberOfDoors: v.puertas ? Number(v.puertas) : void 0,
    offers: {
      "@type": "Offer",
      url,
      price: v.precio ? Number(v.precio) : void 0,
      priceCurrency: v.precio ? v.moneda_precio === "USD" ? "USD" : "ARS" : void 0,
      availability: reservado ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
      seller: {
        "@id": `${SITE}/#concesionaria`,
        "@type": "AutoDealer",
        name: "Fernandez Autos",
        url: `${SITE}/`,
        telephone: "+54 9 223 624-9445",
        address: { "@type": "PostalAddress", streetAddress: "20 de Septiembre 4326", addressLocality: "Mar del Plata", addressRegion: "Buenos Aires", postalCode: "7600", addressCountry: "AR" }
      }
    }
  };
  const jsonLdHTML = `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}<\/script>`;
  const specs = [
    { label: "A\xF1o", val: v.anio },
    { label: "Kilometraje", val: v.km ? Number(v.km).toLocaleString("es-AR") + " km" : "0 km" },
    { label: "Combustible", val: v.combustible },
    { label: "Transmisi\xF3n", val: v.transmision },
    { label: "Carrocer\xEDa", val: v.carroceria },
    { label: "Color", val: v.color },
    { label: "Puertas", val: v.puertas ? v.puertas + " puertas" : null }
  ].filter((s) => s.val && s.val !== "\u2014" && s.val !== "");
  const specsHTML = specs.map(
    (s, i) => {
      const esUltimaImpar = specs.length % 2 === 1 && i === specs.length - 1;
      return `<div class="spec${esUltimaImpar ? " full" : ""}">
        <div class="spec-label">${esc(s.label)}</div>
        <div class="spec-val">${esc(s.val)}</div>
      </div>`;
    }
  ).join("");
  const thumbsHTML = fotos.length > 1 ? `<div class="thumbs">${fotosThumb.map(
    (u, i) => `<img class="thumb ${i === 0 ? "active" : ""}" src="${esc(u)}" onclick="verFoto(${i})" loading="lazy" alt="">`
  ).join("")}</div>` : "";
  const fotoPrincipalHTML = fotos.length ? `<div class="foto-wrap">
         <img id="fotoPrincipal" src="${esc(fotosVista[0])}" alt="${esc(nombre)}" class="foto-principal">
         ${fotos.length > 1 ? `<button class="nav-foto prev" onclick="cambiarFoto(-1)" aria-label="Anterior">\u2039</button>
         <button class="nav-foto next" onclick="cambiarFoto(1)" aria-label="Siguiente">\u203A</button>
         <div class="foto-contador"><span id="fotoNum">1</span>/${fotos.length}</div>` : ""}
       </div>` : `<div class="foto-ph"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c5c1b5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>`;
  const badgeReservado = reservado ? `<span class="badge-reservado">Reservado</span>` : "";
  const waHref = `/wa.html?ctx=${encodeURIComponent("auto:" + nombre)}&vehiculo_id=${encodeURIComponent(String(v.id))}`;
  const btnWsp = reservado ? `<a href="${waHref}" class="btn-wsp" onclick="if(typeof fbq==='function')fbq('track','Contact',{content_ids:['${esc(String(v.id))}'],content_name:'${esc(nombreCompleto)}',content_type:'vehicle'});">Consultar disponibilidad</a>` : `<a href="${waHref}" class="btn-wsp" onclick="if(typeof fbq==='function')fbq('track','Contact',{content_ids:['${esc(String(v.id))}'],content_name:'${esc(nombreCompleto)}',content_type:'vehicle'});">Consultar por WhatsApp</a>`;
  const obsHTML = v.obs ? `<div class="obs"><h3>Descripci\xF3n</h3><p>${esc(v.obs)}</p></div>` : "";
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(seoDesc)}">
<link rel="canonical" href="${esc(url)}">
${jsonLdHTML}

<!-- \u2500\u2500 META PIXEL \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '171050316910974');
fbq('track', 'PageView');
fbq('track', 'ViewContent', {
  content_ids: ['${esc(String(v.id))}'],
  content_name: '${esc(nombreCompleto)}',
  content_type: 'vehicle',
  content_category: '${esc(v.marca || "")}',
  value: ${Number(v.precio) || 0},
  currency: 'ARS'
});
<\/script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=171050316910974&ev=PageView&noscript=1"/></noscript>
<!-- \u2500\u2500 FIN META PIXEL \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->

<!-- Open Graph: lo que WhatsApp / Facebook leen para la miniatura -->
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(nombreCompleto)} \u2014 ${esc(precioTxt)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:image" content="${esc(fotoPrincipal)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="Fernandez Autos">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(nombreCompleto)} \u2014 ${esc(precioTxt)}">
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
  padding:0 48px;height:62px;
  background:rgba(250,250,247,.97);backdrop-filter:blur(12px);
  border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50;
}
header .logo{display:flex;align-items:center;text-decoration:none;flex-shrink:0;}
header .logo svg{height:34px;width:auto;display:block;overflow:visible;}
header .logo svg .p{fill:#15140f;}
header .logo svg .s{fill:#15140f;fill-opacity:0.5;}
header a.volver{
  font-size:0.9rem;font-weight:500;color:var(--muted);text-decoration:none;
  display:flex;align-items:center;gap:6px;
}
header a.volver:hover{color:var(--black);}

/* LAYOUT */
.ficha{max-width:1080px;margin:0 auto;padding:24px;display:grid;grid-template-columns:1.3fr 1fr;gap:32px;}
@media(max-width:820px){.ficha{grid-template-columns:1fr;gap:20px;}header{padding:0 16px;}}

/* GALERIA */
.galeria{min-width:0;}
.foto-wrap{position:relative;user-select:none;}
.foto-principal{width:100%;max-width:100%;aspect-ratio:4/3;object-fit:contain;border-radius:12px;background:var(--cream);display:block;cursor:zoom-in;touch-action:pan-y;}
.foto-ph{width:100%;aspect-ratio:4/3;border-radius:12px;background:var(--cream);display:flex;align-items:center;justify-content:center;}
/* Flechas sobre la foto principal */
.nav-foto{
  position:absolute;top:50%;transform:translateY(-50%);
  width:32px;height:32px;border-radius:50%;border:none;
  background:rgba(255,255,255,.85);color:var(--black);
  font-size:1.35rem;line-height:1;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 2px 8px rgba(0,0,0,.15);transition:background .15s;z-index:2;
}
.nav-foto:hover{background:#fff;}
.nav-foto.prev{left:10px;padding-right:3px;}
.nav-foto.next{right:10px;padding-left:3px;}
.foto-contador{
  position:absolute;bottom:10px;right:12px;
  background:rgba(0,0,0,.6);color:#fff;font-size:0.72rem;font-weight:600;
  padding:3px 9px;border-radius:20px;z-index:2;
}
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
.spec.full{grid-column:1 / -1;}
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
.lightbox img{max-width:92vw;max-height:88vh;object-fit:contain;touch-action:pan-y;user-select:none;}
.lightbox .cerrar{position:absolute;top:20px;right:24px;color:#fff;font-size:2rem;cursor:pointer;background:none;border:none;line-height:1;z-index:2;}
.lb-nav{
  position:absolute;top:50%;transform:translateY(-50%);
  width:48px;height:48px;border-radius:50%;border:none;
  background:rgba(255,255,255,.18);color:#fff;
  font-size:2rem;line-height:1;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:background .15s;z-index:2;
}
.lb-nav:hover{background:rgba(255,255,255,.32);}
.lb-nav.prev{left:16px;padding-right:4px;}
.lb-nav.next{right:16px;padding-left:4px;}
.lb-contador{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);color:#fff;font-size:0.85rem;font-weight:600;background:rgba(0,0,0,.4);padding:4px 12px;border-radius:20px;}

footer{border-top:1px solid var(--border);padding:24px;text-align:center;color:var(--muted);font-size:0.82rem;margin-top:20px;}
footer a{color:var(--accent);text-decoration:none;}
</style>
</head>
<body>

<header>
  <a href="/" class="logo" aria-label="Fernandez Autos">
    <svg viewBox="0 0 715 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fernandez Autos">
      <path class="p" transform="translate(20.000 94.661) scale(0.034180 -0.034180)" d="M1337 586H515V848H1337ZM1453 1174H411V0H151V1303Q151 1330 161.0 1354.0Q171 1378 188.5 1396.0Q206 1414 230.0 1424.0Q254 1434 282 1434H1453Z"/>
      <path class="p" transform="translate(71.680 94.661) scale(0.034180 -0.034180)" d="M1285 723Q1285 669 1266.0 606.5Q1247 544 1204.5 490.5Q1162 437 1093.5 401.0Q1025 365 927 365H458V612H927Q980 612 1009.0 644.5Q1038 677 1038 725Q1038 776 1005.5 805.0Q973 834 927 834H458Q405 834 376.0 801.5Q347 769 347 721V358Q347 306 379.5 277.0Q412 248 460 248H927V0H458Q404 0 341.5 19.0Q279 38 225.5 80.5Q172 123 136.0 191.5Q100 260 100 358V723Q100 777 119.0 839.5Q138 902 180.5 955.5Q223 1009 291.5 1045.0Q360 1081 458 1081H927Q981 1081 1043.5 1062.0Q1106 1043 1159.5 1000.5Q1213 958 1249.0 889.5Q1285 821 1285 723Z"/>
      <path class="p" transform="translate(117.412 94.661) scale(0.034180 -0.034180)" d="M1068 821H483Q430 821 403.0 794.5Q376 768 376 717V0H116V717Q116 784 133.0 837.0Q150 890 178.5 930.5Q207 971 244.0 999.5Q281 1028 321.5 1046.0Q362 1064 403.5 1072.5Q445 1081 481 1081H1068Z"/>
      <path class="p" transform="translate(155.591 94.661) scale(0.034180 -0.034180)" d="M1320 0H1060V600Q1060 651 1042.5 691.5Q1025 732 995.0 761.0Q965 790 924.5 805.5Q884 821 837 821H382V0H122V952Q122 979 132.0 1002.5Q142 1026 160.0 1043.5Q178 1061 202.0 1071.0Q226 1081 253 1081H839Q888 1081 942.5 1070.0Q997 1059 1050.5 1034.5Q1104 1010 1152.5 972.5Q1201 935 1238.5 881.5Q1276 828 1298.0 758.0Q1320 688 1320 600Z"/>
      <path class="p" transform="translate(204.331 94.661) scale(0.034180 -0.034180)" d="M1238 358Q1238 304 1219.0 241.5Q1200 179 1157.5 125.5Q1115 72 1046.5 36.0Q978 0 880 0H411Q357 0 294.5 19.0Q232 38 178.5 80.5Q125 123 89.0 191.5Q53 260 53 358Q53 412 72.0 475.0Q91 538 133.5 591.5Q176 645 244.5 681.0Q313 717 411 717H880V469H411Q358 469 329.0 436.5Q300 404 300 356Q300 305 333.5 276.5Q367 248 413 248H880Q933 248 962.0 280.0Q991 312 991 360V723Q991 774 959.5 804.0Q928 834 880 834H309V1081H880Q934 1081 996.5 1062.0Q1059 1043 1112.5 1000.5Q1166 958 1202.0 889.5Q1238 821 1238 723Z"/>
      <path class="p" transform="translate(250.063 94.661) scale(0.034180 -0.034180)" d="M1320 0H1060V600Q1060 651 1042.5 691.5Q1025 732 995.0 761.0Q965 790 924.5 805.5Q884 821 837 821H382V0H122V952Q122 979 132.0 1002.5Q142 1026 160.0 1043.5Q178 1061 202.0 1071.0Q226 1081 253 1081H839Q888 1081 942.5 1070.0Q997 1059 1050.5 1034.5Q1104 1010 1152.5 972.5Q1201 935 1238.5 881.5Q1276 828 1298.0 758.0Q1320 688 1320 600Z"/>
      <path class="p" transform="translate(298.804 94.661) scale(0.034180 -0.034180)" d="M1308 365Q1308 298 1291.0 244.5Q1274 191 1246.0 150.5Q1218 110 1181.0 81.5Q1144 53 1103.5 35.0Q1063 17 1021.5 8.5Q980 0 943 0H474Q407 0 354.0 17.0Q301 34 260.5 62.5Q220 91 191.5 128.0Q163 165 145.0 205.5Q127 246 118.5 287.5Q110 329 110 365V717Q110 817 146.5 886.5Q183 956 237.5 999.5Q292 1043 356.0 1062.0Q420 1081 474 1081H943V821H476Q424 821 397.0 794.5Q370 768 370 717V367Q370 314 396.5 287.0Q423 260 474 260H943Q996 260 1022.0 287.0Q1048 314 1048 365V1538H1308Z"/>
      <path class="p" transform="translate(347.817 94.661) scale(0.034180 -0.034180)" d="M1285 723Q1285 669 1266.0 606.5Q1247 544 1204.5 490.5Q1162 437 1093.5 401.0Q1025 365 927 365H458V612H927Q980 612 1009.0 644.5Q1038 677 1038 725Q1038 776 1005.5 805.0Q973 834 927 834H458Q405 834 376.0 801.5Q347 769 347 721V358Q347 306 379.5 277.0Q412 248 460 248H927V0H458Q404 0 341.5 19.0Q279 38 225.5 80.5Q172 123 136.0 191.5Q100 260 100 358V723Q100 777 119.0 839.5Q138 902 180.5 955.5Q223 1009 291.5 1045.0Q360 1081 458 1081H927Q981 1081 1043.5 1062.0Q1106 1043 1159.5 1000.5Q1213 958 1249.0 889.5Q1285 821 1285 723Z"/>
      <path class="p" transform="translate(393.550 94.661) scale(0.034180 -0.034180)" d="M1146 1001Q1162 964 1154.5 926.0Q1147 888 1120 860L519 260H1144V0H206Q166 0 133.5 22.5Q101 45 85 80Q70 117 77.5 155.5Q85 194 114 223L712 821H87V1081H1027Q1066 1081 1098.5 1060.0Q1131 1039 1146 1001Z"/>
      <path class="s" transform="translate(458.389 94.661) scale(0.034180 -0.034180)" d="M1558 0H1298V352H384V0H124V717Q124 874 178.0 1006.0Q232 1138 328.0 1233.0Q424 1328 555.0 1381.0Q686 1434 841 1434H1427Q1454 1434 1478.0 1424.0Q1502 1414 1520.0 1396.0Q1538 1378 1548.0 1354.0Q1558 1330 1558 1303ZM384 612H1298V1174H841Q829 1174 790.5 1170.5Q752 1167 701.5 1153.0Q651 1139 595.0 1110.0Q539 1081 492.0 1030.0Q445 979 414.5 902.5Q384 826 384 717Z"/>
      <path class="s" transform="translate(516.802 94.661) scale(0.034180 -0.034180)" d="M1304 131Q1304 103 1294.0 79.0Q1284 55 1266.5 37.5Q1249 20 1225.5 10.0Q1202 0 1175 0H587Q539 0 484.5 11.0Q430 22 377.0 46.5Q324 71 274.5 108.5Q225 146 188.0 199.5Q151 253 128.5 323.0Q106 393 106 481V1081H366V481Q366 430 383.5 389.5Q401 349 431.0 320.0Q461 291 501.5 275.5Q542 260 589 260H1044V1081H1304Z"/>
      <path class="s" transform="translate(565.542 94.661) scale(0.034180 -0.034180)" d="M1105 821H651V0H388V821H50V1081H388V1434H651V1081H1105Z"/>
      <path class="s" transform="translate(604.985 94.661) scale(0.034180 -0.034180)" d="M1298 365Q1298 298 1281.0 244.5Q1264 191 1236.0 150.5Q1208 110 1171.0 81.5Q1134 53 1093.5 35.0Q1053 17 1011.5 8.5Q970 0 933 0H464Q410 0 346.0 19.0Q282 38 227.5 81.5Q173 125 136.5 194.5Q100 264 100 365V717Q100 817 136.5 886.5Q173 956 227.5 999.5Q282 1043 346.0 1062.0Q410 1081 464 1081H933Q1033 1081 1103.0 1045.0Q1173 1009 1216.0 954.5Q1259 900 1278.5 836.0Q1298 772 1298 717ZM1038 715Q1038 769 1011.0 795.0Q984 821 933 821H466Q414 821 387.0 794.5Q360 768 360 717V365Q360 314 387.0 287.0Q414 260 466 260H933Q986 260 1012.0 287.0Q1038 314 1038 365Z"/>
      <path class="s" transform="translate(652.734 94.661) scale(0.034180 -0.034180)" d="M1167 365Q1167 298 1150.0 244.5Q1133 191 1105.0 150.5Q1077 110 1040.0 81.5Q1003 53 962.5 35.0Q922 17 880.5 8.5Q839 0 802 0H98V260H800Q853 260 880.0 287.0Q907 314 907 365Q902 469 802 469H399Q313 469 253.0 499.0Q193 529 155.5 574.0Q118 619 101.5 671.0Q85 723 85 768Q85 855 116.0 914.5Q147 974 194.0 1011.0Q241 1048 296.0 1064.5Q351 1081 399 1081H1038V821H401Q381 821 369.5 816.5Q358 812 352.5 804.5Q347 797 346.0 788.5Q345 780 345 772Q346 756 351.0 747.0Q356 738 363.5 734.0Q371 730 380.5 729.5Q390 729 399 729H802Q902 729 972.0 693.0Q1042 657 1085.0 602.5Q1128 548 1147.5 484.0Q1167 420 1167 365Z"/>
    </svg>
  </a>
  <a href="/stock.html" class="volver">\u2039 Volver al stock</a>
</header>

<div class="ficha">
  <div class="galeria">
    ${fotoPrincipalHTML}
    ${thumbsHTML}
  </div>

  <div class="datos">
    <div class="marca-label">${esc((v.marca || "").toUpperCase())}</div>
    <h1 class="nombre">${esc([v.modelo, v.anio, vLimpia].filter(Boolean).join(" "))}</h1>
    ${badgeReservado}
    <div class="precio">${esc(precioTxt)}</div>
    <div class="specs">${specsHTML}</div>
    ${obsHTML}
    ${btnWsp}
    <button class="btn-compartir" onclick="compartir()">Compartir</button>
  </div>
</div>

<footer>
  Fernandez Autos \u2014 Mar del Plata \xB7 <a href="/stock.html">Ver todo el stock</a>
</footer>

<!-- LIGHTBOX -->
<div class="lightbox" id="lightbox" onclick="cerrarLightbox(event)">
  <button class="cerrar" onclick="cerrarLightbox(event)" aria-label="Cerrar">\u2715</button>
  <button class="lb-nav prev" onclick="cambiarFotoLB(-1, event)" aria-label="Anterior">\u2039</button>
  <img id="lightboxImg" src="" alt="">
  <button class="lb-nav next" onclick="cambiarFotoLB(1, event)" aria-label="Siguiente">\u203A</button>
  <div class="lb-contador"><span id="lbNum">1</span>/<span id="lbTotal">1</span></div>
</div>

<script>
// Fotos para mostrar en grande al cambiar (transformadas, orientadas).
const FOTOS = ${JSON.stringify(fotosVista)};
// Fotos originales en alta, para el lightbox (ampliar).
const FOTOS_HD = ${JSON.stringify(fotos)};
const URL_AUTO = ${JSON.stringify(url)};
const TITULO = ${JSON.stringify(nombreCompleto)};
const TOTAL = FOTOS.length;

let idxActual = 0;   // \xEDndice de la foto principal
let idxLB = 0;       // \xEDndice dentro del lightbox

const mainImg = document.getElementById('fotoPrincipal');
const fotoNum = document.getElementById('fotoNum');

// --- Foto principal: mostrar foto por \xEDndice ---
function verFoto(i){
  if(TOTAL === 0) return;
  idxActual = (i + TOTAL) % TOTAL;
  if(mainImg){ mainImg.src = FOTOS[idxActual]; mainImg.dataset.idx = idxActual; }
  if(fotoNum){ fotoNum.textContent = idxActual + 1; }
  document.querySelectorAll('.thumb').forEach((t,idx)=>t.classList.toggle('active',idx===idxActual));
}
// Avanzar/retroceder la foto principal (flechas encima de la foto)
function cambiarFoto(dir){
  verFoto(idxActual + dir);
}

// --- Lightbox ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lbNum = document.getElementById('lbNum');
const lbTotal = document.getElementById('lbTotal');

function abrirLightbox(i){
  if(TOTAL === 0) return;
  idxLB = (i + TOTAL) % TOTAL;
  lightboxImg.src = FOTOS_HD[idxLB] || FOTOS[idxLB];
  if(lbNum){ lbNum.textContent = idxLB + 1; }
  if(lbTotal){ lbTotal.textContent = TOTAL; }
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function cambiarFotoLB(dir, e){
  if(e) e.stopPropagation();
  idxLB = (idxLB + dir + TOTAL) % TOTAL;
  lightboxImg.src = FOTOS_HD[idxLB] || FOTOS[idxLB];
  if(lbNum){ lbNum.textContent = idxLB + 1; }
}
function cerrarLightbox(e){
  if(e.target.id==='lightbox' || e.target.classList.contains('cerrar')){
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Abrir lightbox al tocar la foto principal (en la foto actual)
if(mainImg){
  mainImg.dataset.idx = 0;
  mainImg.addEventListener('click', ()=> abrirLightbox(idxActual));
}

// --- Teclado: flechas navegan, Escape cierra ---
document.addEventListener('keydown', (e)=>{
  if(lightbox.classList.contains('open')){
    if(e.key === 'ArrowLeft')  cambiarFotoLB(-1);
    else if(e.key === 'ArrowRight') cambiarFotoLB(1);
    else if(e.key === 'Escape'){ lightbox.classList.remove('open'); document.body.style.overflow=''; }
  } else if(TOTAL > 1){
    if(e.key === 'ArrowLeft')  cambiarFoto(-1);
    else if(e.key === 'ArrowRight') cambiarFoto(1);
  }
});

// --- Swipe (deslizar con el dedo) ---
// Detecta gesto horizontal; ignora si es scroll vertical.
function agregarSwipe(elemento, onIzq, onDer){
  let x0 = null, y0 = null;
  elemento.addEventListener('touchstart', (e)=>{
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, {passive:true});
  elemento.addEventListener('touchend', (e)=>{
    if(x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    // Umbral: movimiento horizontal claro (>40px) y m\xE1s horizontal que vertical
    if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)){
      if(dx < 0) onIzq(); else onDer();
    }
    x0 = null; y0 = null;
  }, {passive:true});
}

if(TOTAL > 1){
  if(mainImg){
    // En la foto principal: deslizar izq => siguiente, der => anterior
    agregarSwipe(mainImg, ()=>cambiarFoto(1), ()=>cambiarFoto(-1));
  }
  // En el lightbox
  agregarSwipe(lightboxImg, ()=>cambiarFotoLB(1), ()=>cambiarFotoLB(-1));
}

async function compartir(){
  const datos = { title: TITULO, text: TITULO + ' \u2014 Fernandez Autos', url: URL_AUTO };
  if(navigator.share){
    try{ await navigator.share(datos); }catch(e){}
  } else {
    try{
      await navigator.clipboard.writeText(URL_AUTO);
      alert('Link copiado al portapapeles');
    }catch(e){
      prompt('Copi\xE1 el link:', URL_AUTO);
    }
  }
}

// --- Visita a la ficha: contador propio (edge function visita-web del CRM) ---
// Abrir cualquier auto con ?equipo=1 marca este navegador como del equipo y deja
// de contarlo; ?equipo=0 lo vuelve a contar.
(function(){
  try{
    var eq = new URLSearchParams(location.search).get('equipo');
    if(eq === '1') localStorage.setItem('fa_equipo','1');
    if(eq === '0') localStorage.removeItem('fa_equipo');
    if(localStorage.getItem('fa_equipo') === '1') return;
  }catch(e){}
  fetch(${JSON.stringify(SB_URL + "/functions/v1/visita-web")}, {
    method:'POST', keepalive:true, headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ v: ${JSON.stringify(v.id)} })
  }).catch(function(){});
})();
<\/script>
</body>
</html>`;
}
__name(paginaAuto, "paginaAuto");
__name2(paginaAuto, "paginaAuto");
function paginaNoEncontrada() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Auto no disponible \u2014 Fernandez Autos</title>
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
  <h1>Este auto ya no est\xE1 disponible</h1>
  <p>Puede que se haya vendido o dado de baja. Mir\xE1 el resto de nuestro stock, seguro encontr\xE1s algo que te guste.</p>
  <a href="/stock.html">Ver stock disponible</a>
</div>
</body>
</html>`;
}
__name(paginaNoEncontrada, "paginaNoEncontrada");
__name2(paginaNoEncontrada, "paginaNoEncontrada");
var SB_URL2 = "https://bjgkmrgkgjpydpanewsa.supabase.co";
var SB_KEY2 = "sb_publishable_FL_GSYzAfQ507Ve7RVKsKA_njj_gRT6";
var SITE2 = "https://www.fernandezautos.com";
function esc2(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(esc2, "esc2");
__name2(esc2, "esc");
function fmtPrecio2(n, moneda) {
  if (!n)
    return "Consultar precio";
  return (moneda === "USD" ? "US$ " : "$ ") + Number(n).toLocaleString("es-AR");
}
__name(fmtPrecio2, "fmtPrecio2");
__name2(fmtPrecio2, "fmtPrecio");
async function traerAutos(query) {
  try {
    const r = await fetch(`${SB_URL2}/rest/v1/vehiculos_publico?select=*&${query}`, {
      headers: { apikey: SB_KEY2, Authorization: `Bearer ${SB_KEY2}` },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    if (!r.ok)
      return null;
    const data = await r.json();
    return Array.isArray(data) ? data : null;
  } catch (e) {
    return null;
  }
}
__name(traerAutos, "traerAutos");
__name2(traerAutos, "traerAutos");
function urlAuto(v) {
  return v.slug ? `/auto/${encodeURIComponent(v.slug)}` : `/stock`;
}
__name(urlAuto, "urlAuto");
__name2(urlAuto, "urlAuto");
function tarjetaAuto(v) {
  const nombre = [v.marca, v.modelo, v.anio].filter(Boolean).join(" ");
  const detalle = [
    v.km ? Number(v.km).toLocaleString("es-AR") + " km" : "",
    v.transmision,
    v.combustible,
    v.color
  ].filter(Boolean).join(" \xB7 ");
  const foto = v.foto_portada ? `<img src="${esc2(v.foto_portada)}" alt="${esc2(nombre)}" loading="lazy">` : `<div class="auto-card-img-ph"></div>`;
  return `<a href="${urlAuto(v)}" class="auto-card">
      <div class="auto-card-img">${foto}
        <span class="auto-tag ${v.tipo === "Nuevo" ? "tag-nuevo" : "tag-usado"}">${v.tipo === "Nuevo" ? "0 km" : "Usado"}</span>
        ${v.estado === "Reservado" ? '<span class="tag-reservado">Reservado</span>' : ""}
      </div>
      <div class="auto-card-body">
        <div class="auto-nombre">${esc2(nombre)}</div>
        <div class="auto-detalle">${esc2(detalle)}</div>
        <div class="auto-footer">
          <div class="auto-precio">${esc2(fmtPrecio2(v.precio, v.moneda_precio))}</div>
          <span class="auto-cta">Ver detalle</span>
        </div>
      </div>
    </a>`;
}
__name(tarjetaAuto, "tarjetaAuto");
__name2(tarjetaAuto, "tarjetaAuto");
function itemListJsonLd(autos) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Autos disponibles en Fernandez Autos, Mar del Plata",
    numberOfItems: autos.length,
    itemListElement: autos.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: SITE2 + urlAuto(v),
      name: [v.marca, v.modelo, v.anio].filter(Boolean).join(" ")
    }))
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}<\/script>`;
}
__name(itemListJsonLd, "itemListJsonLd");
__name2(itemListJsonLd, "itemListJsonLd");
async function inyectarStock(context, query) {
  const res = await context.next();
  const tipo = res.headers.get("content-type") || "";
  if (context.request.method !== "GET" || !res.ok || !tipo.includes("text/html"))
    return res;
  const autos = await traerAutos(query);
  if (!autos || !autos.length)
    return res;
  const tarjetas = autos.map(tarjetaAuto).join("");
  return new HTMLRewriter().on("#autosGrid", {
    element(el) {
      el.setInnerContent(tarjetas, { html: true });
    }
  }).on("head", {
    element(el) {
      el.append(itemListJsonLd(autos), { html: true });
    }
  }).transform(res);
}
__name(inyectarStock, "inyectarStock");
__name2(inyectarStock, "inyectarStock");
var PAGINAS = [
  { path: "/", prioridad: "1.0", frecuencia: "daily" },
  { path: "/stock", prioridad: "0.9", frecuencia: "daily" },
  { path: "/financiacion", prioridad: "0.7", frecuencia: "monthly" },
  { path: "/consignaciones", prioridad: "0.7", frecuencia: "monthly" }
];
async function onRequest2() {
  const autos = await traerAutos("or=(estado.eq.Disponible,estado.eq.Reservado)&order=created_at.desc") || [];
  const urls = [
    ...PAGINAS.map(
      (p) => `<url><loc>${SITE2}${p.path}</loc><changefreq>${p.frecuencia}</changefreq><priority>${p.prioridad}</priority></url>`
    ),
    ...autos.filter((v) => v.slug).map((v) => {
      const fecha = v.created_at ? `<lastmod>${String(v.created_at).slice(0, 10)}</lastmod>` : "";
      return `<url><loc>${esc2(SITE2 + urlAuto(v))}</loc>${fecha}<changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    })
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
function onRequest3(context) {
  return inyectarStock(context, "or=(estado.eq.Disponible,estado.eq.Reservado)&order=created_at.desc");
}
__name(onRequest3, "onRequest3");
__name2(onRequest3, "onRequest");
function onRequest4(context) {
  return inyectarStock(context, "estado=eq.Disponible&order=created_at.desc&limit=6");
}
__name(onRequest4, "onRequest4");
__name2(onRequest4, "onRequest");
var routes = [
  {
    routePath: "/auto/:slug",
    mountPath: "/auto",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/sitemap.xml",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/stock",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = /* @__PURE__ */ __name(class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
}, "__Facade_ScheduledController__");
__name2(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../.npm/_npx/0eedb5afd4158ff3/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../.npm/_npx/0eedb5afd4158ff3/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-RxrWQX/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../.npm/_npx/0eedb5afd4158ff3/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-RxrWQX/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__2, "__Facade_ScheduledController__");
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.6926506332421897.js.map
