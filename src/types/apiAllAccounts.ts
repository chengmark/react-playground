import allAccountsSuccessMockData from '../mock/data/[POST][SUCCESS][HK]allAccounts.json'
import allAccountsErrorMockData from '../mock/data/[POST][ERROR][HK]allAccounts.json' 

export type ResponseAllAccounts = typeof allAccountsSuccessMockData | typeof allAccountsErrorMockData;

export const isAllAccountsErrorResponse = (response: ResponseAllAccounts): response is typeof allAccountsErrorMockData => response?.status === "FAILED"