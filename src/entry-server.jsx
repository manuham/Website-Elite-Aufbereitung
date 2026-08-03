import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './App.jsx';

/**
 * Build-time entry. Consumed by scripts/prerender.mjs, never shipped to the browser.
 *
 * MemoryRouter rather than StaticRouter: it is exported from react-router-dom in every version
 * (StaticRouter's export path moved in v7), it touches no browser API, and for a single static
 * render it produces byte-identical markup.
 *
 * No React.StrictMode here — StrictMode double-invokes render in development but is a no-op for
 * renderToString, and leaving it out keeps the server tree identical to what hydrateRoot expects.
 */
export function render(url) {
    return renderToString(
        <MemoryRouter initialEntries={[url]}>
            <AppShell />
        </MemoryRouter>
    );
}
