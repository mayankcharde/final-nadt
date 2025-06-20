import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CertificateButton({ courseName, userName }) {
    const [loading, setLoading] = useState(false);

    const downloadCertificate = async () => {
        try {
            if (!userName || userName.trim() === '') {
                toast.error('User name is required. Please refresh the page.');
                return;
            }

            setLoading(true);
            console.log('Generating certificate for:', { userName, courseName }); // Debug log

            const response = await fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/certificate/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: userName.trim(), // Ensure name is trimmed
                    course: courseName,
                    date: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                })
            });

            if (!response.ok) {
                // Try to parse error message from backend
                let errorMsg = 'Certificate generation failed';
                try {
                    const errJson = await response.json();
                    errorMsg = errJson.details || errJson.error || errorMsg;
                } catch {
                    // Ignore JSON parse errors
                }
                throw new Error(errorMsg);
            }

            // Get the blob from the response
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `certificate-${courseName.replace(/\s+/g, '-')}.pdf`;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Certificate downloaded successfully!');
        } catch (error) {
            console.error('Download error:', error);
            toast.error(error.message || 'Failed to download certificate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={downloadCertificate}
            disabled={loading}
            className="w-full bg-gov-accent-500 text-white py-3 px-4 rounded-lg 
                font-semibold transition-all duration-300
                hover:bg-gov-accent-400 hover:shadow-lg hover:shadow-gov-accent-500/20 
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:translate-y-[-2px] active:translate-y-0"
        >
            {loading ? (
                <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                </div>
            ) : (
                'Download Certificate'
            )}
        </button>
    );
}
