/* eslint-disable no-unused-vars */
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import React from "react";
import { useDashboard } from './DashboardContext';
import { useNavigate } from "react-router-dom";

export default function ProductCard2() {
    const courseDetails = {
        name: "Web Development Course",
        amount: 1,
        image: "https://www.elegantthemes.com/blog/wp-content/uploads/2018/12/top11.png"
    };

    const [amount, setamount] = useState(courseDetails.amount);
    const { triggerRefresh } = useDashboard();
    const navigate = useNavigate();

    // handlePayment Function
    const handlePayment = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/order`, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    amount
                })
            });

            const data = await res.json();
            console.log(data);
            handlePaymentVerify(data.data)
        } catch (error) {
            console.log(error);
        }
    }

    // handlePaymentVerify Function
    const handlePaymentVerify = async (data) => {
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

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: data.amount,
            currency: data.currency,
            name: "NADT Platform",
            description: "Web Development Course Purchase",
            order_id: data.id,
            prefill: { name, email },
            handler: async (response) => {
                try {
                    const res = await fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/verify`, {
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            courseDetails,
                            userId: JSON.parse(atob(localStorage.getItem('token').split('.')[1])).userId
                        })
                    });

                    const verifyData = await res.json();
                    if (verifyData.success) {
                        // Generate and email receipt
                        await fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/receipt`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name,
                                email,
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                amount: data.amount / 100,
                                courseId: courseDetails.name
                            })
                        });
                        toast.success("📧 Receipt emailed successfully!");
                        toast.success(verifyData.message);
                        triggerRefresh();
                        navigate('/dashboard?section=mycourses');
                    } else {
                        throw new Error(verifyData.message || 'Payment verification failed');
                    }
                } catch (error) {
                    console.error('Payment verification error:', error);
                    toast.error(error.message || "Payment verification failed");
                }
            },
            theme: {
                color: "#5f63b8"
            }
        };
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
    }
    
    return (
        <div className="mt-6 w-96 bg-[#222f3e] text-white rounded-xl overflow-hidden shadow-lg">
            {/* CardHeader */}
            <div className="relative h-64 bg-[#2C3A47]">
                {/* Image  */}
                <img
                    src="https://www.elegantthemes.com/blog/wp-content/uploads/2018/12/top11.png"
                    alt="Web Development Course"
                    className="w-full h-full object-contain p-2"
                />
            </div>

            {/* CardBody */}
            <div className="p-6">
                {/* Title */}
                <h5 className="text-xl font-bold mb-2">
                    Web Development Course
                </h5>

                {/* Price  */}
                <p>
                    ₹1 <span className="line-through">₹999</span>
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