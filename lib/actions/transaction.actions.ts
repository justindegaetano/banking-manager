'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";

const { 
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_TRANSACTION_COLLECTION_ID: TRANSACTION_COLLECTION_ID,
  } = process.env;

/**
 * Creates a transaction and stores it in the database.
 * @async
 * @param {Object} transaction - The transaction object.
 * @param {string} transaction.senderBankId - The ID of the sender bank.
 * @param {string} transaction.receiverBankId - The ID of the receiver bank.
 * @param {number} transaction.amount - The amount of the transaction.
 * @param {string} transaction.currency - The currency of the transaction.
 * @returns {Promise<Object>} The created transaction.
 */
export const createTransaction = async (transaction: CreateTransactionProps) => {
  try {
    const { database } = await createAdminClient();

    const newTransaction = await database.createDocument(
      DATABASE_ID!,
      TRANSACTION_COLLECTION_ID!,
      ID.unique(),
      {
        channel: 'Online',
        category: 'Transfer',
        ...transaction
      }
    )

    return parseStringify(newTransaction);
  } catch (error) {
    console.log(error)
  }
};

/**
 * Retrieves transactions associated with a specific bank ID.
 * @async
 * @param {Object} getTransactionsByBankIdProps - The properties object.
 * @param {string} getTransactionsByBankIdProps.bankId - The ID of the bank.
 * @returns {Promise<Object>} The transactions associated with the bank ID.
 */
export const getTransactionsByBankId = async ({ bankId }: getTransactionsByBankIdProps) => {
    try {
      const { database } = await createAdminClient();
  
      const senderTransactions = await database.listDocuments(
        DATABASE_ID!,
        TRANSACTION_COLLECTION_ID!,
        [Query.equal('senderBankId', bankId)]
      );
      const receiverTransactions = await database.listDocuments(
        DATABASE_ID!,
        TRANSACTION_COLLECTION_ID!,
        [Query.equal('receiverBankId', bankId)]
      );

      const transactions = {
        total: senderTransactions.total + receiverTransactions.total,
        documents: [
            ...senderTransactions.documents, 
            ...receiverTransactions.documents
        ]
      };
  
      return parseStringify(transactions);
    } catch (error) {
      console.log(error)
    }
  };