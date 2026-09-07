import { useCallback, useEffect, useState } from "react";
import {api} from '../lib/apiClient';
import { useDebouncedValue } from "./useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Fetches a searchable, paginated list from the backend.
 * Behavior: During fetching, previous results/values stay on-screen (no blanks or just a loading placeholder during re-fetching of data)
 */

export function useEntitySearch(resourcePath, {pageSize = 50} = {}) {
    const [searchInput, setSearchInput] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [refreshCounter, setRefreshCounter] = useState(0);

    const [records, setRecords] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState(null);

    const [isFetching, setIsFetching] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

    useEffect(() => {
        const abortController = new AbortController();
        setIsFetching(true);
        setError(null);

        const query = new URLSearchParams({
            q: debouncedSearch.trim(),
            limit: String(pageSize),
            offset: String(pageIndex * pageSize),
        });
        
        api.get(`${resourcePath}?${query}`, { signal: abortController.signal })
        .then((payload) => {
            setRecords(payload.data ?? []);
            setTotalCount(payload.total ?? 0);
            setHasLoadedOnce(true);
        })
        .catch((requestError) => {
            // An aborted request was superseded by a newer one.
            if (requestError.name === 'AbortError') return;
            setError(requestError.message);
        })
        .finally(() => {
            if (!abortController.signal.aborted) setIsFetching(false);
        });

        return () => abortController.abort();
    }, [resourcePath, debouncedSearch, pageIndex, pageSize, refreshCounter]);

    // if search input is changed, return to page 1 again
    const updateSearch = useCallback((nextValue) => {
        setSearchInput(nextValue);
        setPageIndex(0);
    }, []);

    const refresh = useCallback(() => {
        setRefreshCounter((count) => count + 1)
    }, [])

    const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
        records,
        totalCount,
        error,
        searchInput,
        updateSearch,
        refresh,

        // 3 distinct states
        // still pending/loading
        isInitialLoad: isFetching && !hasLoadedOnce,
        // nothing to show yet -> show skeleton
        isRefreshing: isFetching && hasLoadedOnce,
        // old rows valid even with changed searchInput
        isEmpty: hasLoadedOnce && !isFetching && records.length === 0,

        pageIndex,
        pageCount,
        goToPreviousPage: () => setPageIndex((page) => Math.max(0, page - 1)),
        goToNextPage: () => setPageIndex((page) => Math.min(pageCount - 1, page + 1)),
    };
}