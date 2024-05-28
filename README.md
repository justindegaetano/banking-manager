# MoneyMaven

## Introduction

Built with Next.js 14, MoneyMaven is a financial SaaS platform that connects to multiple bank accounts, displays transactions in real-time, allows users to transfer money to other platform users, and manages their finances altogether.
<br/>
<img src="/public/icons/auth-image.png" width='600' alt="Project Banner">
<br/>

## Tech Stack

- Next.js 14
- TypeScript
- Appwrite
- Plaid
- Dwolla
- React Hook Form
- Zod
- TailwindCSS
- Chart.js
- ShadCN

## Features

🗹 **Authentication**: Secure SSR authentication with proper validations and authorization

🗹 **Connect Banks**: Integrates with Plaid for multiple bank account linking

🗹 **Home Page**: Shows general overview of user account with total balance from all connected banks, recent transactions, money spent on different categories, etc

🗹 **My Banks**: Check the complete list of all connected banks with respective balances, account details

🗹 **Transaction History**: Includes pagination and filtering options for viewing transaction history of different banks

🗹 **Real-time Updates**: Reflects changes across all relevant pages upon connecting new bank accounts.

🗹 **Funds Transfer**: Allows users to transfer funds using Dwolla to other accounts with required fields and recipient bank ID.

🗹 **Responsiveness**: Ensures the application adapts seamlessly to various screen sizes and devices, providing a consistent user experience across desktop, tablet, and mobile platforms.

## How to Use

##### MoneyMaven uses a sandbox environment deployment of Plaid and Dwolla.

To access the application, either:

* <a href='https://banking-manager.vercel.app/sign-in'>Sign in</a> using a pre-generated test account linked with replica bank account details and activity using

```bash
test@email.com
```
```bash
12121212
```

... or <a href='https://banking-manager.vercel.app/sign-up'>sign up</a> and, when prompted to provide credentials once attempting to connect a bank, use the Dwolla sandbox credentials of:

```bash
user_good
```
```bash
pass_good
```