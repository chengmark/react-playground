import useNativeMutation, { MutationConfig } from "./useMutation";
import useNativeQuery, { QueryConfig } from './useQuery';

const commonHeader = () => ({
  'Content-Type': 'application/json',
})

export const useMutation = <T>(config: MutationConfig<T>) => useNativeMutation({
  headers: commonHeader(),
  ...config,
});

export const useQuery = <T>(config: QueryConfig<T>) => useNativeQuery({
  headers: commonHeader(),
  ...config,
})