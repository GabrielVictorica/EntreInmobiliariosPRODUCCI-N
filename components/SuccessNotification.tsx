import React, { useEffect, useState } from 'react';

interface SuccessNotificationProps {
    isVisible: boolean;
    onClose: () => void;
    message?: string;
}

export default function SuccessNotification({
    isVisible,
    onClose,
    message = "¡A por ello tigre! 🐯"
}: SuccessNotificationProps) {
    const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);

    useEffect(() => {
        if (isVisible) {
            // Generate confetti pieces
            const pieces = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.5,
                color: ['#AA895F', '#364649', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 6)]
            }));
            setConfettiPieces(pieces);

            // Auto-close after 10 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Confetti Container */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confettiPieces.map((piece) => (
                    <div
                        key={piece.id}
                        className="absolute w-3 h-3 animate-confetti"
                        style={{
                            left: `${piece.left}%`,
                            top: '-20px',
                            backgroundColor: piece.color,
                            animationDelay: `${piece.delay}s`,
                            transform: `rotate(${Math.random() * 360}deg)`,
                            borderRadius: Math.random() > 0.5 ? '50%' : '0'
                        }}
                    />
                ))}
            </div>

            {/* Modal */}
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center animate-bounce-in">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-[#364649] mb-2">¡Guardado!</h2>

                {/* Message */}
                <p className="text-lg font-bold text-[#AA895F] mb-6">{message}</p>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="bg-[#364649] hover:bg-[#2a3638] text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105 shadow-lg"
                >
                    ¡Vamos!
                </button>
            </div>

            {/* CSS for animations */}
            <style>{`
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                
                @keyframes bounce-in {
                    0% {
                        transform: scale(0.3);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.05);
                    }
                    70% {
                        transform: scale(0.95);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                .animate-confetti {
                    animation: confetti-fall 3s ease-out forwards;
                }
                
                .animate-bounce-in {
                    animation: bounce-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
