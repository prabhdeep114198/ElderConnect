# Knowledge Graph - Quick Reference Guide

## What Changed?

Your knowledge graph is now **much more detailed and dynamic**! Here's what's new:

### 🎯 New Data Displayed

#### 1. **Exercise Tracking** 🏃‍♂️
- **Steps**: Daily step count (e.g., "6847 steps")
- **Exercise Time**: Minutes of exercise (e.g., "45min")
- Color: Orange (#FF9800)

#### 2. **Health Vitals** 💓
- **Blood Pressure**: Shows systolic/diastolic (e.g., "120/80")
- **Blood Sugar**: Glucose levels (e.g., "95 mg/dL")
- **Heart Rate**: Current BPM (e.g., "72 bpm")
- **Status Indicators**: Green dot = Normal ✅
- Color: Pink (#E91E63)

#### 3. **Mood & Activities** 😊
- **Current Mood**: Emoji representation (😊😢😐😰😠)
- **Recent Activities**: From diary (Walking, Gardening, etc.)
- Color: Purple (#9C27B0) for mood, Blue (#00BCD4) for activities

#### 4. **Overall Health Summary** 📊
- **Health Score**: Average of all metrics (e.g., "75%")
- **Dynamic Color**: 
  - Green (>70%) = Excellent
  - Yellow (>50%) = Good
  - Red (<50%) = Needs Attention

### 📱 How It Works

#### Automatic Data Integration
The knowledge graph automatically pulls data from:
1. **Health Tracker** screen → Exercise metrics, sleep, water intake
2. **Diary** screen → Mood, activities, notes
3. **Profile** screen → Personal info, interests, conditions
4. **Vital Signs** (if tracked) → Blood pressure, heart rate, etc.

#### Live Updates
- Refreshes every time you visit the Reports screen
- Shows timestamp of last update
- Displays number of active data nodes

#### Demo Mode
If you haven't entered data yet, it shows **mock demo data** so you can see how it works!

### 🎨 Visual Enhancements

#### Better Nodes
- **Larger & Clearer**: Easier to read
- **Dual Labels**: Main value + description
- **Gradient Effect**: Glowing outer circle
- **Status Dots**: Visual health indicators

#### Enhanced Legend
Now shows all categories:
- 🟠 Exercise
- 🔴 Vitals
- 🟣 Mood
- 🔵 Interests
- 🟢 Contacts
- 🔴 Conditions

#### Info Panel
New bottom section showing:
- Last update time
- Number of active nodes

### 📈 Radar Chart Update

The health balance chart now includes **Exercise** as a 6th dimension:
- Physical
- **Exercise** ← NEW!
- Social
- Mental
- Sleep
- Diet

## 🚀 How to See Your Data

### Step 1: Track Exercise
1. Go to **Health Tracker** tab
2. Log water, exercise, or steps
3. Data auto-saves to knowledge graph

### Step 2: Record Mood
1. Go to **Diary** tab
2. Add an entry with your mood
3. Select activities
4. Knowledge graph shows your emotional state

### Step 3: View Your Graph
1. Go to **Reports** tab
2. See your complete health ecosystem
3. Each node represents a different data point
4. Lines connect everything to you at the center

## 💾 Data Storage

All your data is saved locally using **AsyncStorage**:
- ✅ Private and secure
- ✅ Works offline
- ✅ Persistent across app restarts
- ✅ Only stored on your device

## 🎯 Key Features

### Dynamic Updates
Changes in other screens update the graph automatically!

### Smart Calculations
- Exercise score = (current / target) × 100
- Mental health = average of diary moods
- Overall health = average of all 6 metrics

### Demo-Ready
Perfect for presentations - shows realistic data even without entries!

## 📊 Reading Your Graph

### Node Types

**Center Node (You)**
- Largest circle
- Your name
- Primary color

**Exercise Nodes (Orange)**
- Steps count
- Exercise duration
- Activity metrics

**Vital Signs (Pink)**
- Current readings
- Status indicators
- Medical data

**Mood Node (Purple)**
- Recent emotional state
- Emoji representation
- Latest diary entry

**Activity Node (Blue)**
- What you've been doing
- From diary entries

**Interests (Blue)**
- Your hobbies
- Top 2 displayed

**Conditions (Red)**
- Health conditions
- Up to 2 shown

**Contact (Green)**
- Emergency contact
- Primary person

**Overall Health (Dynamic)**
- Average score
- Color by health level

## 🔄 How Data Updates

```
1. You log data (tracker/diary/profile)
   ↓
2. Saved to AsyncStorage
   ↓
3. Reports screen loads
   ↓
4. Knowledge graph displays updated data
```

## ✨ Pro Tips

1. **Best Viewing**: Visit Reports screen regularly to see your progress
2. **Complete Picture**: Log data in all areas for full graph
3. **Track Trends**: Notice color changes in health summary over time
4. **Download PDF**: Includes all this data in your report

## 🎨 Color Guide

| Color | Category | Example |
|-------|----------|---------|
| 🟠 Orange | Exercise | Steps, workout time |
| 🔴 Pink | Vitals | BP, heart rate |
| 🟣 Purple | Emotional | Mood, feelings |
| 🔵 Blue | Interests/Activities | Hobbies, what you did |
| 🟢 Green | Support | Emergency contacts |
| 🔴 Red | Health Issues | Medical conditions |
| 🟢/🟡/🔴 | Overall Health | Based on score |

## 📱 Mobile Optimization

The graph is fully optimized for mobile:
- ✅ Touch-friendly
- ✅ Responsive layout
- ✅ Clear text readable on phone
- ✅ Smart spacing

---

**Need Help?** The knowledge graph shows demo data if you're just starting out. As you use the app more, it will replace mock data with your real health information!
