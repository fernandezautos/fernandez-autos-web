// ============================================================================
// /c/[id] — Cloudflare Pages Function
// Fernandez Autos — Sweet Cars SRL
// ============================================================================
// Link corto "Hablar con un asesor" que manda la IA de WhatsApp Business.
//   fernandezautos.com/c/186  →  /wa.html?origen=ia_whatsapp&ctx=auto:<nombre>&vehiculo_id=186
//
// Arma el nombre igual que la planilla del CRM (edge function stock-planilla):
// "Marca Modelo Año", y si hay otro auto en venta con la misma marca + modelo +
// año, le suma " · km · color" para que el vendedor sepa cuál es.
//
// Si el auto ya no está en venta (vendido, borrado, id inválido) o falla la
// consulta, manda al formulario general (/wa.html?origen=ia_whatsapp): el
// cliente igual llega a un asesor.
//
// Lee de Supabase con la llave PUBLICA de solo-lectura (vista vehiculos_publico).
// ============================================================================

const SB_URL = "https://bjgkmrgkgjpydpanewsa.supabase.co";
const SB_KEY = "sb_publishable_FL_GSYzAfQ507Ve7RVKsKA_njj_gRT6";
const EN_VENTA = "(Disponible,Reservado)";

// Miles con punto, sin depender de Intl: 157000 → "157.000"
function miles(n) {
  return String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

async function consultar(query) {
  const r = await fetch(`${SB_URL}/rest/v1/vehiculos_publico?${query}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!r.ok) throw new Error("supabase " + r.status);
  return r.json();
}

export async function onRequest(context) {
  const origin = new URL(context.request.url).origin;
  const general = `${origin}/wa.html?origen=ia_whatsapp`;

  const id = String(context.params.id || "");
  if (!/^[0-9]{1,9}$/.test(id)) return Response.redirect(general, 302);

  try {
    const arr = await consultar(
      `select=id,marca,modelo,anio,km,color&id=eq.${id}&estado=in.${EN_VENTA}&limit=1`
    );
    const v = Array.isArray(arr) && arr.length ? arr[0] : null;
    if (!v) return Response.redirect(general, 302);

    let nombre = [v.marca, v.modelo, v.anio].filter(Boolean).join(" ");

    // ¿Hay otro auto en venta igual? (misma marca + modelo + año)
    if (v.marca && v.modelo && v.anio) {
      const iguales = await consultar(
        `select=id&marca=ilike.${encodeURIComponent(v.marca)}` +
        `&modelo=ilike.${encodeURIComponent(v.modelo)}` +
        `&anio=eq.${v.anio}&estado=in.${EN_VENTA}`
      );
      if (Array.isArray(iguales) && iguales.length > 1) {
        const km = v.km != null ? miles(v.km) + " km" : "";
        nombre = [nombre, km, v.color].filter(Boolean).join(" · ");
      }
    }

    const destino =
      `${origin}/wa.html?origen=ia_whatsapp` +
      `&ctx=${encodeURIComponent("auto:" + nombre)}` +
      `&vehiculo_id=${v.id}`;
    return Response.redirect(destino, 302);
  } catch (e) {
    return Response.redirect(general, 302);
  }
}
