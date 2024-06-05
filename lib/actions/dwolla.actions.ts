"use server";

import { Client } from "dwolla-v2";

/**
 * Retrieves the environment for the Dwolla client.
 * @returns {"production" | "sandbox"} The environment of the Dwolla client.
 */
const getEnvironment = (): "production" | "sandbox" => {
  const environment = process.env.DWOLLA_ENV as string;

  switch (environment) {
    case "sandbox":
      return "sandbox";
    case "production":
      return "production";
    default:
      throw new Error(
        "Dwolla environment should either be set to `sandbox` or `production`"
      );
  }
};

const dwollaClient = new Client({
  environment: getEnvironment(),
  key: process.env.DWOLLA_KEY as string,
  secret: process.env.DWOLLA_SECRET as string,
});

/**
 * Creates a funding source for a Dwolla customer using Plaid Processor Token.
 * @async
 * @param {CreateFundingSourceOptions} options - The options for creating a funding source.
 * @param {string} options.customerId - The ID of the customer.
 * @param {string} options.fundingSourceName - The name of the funding source.
 * @param {string} options.plaidToken - The Plaid processor token.
 * @returns {Promise<string>} The location of the created funding source.
 */
export const createFundingSource = async (
  options: CreateFundingSourceOptions
) => {
  try {
    return await dwollaClient
      .post(`customers/${options.customerId}/funding-sources`, {
        name: options.fundingSourceName,
        plaidToken: options.plaidToken,
      })
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Creating a Funding Source Failed: ", err);
  }
};

/**
 * Creates an On-Demand Authorization.
 * @async
 * @returns {Promise<Object>} The On-Demand Authorization link.
 */
export const createOnDemandAuthorization = async () => {
  try {
    const onDemandAuthorization = await dwollaClient.post(
      "on-demand-authorizations"
    );
    const authLink = onDemandAuthorization.body._links;
    return authLink;
  } catch (err) {
    console.error("Creating an On Demand Authorization Failed: ", err);
  }
};

/**
 * Creates a Dwolla customer.
 * @async
 * @param {NewDwollaCustomerParams} newCustomer - The parameters for creating a new Dwolla customer.
 * @returns {Promise<string>} The location of the created Dwolla customer.
 */
export const createDwollaCustomer = async (
  newCustomer: NewDwollaCustomerParams
) => {
  try {
    return await dwollaClient
      .post("customers", newCustomer)
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Creating a Dwolla Customer Failed: ", err);
  }
};

/**
 * Creates a transfer between funding sources.
 * @async
 * @param {TransferParams} params - The parameters for creating the transfer.
 * @param {string} params.sourceFundingSourceUrl - The URL of the source funding source.
 * @param {string} params.destinationFundingSourceUrl - The URL of the destination funding source.
 * @param {number} params.amount - The amount to transfer.
 * @returns {Promise<string>} The location of the created transfer.
 */
export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
}: TransferParams) => {
  try {
    const requestBody = {
      _links: {
        source: {
          href: sourceFundingSourceUrl,
        },
        destination: {
          href: destinationFundingSourceUrl,
        },
      },
      amount: {
        currency: "USD",
        value: amount,
      },
    };
    return await dwollaClient
      .post("transfers", requestBody)
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Transfer fund failed: ", err);
  }
};

/**
 * Adds a funding source to a Dwolla customer.
 * @async
 * @param {AddFundingSourceParams} params - The parameters for adding a funding source.
 * @param {string} params.dwollaCustomerId - The ID of the Dwolla customer.
 * @param {string} params.processorToken - The processor token.
 * @param {string} params.bankName - The name of the bank.
 * @returns {Promise<string>} The URL of the added funding source.
 */
export const addFundingSource = async ({
  dwollaCustomerId,
  processorToken,
  bankName,
}: AddFundingSourceParams) => {
  try {
    // create dwolla auth link
    const dwollaAuthLinks = await createOnDemandAuthorization();

    // add funding source to the dwolla customer & get the funding source url
    const fundingSourceOptions = {
      customerId: dwollaCustomerId,
      fundingSourceName: bankName,
      plaidToken: processorToken,
      _links: dwollaAuthLinks,
    };
    return await createFundingSource(fundingSourceOptions);
  } catch (err) {
    console.error("Transfer fund failed: ", err);
  }
};