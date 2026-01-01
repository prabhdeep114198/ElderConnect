import bn from '../assets/locales/bn.json';
import de from '../assets/locales/de.json';
import en from '../assets/locales/en.json';
import es from '../assets/locales/es.json';
import fr from '../assets/locales/fr.json';
import hi from '../assets/locales/hi.json';
import mr from '../assets/locales/mr.json';
import pa from '../assets/locales/pa.json';
import ta from '../assets/locales/ta.json';
import te from '../assets/locales/te.json';

export type LanguageType = "en" | "hi" | "pa" | "es" | "fr" | "de" | "bn" | "ta" | "te" | "mr";

export const translations: Record<string, any> = {
    en: en.translation,
    hi: hi.translation,
    pa: pa.translation,
    es: es.translation,
    fr: fr.translation,
    de: de.translation,
    bn: bn.translation,
    ta: ta.translation,
    te: te.translation,
    mr: mr.translation,
};
