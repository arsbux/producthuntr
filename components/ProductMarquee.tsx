'use client';

import Image from 'next/image';
import { ChevronUp } from 'lucide-react';

const PRODUCTS = [
    { name: 'Base44', category: 'SaaS', upvotes: 481, image: '/marquee/base44.avif' },
    { name: 'ChatGPT Atlas', category: 'Browser', upvotes: 661, image: '/marquee/chatgptatlas.avif' },
    { name: 'Dynal.AI', category: 'SaaS', upvotes: 435, image: '/marquee/Dynal.AI -SaaS -435.avif' },
    { name: 'Emma', category: 'App', upvotes: 575, image: '/marquee/Emma-App-575.avif' },
    { name: 'Jinna AI', category: 'SaaS', upvotes: 523, image: '/marquee/Jinna ai -SaaS -523.avif' },
    { name: 'MeDo', category: 'SaaS', upvotes: 549, image: '/marquee/MeDo by Baidu-SaaS-549.avif' },
    { name: 'Nimo', category: 'WebApp', upvotes: 586, image: '/marquee/Nimo-WebApp-586.avif' },
    { name: 'PawChamp', category: 'App', upvotes: 590, image: '/marquee/PawChamp-App-590.avif' },
    { name: 'Postiz', category: 'SaaS', upvotes: 632, image: '/marquee/Postiz-632.avif' },
    { name: 'ProblemHunt', category: 'Discovery', upvotes: 530, image: '/marquee/ProblemHunt - Problem Discovery -530.avif' },
    { name: 'Sentra', category: 'Payments', upvotes: 598, image: '/marquee/Sentra-Payments-598.avif' },
    { name: 'Superinbox', category: 'SaaS', upvotes: 547, image: '/marquee/Superinbox- SaaS -547.avif' },
    { name: 'Typeless', category: 'SaaS', upvotes: 539, image: '/marquee/Typeless-SaaS -539.avif' },
    { name: 'Uneed', category: 'Community', upvotes: 648, image: '/marquee/UneedCommunity-648.avif' },
    { name: 'BlogBowl', category: 'SaaS', upvotes: 620, image: '/marquee/blogbowl-saas.avif' },
    { name: 'Cursor', category: 'IDE', upvotes: 850, image: '/marquee/Cursor2.avif' },
    { name: 'Talo', category: 'SaaS', upvotes: 520, image: '/marquee/Talo-saas.avif' },
];

const ROW_1 = PRODUCTS.slice(0, 9);
const ROW_2 = PRODUCTS.slice(9);

export default function ProductMarquee() {
    return (
        <div className="w-full overflow-hidden py-12 space-y-8 relative">
            {/* Fade Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>

            {/* Row 1 - Moving Left */}
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
                {[...ROW_1, ...ROW_1].map((product, i) => (
                    <div key={`row1-${product.name}-${i}`} className="mx-3">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>

            {/* Row 2 - Moving Right */}
            <div className="flex w-max animate-marquee-reverse hover:[animation-play-state:paused]">
                {[...ROW_2, ...ROW_2].map((product, i) => (
                    <div key={`row2-${product.name}-${i}`} className="mx-3">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProductCard({ product }: { product: typeof PRODUCTS[0] }) {
    return (
        <div className="flex items-center gap-5 bg-neutral-900/50 border border-neutral-800 rounded-full pl-2.5 pr-7 py-2.5 hover:bg-neutral-800 hover:border-neutral-700 transition-all cursor-pointer group min-w-[280px]">
            <div className="w-12 h-12 relative rounded-full overflow-hidden border border-neutral-700 group-hover:border-neutral-500 transition-colors flex-shrink-0 bg-neutral-800">
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                />
            </div>

            <div className="flex flex-col min-w-0">
                <span className="text-base font-bold text-white leading-none mb-1.5 group-hover:text-orange-400 transition-colors truncate">{product.name}</span>
                <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">{product.category}</span>
            </div>

            <div className="ml-auto flex flex-col items-end flex-shrink-0">
                <div className="flex items-center gap-1 text-orange-500 font-bold text-base">
                    <ChevronUp className="w-4 h-4 stroke-[4]" />
                    {product.upvotes}
                </div>
            </div>
        </div>
    );
}
