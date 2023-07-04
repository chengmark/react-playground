import { useState, useEffect, useRef } from 'react';

const ensureError = (value) => {
  if (value instanceof Error) return value;

  let stringified = '[Unable to stringify the error value]';
  try {
    stringified = JSON.stringify(value);
  } catch {}

  const error = new Error(stringified);
  return error;
};

const useQuery = ({
  url,
  method = 'GET',
  headers = {},
  body = JSON.stringify({}),
  isErrorFn = async (response) => response.status >= 400,
  getErrorFn = async (response) => new Error(response.statusText),
  getDataFn = async (response) => response.json(),
  otherOptions = {},
  enabled = null,
}) => {
  const [state, setState] = useState({
    status: 'idle',
    error: null,
    data: null,
  });

  const deriveState = (nativeState) => ({
    ...nativeState,
    isIdle: nativeState.status === 'idle',
    isLoading: nativeState.status === 'loading',
    isSuccess: nativeState.status === 'success',
    isError: nativeState.status === 'error',
  });

  const updateState = (updates) => {
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

  const abortControllerRef = useRef(null);

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
