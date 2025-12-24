// appwriteConfig.ts
import { Account, Client } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_URL!) // your Appwrite endpoint
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!); // replace with your project ID

export const account = new Account(client);
export { client };
