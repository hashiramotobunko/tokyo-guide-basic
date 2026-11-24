const storageKey = 'shakedown-basic-routes-v1';

export function readPersonalRoutes() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(route => route && typeof route.id === 'string' &&
      typeof route.name === 'string' && Array.isArray(route.stops) &&
      route.stops.every(id => typeof id === 'string'));
  } catch {
    return [];
  }
}

export function writePersonalRoutes(routes) {
  localStorage.setItem(storageKey, JSON.stringify(routes));
}
