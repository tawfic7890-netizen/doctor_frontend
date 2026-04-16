'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/** Fix Leaflet's default marker icon paths (broken by bundlers) */
const markerIcon = new L.Icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor:[1,  -34],
  shadowSize: [41, 41],
});

interface Coords { lat: number; lng: number }

interface Props {
  value: Coords | null;
  onPick: (coords: Coords) => void;
  center: Coords;
  zoom: number;
  /** bumped whenever the parent wants to re-center on `center` (e.g. after a GPS / search hit) */
  flyToken: number;
}

/** Drops a pin wherever the user clicks */
function ClickCapture({ onPick }: { onPick: (c: Coords) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Pans to `center` when flyToken changes. Also runs invalidateSize on mount so
 *  the map renders correctly inside a modal that was initially display:none. */
function Controller({ center, zoom, flyToken }: { center: Coords; zoom: number; flyToken: number }) {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    if (flyToken === 0) return; // skip initial
    const lat = (typeof center?.lat === 'number' && !isNaN(center.lat)) ? center.lat : 34.4367;
    const lng = (typeof center?.lng === 'number' && !isNaN(center.lng)) ? center.lng : 35.8497;
    map.flyTo([lat, lng], Math.max(map.getZoom(), zoom), { duration: 0.6 });
  }, [flyToken, center.lat, center.lng, zoom, map]);

  return null;
}

export default function LeafletMap({ value, onPick, center, zoom, flyToken }: Props) {
  // Safety fallback — prevents "Invalid LatLng: (undefined, undefined)" if
  // caller passes a bad center before proper state initialisation.
  const safeLat = (typeof center?.lat === 'number' && !isNaN(center.lat)) ? center.lat : 34.4367;
  const safeLng = (typeof center?.lng === 'number' && !isNaN(center.lng)) ? center.lng : 35.8497;

  return (
    <MapContainer
      center={[safeLat, safeLng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture onPick={onPick} />
      <Controller center={center} zoom={zoom} flyToken={flyToken} />
      {value && <Marker position={[value.lat, value.lng]} icon={markerIcon} />}
    </MapContainer>
  );
}
