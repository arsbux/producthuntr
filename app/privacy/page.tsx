import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Privacy Policy',
    description: 'ProductHuntr Privacy Policy - How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-gray-400 mb-8">Last updated: November 28, 2025</p>

                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Flight Labs ("we," "us," or "our") operates ProductHuntr. We collect information you provide directly to us, including when you create an account,
                            subscribe to our service, or contact us for support. This may include your name, email address,
                            and payment information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process your transactions and send related information</li>
                            <li>Send you technical notices and support messages</li>
                            <li>Respond to your comments and questions</li>
                            <li>Monitor and analyze trends and usage</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We take reasonable measures to help protect your personal information from loss, theft,
                            misuse, unauthorized access, disclosure, alteration, and destruction. Payment information
                            is processed securely through Square and is never stored on our servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We use third-party services including Supabase for authentication and database services,
                            and Square for payment processing. These services have their own privacy policies governing
                            the use of your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
                        <p className="text-gray-300 leading-relaxed">
                            You have the right to access, update, or delete your personal information at any time.
                            You may also opt out of receiving promotional communications from us by following the
                            instructions in those messages.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at{' '}
                            <a href="mailto:support@producthuntr.com" className="text-blue-400 hover:text-blue-300">
                                support@producthuntr.com
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
