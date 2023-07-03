import accountDetailSuccessMockData from '../mock/data/[POST][SUCCESS][HK]accountDetail.json'
import accountDetailErrorMockData from '../mock/data/[POST][ERROR][HK]accountDetail.json' 

export type ResponseAccountDetail = typeof accountDetailSuccessMockData | typeof accountDetailErrorMockData;

export const isAccountDetailErrorResponse = (response: ResponseAccountDetail): response is typeof accountDetailErrorMockData => response.status === "FAILED"