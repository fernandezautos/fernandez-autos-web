// ============================================================================
// /meta-catalogo.csv — Cloudflare Pages Function
// Lista de autos para el catálogo de vehículos de Meta (Commerce Manager).
// Meta la descarga sola cada hora: un auto que se publica en la web como
// Disponible entra al catálogo, y uno que se vende, se reserva o se saca de la
// web desaparece del archivo y Meta lo borra (carga programada en modo
// "reemplazar"). No hay que tocar nada a mano.
//
// vehicle_id = id del auto en el CRM: es el mismo que manda el pixel en
// ViewContent/Contact (content_ids), así Meta sabe qué auto miró cada persona.
// El precio es obligatorio para Meta; en los anuncios se oculta desde la
// plantilla (regla de la agencia: nunca precio en anuncios).
// Formato: https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference
// ============================================================================
import { SB_KEY, SB_URL, SITE, urlAuto } from "./_lib/stock.js";

const AGENCIA = {
  nombre: "Fernandez Autos",
  telefono: "+5492236249445",
  direccion: JSON.stringify({
    addr1: "20 de Septiembre 4326", city: "Mar del Plata", region: "Buenos Aires",
    postal_code: "7600", country: "AR",
  }),
  latitud: "-38.0153839",
  longitud: "-57.5739502",
  pagina_fb: "467782756920396",
};

const MAX_FOTOS = 10;

const CARROCERIA = {
  "sedan": "SEDAN", "hatchback": "HATCHBACK", "suv": "SUV", "pick-up": "TRUCK",
  "furgón": "VAN", "furgon": "VAN", "coupé": "COUPE", "coupe": "COUPE",
  "convertible": "CONVERTIBLE", "rural": "WAGON", "familiar": "WAGON",
  "monovolumen": "MINIVAN", "crossover": "CROSSOVER",
};
const COMBUSTIBLE = {
  "nafta": "GASOLINE", "diésel": "DIESEL", "diesel": "DIESEL",
  "eléctrico": "ELECTRIC", "electrico": "ELECTRIC", "híbrido": "HYBRID", "hibrido": "HYBRID",
};
const TIPO_VEHICULO = { "Motorhome": "rv_camper", "Casa rodante": "trailer" };

const COLUMNAS = [
  "vehicle_id", "title", "description", "url", "make", "model", "year",
  "mileage.value", "mileage.unit", "body_style", "price", "exterior_color",
  "state_of_vehicle", "transmission", "fuel_type", "vehicle_type", "trim",
  "availability", "date_first_on_lot", "address", "latitude", "longitude",
  "dealer_id", "dealer_name", "dealer_phone", "fb_page_id",
  ...Array.from({ length: MAX_FOTOS }, (_, i) => `image[${i}].url`),
];

function celda(v) {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function leer(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}

// "Duster" + "Duster 2.0 Privilege" → "Duster 2.0 Privilege": si la versión ya
// trae el modelo (pasa con la carga autocompletada, ej. "Hilux Sw4 Tdi" con
// modelo "Sw4"), no se repite.
function nombreAuto(v) {
  const marca = String(v.marca || "").trim();
  let modelo = String(v.modelo || "").trim();
  // "RAM" + "Ram 1500" → "1500": el modelo no repite la marca. No se corrige en
  // el CRM porque cambiar el modelo regenera el link de la ficha.
  if (marca && modelo.toLowerCase().startsWith(marca.toLowerCase() + " ")) modelo = modelo.slice(marca.length).trim();
  const version = String(v.version || "").trim();
  const repite = modelo && (
    (" " + version.toLowerCase() + " ").includes(" " + modelo.toLowerCase() + " ") ||
    modelo.toLowerCase() === marca.toLowerCase()  // "RAM" + "Ram"
  );
  return [v.marca, repite ? null : modelo, version, v.anio].filter(Boolean).join(" ");
}

function fila(v, fotos) {
  const nombre = nombreAuto(v);
  const km = Number(v.km) || 0;
  const nuevo = v.tipo === "Nuevo";
  const detalle = [
    nuevo ? "0 km" : `Usado, ${km.toLocaleString("es-AR")} km`,
    v.transmision, v.combustible, v.color,
  ].filter(Boolean).join(" · ");
  const imagenes = [v.foto_portada, ...fotos.filter((u) => u !== v.foto_portada)].filter(Boolean).slice(0, MAX_FOTOS);

  return [
    v.id,
    nombre,
    `${nombre}. ${detalle}. Disponible en Fernandez Autos, Mar del Plata. Financiación y permuta.`,
    SITE + urlAuto(v),
    v.marca,
    v.modelo,
    v.anio,
    km,
    "KM",
    CARROCERIA[String(v.carroceria || "").toLowerCase()] || "OTHER",
    `${Math.round(Number(v.precio))} ${v.moneda_precio === "USD" ? "USD" : "ARS"}`,
    v.color || "Otro",
    nuevo ? "New" : "Used",
    /manual/i.test(v.transmision || "") ? "Manual" : (v.transmision ? "Automatic" : ""),
    COMBUSTIBLE[String(v.combustible || "").toLowerCase()] || (v.combustible ? "OTHER" : ""),
    TIPO_VEHICULO[v.clase_vehiculo] || "car_truck",
    String(v.version || "").slice(0, 50),
    "available",
    v.created_at ? String(v.created_at).slice(0, 10) : "",
    AGENCIA.direccion,
    AGENCIA.latitud,
    AGENCIA.longitud,
    "fernandez-autos",
    AGENCIA.nombre,
    AGENCIA.telefono,
    AGENCIA.pagina_fb,
    ...Array.from({ length: MAX_FOTOS }, (_, i) => imagenes[i] || ""),
  ].map(celda).join(",");
}

export async function onRequest() {
  try {
    // Solo Disponible: los reservados no se publicitan.
    const autos = await leer("vehiculos_publico?select=*&estado=eq.Disponible&precio=gt.0&order=created_at.desc");
    // Sin autos casi seguro es una falla de lectura, no un stock vacío: mejor
    // que Meta conserve el catálogo anterior que borrarlo entero.
    if (!autos.length) throw new Error("sin autos");
    const ids = autos.map((v) => v.id);
    const fotos = ids.length
      ? await leer(`auto_fotos?select=vehiculo_id,url&vehiculo_id=in.(${ids.join(",")})&order=orden.asc,created_at.asc`)
      : [];
    const fotosPorAuto = {};
    for (const f of fotos) (fotosPorAuto[f.vehiculo_id] ||= []).push(f.url);

    const csv = [COLUMNAS.join(","), ...autos.filter((v) => v.slug).map((v) => fila(v, fotosPorAuto[v.id] || []))].join("\n");
    return new Response(csv + "\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, max-age=900",
      },
    });
  } catch (e) {
    // Nunca devolver una lista vacía con 200: Meta la tomaría como "no hay
    // autos" y borraría todo el catálogo. Con un error, conserva el último.
    return new Response("error", { status: 503 });
  }
}
