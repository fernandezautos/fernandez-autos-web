// ============================================================================
// /c — Cloudflare Pages Function
// Link corto general "Hablar con un asesor" (sin auto elegido) que manda la IA
// de WhatsApp Business: fernandezautos.com/c → /wa.html?origen=ia_whatsapp
// El link de un auto puntual es /c/<id> (ver [id].js).
// ============================================================================

export function onRequest(context) {
  const origin = new URL(context.request.url).origin;
  return Response.redirect(`${origin}/wa.html?origen=ia_whatsapp`, 302);
}
