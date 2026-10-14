// ============================================================================
// Motorhomes y casas rodantes de arrastre
// ============================================================================
// En la base cada vehículo tiene clase_vehiculo ('Auto', 'Motorhome' o
// 'Casa rodante') y, si no es auto, su equipamiento en casa_datos. Las claves
// de casa_datos las define el CRM (clase-vehiculo.js en fernandez-autos-crm):
// si allá se suma un dato, sumarlo también acá para que se vea en la web.
// ============================================================================

const DATOS = [
  { k: "tipo_motorhome", label: "Tipo" },
  { k: "plazas_dormir", label: "Plazas para dormir" },
  { k: "plazas_viaje", label: "Plazas para viajar" },
  { k: "largo_m", label: "Largo", fmt: (x) => String(x).replace(".", ",") + " m" },
  { k: "peso_kg", label: "Peso", fmt: (x) => Number(x).toLocaleString("es-AR") + " kg" },
  { k: "ejes", label: "Ejes" },
  { k: "agua_l", label: "Tanque de agua", fmt: (x) => x + " litros" },
  { k: "banio", label: "Baño" },
];

const EQUIPAMIENTO = [
  ["cocina", "Cocina"], ["heladera", "Heladera"], ["calefaccion", "Calefacción"],
  ["aire", "Aire acondicionado"], ["solar", "Panel solar"], ["toldo", "Toldo"],
  ["generador", "Generador"],
];

export function esCasa(v) {
  return !!v && !!v.clase_vehiculo && v.clase_vehiculo !== "Auto";
}

export function sinMotor(v) {
  return !!v && v.clase_vehiculo === "Casa rodante";
}

export function nombreClase(v) {
  return sinMotor(v) ? "Casa rodante" : "Motorhome";
}

// Datos para la grilla de specs de la ficha: [{ label, val }]
export function specsCasa(v) {
  const d = v.casa_datos || {};
  const out = [{ label: "Vehículo", val: sinMotor(v) ? "Casa rodante (de arrastre)" : "Motorhome" }];
  for (const c of DATOS) {
    if (d[c.k] == null || d[c.k] === "") continue;
    out.push({ label: c.label, val: c.fmt ? c.fmt(d[c.k]) : String(d[c.k]) });
  }
  const equip = EQUIPAMIENTO.filter(([k]) => d[k]).map(([, l]) => l);
  if (equip.length) out.push({ label: "Equipamiento", val: equip.join(" · ") });
  return out;
}

// Resumen corto para tarjetas y descripciones: "Motorhome · 4 plazas · 6,5 m"
export function resumenCasa(v) {
  const d = v.casa_datos || {};
  const plazas = d.plazas_dormir || d.plazas_viaje;
  return [
    nombreClase(v),
    plazas ? plazas + " plazas" : "",
    d.largo_m ? String(d.largo_m).replace(".", ",") + " m" : "",
    d.banio && d.banio !== "No tiene" ? "Baño " + d.banio.toLowerCase() : "",
  ].filter(Boolean).join(" · ");
}
