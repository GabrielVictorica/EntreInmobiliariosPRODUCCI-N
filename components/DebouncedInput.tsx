import React, { useState, useEffect, useRef } from 'react';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: string | number;
    onChange: (val: string | number, name?: string) => void;
    debounce?: number;
    className?: string;
    name?: string;
}

export const DebouncedInput = React.memo(({
    value,
    onChange,
    debounce = 500,
    className,
    id,
    disabled,
    name,
    ...props
}: DebouncedInputProps) => {
    const [localValue, setLocalValue] = useState<string | number>(value);
    const isFocusedRef = useRef(false);

    useEffect(() => {
        // Only sync from parent when NOT focused to avoid cursor jumping
        if (!isFocusedRef.current && value !== localValue) {
            setLocalValue(value);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
    };

    const handleBlur = (e?: React.FocusEvent<HTMLInputElement>) => {
        isFocusedRef.current = false;

        // Trigger immediate update on blur
        let finalValue: string | number = localValue;
        if (props.type === 'number') {
            finalValue = parseFloat(localValue.toString()) || 0;
        }

        if (finalValue !== value) {
            onChange(finalValue, name);
        }

        // Propagate blur event if parent needs it
        if (props.onBlur && e) props.onBlur(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedRef.current = true;
        if (props.onFocus) props.onFocus(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
            (e.target as HTMLInputElement).blur();
        }
        if (props.onKeyDown) props.onKeyDown(e);
    };

    // Derived effect for value commit logic while typing
    useEffect(() => {
        const timeout = setTimeout(() => {
            // Only commit via timeout if we are STILL focused (typing)
            // If blurred, the handleBlur has already committed it.
            if (isFocusedRef.current) {
                let finalValue: string | number = localValue;
                if (props.type === 'number') {
                    finalValue = parseFloat(localValue.toString()) || 0;
                }

                if (finalValue !== value) {
                    onChange(finalValue, name);
                }
            }
        }, debounce);

        return () => clearTimeout(timeout);
    }, [localValue, debounce, onChange, name, value, props.type]);

    return (
        <input
            {...props}
            id={id}
            name={name}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={className}
        />
    );
});
