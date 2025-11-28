import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Terms of Service',
    description: 'ProductHuntr Terms of Service - Terms and conditions for using our service.',
};

export default function TermsPage() {
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

                <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
                <p className="text-gray-400 mb-8">Last updated: November 28, 2025</p>

                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-300 leading-relaxed">
                            By accessing and using ProductHuntr (a product of Flight Labs), you accept and agree to be bound by the terms
                            and provision of this agreement. If you do not agree to abide by the above, please
                            do not use this service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Permission is granted to temporarily access the materials on ProductHuntr for personal,
                            non-commercial use only. This is the grant of a license, not a transfer of title, and
                            under this license you may not:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Modify or copy the materials</li>
                            <li>Use the materials for any commercial purpose</li>
                            <li>Attempt to reverse engineer any software contained on ProductHuntr</li>
                            <li>Remove any copyright or other proprietary notations from the materials</li>
                            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. Subscription Terms</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Our Pro Monthly Membership is billed at $29.00 USD per month. Your subscription will
                            automatically renew each month unless cancelled. You may cancel your subscription at
                            any time through your account settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Refund Policy</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We offer a 14-day money-back guarantee. If you are not satisfied with our service,
                            you may request a full refund within 14 days of your initial purchase by contacting
                            support@producthuntr.com.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. User Account</h2>
                        <p className="text-gray-300 leading-relaxed">
                            You are responsible for maintaining the confidentiality of your account and password.
                            You agree to accept responsibility for all activities that occur under your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">6. Disclaimer</h2>
                        <p className="text-gray-300 leading-relaxed">
                            The materials on ProductHuntr are provided on an 'as is' basis. ProductHuntr makes
                            no warranties, expressed or implied, and hereby disclaims and negates all other warranties
                            including, without limitation, implied warranties or conditions of merchantability,
                            fitness for a particular purpose, or non-infringement of intellectual property or other
                            violation of rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">7. Limitations</h2>
                        <p className="text-gray-300 leading-relaxed">
                            In no event shall Flight Labs, ProductHuntr, or its suppliers be liable for any damages (including,
                            without limitation, damages for loss of data or profit, or due to business interruption)
                            arising out of the use or inability to use the materials on ProductHuntr.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">8. Modifications</h2>
                        <p className="text-gray-300 leading-relaxed">
                            ProductHuntr may revise these terms of service at any time without notice. By using
                            this service you are agreeing to be bound by the then current version of these terms
                            of service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have any questions about these Terms, please contact us at{' '}
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
