import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "@/components/ui/RightSidebar";
import TotalBalanceBox from "@/components/ui/TotalBalanceBox";

const Home = () => {
  const loggedIn = { firstName: 'Justin', lastName: 'DeGaetano', email: 'justin@email.com' };

  return (
    <section className='home'>
      <div className='home-content'>
        <header className='home-header'>
          <HeaderBox 
            type='greeting'
            title='Welcome'
            user={loggedIn?.firstName || 'guest'}
            subtext='Access and manage your accounts and transactions efficiently.'
          />

          <TotalBalanceBox 
            accounts={[]}
            totalBanks={1}
            totalCurrentBalance={300.69}
          />
        </header>

        RECENT TRANSACTIONS
      </div>

      <RightSidebar 
        user={loggedIn}
        transactions={[]}
        banks={[{ currentBalance: 1400.30 }, { currentBalance: 1800 }]}
      />
    </section>
  )
}

export default Home