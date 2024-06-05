'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from "@/lib/plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const { 
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

/**
 * Retrieves user information from the database.
 * @async
 * @param {Object} getUserInfoProps - The properties object.
 * @param {string} getUserInfoProps.userId - The ID of the user to retrieve.
 * @returns {Promise<Object>} The user information.
 */
export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    const { database } = await createAdminClient();

    const user = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    );

    return parseStringify(user.documents[0]);
  } catch (error) {
    console.log(error);
  }
};

/**
 * Signs in a user using email and password.
 * @async
 * @param {Object} signInProps - The properties object.
 * @param {string} signInProps.email - The email of the user.
 * @param {string} signInProps.password - The password of the user.
 * @returns {Promise<Object>} The user information.
 */
export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account } = await createAdminClient();

    const session = await account.createEmailPasswordSession(email, password);

    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    const user = await getUserInfo({ userId: session.userId })

    return parseStringify(user);
  } catch (error) {
    console.error('Error', error);
  }
}

/**
 * Signs up a new user.
 * @async
 * @param {Object} SignUpParams - The properties object.
 * @param {string} SignUpParams.password - The password for the new user.
 * @param {Object} userData - Additional user data.
 * @returns {Promise<Object>} The new user information.
 */
export const signUp = async ({password, ...userData}: SignUpParams) => {
  const { email, firstName, lastName } = userData;

  let newUserAccount;
  
  try {
    const { account, database } = await createAdminClient();

    newUserAccount = await account.create(
      ID.unique(), 
      email, 
      password, 
      `${firstName} ${lastName}`
    );

    if(!newUserAccount) throw new Error('Error creating user')

    const dwollaCustomerUrl = await createDwollaCustomer({
      ...userData,
      type: 'personal'
    })

    if (!dwollaCustomerUrl) throw new Error('Error creating Dwolla customer')

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);
    
    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrl,
      }

    );

    const session = await account.createEmailPasswordSession(email, password);

    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(newUser);
  } catch (error) {
    console.error('Error', error);
  }
}

/**
 * Retrieves information of the logged-in user.
 * @async
 * @returns {Promise<Object|null>} The logged-in user information or null if an error occurs.
 */
export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();

    const user = await getUserInfo({ userId: result.$id})

    return parseStringify(user);
  } catch (error) {
    console.log(error)
    return null;
  }
}

/**
 * Logs out the current user.
 * @async
 * @returns {Promise<null>} Always returns null.
 */
export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();

    cookies().delete("appwrite-session");

    await account.deleteSession('current');
  } catch (error) {
    return null;
  }
}

/**
 * Creates a Plaid link token for the user.
 * @async
 * @param {Object} user - The user object.
 * @returns {Promise<Object>} The link token.
 */
export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ['auth'] as Products[],
      language: 'en',
      country_codes: ['US'] as CountryCode[],
    }

    const response = await plaidClient.linkTokenCreate(tokenParams);

    return parseStringify({linkToken: response.data.link_token })
  } catch (error) {
    console.log(error);
  }
}

/**
 * Creates a bank account in the database.
 * @async
 * @param {Object} createBankAccountProps - The properties object.
 * @param {string} createBankAccountProps.userId - The ID of the user.
 * @param {string} createBankAccountProps.bankId - The ID of the bank.
 * @param {string} createBankAccountProps.accountId - The ID of the account.
 * @param {string} createBankAccountProps.accessToken - The access token.
 * @param {string} createBankAccountProps.fundingSourceUrl - The URL of the funding source.
 * @param {string} createBankAccountProps.shareableId - The shareable ID.
 * @returns {Promise<Object>} The created bank account.
 */
export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
      }
    )

    return parseStringify(bankAccount);
  } catch (error) {
    
  }
}

/**
 * Exchanges a public token for an access token and item ID, then creates a bank account.
 * @async
 * @param {Object} exchangePublicTokenProps - The properties object.
 * @param {string} exchangePublicTokenProps.publicToken - The public token to exchange.
 * @param {Object} exchangePublicTokenProps.user - The user object.
 * @returns {Promise<Object>} A success message or an error.
 */
export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    // Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Get account information from Plaid using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    // Create a processor token for Dwolla using the access token and account ID
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    };

    const processorTokenResponse =
      await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

    // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });

    // If the funding source URL is not created, throw an error
    if (!fundingSourceUrl) throw Error;

    // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and shareable ID
    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });

    // Revalidate the path to reflect the changes
    revalidatePath("/");

    // Return a success message
    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error) {
    // Log any errors that occur during the process
    console.error("An error occurred while creating exchanging token:", error);
  }
};

/**
 * Retrieves banks associated with a user.
 * @async
 * @param {Object} getBanksProps - The properties object.
 * @param {string} getBanksProps.userId - The ID of the user.
 * @returns {Promise<Object>} The banks associated with the user.
 */
export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();

    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    );

    return parseStringify(banks.documents);
  } catch (error) {
    console.log(error);
  }
};

/**
 * Retrieves a bank by its document ID.
 * @async
 * @param {Object} getBankProps - The properties object.
 * @param {string} getBankProps.documentId - The ID of the bank document.
 * @returns {Promise<Object>} The bank document.
 */
export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('$id', [documentId])]
    );

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error);
  }
};

/**
 * Retrieves a bank by its account ID.
 * @async
 * @param {Object} getBankByAccountIdProps - The properties object.
 * @param {string} getBankByAccountIdProps.accountId - The ID of the bank account.
 * @returns {Promise<Object|null>} The bank document or null if not found.
 */
export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('accountId', [accountId])]
    );

    if (bank.total !== 1) return null;

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error);
  }
};