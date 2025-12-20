import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { DarkColors, LightColors } from "../constants/colors";

type ThemeType = "light" | "dark";

interface ThemeContextType {
    theme: ThemeType;
    colors: typeof LightColors;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    colors: LightColors,
    toggleTheme: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeType>("light");

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem("theme");
                if (storedTheme === "dark") {
                    setTheme("dark");
                }
            } catch (error) {
                console.error("Failed to load theme", error);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        try {
            await AsyncStorage.setItem("theme", newTheme);
        } catch (error) {
            console.error("Failed to save theme", error);
        }
    };

    const colors = theme === "light" ? LightColors : DarkColors;

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
