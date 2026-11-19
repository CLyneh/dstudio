import { useEffect, useState } from 'react';

export const ROUTES = ['accueil', 'editeur', 'marque', 'creations'] as const;
export type Route = (typeof ROUTES)[number];

export function parseRoute(hash: string): Route {
  const name = hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'accueil';
}

export function navigate(route: Route): void {
  if (location.hash !== `#${route}`) location.hash = route;
}

/** Hash routing (#editeur…): works on GitHub Pages without any server configuration. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
