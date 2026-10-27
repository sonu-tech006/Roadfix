import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { IComplaint } from '../types.ts';
import { MapPin, Layers, Filter, Compass, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface InteractiveMapProps {
  complaints?: Partial<IComplaint>[];
  selectedComplaint?: Partial<IComplaint> | null;
  onSelectComplaint?: (complaint: Partial<IComplaint>) => void;
  // Picker mode for reporting
  isPickerMode?: boolean;
  selectedCoordinates?: [number, number] | null; // [lng, lat]
  onCoordinatesChange?: (coords: [number, number], approxAddress?: string) => void;
  height?: string;
  center?: [number, number]; // [lat, lng]
  zoom?: number;
}

// Marker icon generator using SVG Data URIs
function createCustomMarkerIcon(status: string = 'Submitted', severity: string = 'Medium') {
  let color = '#f97316'; // default orange

  if (status === 'Resolved') color = '#0d9488'; // teal
  else if (status === 'In Progress') color = '#0284c7'; // sky blue
  else if (status === 'Resolution Submitted') color = '#6366f1'; // indigo
  else if (status === 'Escalated' || severity === 'Critical') color = '#ef4444'; // red
  else if (status === 'Assigned') color = '#8b5cf6'; // purple

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-road-marker',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32]
  });
}

function createPickerIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="34" height="42">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="#0f766e" stroke="#f59e0b" stroke-width="2.5"/>
      <circle cx="12" cy="11" r="5" fill="#f59e0b"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'picker-road-marker',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -36]
  });
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  complaints = [],
  selectedComplaint,
  onSelectComplaint,
  isPickerMode = false,
  selectedCoordinates,
  onCoordinatesChange,
  height = '500px',
  center = [12.9716, 77.6412], // Default Bengaluru coordinates
  zoom = 13
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle click in Picker Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isPickerMode) return;
      const { lat, lng } = e.latlng;

      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: createPickerIcon(),
          draggable: true
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          if (onCoordinatesChange) {
            onCoordinatesChange([pos.lng, pos.lat]);
          }
        });

        pickerMarkerRef.current = marker;
      }

      if (onCoordinatesChange) {
        onCoordinatesChange([lng, lat]);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isPickerMode, onCoordinatesChange]);

  // Update picker marker if coords passed from outside
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPickerMode && selectedCoordinates) {
      const [lng, lat] = selectedCoordinates;
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: createPickerIcon(),
          draggable: true
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          if (onCoordinatesChange) {
            onCoordinatesChange([pos.lng, pos.lat]);
          }
        });

        pickerMarkerRef.current = marker;
      }
      map.setView([lat, lng], Math.max(map.getZoom(), 14));
    }
  }, [isPickerMode, selectedCoordinates]);

  // Render complaint markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || isPickerMode) return;

    layer.clearLayers();

    const filtered = complaints.filter(c => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });

    filtered.forEach(c => {
      if (!c.coordinates || c.coordinates.length !== 2) return;
      const [lng, lat] = c.coordinates;

      const marker = L.marker([lat, lng], {
        icon: createCustomMarkerIcon(c.status, c.severity)
      });

      const photoUrl = c.evidence?.[0]?.url;
      const popupHtml = `
        <div style="min-width: 220px; font-family: sans-serif;">
          ${photoUrl ? `<img src="${photoUrl}" alt="damage" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ''}
          <div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
            ${c.reference || 'Issue'} · ${c.category}
          </div>
          <h4 style="font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">
            ${c.roadName || 'Road Location'}
          </h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0; max-height: 40px; overflow: hidden;">
            ${c.landmark ? `Near ${c.landmark}` : (c.description || '')}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px;">
            <span style="font-weight: 600; color: ${c.status === 'Resolved' ? '#0d9488' : '#ea580c'};">
              ${c.status}
            </span>
            <span style="color: #94a3b8; font-family: monospace;">
              ${c.severity} Severity
            </span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (onSelectComplaint) {
          onSelectComplaint(c);
        }
      });

      layer.addLayer(marker);
    });
  }, [complaints, categoryFilter, statusFilter, isPickerMode, onSelectComplaint]);

  // Handle current user GPS geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 15);
        if (isPickerMode && onCoordinatesChange) {
          onCoordinatesChange([longitude, latitude], 'Current GPS Location');
        }
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err);
      }
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      {/* Map Filter & Controls Bar (Only in explorer mode) */}
      {!isPickerMode && (
        <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-md">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mr-1">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolution Submitted">Resolution Submitted</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 max-w-[150px] truncate"
          >
            <option value="all">All Categories</option>
            <option value="Pothole">Pothole</option>
            <option value="Broken or damaged road surface">Broken Surface</option>
            <option value="Road subsidence">Road Subsidence</option>
            <option value="Waterlogging caused by road damage">Waterlogging</option>
            <option value="Damaged footpath">Damaged Footpath</option>
            <option value="Broken or missing manhole cover">Manhole Cover</option>
            <option value="Damaged road divider">Road Divider</option>
            <option value="Missing or damaged road signs">Road Signs</option>
            <option value="Unsafe road obstruction">Road Obstruction</option>
          </select>
        </div>
      )}

      {/* Picker Guidance Banner */}
      {isPickerMode && (
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between bg-teal-900/90 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-xl border border-teal-700 shadow-md">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Click or drag pin to pinpoint exact damage location on map</span>
          </div>
          <button
            type="button"
            onClick={handleLocateMe}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded text-xs transition-colors shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Use My GPS</span>
          </button>
        </div>
      )}

      {/* Recenter / Geolocation floating action button */}
      {!isPickerMode && (
        <button
          type="button"
          onClick={handleLocateMe}
          title="Zoom to my location"
          className="absolute bottom-4 left-4 z-20 flex items-center justify-center w-9 h-9 bg-white text-slate-700 hover:text-teal-700 rounded-xl border border-slate-200 shadow-md transition-colors"
        >
          <Compass className="w-4 h-4" />
        </button>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
