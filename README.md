# ElderConnect - Comprehensive Healthcare Companion App

<div align="center">

![ElderConnect Logo](./assets/images/icon.png)

**A modern, feature-rich mobile application designed to support elderly individuals in managing their health, medications, appointments, and daily activities with AI-powered assistance.**

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.23-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red.svg)]()

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Key Features Explained](#key-features-explained)
- [API Integration](#api-integration)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**ElderConnect** is a comprehensive healthcare companion application built with React Native and Expo, specifically designed to assist elderly individuals in managing their health and daily activities. The app provides a user-friendly interface with multi-language support, dark mode, and AI-powered assistance to help users stay healthy, organized, and connected with their families and caregivers.

### Core Purpose

- **Health Management**: Track vital signs, medications, appointments, and daily health metrics
- **Medication Reminders**: Never miss a dose with intelligent medication scheduling and notifications
- **AI Companion**: Get personalized health advice and assistance through an AI chatbot
- **Family Connectivity**: Stay connected with family members through video calls and health reports
- **Emergency Support**: Quick access to emergency services and SOS functionality
- **Accessibility**: Multi-language support (10+ languages) and intuitive UI design

---

## ✨ Features

### 🏠 Home Dashboard
- **Personalized Greetings**: Time-based greetings (Good Morning/Afternoon/Evening)
- **Quick Actions**: One-tap access to Emergency SOS, Family Calls, Health Checks, and Reminders
- **Health Metrics Summary**: Real-time display of steps, heart rate, sleep quality, and hydration
- **Today's Schedule**: View upcoming medications and appointments
- **AI Companion Preview**: Quick access to AI chatbot with personalized tips

### 💊 Medication Management
- **Medication Tracking**: Add, edit, and manage multiple medications
- **Dosage Scheduling**: Set custom schedules with multiple daily doses
- **Compliance Tracking**: Track medication adherence with visual indicators
- **Reminder Notifications**: Push notifications for medication times
- **Medication History**: View past medication records and statistics
- **Side Effects Tracking**: Record and monitor medication side effects

### 📅 Appointments & Events
- **Appointment Scheduling**: Create and manage medical appointments
- **Event Calendar**: View all upcoming events in a calendar view
- **Reminder System**: Get notified before appointments
- **Event Details**: Detailed view with location, time, and notes

### 📊 Health Tracker
- **Vital Signs Monitoring**: Track blood pressure, heart rate, blood sugar, and more
- **Step Counter**: Automatic step tracking using device sensors
- **Health Metrics**: Monitor sleep hours, water intake, exercise time
- **Trend Analysis**: Visual charts showing health trends over time
- **Target Goals**: Set and track health goals

### 📝 Diary & Mood Tracking
- **Daily Journal**: Record daily activities, thoughts, and experiences
- **Mood Tracking**: Log mood with emoji indicators
- **Activity Logging**: Track activities like walking, gardening, reading
- **Memory Preservation**: Keep a digital diary of daily life

### 📈 Health Reports
- **Knowledge Graph Visualization**: Interactive graph showing health relationships
- **Health Scores**: Calculate physical, mental, and overall health scores
- **Report Generation**: Generate comprehensive health reports
- **Data Export**: Share reports with family and healthcare providers
- **N8N Integration**: Automated WhatsApp reports to caregivers

### 🤖 AI Chatbot
- **Conversational AI**: Natural language interaction for health queries
- **Personalized Advice**: Context-aware health recommendations
- **Chat History**: Save and manage multiple conversation sessions
- **Action Links**: Quick actions from chatbot responses
- **Knowledge Base**: Access to health information and tips

### 📞 Communication
- **Video Calls**: Make video calls to family members using Agora
- **Emergency SOS**: One-tap emergency service access
- **Family Notifications**: Automated health updates to caregivers

### 🔧 Additional Features
- **Multi-language Support**: 10+ languages (English, Hindi, Spanish, French, German, Bengali, Tamil, Telugu, Marathi, Punjabi)
- **Dark Mode**: Full dark mode support with theme switching
- **Accessibility**: Large fonts, high contrast, and intuitive navigation
- **Bluetooth Device Integration**: Connect to health monitoring devices
- **Magnifier Tool**: Camera-based magnifier for reading small text
- **Music Player**: Built-in music player for relaxation
- **Settings Management**: Comprehensive app settings and preferences
- **Profile Management**: User profile with personal information
- **Subscription Management**: Premium features and subscription handling
- **Payment Integration**: Razorpay integration for payments

---

## 🛠 Technology Stack

### Core Framework
- **React Native** (0.81.4) - Cross-platform mobile framework
- **Expo** (54.0.23) - Development platform and tooling
- **TypeScript** (5.9.2) - Type-safe JavaScript
- **Expo Router** (6.0.4) - File-based routing system

### Navigation & UI
- **React Navigation** - Navigation library (Stack, Tabs, Drawer)
- **Expo Vector Icons** - Icon library
- **React Native Reanimated** - Smooth animations
- **React Native Gesture Handler** - Touch gestures

### State Management & Context
- **React Context API** - Global state management
  - `AuthContext` - User authentication
  - `ThemeContext` - Theme and color management
  - `LanguageContext` - Internationalization

### Backend Integration
- **Axios** - HTTP client for API requests
- **Appwrite** (20.0.0) - Backend-as-a-Service
- **Custom API Services** - RESTful API integration

### Features & Libraries
- **i18next & react-i18next** - Internationalization
- **Expo Notifications** - Push notifications
- **Expo Camera** - Camera functionality
- **Expo Location** - Location services
- **Expo Sensors** - Device sensors (Pedometer)
- **React Native Agora** - Video calling
- **React Native BLE PLX** - Bluetooth Low Energy
- **React Native Razorpay** - Payment processing
- **React Native Flagsmith** - Feature flags
- **Lottie React Native** - Animations
- **AsyncStorage** - Local data persistence

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Expo Dev Client** - Custom development builds

---

## 📁 Project Structure

```
ElderConnect_Frontend/
├── app/                          # Main application screens (Expo Router)
│   ├── _layout.tsx              # Root layout with providers
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── home.tsx             # Home dashboard
│   │   ├── medications.tsx      # Medication management
│   │   ├── appointments.tsx     # Appointment scheduling
│   │   ├── tracker.tsx          # Health tracker
│   │   ├── diary.tsx            # Daily diary
│   │   └── reports.tsx          # Health reports
│   ├── auth/                     # Authentication screens
│   │   └── login.tsx            # Login screen
│   ├── events/                   # Event management
│   ├── onboarding/               # Onboarding flow
│   ├── chatbot.tsx              # AI chatbot
│   ├── reminders.tsx            # Reminders screen
│   ├── profile.tsx              # User profile
│   ├── SettingsScreen.tsx       # App settings
│   ├── VideoCallScreen.tsx      # Video calling
│   ├── MagnifierScreen.tsx      # Camera magnifier
│   └── DevicesScreen.tsx        # Device management
│
├── components/                   # Reusable components
│   └── LoginModal.tsx
│
├── context/                      # React Context providers
│   ├── AuthContext.tsx          # Authentication state
│   ├── ThemeContext.tsx         # Theme management
│   └── LanguageContext.tsx      # Language management
│
├── services/                     # API and service layers
│   ├── api/                     # API service modules
│   │   ├── auth.ts             # Authentication API
│   │   ├── profile.ts          # Profile API
│   │   ├── chat.ts             # Chat API
│   │   ├── device.ts           # Device API
│   │   ├── client.ts           # HTTP client
│   │   └── config.ts            # API configuration
│   ├── N8NService.ts            # N8N workflow integration
│   ├── PaymentService.ts        # Payment processing
│   └── MockEventService.ts      # Mock event service
│
├── hooks/                        # Custom React hooks
│   ├── useApi.ts                # API hook
│   └── useFeatureFlags.ts      # Feature flags hook
│
├── utils/                        # Utility functions
│   ├── reminderService.ts       # Reminder utilities
│   └── reeminderStorage.tsx     # Reminder storage
│
├── constants/                    # App constants
│   ├── colors.ts                # Color definitions
│   ├── theme.ts                 # Theme constants
│   └── translations.ts          # Translation keys
│
├── assets/                       # Static assets
│   ├── images/                  # Image assets
│   ├── locales/                 # Translation files
│   │   ├── en.json
│   │   ├── hi.json
│   │   └── ... (10+ languages)
│   ├── sounds/                  # Audio files
│   └── elderly_care.json        # Lottie animations
│
├── scripts/                      # Build scripts
│   └── reset-project.js
│
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── i18n.ts                       # i18n configuration
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (for macOS) or **Android Studio** (for Android development)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ElderConnect_Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory (or configure in `app.json`):
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
   EXPO_PUBLIC_FLAGSMITH_ENV_ID=your-flagsmith-env-id
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on your preferred platform**
   - **iOS Simulator**: Press `i` in the terminal or run `npm run ios`
   - **Android Emulator**: Press `a` in the terminal or run `npm run android`
   - **Web**: Press `w` in the terminal or run `npm run web`
   - **Physical Device**: Scan the QR code with Expo Go app

### First Time Setup

1. **Backend API**: Ensure your backend API is running and accessible
   - Default development URL: `http://localhost:3000/api`
   - For physical devices, update `EXPO_PUBLIC_API_BASE_URL` to your local IP

2. **Permissions**: The app will request permissions for:
   - Camera (for magnifier and video calls)
   - Location (for emergency services)
   - Notifications (for reminders)
   - Bluetooth (for health devices)
   - Storage (for local data)

---

## ⚙️ Configuration

### API Configuration

The API base URL is configured in `services/api/config.ts`:

```typescript
// Automatically detects environment
// Development: Uses Expo hostUri or localhost
// Production: Set via EXPO_PUBLIC_API_BASE_URL
```

**For Development:**
- iOS Simulator: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Physical Device: Auto-detected from Expo or set manually

**For Production:**
Set `EXPO_PUBLIC_API_BASE_URL` in your environment or `app.json`

### Feature Flags (Flagsmith)

The app uses Flagsmith for feature flag management:

```typescript
// Configure in app/_layout.tsx
EXPO_PUBLIC_FLAGSMITH_ENV_ID=your-environment-id
```

Feature flags are only active for subscribed users. Free users have all flags disabled.

### N8N Integration

For automated health reports via WhatsApp:

1. Set up N8N workflow with webhook endpoint
2. Configure webhook URL in `services/N8NService.ts`:
   ```typescript
   const N8N_WEBHOOK_URL = `http://${host}:5678/webhook/elder-connect-report`;
   ```

### Payment Integration (Razorpay)

Configure Razorpay in `services/PaymentService.ts`:
- Add your Razorpay key ID
- Configure payment callbacks

### Video Calling (Agora)

Configure Agora in `app/VideoCallScreen.tsx`:
- Add your Agora App ID
- Configure channel settings

---

## 🔍 Key Features Explained

### Authentication System

The app uses a token-based authentication system:

- **Login/Signup**: Email and password authentication
- **Session Management**: Automatic session restoration
- **Onboarding Flow**: First-time user onboarding
- **Profile Management**: Update user profile and password

**Auth Flow:**
1. User logs in → Receives JWT token
2. Token stored in AsyncStorage
3. Token included in all API requests
4. Auto-logout on token expiration

### Theme System

Comprehensive theme support with light and dark modes:

- **Dynamic Colors**: All colors adapt to theme
- **System Preference**: Respects system theme
- **Manual Toggle**: User can switch themes
- **Persistent**: Theme preference saved locally

### Internationalization (i18n)

Multi-language support with 10+ languages:

- **Auto-detection**: Detects device language
- **Manual Selection**: User can change language
- **Persistent**: Language preference saved
- **Supported Languages**: English, Hindi, Spanish, French, German, Bengali, Tamil, Telugu, Marathi, Punjabi

### Health Tracking

Comprehensive health monitoring:

- **Step Counter**: Uses device pedometer
- **Vital Signs**: Manual entry with validation
- **Health Metrics**: Sleep, water intake, exercise
- **Trend Analysis**: Visual charts and trends
- **Goal Setting**: Set and track health goals

### Medication Management

Advanced medication tracking:

- **Multiple Medications**: Manage unlimited medications
- **Flexible Scheduling**: Custom times and frequencies
- **Compliance Tracking**: Visual adherence indicators
- **Notifications**: Push notifications for doses
- **History**: Complete medication history

### AI Chatbot

Intelligent health companion:

- **Conversational Interface**: Natural language interaction
- **Context Awareness**: Remembers conversation context
- **Session Management**: Multiple chat sessions
- **Action Links**: Quick actions from responses
- **Health Advice**: Personalized recommendations

### Emergency Features

Safety and emergency support:

- **SOS Button**: One-tap emergency call
- **Family Notification**: Auto-notify family members
- **Location Sharing**: Share location in emergencies
- **Quick Access**: Always accessible from home screen

---

## 🔌 API Integration

### API Services

The app uses a modular API service architecture:

#### Authentication API (`services/api/auth.ts`)
- `login()` - User login
- `register()` - User registration
- `logout()` - User logout
- `getProfile()` - Get user profile
- `changePassword()` - Update password

#### Profile API (`services/api/profile.ts`)
- `getDailyMetrics()` - Get daily health metrics
- `getMedicationReminders()` - Get medication reminders
- `getAppointments()` - Get appointments
- `updateHealthMetric()` - Update health data
- `updateProfile()` - Update user profile

#### Chat API (`services/api/chat.ts`)
- `sendMessage()` - Send chat message
- `getChatHistory()` - Get chat history
- `createSession()` - Create chat session

#### Device API (`services/api/device.ts`)
- `createSOS()` - Create emergency SOS
- `getDevices()` - Get connected devices
- `syncDeviceData()` - Sync device health data

### API Client

Centralized HTTP client in `services/api/client.ts`:

- **Automatic Token Injection**: Adds auth token to requests
- **Error Handling**: Centralized error handling
- **Request/Response Interceptors**: Logging and transformation
- **Timeout Configuration**: 10-second default timeout

### Error Handling

The app implements comprehensive error handling:

- **Network Errors**: Retry logic and offline detection
- **Authentication Errors**: Auto-logout on 401
- **Validation Errors**: User-friendly error messages
- **Fallback Data**: Local storage fallback for critical data

---

## 💻 Development

### Development Workflow

1. **Start Development Server**
   ```bash
   npm start
   ```

2. **Run on Specific Platform**
   ```bash
   npm run ios      # iOS Simulator
   npm run android  # Android Emulator
   npm run web      # Web browser
   ```

3. **Linting**
   ```bash
   npm run lint
   ```

### Code Structure Guidelines

- **Components**: Reusable UI components in `components/`
- **Screens**: Screen components in `app/` directory
- **Services**: API and business logic in `services/`
- **Context**: Global state in `context/`
- **Utils**: Helper functions in `utils/`
- **Constants**: App constants in `constants/`

### TypeScript

The project uses TypeScript for type safety:

- **Strict Mode**: Enabled for better type checking
- **Type Definitions**: Custom types in component files
- **API Types**: Type definitions for API responses

### State Management

The app uses React Context for state management:

- **AuthContext**: User authentication state
- **ThemeContext**: Theme and color state
- **LanguageContext**: Language preference state

### Testing

While not included in the current setup, recommended testing:

- **Unit Tests**: Jest for utility functions
- **Component Tests**: React Native Testing Library
- **E2E Tests**: Detox for end-to-end testing

---

## 📦 Building for Production

### Pre-build Checklist

1. **Update API URLs**: Set production API URLs
2. **Update App Version**: Update version in `app.json` and `package.json`
3. **Configure Icons**: Ensure all app icons are in `assets/images/`
4. **Test Features**: Test all features on physical devices
5. **Review Permissions**: Ensure all required permissions are declared

### iOS Build

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Build for iOS**
   ```bash
   eas build --platform ios
   ```

4. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```

### Android Build

1. **Build for Android**
   ```bash
   eas build --platform android
   ```

2. **Submit to Play Store**
   ```bash
   eas submit --platform android
   ```

### Environment Variables

Set production environment variables in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value https://api.yourapp.com
eas secret:create --scope project --name EXPO_PUBLIC_FLAGSMITH_ENV_ID --value your-prod-env-id
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Metro Bundler Issues**
```bash
# Clear cache and restart
npm start -- --clear
```

#### 2. **API Connection Issues**
- Check if backend is running
- Verify API URL in `services/api/config.ts`
- For physical devices, use your computer's IP address
- Check firewall settings

#### 3. **Permission Errors**
- Ensure permissions are declared in `app.json`
- Check device settings for app permissions
- Reinstall app if permissions are denied

#### 4. **Build Errors**
```bash
# Clear all caches
rm -rf node_modules
npm install
expo start --clear
```

#### 5. **TypeScript Errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

### Debugging

1. **Enable Debug Mode**: Shake device → "Debug Remote JS"
2. **React Native Debugger**: Use React Native Debugger tool
3. **Console Logs**: Check Metro bundler console
4. **Network Logs**: Use network inspector in React Native Debugger

### Performance Optimization

- **Image Optimization**: Use optimized image formats
- **Code Splitting**: Lazy load screens when possible
- **Memoization**: Use React.memo for expensive components
- **List Optimization**: Use FlatList for long lists

---

## 🤝 Contributing

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**
   ```bash
   git commit -m "Add: your feature description"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Code Style

- Follow existing code style
- Use TypeScript for type safety
- Add comments for complex logic
- Keep components small and focused
- Use meaningful variable names

### Commit Messages

Use conventional commit format:
- `Add:` for new features
- `Fix:` for bug fixes
- `Update:` for updates
- `Remove:` for removals
- `Refactor:` for refactoring

---

## 📄 License

This project is **private** and proprietary. All rights reserved.

---

## 📞 Support

For support and questions:

- **Documentation**: Check the documentation files in the project
- **Issues**: Create an issue in the repository
- **Email**: Contact the development team

---

## 🙏 Acknowledgments

- **Expo Team** - For the amazing Expo platform
- **React Native Community** - For excellent libraries and tools
- **All Contributors** - For their valuable contributions

---

## 📚 Additional Resources

### Documentation Files

- `KNOWLEDGE_GRAPH_USER_GUIDE.md` - Knowledge graph feature guide
- `KNOWLEDGE_GRAPH_ENHANCEMENTS.md` - Knowledge graph enhancements
- `N8N_INTEGRATION_GUIDE.md` - N8N workflow integration guide

### External Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

<div align="center">

**Built with ❤️ for elderly care and health management**

*Last Updated: 2026*

</div>
