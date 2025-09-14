// appwriteConfig.ts
import { Account, Client } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://cloud.appwrite.io/v1") // your Appwrite endpoint
  .setProject("68c71029003afb856d1e"); // replace with your project ID

export const account = new Account(client);
export { client };
