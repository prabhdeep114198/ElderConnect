// appwriteConfig.ts
import { Account, Client } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!) // your Appwrite endpoint
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_NAME!); // replace with your project ID

export const account = new Account(client);
export { client };
