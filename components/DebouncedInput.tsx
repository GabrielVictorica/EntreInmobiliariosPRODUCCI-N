import React, { useState, useEffect } from 'react';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number;
    onChange: (val: number) => void;
    className?: string;
}

export const DebouncedInput = ({
    value,
    onChange,
    className,
    id,
    disabled,
    ...props
}: DebouncedInputProps) => {
    const [localValue, setLocalValue] = useState<string>(value.toString());

    useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow strictly numeric input (digits and one decimal point)
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setLocalValue(val);
        }
    };

    const handleBlur = () => {
        let num = parseFloat(localValue);
        if (localValue === '' || isNaN(num)) {
            // Revert to original value if empty or invalid
            setLocalValue(value.toString());
        } else {
            onChange(num);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <input
            {...props}
            id={id}
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={className}
        />
    );
};
