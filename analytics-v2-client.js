/* Viewmetrica 360 Analytics v2 — metadata helper (staging only).
 * Does not transmit data, modify analytics.js, or request geolocation.
 * A trusted GeoIP backend will provide city; never store client IP.
 */
(function () {
  'use strict';
  const q = new URLSearchParams(location.search);
  const clip = (v,n=100) => String(v || '').slice(0,n);
  function device() {
    const ua = navigator.userAgent || '';
    if (/iPad|Tablet|PlayBook/i.test(ua) ||
        (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
    if (/Mobi|Android|iPhone|iPod/i.test(ua) ||
        (navigator.userAgentData && navigator.userAgentData.mobile)) return 'mobile';
    return 'desktop';
  }
  function source() {
    const utm = clip(q.get('utm_source'),60).toLowerCase();
    if (utm) return {kind:'utm', value:utm};
    if (!document.referrer) return {kind:'unknown', value:'unknown'};
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      if (host === location.hostname) return {kind:'internal',value:'internal'};
      if (host === 'grinkerhospital.com' || host === 'www.grinkerhospital.com')
        return {kind:'referrer',value:'grinkerhospital.com'};
      if (host.endsWith('.google.com') || host === 'google.com')
        return {kind:'referrer',value:'google'};
      return {kind:'referrer',value:clip(host,100)};
    } catch (_) { return {kind:'unknown',value:'unknown'}; }
  }
  window.VM360SessionMetadata = {
    collect() {
      return {
        device: device(),
        source: source(),
        // Supplied only by a future trusted backend, never browser GPS.
        city: 'Desconocida',
        region: 'Desconocida',
        country: 'Desconocido'
      };
    }
  };
})();
