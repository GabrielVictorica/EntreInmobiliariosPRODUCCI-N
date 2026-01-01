import React, { useState, useEffect, useRef } from 'react';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number;
    onChange: (val: number, name?: string) => void;
    className?: string;
    name?: string; // Added name prop for stable handlers
}

export const DebouncedInput = React.memo(({
    value,
    onChange,
    className,
    id,
    disabled,
    name,
    ...props
}: DebouncedInputProps) => {
    const [localValue, setLocalValue] = useState<string>(value.toString());
    const isFocusedRef = useRef(false);

    useEffect(() => {
        // Only sync from parent when NOT focused (prevents overwriting user input)
        if (!isFocusedRef.current && value.toString() !== localValue) {
            setLocalValue(value.toString());
        }
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow strictly numeric input (digits and one decimal point)
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setLocalValue(val);
        }
    };

    const handleBlur = () => {
        isFocusedRef.current = false;
        let num = parseFloat(localValue);
        if (localValue === '' || isNaN(num)) {
            num = 0;
            setLocalValue('0');
        }
        // Only call onChange if the value actually changed
        if (num !== value) {
            onChange(num, name);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
            (e.target as HTMLInputElement).blur();
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedRef.current = true;
        // Use setTimeout to avoid interfering with the click event
        const target = e.target;
        setTimeout(() => target.select(), 0);
    };

    return (
        <input
            {...props}
            id={id}
            name={name}
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            disabled={disabled}
            className={className}
        />
    );
});
