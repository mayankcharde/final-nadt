import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import DownloadReceiptButton from './DownloadReceiptButton';

export default function RazorpayCheckout({ courseId, courseName, amount }) {
    const [paid, setPaid] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (!name || !email) {
            toast.error('Please enter your name and email');
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/order`,
                { amount }
            );
            const order = data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'NADT Platform',
                description: `${courseName} Purchase`,
                order_id: order.id,
                prefill: { name, email },
                handler: async function (response) {
                    try {
                        await axios.post(
                            `${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/receipt`,
                            {
                                name,
                                email,
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                amount: order.amount / 100,
                                courseId,
                            }
                        );
                        setOrderId(response.razorpay_order_id);
                        setPaid(true);
                        toast.success('Payment successful!');
                        toast.success('📧 Receipt emailed successfully!');
                    } catch (err) {
                        toast.error('Receipt/email failed');
                    }
                },
                theme: { color: '#5f63b8' }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error('Payment initiation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="mb-2 p-2 border rounded w-full"
                disabled={paid}
            />
            <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mb-2 p-2 border rounded w-full"
                disabled={paid}
            />
            <button
                onClick={handlePayment}
                disabled={loading || paid}
                className="bg-gov-primary-600 text-white px-4 py-2 rounded w-full"
            >
                {loading ? 'Processing...' : 'Pay & Get Receipt'}
            </button>
            {/* Only render DownloadReceiptButton if paid and orderId exists */}
            {paid && orderId && (
                <DownloadReceiptButton orderId={orderId} disabled={false} />
            )}
        </div>
    );
}
