import { useEffect, useState } from 'react';
import { ResponseAllAccounts, isAllAccountsErrorResponse } from '../types/apiAllAccounts';
import { ResponseAccountDetail } from '../types/apiAccountDetails';
import { useMutation, useQuery } from '../hooks';
import { ResponseLogin } from '../types/apiLogin';

function Home() {
  const setAccessToken = (token: string) => sessionStorage.setItem('x-acc-op', token);
  const setRefreshToken = (token: string) => sessionStorage.setItem('x-ref-op', token);
  const getAccessToken = () => sessionStorage.getItem('x-acc-op');
  const getRefreshToken = () => sessionStorage.getItem('x-ref-op');

  const login = useMutation<ResponseLogin>({
    url: '/v1/login',
    method: 'POST',
    body: JSON.stringify({ userId: 'uid', password: 'pwd' }),
    onSuccess: (state, response) => {
      // console.log('login success', state, response);
      setAccessToken(response.headers.get('x-acc-op') || '');
      setRefreshToken(response.headers.get('x-ref-op') || '');
    },
  });

  const refresh = useMutation({
    url: '/v1/token',
    method: 'POST',
    headers: {
      'x-acc-op': getAccessToken() || '',
      'x-ref-op': getRefreshToken() || '',
    },
    onSuccess: (state, response) => {
      console.log('refresh success');
      setAccessToken(response.headers.get('x-acc-op') || '');
      setRefreshToken(response.headers.get('x-ref-op') || '');
    },
    onError: () => {
      console.log('refresh error');
      sessionStorage.clear();
    },
  });

  return (
    <div>
      <button disabled={login.isLoading} onClick={() => login.execute()}>
        LOGIN
      </button>
      <div>{login.status}</div>
      <div>{JSON.stringify(login?.data)}</div>
      <div>{login?.error?.toString()}</div>

      <button disabled={refresh.isLoading} onClick={() => refresh.execute()}>
        REFRESH
      </button>
      <div>{refresh.status}</div>
      <div>{JSON.stringify(refresh?.data)}</div>
      <div>{refresh?.error?.toString()}</div>
    </div>
  );
}

export default Home;
