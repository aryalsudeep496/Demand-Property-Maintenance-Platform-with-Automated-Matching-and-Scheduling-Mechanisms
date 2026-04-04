import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix the missing marker icons that webpack breaks by default
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER = [51.505, -0.09]; // London fallback
const DEFAULT_ZOOM   = 13;

/**
 * LocationPicker
 *
 * Props:
 *   value    : { lat, lng, address, city, postcode } | null
 *   onChange : (location) => void
 *   height   : string (default '300px')
 *   showRadius       : bool   — show radius slider (for provider service area)
 *   radiusKm         : number — current radius value
 *   onRadiusChange   : (km) => void
 */
const LocationPicker = ({
  value,
  onChange,
  height = '300px',
  showRadius = false,
  radiusKm = 25,
  onRadiusChange,
}) => {
  const mapRef      = useRef(null);
  const markerRef   = useRef(null);
  const circleRef   = useRef(null);
  const containerRef = useRef(null);

  const [search,    setSearch]    = useState('');
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  // ── Init map once ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return; // already initialised

    const center = value ? [value.lat, value.lng] : DEFAULT_CENTER;
    const map    = L.map(containerRef.current, { center, zoom: DEFAULT_ZOOM });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Place initial marker if value provided
    if (value?.lat && value?.lng) {
      markerRef.current = L.marker([value.lat, value.lng]).addTo(map);
      if (showRadius) {
        circleRef.current = L.circle([value.lat, value.lng], {
          radius: radiusKm * 1000,
          color: '#C17B2A', fillColor: '#C17B2A', fillOpacity: 0.12, weight: 2,
        }).addTo(map);
      }
    }

    // Click handler: place/move marker + reverse geocode
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      placeMarker(map, lat, lng);
      await reverseGeocode(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []); // eslint-disable-line

  // ── Update circle when radiusKm changes ─────────────────────────────────────
  useEffect(() => {
    if (!showRadius || !markerRef.current || !mapRef.current) return;
    const pos = markerRef.current.getLatLng();
    if (circleRef.current) {
      circleRef.current.setRadius(radiusKm * 1000);
    } else {
      circleRef.current = L.circle([pos.lat, pos.lng], {
        radius: radiusKm * 1000,
        color: '#C17B2A', fillColor: '#C17B2A', fillOpacity: 0.12, weight: 2,
      }).addTo(mapRef.current);
    }
  }, [radiusKm, showRadius]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const placeMarker = (map, lat, lng) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }

    if (showRadius) {
      if (circleRef.current) {
        circleRef.current.setLatLng([lat, lng]);
      } else {
        circleRef.current = L.circle([lat, lng], {
          radius: radiusKm * 1000,
          color: '#C17B2A', fillColor: '#C17B2A', fillOpacity: 0.12, weight: 2,
        }).addTo(map);
      }
    }

    map.panTo([lat, lng]);
  };

  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.address || {};

      const streetNum  = addr.house_number || '';
      const street     = addr.road || addr.pedestrian || addr.footway || '';
      const addressStr = [streetNum, street].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || '';
      const city       = addr.city || addr.town || addr.village || addr.county || addr.municipality || '';
      const postcode   = addr.postcode || '';

      onChange({ lat, lng, address: addressStr, city, postcode });
    } catch {
      // Geocoding failed — still report coordinates
      onChange({ lat, lng, address: '', city: '', postcode: '' });
    } finally {
      setGeocoding(false);
    }
  };

  // ── Search by text ────────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    setSearchErr('');
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (!data[0]) { setSearchErr('Location not found. Try a more specific address.'); return; }

      const { lat, lon } = data[0];
      const latF = parseFloat(lat);
      const lngF = parseFloat(lon);

      if (mapRef.current) {
        placeMarker(mapRef.current, latF, lngF);
        mapRef.current.setView([latF, lngF], 15);
      }
      await reverseGeocode(latF, lngF);
    } catch {
      setSearchErr('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // ── Use my location ──────────────────────────────────────────────────────────
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (mapRef.current) {
        placeMarker(mapRef.current, lat, lng);
        mapRef.current.setView([lat, lng], 15);
      }
      await reverseGeocode(lat, lng);
    });
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* ── Search bar ── */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setSearchErr(''); }}
          placeholder="Search for an address or postcode…"
          style={{
            flex: 1, padding: '9px 13px', border: '1.5px solid #dde3eb',
            borderRadius: '8px', fontSize: '13px', fontFamily: "'Outfit', sans-serif",
            outline: 'none', color: '#1a2e44',
          }}
        />
        <button
          type="submit"
          disabled={searching}
          style={{
            padding: '9px 16px', background: '#1a3c5e', color: '#fff', border: 'none',
            borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap',
          }}
        >
          {searching ? '…' : '🔍 Search'}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          title="Use my current location"
          style={{
            padding: '9px 12px', background: '#f0f4f8', color: '#1a3c5e',
            border: '1.5px solid #dde3eb', borderRadius: '8px', fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          📍
        </button>
      </form>

      {searchErr && (
        <p style={{ fontSize: '12px', color: '#e74c3c', margin: '0 0 8px' }}>⚠ {searchErr}</p>
      )}

      {/* ── Map ── */}
      <div style={{ position: 'relative' }}>
        <div
          ref={containerRef}
          style={{ height, borderRadius: '10px', border: '1.5px solid #dde3eb', overflow: 'hidden' }}
        />
        {geocoding && (
          <div style={{
            position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(26,60,94,0.85)', color: '#fff', borderRadius: '20px',
            padding: '5px 14px', fontSize: '12px', fontWeight: '600', zIndex: 1000,
            pointerEvents: 'none',
          }}>
            Getting address…
          </div>
        )}
      </div>

      <p style={{ fontSize: '11px', color: '#8a9bb0', margin: '6px 0 0' }}>
        Click anywhere on the map to pin your location, or use the search bar above.
      </p>
    </div>
  );
};

export default LocationPicker;
