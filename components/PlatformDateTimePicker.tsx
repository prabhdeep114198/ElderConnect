import React from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    display = 'default',
    minimumDate,
    maximumDate,
    themeVariant,
    style,
}) => {
    return (
        <DateTimePicker
            value={value}
            mode={mode}
            display={display}
            onChange={onChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            themeVariant={themeVariant}
            style={style}
        />
    );
};
