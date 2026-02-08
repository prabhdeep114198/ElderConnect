import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface PlatformDateTimePickerProps {
    value: Date;
    onChange: (event: any, date?: Date) => void;
    mode?: 'date' | 'time' | 'datetime';
    display?: 'default' | 'spinner' | 'calendar' | 'clock';
    minimumDate?: Date;
    maximumDate?: Date;
    themeVariant?: 'light' | 'dark';
    style?: any;
}

export const PlatformDateTimePicker: React.FC<PlatformDateTimePickerProps> = ({
    value,
    onChange,
    mode = 'date',
    minimumDate,
    maximumDate,
    style,
}) => {
    const formatDate = (date: Date) => {
        try {
            return date.toISOString().split('T')[0];
        } catch (e) {
            return new Date().toISOString().split('T')[0];
        }
    };

    const formatTime = (date: Date) => {
        try {
            return date.toTimeString().slice(0, 5);
        } catch (e) {
            return "12:00";
        }
    };

    const handleChange = (e: any) => {
        const newVal = e.target.value;
        if (!newVal) return;

        let newDate = new Date(value);
        if (mode === 'date') {
            const [y, m, d] = newVal.split('-');
            newDate.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(d));
        } else if (mode === 'time') {
            const [h, min] = newVal.split(':');
            newDate.setHours(parseInt(h), parseInt(min));
        } else if (mode === 'datetime') {
            newDate = new Date(newVal);
        }

        onChange({ type: 'set' }, newDate);
    };

    return (
        <View style={[styles.webContainer, style]}>
            {(mode === 'date' || mode === 'datetime') && (
                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Select Date:</Text>
                    <input
                        type="date"
                        value={formatDate(value)}
                        onChange={handleChange}
                        style={webInputStyle}
                        min={minimumDate ? formatDate(minimumDate) : undefined}
                        max={maximumDate ? formatDate(maximumDate) : undefined}
                    />
                </View>
            )}
            {(mode === 'time' || mode === 'datetime') && (
                <View style={[styles.inputWrapper, { marginTop: mode === 'datetime' ? 12 : 0 }]}>
                    <Text style={styles.label}>Select Time:</Text>
                    <input
                        type="time"
                        value={formatTime(value)}
                        onChange={handleChange}
                        style={webInputStyle}
                    />
                </View>
            )}
        </View>
    );
};

const webInputStyle: any = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    width: '100%',
    outline: 'none',
    fontFamily: 'system-ui, -apple-system, sans-serif',
};

const styles = StyleSheet.create({
    webContainer: {
        padding: 10,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    inputWrapper: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
        fontWeight: '500',
    }
});
