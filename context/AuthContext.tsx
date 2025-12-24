import { account } from "@/appwriteConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ID, Models } from "appwrite";
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

// =====================
// Types
// =====================
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnboarded?: boolean;
  plan_level?: "free" | "premium" | "enterprise";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  updatePassword: (newPassword: string, oldPassword?: string) => Promise<void>;
  requireAuth: (action: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    console.log("Checking session...");
    try {
      const sessionUser = await account.get();
      if (sessionUser) {
        console.log("Session found for user:", sessionUser.email);
        await handleUserAuthenticated(sessionUser);
      } else {
        console.log("No session user returned from account.get()");
        setUser(null);
      }
    } catch (error: any) {
      console.log("No active session found or error during checkSession:", error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAuthenticated = async (appwriteUser: Models.User<Models.Preferences>) => {
    console.log("Handling authenticated user:", appwriteUser.$id);
    const newUser: User = {
      id: appwriteUser.$id,
      name: appwriteUser.name,
      email: appwriteUser.email,
      isOnboarded: false,
    };

    // Check onboarding status from AsyncStorage or a database
    const profileKey = `user_onboarded_${appwriteUser.$id}`;
    const existingProfile = await AsyncStorage.getItem(profileKey);
    console.log("Onboarding status check for", appwriteUser.$id, ":", existingProfile);

    if (existingProfile) {
      newUser.isOnboarded = true;
    }

    console.log("Setting user state with onboarding:", newUser.isOnboarded);
    setUser(newUser);
    await AsyncStorage.setItem("user_session", JSON.stringify(newUser));
  };

  // =====================
  // Appwrite Authentication
  // =====================

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      const sessionUser = await account.get();
      await handleUserAuthenticated(sessionUser);
    } catch (error: any) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await account.create(ID.unique(), email, password, name);
      await login(email, password);
    } catch (error: any) {
      console.error("Signup failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const redirectUri = Linking.createURL("/");
      const endpoint = process.env.EXPO_PUBLIC_APPWRITE_URL;
      const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

      console.log("Starting Google Login with redirect:", redirectUri);

      // Construct OAuth URL manually to bypass SDK's internal location.href attempt
      const authUrl = `${endpoint}/account/sessions/oauth2/google?project=${projectId}&success=${encodeURIComponent(redirectUri)}&failure=${encodeURIComponent(redirectUri)}`;

      const browserResult = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      console.log("Browser Result Type:", browserResult.type);
      if (browserResult.type === 'success' && browserResult.url) {
        console.log("Google Login callback URL received:", browserResult.url);

        // Robust parameter extraction for custom schemes
        const getParam = (url: string, param: string) => {
          const match = url.match(new RegExp('[?&]' + param + '=([^&]+)'));
          return match ? match[1] : null;
        };

        const secret = getParam(browserResult.url, 'secret');
        const userId = getParam(browserResult.url, 'userId');

        if (secret && userId) {
          console.log("Secret and UserId found, creating session for:", userId);
          try {
            await account.createSession(userId, secret);
            console.log("Session created manually successfully");
          } catch (sessionError: any) {
            console.error("Failed to create session from secret:", sessionError.message);
          }
        } else {
          console.log("No secret/userId found in callback URL. Query string present?", browserResult.url.includes('?'));
        }

        await checkSession();
      } else {
        console.log("Google Login was cancelled or failed in browser");
      }
    } catch (error: any) {
      console.error("Google login failed", error);
      Alert.alert("Login Failed", error.message || "Could not sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      await AsyncStorage.removeItem("user_session");
      setUser(null);
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    const updatedUser = { ...user, isOnboarded: true };
    setUser(updatedUser);
    await AsyncStorage.setItem(`user_onboarded_${user.id}`, "true");
    await AsyncStorage.setItem("user_session", JSON.stringify(updatedUser));
  };

  const updateProfile = async (name: string) => {
    try {
      await account.updateName(name);
      if (user) {
        const updatedUser = { ...user, name };
        setUser(updatedUser);
        await AsyncStorage.setItem("user_session", JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      console.error("Update profile failed", error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string, oldPassword?: string) => {
    try {
      await account.updatePassword(newPassword, oldPassword);
    } catch (error: any) {
      console.error("Update password failed", error);
      throw error;
    }
  };

  const requireAuth = (action: () => void) => {
    if (user) {
      action();
    } else {
      Alert.alert(
        "Sign In Required",
        "You need to be signed in to access this feature.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/auth/login") },
        ]
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        completeOnboarding,
        updateProfile,
        updatePassword,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
