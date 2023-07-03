import { useState, useEffect, useRef } from 'react';

export type ApiResponse<T> = Response & {
  json(): Promise<T>
}

type IsErrorFn<T> = (response: ApiResponse<T>) => Promise<boolean>;
type GetErrorFn<T> = (response: ApiResponse<T>) => Promise<string>;
type GetDataFn<T> = (response: ApiResponse<T>) => Promise<T>;

interface QueryConfig<T> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: BodyInit,
  isErrorFn?: IsErrorFn<T>; // if exists, then override default error indicating function 
  getErrorFn?: GetErrorFn<T>; // if exists then override default "get error message" function
  getDataFn?: GetDataFn<T>; // if exists then override default "get data" function
  otherOptions?: Record<string, string>; // other fetch options
  enabled?: boolean | null // if not null, then the fetch will only execute when it is "true"
}

interface QueryState<T> {
  status: 'idle' | 'loading' | 'success' | 'error'
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: T | null;
}

const ensureError = (value: unknown): Error => {
  if (value instanceof Error) return value

  let stringified = '[Unable to stringify the error value]'
  try {
    stringified = JSON.stringify(value)
  } catch {}

  const error = new Error(stringified)
  return error
}

const useQuery = <T>({
  url,
  method = 'GET',
  headers = {},
  body = JSON.stringify({}),
  isErrorFn = async (response: ApiResponse<T>) => response.status >= 400,
  getErrorFn = async (response: ApiResponse<T>) => response.statusText,
  getDataFn = async (response: ApiResponse<T>) => await response.json(),
  otherOptions = {},
  enabled = null,
}:QueryConfig<T>):QueryState<T> => {

  const [state, setState] = useState<QueryState<T>>({
    status: 'idle',
    isIdle: true,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: null,
  });

  const updateState = (newStates: Partial<QueryState<T>>) => setState(prevState => ({...prevState, ...newStates}));

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = async () => {
    if (enabled !== null && !enabled) return;

    updateState({
      status: 'loading',
      isIdle: false,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
    });

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
        return updateState({
          status: 'error',
          isIdle: false,
          isLoading: false,
          isSuccess: false,
          isError: true,
          error,
          data: null,
        });
      }

      const data = await getDataFn(response);
      updateState({
        status: 'success',
        isIdle: false,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        data,
      });
    } catch (err) {
      if (abortControllerRef.current !== abortController) return 
      const error = ensureError(err)
      updateState({
        status: 'error',
        isIdle: false,
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: error.message,
        data: null,
      });
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

  return state;
};
export default useQuery;