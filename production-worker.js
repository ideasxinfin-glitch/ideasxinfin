import policies from './migration/policies.json' with { type: 'json' };
import media from './migration/media-routes.json' with { type: 'json' };
import previousRoutes from './migration/routes.json' with { type: 'json' };
const mediaPaths = new Set(media);
const consolidatedRoutes = new Set(previousRoutes.filter(path => path !== '/'));
const isConsolidated = path => consolidatedRoutes.has(path.replace(/index\.html$/, '').replace(/\/?$/, '/'));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (['xinfinlab.com', 'www.xinfinlab.com'].includes(url.hostname)) {
      url.protocol = 'https:';
      url.hostname = 'ideasxinfin.com';
      if (/^\/(img|assets)\//.test(url.pathname) || mediaPaths.has(url.pathname)) url.pathname = '/legacy' + url.pathname;
      else {
        url.pathname = url.pathname.replace(/\/index\.html$/, '/');
        if (isConsolidated(url.pathname)) url.pathname = '/';
      }
      return Response.redirect(url.href, 301);
    }
    const production = url.hostname === 'ideasxinfin.com';
    // Only the newly approved landing is published. Previous service pages
    // are consolidated into the equivalent business offering on that landing.
    if (isConsolidated(url.pathname)) {
      url.protocol = 'https:';
      url.hostname = 'ideasxinfin.com';
      url.pathname = '/';
      return Response.redirect(url.href, 301);
    }
    if (url.hostname === 'www.ideasxinfin.com' || (production && url.protocol !== 'https:')) {
      url.protocol = 'https:';
      url.hostname = 'ideasxinfin.com';
      return Response.redirect(url.href, 301);
    }
    if (!production && url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    const route = url.pathname.replace(/index\.html$/, '');
    const policy = policies[route] || policies[route + '/'] || policies['/'];
    response.headers.set('Content-Security-Policy', policy);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (!production || url.pathname === '/privacidad.html' || response.status === 404) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
  }
};
