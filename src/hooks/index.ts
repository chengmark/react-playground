import { merge } from 'lodash';
import useNativeMutation, { MutationConfig } from './useMutation';
import useNativeQuery, { QueryConfig } from './useQuery';

const commonHeader = () => ({
  'Content-Type': 'application/json',
  'x-test': 'v',
});

export const useMutation = <T>(config: MutationConfig<T>) => useNativeMutation(merge({ headers: commonHeader() }, config));

export const useQuery = <T>(config: QueryConfig<T>) => useNativeQuery(merge({ headers: commonHeader() }, config));
