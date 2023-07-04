import { useState, useEffect, useRef } from 'react';

export type ApiResponse<T> = Response & {
  json(): Promise<T>;
};

interface DerivedState {
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

interface NativeState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: Error | null;
  data: T | null;
}

type QueryState<T> = NativeState<T> & DerivedState;

type IsErrorFn<T> = (response: ApiResponse<T>) => Promise<boolean>;
type GetErrorFn<T> = (response: ApiResponse<T>) => Promise<Error>;
type GetDataFn<T> = (response: ApiResponse<T>) => Promise<T>;

export interface QueryConfig<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: BodyInit;
  isErrorFn?: IsErrorFn<T>; // if exists, then override default error indicating function
  getErrorFn?: GetErrorFn<T>; // if exists then override default "get error message" function
  getDataFn?: GetDataFn<T>; // if exists then override default "get data" function
  otherOptions?: Record<string, string>; // other fetch options
  enabled?: boolean | null; // if not null, then the fetch will only execute when it is "true"
}

const ensureError = (value: unknown): Error => {
  if (value instanceof Error) return value;

  let stringified = '[Unable to stringify the error value]';
  try {
    stringified = JSON.stringify(value);
  } catch {}

  const error = new Error(stringified);
  return error;
};

const useQuery = <T>({
  url,
  method = 'GET',
  headers = {},
  body = JSON.stringify({}),
  isErrorFn = async (response: ApiResponse<T>) => response.status >= 400,
  getErrorFn = async (response: ApiResponse<T>) => new Error(response.statusText),
  getDataFn = async (response: ApiResponse<T>) => response.json(),
  otherOptions = {},
  enabled = null,
}: QueryConfig<T>): QueryState<T> => {
  const [state, setState] = useState<NativeState<T>>({
    status: 'idle',
    error: null,
    data: null,
  });

  const deriveState = (nativeState: NativeState<T>): QueryState<T> => ({
    ...nativeState,
    isIdle: nativeState.status === 'idle',
    isLoading: nativeState.status === 'loading',
    isSuccess: nativeState.status === 'success',
    isError: nativeState.status === 'error',
  });

  const updateState = (updates: Partial<NativeState<T>>) => {
    setState((prevState) => {
      let newState = { ...prevState };
      if (updates) {
        newState = {
          ...newState,
          error: null,
          data: null,
          ...updates,
        };
      }
      return { ...newState };
    });
  };

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = async () => {
    if (enabled !== null && !enabled) return;

    updateState({ status: 'loading' });

    // abort prev fetch
    if (abortControllerRef.current) abortControllerRef.current.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' ? body : null,
        signal: abortController.signal,
        ...otherOptions,
      });

      const isError = await isErrorFn(response);
      if (isError) {
        const error = await getErrorFn(response);
        updateState({ status: 'error', error });
      }

      const data = await getDataFn(response);
      updateState({ status: 'success', data });
    } catch (err) {
      if (abortControllerRef.current !== abortController) return;
      const error = ensureError(err);
      updateState({ status: 'error', error });
    }
  };

  useEffect(() => {
    execute();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled]);

  return {
    ...deriveState(state),
  };
};
export default useQuery;
