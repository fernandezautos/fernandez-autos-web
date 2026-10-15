// ============================================================================
// Atribución de anuncios — recuerda de qué anuncio llegó la persona.
//
// Cuando alguien entra desde un anuncio (Meta o Google), la URL trae utm_*,
// fbclid o gclid. Se guardan en el navegador por 30 días, así aunque navegue
// por varias páginas antes de consultar, el lead llega al CRM con el anuncio
// que lo trajo. Gana el último clic de anuncio.
//
// Las páginas lo mandan con: atribucion: faAtribucion()
// No guarda datos personales: solo los parámetros del anuncio.
// ============================================================================
(function () {
  var CLAVE = 'fa_atrib';
  var DIAS = 30;
  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];

  function leer() {
    try {
      var a = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      if (a && a.clic_at && Date.now() - a.clic_at < DIAS * 864e5) return a;
    } catch (e) {}
    return null;
  }

  try {
    var q = new URLSearchParams(location.search);
    var nueva = {};
    var hay = false;
    PARAMS.forEach(function (p) {
      var v = (q.get(p) || '').trim();
      if (v) { nueva[p] = v.slice(0, 500); hay = true; }
    });
    if (hay) {
      nueva.clic_at = Date.now();
      nueva.landing = (location.origin + location.pathname).slice(0, 500);
      nueva.referrer = (document.referrer || '').slice(0, 500);
      localStorage.setItem(CLAVE, JSON.stringify(nueva));
    }
  } catch (e) {}

  function cookie(nombre) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + nombre + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  window.faAtribucion = function () {
    var a = leer();
    if (!a) return null;
    var out = {};
    for (var k in a) out[k] = a[k];
    // Cookies del pixel de Meta: sirven para avisarle a Meta quién compró.
    out.fbp = cookie('_fbp');
    out.fbc = cookie('_fbc') || (a.fbclid ? 'fb.1.' + a.clic_at + '.' + a.fbclid : null);
    return out;
  };
})();
