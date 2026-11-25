import { haversineMeters } from "../../shared/pois";

export interface WalkingRouteData {
  coordinates: [number, number][]; // [lat, lng] lungo le strade
  distanceMeters: number;
  durationMinutes: number;
  nextWaypoint: [number, number]; // Prossimo incrocio verso cui puntare la bussola
  isStreetRoute: boolean;
}

interface CacheEntry {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  data: WalkingRouteData;
}

let routeCache: CacheEntry | null = null;

function pickNextWaypoint(
  fromLat: number,
  fromLng: number,
  coords: [number, number][],
  fallback: [number, number],
): [number, number] {
  for (let i = 1; i < coords.length; i++) {
    const [lat, lng] = coords[i];
    if (haversineMeters(fromLat, fromLng, lat, lng) >= 14) {
      return [lat, lng];
    }
  }
  return coords[coords.length - 1] || fallback;
}

export async function fetchWalkingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<WalkingRouteData> {
  if (
    routeCache &&
    Math.abs(routeCache.toLat - toLat) < 0.00001 &&
    Math.abs(routeCache.toLng - toLng) < 0.00001 &&
    haversineMeters(fromLat, fromLng, routeCache.fromLat, routeCache.fromLng) <
      15
  ) {
    return {
      ...routeCache.data,
      nextWaypoint: pickNextWaypoint(
        fromLat,
        fromLng,
        routeCache.data.coordinates,
        [toLat, toLng],
      ),
    };
  }

  const endpoints = [
    `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
    `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const json = (await res.json()) as {
        routes?: Array<{
          distance: number;
          duration: number;
          geometry?: { coordinates?: [number, number][] };
        }>;
      };

      const route = json.routes?.[0];
      const rawCoords = route?.geometry?.coordinates;
      if (route && rawCoords && rawCoords.length >= 2) {
        // GeoJSON usa [lng, lat] -> convertiamo in [lat, lng] per Leaflet
        const latLngs: [number, number][] = [
          [fromLat, fromLng],
          ...rawCoords.map(([lng, lat]) => [lat, lng] as [number, number]),
          [toLat, toLng],
        ];

        const distanceMeters = Math.round(route.distance);
        const durationMinutes = Math.max(1, Math.round(distanceMeters / 78));
        const data: WalkingRouteData = {
          coordinates: latLngs,
          distanceMeters,
          durationMinutes,
          nextWaypoint: pickNextWaypoint(fromLat, fromLng, latLngs, [
            toLat,
            toLng,
          ]),
          isStreetRoute: true,
        };

        routeCache = { fromLat, fromLng, toLat, toLng, data };
        return data;
      }
    } catch {
      // Prova l'endpoint successivo
    }
  }

  const straightDist = Math.round(
    haversineMeters(fromLat, fromLng, toLat, toLng),
  );
  return {
    coordinates: [
      [fromLat, fromLng],
      [toLat, toLng],
    ],
    distanceMeters: straightDist,
    durationMinutes: Math.max(1, Math.round(straightDist / 78)),
    nextWaypoint: [toLat, toLng],
    isStreetRoute: false,
  };
}
