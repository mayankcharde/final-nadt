import React from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function DownloadReceiptButton({ orderId, disabled }) {
    const handleDownload = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/receipt/${orderId}`,
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `receipt-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success("Receipt downloaded!");
        } catch (err) {
            toast.error("Failed to download receipt");
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={disabled}
            className="mt-3 bg-gov-accent-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
            Download Receipt
        </button>
    );
}

// If you see this error, it means you do not have react-toastify installed in your frontend project.
// To fix this, run the following command in your frontend directory:

// npm install react-toastify
