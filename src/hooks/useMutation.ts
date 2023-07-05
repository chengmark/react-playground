import { useState, useRef } from 'react';

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
  execute: () => Promise<void>;
}

type MutationState<T> = NativeState<T> & DerivedState;

type IsErrorFn<T> = (response: ApiResponse<T>) => Promise<boolean>;
type GetErrorFn<T> = (response: ApiResponse<T>) => Promise<Error>;
type GetDataFn<T> = (response: ApiResponse<T>) => Promise<T>;
type OnSuccess<T> = (state: MutationState<T>, response: ApiResponse<T>) => Promise<void> | void;
type OnError<T> = (state: MutationState<T>, error: Error) => Promise<void> | void;
type OnSettled<T> = (state: MutationState<T>) => Promise<void> | void;
type StateCallback<T> = (state: MutationState<T>) => Promise<void> | void;

export interface MutationConfig<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: BodyInit;
  isErrorFn?: IsErrorFn<T>; // if exists, then override default error indicating function
  getErrorFn?: GetErrorFn<T>; // if exists then override default "get error message" function
  getDataFn?: GetDataFn<T>; // if exists then override default "get data" function
  onSuccess?: OnSuccess<T>;
  onError?: OnError<T>;
  onSettled?: OnSettled<T>;
  otherOptions?: Record<string, string>; // other fetch options
}

const ensureError = (value: unknown): Error => {
  if (value instanceof Error) return value;

  let stringified = '[Unable to stringify the error value]';
  try {
    stringified = JSON.stringify(value);
  } catch {
    /* empty */
  }

  const error = new Error(stringified);
  return error;
};

const useMutation = <T>({
  url,
  method = 'POST',
  headers = {},
  body = JSON.stringify({}),
  isErrorFn = async (response: ApiResponse<T>) => response.status >= 400,
  getErrorFn = async (response: ApiResponse<T>) => new Error(response.statusText),
  getDataFn = async (response: ApiResponse<T>) => response.json(),
  onSuccess = () => {},
  onError = () => {},
  onSettled = () => {},
  otherOptions = {},
}: MutationConfig<T>): MutationState<T> => {
  const [state, setState] = useState<NativeState<T>>({
    status: 'idle',
    error: null,
    data: null,
    execute: () => Promise.resolve(),
  });

  const deriveState = (nativeState: NativeState<T>): MutationState<T> => ({
    ...nativeState,
    isIdle: nativeState.status === 'idle',
    isLoading: nativeState.status === 'loading',
    isSuccess: nativeState.status === 'success',
    isError: nativeState.status === 'error',
  });

  const updateState = (updates: Partial<NativeState<T>> | null, callback?: StateCallback<T>) => {
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
      callback?.(deriveState(newState));
      return { ...newState };
    });
  };

  const abortControllerRef = useRef<AbortController | null>(null);

  async function execute() {
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
        updateState(
          {
            status: 'error',
            error,
          },
          (newState: MutationState<T>) => onError(newState, error),
        );
      } else {
        const data = await getDataFn(response);
        updateState(
          {
            status: 'success',
            data,
          },
          (newState: MutationState<T>) => onSuccess(newState, response),
        );
      }
    } catch (err) {
      if (abortControllerRef.current !== abortController) return;
      const error = ensureError(err);
      updateState(
        {
          status: 'error',
          error,
        },
        (newState: MutationState<T>) => onError(newState, error),
      );
    }
    updateState(null, onSettled);
  }

  return {
    ...deriveState(state),
    execute,
  };
};

export default useMutation;
