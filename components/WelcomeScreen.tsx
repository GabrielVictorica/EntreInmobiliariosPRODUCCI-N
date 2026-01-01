import React, { useEffect, useState } from 'react';

interface WelcomeScreenProps {
    isVisible: boolean;
    onClose: () => void;
    userName?: string;
}

export default function WelcomeScreen({
    isVisible,
    onClose,
    userName = 'Agente'
}: WelcomeScreenProps) {
    const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; color: string; size: number }>>([]);

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return { text: '¡Buenos días', emoji: '☀️' };
        if (hour >= 12 && hour < 19) return { text: '¡Buenas tardes', emoji: '🌤️' };
        return { text: '¡Buenas noches', emoji: '🌙' };
    };

    const greeting = getGreeting();

    // Extract first name from email or use provided name
    const displayName = userName.includes('@')
        ? userName.split('@')[0].charAt(0).toUpperCase() + userName.split('@')[0].slice(1)
        : userName;

    useEffect(() => {
        if (isVisible) {
            // Generate golden confetti pieces
            const pieces = Array.from({ length: 60 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.8,
                color: ['#AA895F', '#D4B896', '#364649', '#C9A86C', '#8B7355', '#E0D8CC'][Math.floor(Math.random() * 6)],
                size: Math.random() * 8 + 4
            }));
            setConfettiPieces(pieces);

            // Auto-close after 4 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop with gradient */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-[#364649]/95 to-[#1a2426]/95 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Confetti Container */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confettiPieces.map((piece) => (
                    <div
                        key={piece.id}
                        className="absolute animate-confetti-welcome"
                        style={{
                            left: `${piece.left}%`,
                            top: '-20px',
                            width: `${piece.size}px`,
                            height: `${piece.size}px`,
                            backgroundColor: piece.color,
                            animationDelay: `${piece.delay}s`,
                            transform: `rotate(${Math.random() * 360}deg)`,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
                        }}
                    />
                ))}
            </div>

            {/* Welcome Modal */}
            <div className="relative max-w-md w-full mx-4 text-center animate-welcome-in">
                {/* Logo / Icon */}
                <div className="w-24 h-24 bg-gradient-to-br from-[#AA895F] to-[#8B7355] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#AA895F]/30 animate-float">
                    <span className="text-5xl">{greeting.emoji}</span>
                </div>

                {/* Greeting */}
                <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                    {greeting.text}, <span className="text-[#AA895F]">{displayName}</span>!
                </h1>

                {/* Subtitle */}
                <p className="text-lg text-white/70 font-medium mb-8">
                    Tu centro de comando está listo
                </p>

                {/* Motivational Message */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 mb-8 border border-white/10">
                    <p className="text-white/90 font-bold text-sm italic">
                        "Cada día es una nueva oportunidad para hacer historia"
                    </p>
                </div>

                {/* Enter Button */}
                <button
                    onClick={onClose}
                    className="bg-[#AA895F] hover:bg-[#8B7355] text-white font-black py-4 px-12 rounded-2xl transition-all hover:scale-105 shadow-xl shadow-[#AA895F]/30 uppercase tracking-widest text-sm"
                >
                    ¡Comenzar!
                </button>

                {/* Skip hint */}
                <p className="text-white/30 text-xs mt-4 font-medium">
                    Click en cualquier lugar para continuar
                </p>
            </div>

            {/* CSS for animations */}
            <style>{`
                @keyframes confetti-fall-welcome {
                    0% {
                        transform: translateY(0) rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg) scale(0.5);
                        opacity: 0;
                    }
                }
                
                @keyframes welcome-in {
                    0% {
                        transform: scale(0.8) translateY(20px);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                
                .animate-confetti-welcome {
                    animation: confetti-fall-welcome 4s ease-out forwards;
                }
                
                .animate-welcome-in {
                    animation: welcome-in 0.6s ease-out forwards;
                }
                
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
