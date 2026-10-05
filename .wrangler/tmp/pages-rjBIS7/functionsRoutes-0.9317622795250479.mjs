import { onRequest as __auto__slug__js_onRequest } from "/Users/manuelfernandez/Desktop/fernandez-autos-web/functions/auto/[slug].js"
import { onRequest as __sitemap_xml_js_onRequest } from "/Users/manuelfernandez/Desktop/fernandez-autos-web/functions/sitemap.xml.js"
import { onRequest as __stock_js_onRequest } from "/Users/manuelfernandez/Desktop/fernandez-autos-web/functions/stock.js"
import { onRequest as __index_js_onRequest } from "/Users/manuelfernandez/Desktop/fernandez-autos-web/functions/index.js"

export const routes = [
    {
      routePath: "/auto/:slug",
      mountPath: "/auto",
      method: "",
      middlewares: [],
      modules: [__auto__slug__js_onRequest],
    },
  {
      routePath: "/sitemap.xml",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__sitemap_xml_js_onRequest],
    },
  {
      routePath: "/stock",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__stock_js_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__index_js_onRequest],
    },
  ]