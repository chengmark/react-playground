import { Response, createServer } from 'miragejs'
import allAccountsSuccessMockData from './data/[POST][SUCCESS][HK]allAccounts.json'
// import allAccountsErrorMockData from './data/[POST][ERROR][HK]allAccounts.json'
import accountDetailSuccessMockData from './data/[POST][SUCCESS][HK]accountDetail.json'

function createMockServer () {
  createServer({
    routes() {
      this.post('/v1/accountDetail', () => accountDetailSuccessMockData);
      this.get('/v1/allAccounts', () => allAccountsSuccessMockData);
      // this.get('/v1/allAccounts', () => new Response(400, {}, allAccountsErrorMockData));
      this.timing = 2000;
    }
  })
}

export default createMockServer;