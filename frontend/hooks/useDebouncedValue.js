import {useEffect, useState} from 'react';

/**
 * Returns `value` only once it has stopped changing for `delayMs`.
 * A search box wired through this fires one request per pause in typing,
 * not one per keystroke.
 */

export function useDebouncedValue(value, delayMs = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timerId = setTimeout(() => setDebouncedValue(value), delayMs);
        return () => clearTimeout(timerId);
    }, [value, delayMs]);

    return debouncedValue;
}