import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="inline-flex items-center gap-2 text-gray-400 mb-4">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </div>

            {/* Header Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
                <div className="lg:col-span-2">
                    <div className="flex items-start gap-6">
                        <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
                        <div className="flex-1">
                            <Skeleton className="h-10 w-3/4 mb-2" />
                            <Skeleton className="h-6 w-1/2 mb-4" />

                            {/* Description */}
                            <div className="space-y-2 mb-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>

                            {/* Topics */}
                            <div className="flex gap-2 mb-6">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 mt-6">
                                <Skeleton className="h-10 w-32 rounded-lg" />
                                <Skeleton className="h-10 w-32 rounded-lg" />
                                <Skeleton className="h-10 w-32 rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <Skeleton className="h-4 w-16 mb-2" />
                            <Skeleton className="h-8 w-12" />
                        </div>
                        <div>
                            <Skeleton className="h-4 w-16 mb-2" />
                            <Skeleton className="h-8 w-12" />
                        </div>
                    </div>
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>

            {/* AI Audit Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Left Column: Analysis */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Velocity Chart */}
                    <Skeleton className="h-[300px] w-full rounded-xl" />

                    {/* One-Line Pitch */}
                    <Skeleton className="h-32 w-full rounded-xl" />

                    {/* Strengths & Risks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>

                    {/* Growth Actions */}
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>

                {/* Right Column: Meta Info */}
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>

            {/* Category & Keyword Growth */}
            <div className="mb-8">
                <Skeleton className="h-8 w-64 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>

            {/* Similar Launches */}
            <div className="mb-8">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
