import { useEffect, useState } from "react"
import { ResponseAllAccounts, isAllAccountsErrorResponse } from "../types/apiAllAccounts"
import { ResponseAccountDetail } from "../types/apiAccountDetails"
import useFetch from "../hooks/useFetch"
import useQuery from "../hooks/useQuery"
import useMutation from "../hooks/useMutation"

const Home = () => {
  const [text, setText] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>('')
  const allAccountsQuery = useQuery<ResponseAllAccounts>({
    url: '/v1/allAccounts',
    method: 'GET',
    enabled: !!text,
    // isErrorFn: async (response) => (await response.clone().json()).status === 'FAILED',
    // getErrorFn: async (response) => (await response.clone().json()).code
  })

  const accountDetailQuery = useMutation<ResponseAccountDetail>({
    url: '/v1/accountDetail',
    method: 'POST',
    body: JSON.stringify({selectedAccount}),
    // enabled: !!selectedAccount,
  })

  useEffect(() => {
    console.log(allAccountsQuery.data, !isAllAccountsErrorResponse(allAccountsQuery.data!))
    if(allAccountsQuery.data){
      setSelectedAccount(!isAllAccountsErrorResponse(allAccountsQuery.data) ? allAccountsQuery.data?.accounts[0].accountId : '')
      accountDetailQuery.execute()
    }
  }, [allAccountsQuery.data])

  useEffect(() => {
    console.log(selectedAccount)
  }, [selectedAccount])

  return (
    <div>
      {
        allAccountsQuery.status && <div>{allAccountsQuery.status}</div>
      }
      {
        allAccountsQuery.error && <div>{allAccountsQuery.error}</div>
      }
      {
        allAccountsQuery.data && <div>{JSON.stringify(allAccountsQuery.data)}</div>
      }
      {
        !allAccountsQuery.isLoading && <input type="text" value={text} onChange={e => setText(e.target.value)}/>
      }
      <br></br>
      {
        accountDetailQuery.status && <div>{accountDetailQuery.status}</div>
      }
      {
        accountDetailQuery.error && <div>{accountDetailQuery.error}</div>
      }
      {
        accountDetailQuery.data && <div>{JSON.stringify(accountDetailQuery.data)}</div>
      }
    </div>
  )
}

export default Home