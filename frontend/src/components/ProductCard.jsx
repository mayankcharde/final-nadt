/* eslint-disable no-unused-vars */
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDashboard } from './DashboardContext';

export default function ProductCard() {
    const navigate = useNavigate();
    // Define course details inside component
    const courseDetails = {
        name: "Python Course",
        amount: 350,
        image: "https://www.emexotechnologies.com/wp-content/uploads/2021/01/python-training-emexo.png"
    };

    const [amount, setamount] = useState(courseDetails.amount);
    const { triggerRefresh } = useDashboard();

    // handlePayment Function
    const handlePayment = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Please login first");
                navigate('/login');
                return;
            }

            // Prompt for name/email before payment
            const name = prompt("Enter your full name for the receipt:");
            if (!name || !name.trim()) {
                toast.error("Name is required for receipt");
                return;
            }
            const email = prompt("Enter your email for the receipt:");
            if (!email || !email.trim()) {
                toast.error("Email is required for receipt");
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: courseDetails.amount,
                    receipt: `order_${Date.now()}`,
                    currency: "INR",
                    notes: {
                        courseName: courseDetails.name
                    }
                })
            });

            if (!res.ok) {
                throw new Error('Failed to create order');
            }

            const data = await res.json();
            
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.data.amount,
                currency: data.data.currency,
                name: "NADT Platform",
                description: courseDetails.name + " Purchase",
                order_id: data.data.id,
                prefill: {
                    name,
                    email
                },
                handler: async function (response) {
                    try {
                        // Verify payment
                        const verifyRes = await fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                courseDetails,
                                userId: JSON.parse(atob(token.split('.')[1])).userId
                            })
                        });

                        if (!verifyRes.ok) {
                            throw new Error('Payment verification failed');
                        }

                        const verifyData = await verifyRes.json();
                        toast.success(verifyData.message);

                        // Generate and email receipt
                        await fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/receipt`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name,
                                email,
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                amount: data.data.amount / 100,
                                courseId: courseDetails.name
                            })
                        });
                        toast.success("📧 Receipt emailed successfully!");

                        triggerRefresh();
                        navigate('/dashboard?section=mycourses');
                    } catch (error) {
                        console.error('Verification/receipt error:', error);
                        toast.error("Payment verification or receipt failed");
                    }
                },
                modal: {
                    ondismiss: function() {
                        toast.error("Payment cancelled");
                    }
                },
                theme: {
                    color: "#5f63b8"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function(response) {
                toast.error(response.error.description || "Payment failed");
            });
            rzp1.open();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.message || "Error initiating payment");
        }
    };

    return (
        <div className="mt-6 w-96 bg-gov-surface-800 text-gov-surface-50 rounded-xl overflow-hidden shadow-lg border border-gov-border">
            {/* CardHeader */}
            <div className="relative h-64 bg-gov-surface-900">
                <img
                    src={courseDetails.image}
                    alt={courseDetails.name}
                    className="w-full h-full object-contain p-2"
                />
            </div>

            {/* CardBody */}
            <div className="p-6">
                <h5 className="text-xl font-bold mb-2 text-gov-surface-50">
                    {courseDetails.name}
                </h5>

                <p className="text-gov-surface-100">
                    ₹{courseDetails.amount} <span className="line-through text-gov-surface-200">₹699</span>
                </p>
            </div>

            {/* CardFooter */}
            <div className="px-6 pt-0 pb-6">
                <button 
                    onClick={handlePayment} 
                    className="w-full bg-gov-primary-600 text-gov-surface-50 py-3 px-4 rounded-lg 
                        font-semibold transition-all duration-300
                        hover:bg-gov-primary-500 hover:shadow-lg hover:shadow-gov-primary-600/20 
                        hover:translate-y-[-2px]
                        active:transform active:scale-98 active:translate-y-0
                        focus:outline-none focus:ring-2 focus:ring-gov-primary-500 focus:ring-offset-2
                        focus:ring-offset-gov-surface-800"
                >
                    Buy Now
                </button>
                <Toaster/>
            </div>
        </div>
    );
}