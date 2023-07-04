import { useState, useRef } from 'react';

const ensureError = (value) => {
  if (value instanceof Error) return value;

  let stringified = '[Unable to stringify the error value]';
  try {
    stringified = JSON.stringify(value);
  } catch {}

  const error = new Error(stringified);
  return error;
};

const useMutation = ({
  url,
  method = 'POST',
  headers = {},
  body = JSON.stringify({}),
  isErrorFn = async (response) => response.status >= 400,
  getErrorFn = async (response) => new Error(response.statusText),
  getDataFn = async (response) => response.json(),
  onSuccess = () => {},
  onError = () => {},
  onSettled = () => {},
  otherOptions = {},
}) => {
  const [state, setState] = useState({
    status: 'idle',
    error: null,
    data: null,
    execute: () => Promise.resolve(),
  });

  const deriveState = (nativeState) => ({
    ...nativeState,
    isIdle: nativeState.status === 'idle',
    isLoading: nativeState.status === 'loading',
    isSuccess: nativeState.status === 'success',
    isError: nativeState.status === 'error',
  });

  const updateState = (updates, callback) => {
    setState((prevState) => {
      let newState = { ...prevState };
      if (updates) newState = { ...newState, error: null, data: null, ...updates };
      callback?.(deriveState(newState));
      return { ...newState };
    });
  };

  const abortControllerRef = useRef(null);

  const execute = async () => {
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
          onError,
        );
      }

      const data = await getDataFn(response);
      updateState(
        {
          status: 'success',
          data,
        },
        onSuccess,
      );
    } catch (err) {
      if (abortControllerRef.current !== abortController) return;
      const error = ensureError(err);
      updateState(
        {
          status: 'error',
          error,
        },
        onError,
      );
    }
    updateState(null, onSettled);
  };

  return {
    ...deriveState(state),
    execute,
  };
};

export default useMutation;
export { ensureError };
