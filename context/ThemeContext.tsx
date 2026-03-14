import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { DarkColors, LightColors } from "../constants/colors";

export type ThemeType = "light" | "dark";
export type UIMode = "senior" | "caregiver";
export type FontSizeScale = "small" | "medium" | "large" | "extraLarge";

interface ThemeContextType {
    theme: ThemeType;
    uiMode: UIMode;
    fontSize: FontSizeScale;
    accentColor: string;
    colors: typeof LightColors;
    toggleTheme: () => void;
    setUIMode: (mode: UIMode) => void;
    setFontSize: (scale: FontSizeScale) => void;
    setAccentColor: (color: string) => void;
    ecoMode: boolean;
    presentationMode: boolean;
    setEcoMode: (val: boolean) => void;
    setPresentationMode: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    uiMode: "senior",
    fontSize: "medium",
    accentColor: LightColors.primary,
    colors: LightColors,
    toggleTheme: () => { },
    setUIMode: () => { },
    setFontSize: () => { },
    setAccentColor: () => { },
    ecoMode: false,
    presentationMode: false,
    setEcoMode: () => { },
    setPresentationMode: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeType>("light");
    const [uiMode, setUIModeState] = useState<UIMode>("senior");
    const [fontSize, setFontSizeState] = useState<FontSizeScale>("medium");
    const [accentColor, setAccentColorState] = useState<string>(LightColors.primary);
    const [ecoMode, setEcoModeState] = useState<boolean>(false);
    const [presentationMode, setPresentationModeState] = useState<boolean>(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [storedTheme, storedMode, storedSize, storedAccent, storedEcoMode, storedPresentationMode] = await Promise.all([
                    AsyncStorage.getItem("theme"),
                    AsyncStorage.getItem("uiMode"),
                    AsyncStorage.getItem("fontSize"),
                    AsyncStorage.getItem("accentColor"),
                    AsyncStorage.getItem("ecoMode"),
                    AsyncStorage.getItem("presentationMode"),
                ]);

                if (storedTheme === "dark") setTheme("dark");
                if (storedMode) setUIModeState(storedMode as UIMode);
                if (storedSize) setFontSizeState(storedSize as FontSizeScale);
                if (storedAccent) setAccentColorState(storedAccent);
                if (storedEcoMode === "true") setEcoModeState(true);
                if (storedPresentationMode === "true") setPresentationModeState(true);
            } catch (error) {
                console.error("Failed to load theme settings", error);
            }
        };
        loadSettings();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        await AsyncStorage.setItem("theme", newTheme);
    };

    const setUIMode = async (mode: UIMode) => {
        setUIModeState(mode);
        await AsyncStorage.setItem("uiMode", mode);
    };

    const setFontSize = async (scale: FontSizeScale) => {
        setFontSizeState(scale);
        await AsyncStorage.setItem("fontSize", scale);
    };

    const setAccentColor = async (color: string) => {
        setAccentColorState(color);
        await AsyncStorage.setItem("accentColor", color);
    };

    const setEcoMode = async (val: boolean) => {
        setEcoModeState(val);
        await AsyncStorage.setItem("ecoMode", String(val));
    };

    const setPresentationMode = async (val: boolean) => {
        setPresentationModeState(val);
        await AsyncStorage.setItem("presentationMode", String(val));
    };

    const baseColors = theme === "light" ? LightColors : DarkColors;
    const colors = {
        ...baseColors,
        primary: accentColor,
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            uiMode,
            fontSize,
            accentColor,
            colors,
            toggleTheme,
            setUIMode,
            setFontSize,
            setAccentColor,
            ecoMode,
            presentationMode,
            setEcoMode,
            setPresentationMode
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
