const { SquareClient, SquareEnvironment } = require('square');
require('dotenv').config({ path: '.env.local' });

async function checkPayment() {
    const paymentId = '1CQ6Gar4XutfXBm1g0oL76vEmA7YY'; // The ID from your logs
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;

    if (!accessToken) {
        console.error('Error: SQUARE_ACCESS_TOKEN not found in .env.local');
        return;
    }

    console.log('Checking payment details...');
    console.log('Payment ID:', paymentId);
    console.log('Using Token:', accessToken.substring(0, 10) + '...');

    const client = new SquareClient({
        token: accessToken,
        environment: accessToken.startsWith('sandbox') || accessToken.startsWith('EAA')
            ? SquareEnvironment.Sandbox
            : SquareEnvironment.Production,
    });

    try {
        const response = await client.payments.get(paymentId);
        const payment = response.payment;

        console.log('\n✅ Payment Found!');
        console.log('--------------------------------');
        console.log('Status:', payment.status);
        console.log('Amount:', Number(payment.amountMoney.amount) / 100, payment.amountMoney.currency);
        console.log('Created At:', payment.createdAt);
        console.log('Location ID:', payment.locationId);
        console.log('Order ID:', payment.orderId);
        console.log('Source Type:', payment.sourceType);
        console.log('--------------------------------');
        console.log('\n💡 To find this in your Dashboard:');
        console.log('1. Ensure you are viewing the Sandbox account that owns Location ID:', payment.locationId);
        console.log('2. Check the "Transactions" tab for date:', new Date(payment.createdAt).toLocaleString());

    } catch (error) {
        console.error('\n❌ Error fetching payment:', error.message);
        if (error.errors) {
            console.error('Details:', JSON.stringify(error.errors, null, 2));
        }
    }
}

checkPayment();
