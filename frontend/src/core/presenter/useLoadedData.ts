import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export type LoadedData<T> = {
  /** undefined while it is still loading. */
  data: T | undefined;
  setData: Dispatch<SetStateAction<T | undefined>>;
  hasFailed: boolean;
  /** Loads the data again, for the "Reintentar" button. */
  retry: () => void;
};

/**
 * Loads data when the screen opens and again every time `load` changes.
 * Wrap `load` in useCallback so it does not change on every render.
 */
export function useLoadedData<T>(load: () => Promise<T>): LoadedData<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [hasFailed, setHasFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;
    setData(undefined);
    setHasFailed(false);
    load()
      .then((loadedData) => isActive && setData(() => loadedData))
      .catch(() => isActive && setHasFailed(true));
    return () => {
      isActive = false;
    };
  }, [load, loadAttempt]);

  return { data, setData, hasFailed, retry: () => setLoadAttempt((value) => value + 1) };
}
