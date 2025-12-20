import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const INTERESTS = ["Gardening", "Reading", "Music", "Walking", "Technology", "Cooking", "Art", "Photography", "Knitting", "Traveling", "Sports", "Puzzles", "Bird Watching"];
const CONDITIONS = ["Diabetes", "Hypertension", "Mobility Issues", "Vision Impairment", "Hearing Impairment", "Arthritis", "Heart Disease", "Asthma", "Memory Issues", "None"];
const MEDICATIONS = ["Daily", "Multiple Times Daily", "Weekly", "As Needed", "None"];
const MOBILITY_LEVELS = ["Independent", "Uses Cane", "Uses Walker", "Uses Wheelchair", "Requires Assistance"];
const LIVING_SITUATIONS = ["Live Alone", "With Spouse/Partner", "With Family", "Assisted Living", "Nursing Home"];
const TECH_COMFORT = ["Not Comfortable", "Somewhat Comfortable", "Comfortable", "Very Comfortable"];
const EMERGENCY_CONTACTS = ["Yes, I have them ready", "I'll add them later"];
const DIETARY_PREFERENCES = ["No Restrictions", "Vegetarian", "Vegan", "Diabetic-Friendly", "Low Sodium", "Gluten Free", "Lactose Intolerant"];
const ACTIVITY_LEVELS = ["Sedentary", "Light Activity", "Moderate Activity", "Very Active"];
const SOCIAL_PREFERENCES = ["Prefer Alone Time", "Small Groups", "Large Gatherings", "One-on-One"];
const MEMORY_SUPPORT = ["No Issues", "Occasional Forgetfulness", "Need Regular Reminders", "Need Significant Support"];

