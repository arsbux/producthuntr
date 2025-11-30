import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';


import Pricing from '@/components/landing/Pricing';
import CTAStrip from '@/components/landing/CTAStrip';
import Footer from '@/components/landing/Footer';

export const metadata = {
    title: 'ProductHuntr Insights — Real-time Product Hunt analytics for founders & investors',
    description: 'Turn Product Hunt signals into repeatable growth actions. Real-time trends, predictive momentum, launch audits, and investor-grade datasets. Ship better launches. Spot winners earlier.',
};

import ScreenshotsGrid from '@/components/landing/ScreenshotsGrid';

export default function Home() {
    return (
        <main className="min-h-screen bg-[#0A0A0C] selection:bg-[#FF6154] selection:text-white font-sans">
            <Navbar />
            <Hero />
            <Features />
            <ScreenshotsGrid />
            <HowItWorks />


            <Pricing />
            <Footer />
        </main>
    );
}
