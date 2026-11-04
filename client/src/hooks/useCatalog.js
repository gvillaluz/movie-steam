import { useCallback, useEffect, useRef, useState } from "react";
import { loadMovies } from "../api/movieAPI";
import { loadSeries } from "../api/seriesAPI";
import { search } from "../api/searchAPI";

// Series and search keep their legacy providers until their migration slices.
const prepareLegacyContents = (items) => {
    if (!Array.isArray(items)) throw new Error("Content request failed");
    return Array.from(new Map(items.map(item => [item.id, item])).values())
        .filter(item => item.poster_path &&
            (item.release_date || item.first_air_date) && (item.title || item.name));
};

export const useCatalog = (pathname) => {
    const [state, setState] = useState({ contents: [], loading: true, error: null, searchResults: "" });
    const activeRequest = useRef(null);
    const generation = useRef(0);
    const lastRequest = useRef(null);

    const runRequest = useCallback(async (loader, searchResults = "") => {
        activeRequest.current?.abort();
        const controller = new AbortController();
        activeRequest.current = controller;
        const requestId = ++generation.current;
        lastRequest.current = { loader, searchResults };
        setState({ contents: [], loading: true, error: null, searchResults });
        try {
            const contents = await loader(controller.signal);
            if (requestId !== generation.current || controller.signal.aborted) return;
            setState({ contents, loading: false, error: null, searchResults });
        } catch {
            if (requestId !== generation.current || controller.signal.aborted) return;
            setState({ contents: [], loading: false, error: "We couldn't load this list. Please try again.", searchResults });
        }
    }, []);

    useEffect(() => () => {
        generation.current++;
        activeRequest.current?.abort();
        lastRequest.current = null;
    }, [pathname]);

    const loadCatalog = useCallback((type) => {
        const loader = String(type).toLowerCase() === "series"
            ? async () => prepareLegacyContents(await loadSeries())
            : signal => loadMovies({ signal });
        return runRequest(loader);
    }, [runRequest]);

    const runSearch = useCallback((query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        return runRequest(async () => prepareLegacyContents(await search(trimmed, pathname)), trimmed);
    }, [pathname, runRequest]);

    const reload = useCallback(() => {
        const previous = lastRequest.current;
        if (previous) return runRequest(previous.loader, previous.searchResults);
    }, [runRequest]);

    return { ...state, loadCatalog, runSearch, reload };
};
