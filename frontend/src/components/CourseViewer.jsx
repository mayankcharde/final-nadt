import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PYTHON_COURSE_VIDEOS, JAVA_COURSE_VIDEOS, WEB_COURSE_VIDEOS } from '../constants/courseContent';
import CertificateButton from './CertificateButton';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_HOST_URL;

export default function CourseViewer() {
    const { courseName } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentVideo, setCurrentVideo] = useState(PYTHON_COURSE_VIDEOS[0]);
    const [progress, setProgress] = useState([]);
    const [videoError, setVideoError] = useState(null);
    const [signedVideoUrl, setSignedVideoUrl] = useState('');
    const [userName, setUserName] = useState('');
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        // Check course access before loading content
        const checkAccess = async () => {
            try {
                if (!localStorage.getItem('token')) {
                    navigate('/login');
                    return;
                }

                const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).userId;
                const response = await fetch(
                    `${BASE_URL}/api/payment/check-access/${userId}/${courseName}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                const data = await response.json();
                if (!data.hasAccess) {
                    toast.error("You don't have access to this course");
                    navigate('/dashboard');
                    return;
                }

                setProgress(data.progress || []);
                setHasAccess(true); // User has access if UserCourse exists
                setLoading(false);
            } catch (error) {
                console.error('Access check error:', error);
                toast.error('Error verifying course access');
                navigate('/dashboard');
            }
        };

        checkAccess();
    }, [courseName, navigate]);

    const getCourseVideos = (courseName) => {
        switch(courseName.toLowerCase()) {
            case 'java course':
                return JAVA_COURSE_VIDEOS;
            case 'web development course':
                return WEB_COURSE_VIDEOS;
            case 'python course':
                return PYTHON_COURSE_VIDEOS;
            default:
                return [];
        }
    };

    useEffect(() => {
        const courseVideos = getCourseVideos(courseName);
        if (courseVideos.length > 0) {
            setCurrentVideo(courseVideos[0]);
        }
    }, [courseName]);

    const getCourseFolder = (courseName) => {
        const folderMap = {
            'Python Course': 'python',
            'Java Course': 'java',
            'Web Development Course': 'webdev'
        };
        return folderMap[courseName] || courseName.toLowerCase().split(' ')[0];
    };

    const loadVideoUrl = useCallback(async () => {
        if (!currentVideo || loading) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No auth token');

            const courseFolder = getCourseFolder(courseName);
            if (!courseFolder) throw new Error('Invalid course folder');

            // Construct the endpoint URL with error checking
            if (!BASE_URL) {
                throw new Error('Backend URL not configured. Check environment variables.');
            }

            const endpoint = new URL(`/api/videos/signed-url/${courseFolder}/${currentVideo.id}`, BASE_URL).toString();
            
            console.log('Fetching signed URL from:', endpoint);

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success || !data.signedUrl) {
                throw new Error(data.error || 'Invalid response from server');
            }

            // Validate URL before setting
            try {
                new URL(data.signedUrl);
                setSignedVideoUrl(data.signedUrl);
                setVideoError(null);
            } catch (urlError) {
                throw new Error(`Invalid URL received from server: ${data.signedUrl}`);
            }

        } catch (error) {
            console.error('Error getting signed URL:', error);
            setVideoError({
                message: 'Failed to load video',
                details: error.message
            });
            setSignedVideoUrl('');
            toast.error('Failed to load video: ' + error.message);
        }
    }, [currentVideo, courseName, loading, BASE_URL]);

    useEffect(() => {
        loadVideoUrl();
    }, [loadVideoUrl]);

    const handleVideoEnd = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No auth token');

            const userId = JSON.parse(atob(token.split('.')[1])).userId;
            
            const response = await fetch(`${BASE_URL}/api/payment/update-progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    courseName,
                    videoId: currentVideo.id,
                    watched: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update progress');
            }

            // Immediately update progress state to show green tick
            setProgress(prev => {
                const newProgress = [...prev];
                const existingProgress = newProgress.find(p => p.videoId === currentVideo.id);
                if (existingProgress) {
                    existingProgress.watched = true;
                } else {
                    newProgress.push({ videoId: currentVideo.id, watched: true });
                }
                return newProgress;
            });

            // Show completion toast
            toast.success(
                <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                            clipRule="evenodd"
                        />
                    </svg>
                    <div>
                        <p className="font-medium">Video completed!</p>
                        <p className="text-sm opacity-75">
                            {currentVideo.title}
                        </p>
                    </div>
                </div>
            );

            // Auto-play next video after a short delay
            const courseVideos = getCourseVideos(courseName);
            const currentIndex = courseVideos.findIndex(v => v.id === currentVideo.id);
            if (currentIndex < courseVideos.length - 1) {
                const nextVideo = courseVideos[currentIndex + 1];
                setTimeout(() => {
                    setCurrentVideo(nextVideo);
                    toast.success(
                        <div className="flex items-center space-x-2">
                            <span>▶️</span>
                            <div>
                                <p className="font-medium">Playing next</p>
                                <p className="text-sm opacity-75">{nextVideo.title}</p>
                            </div>
                        </div>
                    );
                }, 1500); // Delay before next video
            } else {
                // Course completion message
                toast.success(
                    <div className="flex items-center space-x-2">
                        <span>🎉</span>
                        <div>
                            <p className="font-medium">Course completed!</p>
                            <p className="text-sm opacity-75">Congratulations!</p>
                        </div>
                    </div>
                );
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            toast.error('Failed to save progress');
        }
    };

    const getVideoErrorMessage = (error) => {
        if (!error) return 'Unknown playback error';

        switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
                return 'Video playback was aborted';
            case MediaError.MEDIA_ERR_NETWORK:
                return 'Network error prevented video download';
            case MediaError.MEDIA_ERR_DECODE:
                return 'Video decoding failed - file may be corrupted';
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                return 'Video format not supported by browser';
            default:
                return `Video playback error (${error.code})`;
        }
    };

    const logVideoError = (errorEvent, type = 'video') => {
        // Extract detailed error information
        const videoElement = errorEvent.target;
        const error = {
            type,
            timestamp: new Date().toISOString(),
            sourceUrl: videoElement?.currentSrc || signedVideoUrl,
            details: {
                errorCode: videoElement?.error?.code,
                errorMessage: videoElement?.error?.message,
                readyState: videoElement?.readyState,
                networkState: videoElement?.networkState,
                paused: videoElement?.paused,
                ended: videoElement?.ended,
                currentTime: videoElement?.currentTime,
                src: videoElement?.src,
                // Add more debugging info
                eventType: errorEvent.type,
                bubbles: errorEvent.bubbles,
                cancelable: errorEvent.cancelable,
                timeStamp: errorEvent.timeStamp,
                // Connection info if available
                connection: navigator.connection ? {
                    downlink: navigator.connection.downlink,
                    effectiveType: navigator.connection.effectiveType,
                    rtt: navigator.connection.rtt,
                } : null
            }
        };

        console.error(`${type} Error:`, error);
        return error;
    };

    useEffect(() => {
        // Get user's name from token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = token.split('.')[1];
                const decoded = JSON.parse(atob(payload));
                console.log('Decoded token:', decoded); // Debug log
                if (decoded.name) {
                    setUserName(decoded.name);
                } else {
                    // If name not in token, fetch from backend
                    fetchUserName(decoded.userId);
                }
            } catch (error) {
                console.error('Error decoding token:', error);
                toast.error('Error getting user information');
            }
        }
    }, []);

    const fetchUserName = async (userId) => {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            if (data.success && data.name) {
                setUserName(data.name);
            } else {
                throw new Error(data.error || 'Invalid user data received');
            }
        } catch (error) {
            console.error('Error fetching user name:', error);
            toast.error('Could not load user information');
            // Fallback to token data
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    if (decoded.name) {
                        setUserName(decoded.name);
                    }
                } catch (tokenError) {
                    console.error('Error decoding token:', tokenError);
                }
            }
        }
    };

    // Add function to check if course is completed
    const isCourseCompleted = () => {
        const courseVideos = getCourseVideos(courseName);
        return courseVideos.every(video => 
            progress.some(p => p.videoId === video.id && p.watched)
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gov-surface-900 to-black">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gov-primary-500"></div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-red-500">
                    Access denied. Please complete payment to access this course.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gov-surface-900 to-black">
            {/* Top Navigation */}
            <nav className="fixed top-0 w-full bg-black/50 backdrop-blur-xl border-b border-gov-border/10 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h2 className="text-xl font-display font-semibold text-white">
                            {courseName}
                        </h2>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 rounded-xl bg-white/5 text-white 
                                font-semibold transition-all duration-300 
                                hover:bg-white/10 hover:scale-105 border border-white/10"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Video Player */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card overflow-hidden">
                            <div className="aspect-w-16 aspect-h-9">
                                {signedVideoUrl ? (
                                    <video
                                        key={currentVideo.id}
                                        controls
                                        autoPlay
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const error = {
                                                message: getVideoErrorMessage(e.target?.error),
                                                details: {
                                                    url: signedVideoUrl,
                                                    errorCode: e.target?.error?.code,
                                                    errorMessage: e.target?.error?.message
                                                }
                                            };

                                            console.error('Video playback error:', error);
                                            setVideoError(error);
                                            toast.error(`Video playback error: ${error.message}`);
                                        }}
                                        onEnded={handleVideoEnd}
                                    >
                                        <source src={signedVideoUrl} type="video/mp4" />
                                        Your browser does not support video playback
                                    </video>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full bg-black/40 backdrop-blur-sm p-4">
                                        {videoError ? (
                                            <>
                                                <div className="text-red-400 mb-2">
                                                    {videoError.message}
                                                </div>
                                                <button
                                                    onClick={loadVideoUrl}
                                                    className="mt-4 btn-primary"
                                                >
                                                    Retry Loading Video
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gov-primary-500 mb-4" />
                                                <p className="text-white/70">Loading video...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-white mb-2">{currentVideo.title}</h2>
                                <p className="text-white/70">{currentVideo.description}</p>
                                <div className="mt-4 flex items-center text-sm text-white/50">
                                    <span className="mr-4">Duration: {currentVideo.duration}</span>
                                    {progress.find(p => p.videoId === currentVideo.id)?.watched && (
                                        <span className="flex items-center text-gov-primary-400">
                                            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course Content Sidebar */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-bold text-white mb-6">Course Content</h3>
                        <div className="space-y-2">
                            {getCourseVideos(courseName).map((video, index) => {
                                const isWatched = progress.find(p => p.videoId === video.id)?.watched;
                                const isCurrent = currentVideo.id === video.id;
                                
                                return (
                                    <button
                                        key={video.id}
                                        onClick={() => setCurrentVideo(video)}
                                        className={`w-full flex items-center p-4 rounded-xl transition-all duration-300 border
                                            ${isCurrent 
                                                ? 'bg-gov-primary-600/10 text-gov-primary-400 border-gov-primary-500/20' 
                                                : 'text-white/70 hover:bg-white/5 border-transparent hover:border-white/10'
                                            } relative group`}
                                    >
                                        {/* Video number/completion icon */}
                                        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-3 
                                            transition-all duration-300 ${
                                                isWatched 
                                                    ? 'bg-green-500/20' 
                                                    : isCurrent 
                                                        ? 'bg-gov-primary-500/20'
                                                        : 'bg-white/10'
                                            }`}
                                        >
                                            {isWatched ? (
                                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" 
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                                        clipRule="evenodd" 
                                                    />
                                                </svg>
                                            ) : (
                                                <span className={`${isCurrent ? 'text-gov-primary-400' : 'text-white/50'}`}>
                                                    {index + 1}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 text-left">
                                            <p className={`font-medium ${
                                                isWatched 
                                                    ? 'text-green-400' 
                                                    : isCurrent 
                                                        ? 'text-gov-primary-400' 
                                                        : ''
                                            }`}>
                                                {video.title}
                                            </p>
                                            <p className="text-sm text-white/50">{video.duration}</p>
                                        </div>

                                        {/* Status indicators */}
                                        <div className="absolute right-4 flex items-center space-x-2">
                                            {isWatched && (
                                                <span className="text-green-400 text-sm">Completed</span>
                                            )}
                                            {isCurrent && !isWatched && (
                                                <div className="flex items-center text-gov-primary-400">
                                                    <div className="w-2 h-2 bg-gov-primary-400 rounded-full animate-pulse mr-2"></div>
                                                    <span className="text-sm">Current</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Add Certificate Button */}
                        {isCourseCompleted() && (
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <h4 className="text-lg font-semibold text-white mb-4">
                                    🎉 Course Completed!
                                </h4>
                                <CertificateButton 
                                    courseName={courseName}
                                    userName={userName || ''} // Provide fallback empty string
                                />
                                {!userName && (
                                    <p className="text-red-400 text-sm mt-2">
                                        Error: Unable to get user name. Please try refreshing the page.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}