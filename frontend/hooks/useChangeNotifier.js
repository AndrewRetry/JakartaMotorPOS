import {useEffect, useRef} from 'react';
import {api} from '../lib/apiClient';

const POLL_INTERVAL_MS = 3000;

/**
 * Calls `onChange` when the backend reports that `entityName` was modified.
 *
 * Polls /api/sync-check, which returns only timestamps, instead of refetching
 * the entity's full list to find out whether it is worth refetching.
 */

export function useChangeNotifier(entityName, onChange) {
    const lastSeenTimeStamp = useRef(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (document.hidden) return;

            try {
                const { matrix } = await api.get('/sync-check');
                const timestamp = matrix?.[entityName];

                if (lastSeenTimeStamp.current == null) {
                    lastSeenTimeStamp.current = timestamp;
                } else if (timestamp !== lastSeenTimeStamp.current) {
                    lastSeenTimeStamp.current = timestamp;
                    onChangeRef.current();
                }
                
            } catch {
                // the next poll will retry if the current one fails
            }
        }, POLL_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [entityName]);
}