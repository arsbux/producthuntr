'use client';

import { useState } from 'react';
import { ArrowLeft, CreditCard, Check } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const [email, setEmail] = useState('franciskatale87@gmail.com');
    const [name, setName] = useState('');
    const [country, setCountry] = useState('Uganda');

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans">
            {/* LEFT SIDE - Dark (Order Summary) */}
            <div className="w-full lg:w-1/2 bg-[#1a1a1a] text-white p-8 lg:p-12 flex flex-col relative">
                <div className="absolute top-8 left-8 flex items-center gap-6">
                    <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <img src="/Favicon.png" alt="ProductHuntr" className="w-6 h-6 rounded" />
                        <span className="font-bold text-lg">ProductHuntr</span>
                    </div>
                </div>

                <div className="mt-16 lg:mt-24 max-w-md mx-auto w-full flex-1">
                    <div className="mb-8">
                        <p className="text-gray-400 text-sm mb-2">Subscribe to Pro Monthly Membership</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">CA$45.00</span>
                            <span className="text-gray-400 text-sm">per month</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Item */}
                        <div className="flex justify-between items-start py-4 border-t border-gray-800">
                            <div>
                                <h3 className="font-medium">Pro Monthly Membership</h3>
                                <p className="text-sm text-gray-400 mt-1">Get access to everything in the Pro Tier</p>
                                <p className="text-sm text-gray-400">Billed monthly</p>
                            </div>
                            <span className="font-medium">CA$45.00</span>
                        </div>

                        {/* Subtotal */}
                        <div className="flex justify-between items-center py-4 border-t border-gray-800">
                            <span className="text-gray-300">Subtotal</span>
                            <span className="font-medium">CA$45.00</span>
                        </div>

                        {/* Promo Code */}
                        <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                            Add promotion code
                        </button>

                        {/* Total */}
                        <div className="flex justify-between items-center py-6 border-t border-gray-800 mt-4">
                            <span className="text-gray-300 font-medium">Total due today</span>
                            <span className="text-2xl font-bold">CA$45.00</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - Light (Payment Form) */}
            <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 flex flex-col">
                <div className="max-w-md mx-auto w-full mt-8 lg:mt-16">
                    {/* Link Pay Button */}
                    <button className="w-full bg-[#00D66F] hover:bg-[#00c465] text-black font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 mb-6">
                        Pay with <span className="font-bold italic">Link</span>
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">OR</span>
                        </div>
                    </div>

                    <form className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment method</label>
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500">Card information</p>
                                <div className="border border-gray-300 rounded-md overflow-hidden">
                                    <div className="flex items-center px-3 py-2 border-b border-gray-300 bg-white">
                                        <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                                        <input
                                            type="text"
                                            placeholder="1234 1234 1234 1234"
                                            className="flex-1 outline-none text-sm"
                                        />
                                        <div className="flex gap-1">
                                            <div className="w-8 h-5 bg-gray-100 rounded border border-gray-200"></div>
                                            <div className="w-8 h-5 bg-gray-100 rounded border border-gray-200"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-white">
                                        <input
                                            type="text"
                                            placeholder="MM / YY"
                                            className="w-1/2 px-3 py-2 border-r border-gray-300 outline-none text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="CVC"
                                            className="w-1/2 px-3 py-2 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cardholder Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Cardholder name</label>
                            <input
                                type="text"
                                id="name"
                                placeholder="Full name on card"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country or region</label>
                            <select
                                id="country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option>Uganda</option>
                                <option>United States</option>
                                <option>Canada</option>
                                <option>United Kingdom</option>
                            </select>
                        </div>

                        {/* Business Checkbox */}
                        <div className="flex items-center">
                            <input
                                id="business"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="business" className="ml-2 block text-sm text-gray-600">
                                I'm purchasing as a business
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-[#FF9A7B] hover:bg-[#ff8a65] text-black font-medium py-3 px-4 rounded-md shadow-sm transition-colors text-lg"
                        >
                            Subscribe
                        </button>

                        {/* Footer */}
                        <div className="text-center text-xs text-gray-500 mt-6 space-y-2">
                            <p>By subscribing, you authorize ProductHuntr to charge you according to the terms until you cancel.</p>
                            <div className="flex justify-center gap-4">
                                <span>Powered by <span className="font-bold">stripe</span></span>
                                <a href="#" className="hover:underline">Terms</a>
                                <a href="#" className="hover:underline">Privacy</a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
