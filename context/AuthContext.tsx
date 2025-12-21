import { account } from "@/appwriteConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ID, Models, OAuthProvider } from "appwrite";
import { useRouter } from "expo-router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

// =====================
// Types
// =====================
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnboarded?: boolean;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// =====================
// AuthProvider
// =====================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // =====================
  // Load user session on startup
  // =====================
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionUser = await account.get();
      if (sessionUser) {
        await handleUserAuthenticated(sessionUser);
      }
    } catch (error) {
      // No active session
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAuthenticated = async (appwriteUser: Models.User<Models.Preferences>) => {
    const newUser: User = {
      id: appwriteUser.$id,
      name: appwriteUser.name,
      email: appwriteUser.email,
      isOnboarded: false,
    };

    // Check onboarding status from AsyncStorage or a database
    const existingProfile = await AsyncStorage.getItem(`user_onboarded_${appwriteUser.$id}`);
    if (existingProfile) {
      newUser.isOnboarded = true;
    }

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
    try {
      // In Appwrite React Native/Expo, createOAuth2Session will handle the redirection
      // You may need to configure deep linking in your app.json
      await account.createOAuth2Session(OAuthProvider.Google);
    } catch (error) {
      console.error("Google login failed", error);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
