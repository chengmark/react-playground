import { useState, useRef } from 'react';

export type ApiResponse<T> = Response & {
  json(): Promise<T>
}

type IsErrorFn<T> = (response: ApiResponse<T>) => Promise<boolean>;
type GetErrorFn<T> = (response: ApiResponse<T>) => Promise<string>;
type GetDataFn<T> = (response: ApiResponse<T>) => Promise<T>;

interface MutationConfig<T> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: BodyInit,
  isErrorFn?: IsErrorFn<T>; // if exists, then override default error indicating function 
  getErrorFn?: GetErrorFn<T>; // if exists then override default "get error message" function
  getDataFn?: GetDataFn<T>; // if exists then override default "get data" function
  otherOptions?: Record<string, string>; // other fetch options
}

interface MutationState<T> {
  status: 'idle' | 'loading' | 'success' | 'error'
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: T | null;
  execute: () => Promise<void>;
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

const useMutation = <T>({
  url,
  method = 'POST',
  headers = {},
  body = JSON.stringify({}),
  isErrorFn = async (response: ApiResponse<T>) => response.status >= 400,
  getErrorFn = async (response: ApiResponse<T>) => response.statusText,
  getDataFn = async (response: ApiResponse<T>) => await response.json(),
  otherOptions = {},
}:MutationConfig<T>):MutationState<T> => {

  const [state, setState] = useState<MutationState<T>>({
    status: 'idle',
    isIdle: true,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: null,
    execute: () => Promise.resolve(),
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  async function execute () {
    setState({
      status: 'loading',
      isIdle: false,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
      execute: () => Promise.resolve(),
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
        return setState({
          status: 'error',
          isIdle: false,
          isLoading: false,
          isSuccess: false,
          isError: true,
          error,
          data: null,
          execute,
        });
      }

      const data = await getDataFn(response);
      setState({
        status: 'success',
        isIdle: false,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        data,
        execute,
      });
    } catch (err) {
      if (abortControllerRef.current !== abortController) return 
      const error = ensureError(err)
      setState({
        status: 'error',
        isIdle: false,
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: error.message,
        data: null,
        execute,
      });
    }
  };

  return {
    ...state,
    execute
  };
};
export default useMutation;