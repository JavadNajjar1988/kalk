// Inject custom CSS theme into GeoServer
(function() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = '/geoserver/styles/overlay.css';
  document.head.appendChild(link);
})();

