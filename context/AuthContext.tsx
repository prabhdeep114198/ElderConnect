import { authService } from "@/services/api/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
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
  isSubscribed?: boolean;
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
  refreshSubscription: () => Promise<void>;
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
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const savedUser = await AsyncStorage.getItem("user_session");

      if (token && savedUser) {
        const parsedUser = JSON.parse(savedUser);

        // FIX 1: Guard against corrupted session missing the id field.
        // If id is missing the whole app breaks (undefined in all API URLs).
        // Clear the bad session and force re-login instead of silently failing.
        if (!parsedUser.id) {
          console.warn("[AuthContext] Cached user has no id — clearing session");
          await AsyncStorage.multiRemove(["auth_token", "user_session"]);
          setLoading(false);
          return;
        }

        // Restore onboarding status from dedicated key
        const onboardingStatus = await AsyncStorage.getItem(`user_onboarded_${parsedUser.id}`);
        if (onboardingStatus === "true") {
          parsedUser.isOnboarded = true;
        }

        setUser(parsedUser);

        // Optionally refresh profile from backend
        try {
          const response: any = await authService.getProfile();
          if (response && response.data) {
            const userData = response.data;

            // FIX 2: Always use the id from the cached session if backend
            // response doesn't include it, so user.id is never undefined.
            const resolvedId = userData.id || parsedUser.id;

            // FIX 3: Build name safely — handle both {name} and {firstName, lastName}
            // formats from different backend response shapes.
            const resolvedName = userData.name
              || `${userData.firstName ?? ''} ${userData.lastName ?? ''}`.trim()
              || parsedUser.name
              || '';

            const updatedUser: User = {
              id:           resolvedId,
              name:         resolvedName,
              email:        userData.email || parsedUser.email,
              isOnboarded:  parsedUser.isOnboarded || false,
              plan_level:   userData.plan_level || parsedUser.plan_level,
              isSubscribed: userData.isSubscribed || false,
            };

            setUser(updatedUser);
            await AsyncStorage.setItem("user_session", JSON.stringify(updatedUser));
          }
        } catch (e) {
          console.log("Failed to refresh profile, using cached data", e);
          // Keep using parsedUser that was already set above — that's fine
        }
      }
    } catch (error) {
      console.error("Session check failed", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response: any = await authService.login({ email, password });

      if (response && response.data && response.data.token && response.data.user) {
        const { user: apiUser, token } = response.data;

        // FIX 2 (also here): Build name safely from whatever the backend returns
        const resolvedName = apiUser.name
          || `${apiUser.firstName ?? ''} ${apiUser.lastName ?? ''}`.trim()
          || '';

        const newUser: User = {
          id:           apiUser.id,        // this must come from backend
          name:         resolvedName,
          email:        apiUser.email,
          isOnboarded:  false,
          isSubscribed: apiUser.isSubscribed || false,
          plan_level:   apiUser.plan_level || "free",
        };

        // Check onboarding status
        const profileKey = `user_onboarded_${apiUser.id}`;
        const existingProfile = await AsyncStorage.getItem(profileKey);
        if (existingProfile) {
          newUser.isOnboarded = true;
        }

        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("user_session", JSON.stringify(newUser));
        setUser(newUser);
      } else {
        throw new Error("Invalid response structure from server");
      }
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
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const response: any = await authService.register({
        email,
        password,
        firstName,
        lastName,
      });

      if (response && response.data && response.data.token && response.data.user) {
        const { user: apiUser, token } = response.data;

        const resolvedName = apiUser.name
          || `${apiUser.firstName ?? ''} ${apiUser.lastName ?? ''}`.trim()
          || name;

        const newUser: User = {
          id:           apiUser.id,
          name:         resolvedName,
          email:        apiUser.email,
          isOnboarded:  false,
          isSubscribed: apiUser.isSubscribed || false,
          plan_level:   apiUser.plan_level || "free",
        };

        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("user_session", JSON.stringify(newUser));
        setUser(newUser);
      } else {
        throw new Error("Invalid response from server. Check logs for details.");
      }
    } catch (error: any) {
      console.error("Signup failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    Alert.alert("Google Login", "Google login is currently disabled as we moved away from Firebase.");
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.log("Logout API call failed, clearing local session anyway", error);
    } finally {
      await AsyncStorage.removeItem("user_session");
      await AsyncStorage.removeItem("auth_token");
      setUser(null);
      router.replace("/auth/login");
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
      await authService.changePassword({ oldPassword, newPassword });
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
        refreshSubscription: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};