export default function OnboardingScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const { completeOnboarding, user } = useAuth();

    // Page navigation state
    const [currentPage, setCurrentPage] = useState(0);
    const totalPages = 5;

    // Basic Information
    const [name, setName] = useState(user?.name || "");
    const [age, setAge] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [gender, setGender] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");

    // Health Information
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    const [medicationFrequency, setMedicationFrequency] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [doctorPhone, setDoctorPhone] = useState("");
    const [selectedAllergies, setSelectedAllergies] = useState("");
    const [selectedMobility, setSelectedMobility] = useState("");
    const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

    // Lifestyle & Preferences
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [selectedActivityLevel, setSelectedActivityLevel] = useState("");
    const [selectedSocialPref, setSelectedSocialPref] = useState("");
    const [livingArrangement, setLivingArrangement] = useState("");
    const [selectedMemorySupport, setSelectedMemorySupport] = useState("");

    // Technology & Communication
    const [techComfort, setTechComfort] = useState("");
    const [preferredContact, setPreferredContact] = useState("");
    const [languagePreference, setLanguagePreference] = useState("");

    // Emergency Contacts
    const [emergencyName1, setEmergencyName1] = useState("");
    const [emergencyPhone1, setEmergencyPhone1] = useState("");
    const [emergencyRelation1, setEmergencyRelation1] = useState("");
    const [emergencyName2, setEmergencyName2] = useState("");
    const [emergencyPhone2, setEmergencyPhone2] = useState("");
    const [emergencyRelation2, setEmergencyRelation2] = useState("");

    // Daily Routine & Goals
    const [wakeUpTime, setWakeUpTime] = useState("");
    const [bedTime, setBedTime] = useState("");
    const [goals, setGoals] = useState("");
    const [concerns, setConcerns] = useState("");

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter((i) => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleBack = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleFinish = async () => {
        const profileData = {
            // Basic Info
            name,
            age,
            birthDate,
            gender,
            phone,
            address,
            city,

            // Health
            conditions: selectedConditions,
            medicationFrequency,
            doctorName,
            doctorPhone,
            allergies: selectedAllergies,
            mobilityLevel: selectedMobility,
            dietaryPreferences: selectedDietary,

            // Lifestyle
            interests: selectedInterests,
            activityLevel: selectedActivityLevel,
            socialPreference: selectedSocialPref,
            livingArrangement,
            memorySupport: selectedMemorySupport,

            // Technology
            techComfort,
            preferredContact,
            languagePreference,

            // Emergency
            emergencyContacts: [
                { name: emergencyName1, phone: emergencyPhone1, relation: emergencyRelation1 },
                { name: emergencyName2, phone: emergencyPhone2, relation: emergencyRelation2 }
            ],

            // Routine
            wakeUpTime,
            bedTime,
            goals,
            concerns,

            onboardingCompleted: true,
        };

        try {
            await AsyncStorage.setItem("user_profile_data", JSON.stringify(profileData));
            await completeOnboarding();
            router.replace("/(tabs)/home");
        } catch (error) {
            console.error("Failed to save profile", error);
        }
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            {Array.from({ length: totalPages }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.progressDot,
                        {
                            backgroundColor: index === currentPage ? colors.primary : colors.border,
                            width: index === currentPage ? 24 : 8,
                        }
                    ]}
                />
            ))}
        </View>
    );

    const renderPage = () => {
        switch (currentPage) {
            case 0:
                return (
                    <>
                        <Text style={[styles.heading, { color: colors.primary }]}>Welcome, {user?.name?.split(" ")[0]}!</Text>
                        <Text style={[styles.subheading, { color: colors.mutedText }]}>
                            Let's gather some information to personalize your experience and keep you safe.
                        </Text>

                        <View style={[styles.section, { backgroundColor: colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

                            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. John Doe"
                                placeholderTextColor={colors.mutedText}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Date of Birth</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={birthDate}
                                onChangeText={setBirthDate}
                                placeholder="MM/DD/YYYY"
                                placeholderTextColor={colors.mutedText}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Age</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={age}
                                onChangeText={setAge}
                                placeholder="e.g. 72"
                                placeholderTextColor={colors.mutedText}
                                keyboardType="number-pad"
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Gender</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={gender}
                                onChangeText={setGender}
                                placeholder="e.g. Male, Female, Other"
                                placeholderTextColor={colors.mutedText}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="e.g. (555) 123-4567"
                                placeholderTextColor={colors.mutedText}
                                keyboardType="phone-pad"
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Address</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Street address"
                                placeholderTextColor={colors.mutedText}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>City</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={city}
                                onChangeText={setCity}
                                placeholder="Your city"
                                placeholderTextColor={colors.mutedText}
                            />
                        </View>
                    </>
                );

            case 1:
                return (
                    <>
                        <Text style={[styles.heading, { color: colors.primary }]}>Health Profile</Text>
                        <Text style={[styles.subheading, { color: colors.mutedText }]}>
                            This helps us provide better care reminders and health tracking.
                        </Text>

                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Conditions</Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>Select all that apply</Text>
                        </View>
                        <View style={styles.chipContainer}>
                            {CONDITIONS.map((cond) => (
                                <TouchableOpacity
                                    key={cond}
                                    style={[
                                        styles.chip,
                                        selectedConditions.includes(cond)
                                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                            : { backgroundColor: colors.background, borderColor: colors.border }
                                    ]}
                                    onPress={() => toggleSelection(cond, selectedConditions, setSelectedConditions)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        selectedConditions.includes(cond) ? { color: colors.buttonText } : { color: colors.text }
                                    ]}>{cond}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={[styles.section, { backgroundColor: colors.card, marginTop: 24 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Medication Frequency</Text>
                            <View style={styles.chipContainer}>
                                {MEDICATIONS.map((med) => (
                                    <TouchableOpacity
                                        key={med}
                                        style={[
                                            styles.chip,
                                            medicationFrequency === med
                                                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                                : { backgroundColor: colors.background, borderColor: colors.border }
                                        ]}
                                        onPress={() => setMedicationFrequency(med)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            medicationFrequency === med ? { color: colors.buttonText } : { color: colors.text }
                                        ]}>{med}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Primary Doctor's Name</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={doctorName}
                                onChangeText={setDoctorName}
                                placeholder="Dr. Smith"
                                placeholderTextColor={colors.mutedText}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Doctor's Phone</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={doctorPhone}
                                onChangeText={setDoctorPhone}
                                placeholder="(555) 123-4567"
                                placeholderTextColor={colors.mutedText}
                                keyboardType="phone-pad"
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Allergies</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={selectedAllergies}
                                onChangeText={setSelectedAllergies}
                                placeholder="e.g. Penicillin, Peanuts"
                                placeholderTextColor={colors.mutedText}
                                multiline
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Mobility Level</Text>
                            <View style={styles.chipContainer}>
                                {MOBILITY_LEVELS.map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.chip,
                                            selectedMobility === level
                                                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                                : { backgroundColor: colors.background, borderColor: colors.border }
                                        ]}
                                        onPress={() => setSelectedMobility(level)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedMobility === level ? { color: colors.buttonText } : { color: colors.text }
                                        ]}>{level}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Dietary Preferences</Text>
                            <View style={styles.chipContainer}>
                                {DIETARY_PREFERENCES.map((diet) => (
                                    <TouchableOpacity
                                        key={diet}
                                        style={[
                                            styles.chip,
                                            selectedDietary.includes(diet)
                                                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                                : { backgroundColor: colors.background, borderColor: colors.border }
                                        ]}
                                        onPress={() => toggleSelection(diet, selectedDietary, setSelectedDietary)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedDietary.includes(diet) ? { color: colors.buttonText } : { color: colors.text }
                                        ]}>{diet}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                );

            case 2:
                return (
                    <>
                        <Text style={[styles.heading, { color: colors.primary }]}>Lifestyle & Preferences</Text>
                        <Text style={[styles.subheading, { color: colors.mutedText }]}>
                            Help us understand your daily life and interests.
                        </Text>

                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests & Hobbies</Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>What do you enjoy?</Text>
                        </View>
                        <View style={styles.chipContainer}>
                            {INTERESTS.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.chip,
                                        selectedInterests.includes(item)
                                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                            : { backgroundColor: colors.background, borderColor: colors.border }
                                    ]}
                                    onPress={() => toggleSelection(item, selectedInterests, setSelectedInterests)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        selectedInterests.includes(item) ? { color: colors.buttonText } : { color: colors.text }
                                    ]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={[styles.section, { backgroundColor: colors.card, marginTop: 24 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Activity Level</Text>
                            <View style={styles.chipContainer}>
                                {ACTIVITY_LEVELS.map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.chip,
                                            selectedActivityLevel === level
                                                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                                : { backgroundColor: colors.background, borderColor: colors.border }
                                        ]}
                                        onPress={() => setSelectedActivityLevel(level)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedActivityLevel === level ? { color: colors.buttonText } : { color: colors.text }
                                        ]}>{level}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Social Preference</Text>
                            <View style={styles.chipContainer}>
                                {SOCIAL_PREFERENCES.map((pref) => (
                                    <TouchableOpacity
                                        key={pref}
                                        style={[
                                            styles.chip,
                                            selectedSocialPref === pref
                                                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                                : { backgroundColor: colors.background, borderColor: colors.border }
                                        ]}
                                        onPress={() => setSelectedSocialPref(pref)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedSocialPref === pref ? { color: colors.buttonText } : { color: colors.text }
                                        ]}>{pref}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Living Arrangement</Text>
                            <View style={styles.chipContainer}>
                                {LIVING_SITUATIONS.map((living) => (
                                    <TouchableOpacity
                                        key={living}
                                        style={[
                                            styles.chip,
                                            livingArrangement === living
                                                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                                : { backgroundColor: colors.background, borderColor: colors.border }
                                        ]}
                                        onPress={() => setLivingArrangement(living)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            livingArrangement === living ? { color: colors.buttonText } : { color: colors.text }
                                        ]}>{living}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Memory Support Needed</Text>
                            <View style={styles.chipContainer}>
                                {MEMORY_SUPPORT.map((support) => (
                                    <TouchableOpacity
                                        key={support}
                                        style={[
                                            styles.chip,
                                            selectedMemorySupport === support
                                                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                                : { backgroundColor: colors.background, borderColor: colors.border }
                                        ]}
                                        onPress={() => setSelectedMemorySupport(support)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedMemorySupport === support ? { color: colors.buttonText } : { color: colors.text }
                                        ]}>{support}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                );

            case 3:
                return (
                    <>
                        <Text style={[styles.heading, { color: colors.primary }]}>Emergency Contacts</Text>
                        <Text style={[styles.subheading, { color: colors.mutedText }]}>
                            Who should we contact in case of emergency?
                        </Text>

                        <View style={[styles.section, { backgroundColor: colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Primary Contact</Text>

                            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={emergencyName1}
                                onChangeText={setEmergencyName1}
                                placeholder="Jane Doe"
                                placeholderTextColor={colors.mutedText}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={emergencyPhone1}
                                onChangeText={setEmergencyPhone1}
                                placeholder="(555) 123-4567"
                                placeholderTextColor={colors.mutedText}
                                keyboardType="phone-pad"
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Relationship</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={emergencyRelation1}
                                onChangeText={setEmergencyRelation1}
                                placeholder="e.g. Daughter, Son, Spouse"
                                placeholderTextColor={colors.mutedText}
                            />
                        </View>

                        <View style={[styles.section, { backgroundColor: colors.card, marginTop: 24 }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Secondary Contact (Optional)</Text>

                            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={emergencyName2}
                                onChangeText={setEmergencyName2}
                                placeholder="John Smith"
                                placeholderTextColor={colors.mutedText}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={emergencyPhone2}
                                onChangeText={setEmergencyPhone2}
                                placeholder="(555) 123-4567"
                                placeholderTextColor={colors.mutedText}
                                keyboardType="phone-pad"
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Relationship</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={emergencyRelation2}
                                onChangeText={setEmergencyRelation2}
                                placeholder="e.g. Friend, Neighbor"
                                placeholderTextColor={colors.mutedText}
                            />
                        </View>

                        <View style={[styles.section, { backgroundColor: colors.card, marginTop: 24 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Technology Comfort Level</Text>
                            <View style={styles.chipContainer}>
                                {TECH_COMFORT.map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.chip,
                                            techComfort === level
                                                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                                : { backgroundColor: colors.background, borderColor: colors.border }
                                        ]}
                                        onPress={() => setTechComfort(level)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            techComfort === level ? { color: colors.buttonText } : { color: colors.text }
                                        ]}>{level}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Preferred Contact Method</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={preferredContact}
                                onChangeText={setPreferredContact}
                                placeholder="e.g. Phone Call, Text, Email"
                                placeholderTextColor={colors.mutedText}
                            />
                        </View>
                    </>
                );

            case 4:
                return (
                    <>
                        <Text style={[styles.heading, { color: colors.primary }]}>Daily Routine & Goals</Text>
                        <Text style={[styles.subheading, { color: colors.mutedText }]}>
                            Help us understand your schedule and aspirations.
                        </Text>

                        <View style={[styles.section, { backgroundColor: colors.card }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Typical Wake-Up Time</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={wakeUpTime}
                                onChangeText={setWakeUpTime}
                                placeholder="e.g. 7:00 AM"
                                placeholderTextColor={colors.mutedText}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Typical Bedtime</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={bedTime}
                                onChangeText={setBedTime}
                                placeholder="e.g. 10:00 PM"
                                placeholderTextColor={colors.mutedText}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Health & Wellness Goals</Text>
                            <TextInput
                                style={[styles.input, styles.multilineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={goals}
                                onChangeText={setGoals}
                                placeholder="e.g. Walk 30 minutes daily, Maintain healthy weight, Stay socially active"
                                placeholderTextColor={colors.mutedText}
                                multiline
                                numberOfLines={4}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Concerns or Special Needs</Text>
                            <TextInput
                                style={[styles.input, styles.multilineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={concerns}
                                onChangeText={setConcerns}
                                placeholder="e.g. Need reminders for medications, Prefer large text, Easily fatigued"
                                placeholderTextColor={colors.mutedText}
                                multiline
                                numberOfLines={4}
                            />

                            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Language Preference</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={languagePreference}
                                onChangeText={setLanguagePreference}
                                placeholder="e.g. English, Spanish"
                                placeholderTextColor={colors.mutedText}
                            />
                        </View>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {renderProgressBar()}
                {renderPage()}

                <View style={styles.navigationContainer}>
                    {currentPage > 0 && (
                        <TouchableOpacity
                            style={[styles.navButton, { backgroundColor: colors.border }]}
                            onPress={handleBack}
                        >
                            <Text style={{ color: colors.text }}>Back</Text>
                        </TouchableOpacity>
                    )}

                    {currentPage < totalPages - 1 ? (
                        <TouchableOpacity
                            style={[styles.navButton, { backgroundColor: colors.primary }]}
                            onPress={handleNext}
                        >
                            <Text style={{ color: colors.buttonText }}>Next</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.navButton, { backgroundColor: colors.primary }]}
                            onPress={handleFinish}
                        >
                            <Text style={{ color: colors.buttonText }}>Finish</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
    subheading: {
        fontSize: 16,
        marginBottom: 16,
    },
    section: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    sectionHeader: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
    },
    chipText: {
        fontSize: 14,
    },
    navigationContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
        marginBottom: 32,
    },
    navButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    progressContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 24,
    },
    progressDot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
});
