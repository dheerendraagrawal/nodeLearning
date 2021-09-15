/* eslint-disable */


export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZGhlZXJlbmRyYWFncmF3YWwiLCJhIjoiY2t0anF2bGV1MDBoZjJucGdxdGJkMThiOSJ9.xx00nwW5X3Bni0xKbi9k3A';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/dheerendraagrawal/cktjqyov04m5r17r4d933k9kd',
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
