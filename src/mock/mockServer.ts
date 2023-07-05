import { Response, createServer } from 'miragejs';
import allAccountsSuccessMockData from './data/[POST][SUCCESS][HK]allAccounts.json';
// import allAccountsErrorMockData from './data/[POST][ERROR][HK]allAccounts.json'
import accountDetailSuccessMockData from './data/[POST][SUCCESS][HK]accountDetail.json';
let counter = 0;
function createMockServer() {
  createServer({
    routes() {
      this.post('/v1/accountDetail', () => accountDetailSuccessMockData);
      this.get('/v1/allAccounts', () => allAccountsSuccessMockData);
      this.post(
        '/v1/login',
        () =>
          new Response(
            200,
            {
              'x-acc-op': 'accessToken',
              'x-ref-op': 'refreshToken',
            },
            {
              status: 'SUCCESS',
            },
          ),
      );
      this.post('/v1/token', (_, req) => {
        console.log('refresh header', req.requestHeaders);
        counter++;
        return new Response(
          200,
          {
            'x-acc-op': `accessToken-${counter}`,
            'x-ref-op': `refreshToken-${counter}`,
          },
          {
            status: 'SUCCESS',
          },
        );
      });
      // this.get('/v1/allAccounts', () => new Response(400, {}, allAccountsErrorMockData));
      this.timing = 2000;
    },
  });
}

export default createMockServer;
