import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { LanguageType, translations } from "../constants/translations";

interface LanguageContextType {
    language: LanguageType;
    setLanguage: (lang: LanguageType) => Promise<void>;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<LanguageType>("en");

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem("app_language");
            if (savedLanguage) {
                setLanguageState(savedLanguage as LanguageType);
            }
        } catch (error) {
            console.error("Failed to load language", error);
        }
    };

    const setLanguage = async (lang: LanguageType) => {
        try {
            setLanguageState(lang);
            await AsyncStorage.setItem("app_language", lang);
        } catch (error) {
            console.error("Failed to save language", error);
        }
    };

    const t = (key: string) => {
        const translation = translations[language];
        return translation && translation[key] ? translation[key] : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
