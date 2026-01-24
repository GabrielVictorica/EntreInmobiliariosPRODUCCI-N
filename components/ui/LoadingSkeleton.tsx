import React from 'react';

interface LoadingSkeletonProps {
    type?: 'home' | 'metrics' | 'list' | 'calendar';
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'metrics' }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'home':
                return (
                    <div className="space-y-6 animate-pulse p-6">
                        <div className="flex justify-between items-center mb-10">
                            <div className="space-y-2">
                                <div className="h-8 w-64 bg-gray-200 rounded-lg"></div>
                                <div className="h-4 w-48 bg-gray-100 rounded-lg"></div>
                            </div>
                            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 bg-gray-100 rounded-3xl border border-gray-200/50"></div>
                            ))}
                        </div>
                        <div className="h-96 bg-gray-50 rounded-3xl border border-gray-200/50 mt-10"></div>
                    </div>
                );
            case 'metrics':
                return (
                    <div className="space-y-6 animate-pulse p-6">
                        <div className="flex justify-between items-end mb-8">
                            <div className="space-y-2">
                                <div className="h-10 w-80 bg-gray-200 rounded-xl"></div>
                                <div className="h-4 w-56 bg-gray-100 rounded-lg"></div>
                            </div>
                            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                            <div className="h-[400px] bg-gray-50 rounded-3xl"></div>
                            <div className="h-[400px] bg-gray-50 rounded-3xl"></div>
                        </div>
                    </div>
                );
            case 'list':
                return (
                    <div className="animate-pulse p-6">
                        <div className="h-10 w-64 bg-gray-200 rounded-lg mb-8"></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-16 bg-gray-100 rounded-xl flex items-center px-4 gap-4">
                                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'calendar':
                return (
                    <div className="animate-pulse p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
                            <div className="h-10 w-48 bg-gray-200 rounded-xl"></div>
                        </div>
                        <div className="h-16 bg-gray-50 rounded-2xl border border-gray-100"></div>
                        <div className="grid grid-cols-8 gap-1 h-[600px]">
                            <div className="bg-gray-50 rounded-l-2xl"></div>
                            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                <div key={i} className="bg-white border border-gray-100 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full h-full bg-[#f8fafc]/50 backdrop-blur-sm">
            {renderSkeleton()}
        </div>
    );
};

export default LoadingSkeleton;
