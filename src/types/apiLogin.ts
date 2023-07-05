import loginSuccessMockData from '../mock/data/[POST][SUCCESS][HK]login.json';
import loginErrorMockData from '../mock/data/[POST][ERROR][HK]login.json';

export type ResponseLogin = typeof loginSuccessMockData | typeof loginErrorMockData;

export const isAllAccountsErrorResponse = (response: ResponseLogin): response is typeof loginErrorMockData => response?.status === 'FAILED';
