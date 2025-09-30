import React, { useState, useEffect, useRef } from 'react';
// These global variables are provided by the Canvas environment
// We mock them here for standalone clarity, but they rely on the host environment
// for real Firebase functionality.
// NOTE: We rely on the environment to handle the import path for firebase-keys.
import {
    getAuth,
    signInAnonymously,
    GoogleAuthProvider,
    signInWithPopup,
    linkWithPopup,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// --- Environment Variables Mock/Access ---
// In a real Canvas environment, these are injected globally.
// We use a safe check here.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyBqmKHmWXuLjZtFIWS_aNdjv1r_9SHxPas",
    authDomain: "web-ide-6f8b0.firebaseapp.com",
    projectId: "web-ide-6f8b0",
    storageBucket: "web-ide-6f8b0.firebasestorage.app",
    messagingSenderId: "479851404387",
    appId: "1:479851404387:web:812bef16222a8d2d8aac56",
    measurementId: "G-PGLWD094JZ"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Default starter code for new users
const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <!-- Load Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-gray-100 p-4 font-sans">
    <div id="app" class="max-w-xl mx-auto p-8 text-center bg-gray-800 rounded-lg shadow-2xl transition-all duration-300 transform hover:scale-105">
        <h1 class="text-4xl font-extrabold text-blue-400 mb-4 animate-pulse">Hello Firebase IDE!</h1>
        <p class="text-lg text-gray-300 mb-6">
            Edit the code above and click <span class="font-bold text-green-400">Run</span>, or wait for the auto-update!
        </p>
        <button id="actionButton" class="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full font-bold text-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1">
            Click Me
        </button>
    </div>
</body>
</html>`;

const DEFAULT_CSS = `
/* Basic Styling for the preview */
body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    overflow-x: hidden;
}
`;

const DEFAULT_JS = `
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('actionButton');
    if (button) {
        button.addEventListener('click', () => {
            // Check your console panel below for this message!
            console.log('Button was clicked at: ' + new Date().toLocaleTimeString());
        });
    }
    console.log("Welcome to your IDE's JavaScript console!");
});
`;

// Main App component
const App = () => {
    // --- State Management ---
    const [html, setHtml] = useState(DEFAULT_HTML.trim());
    const [css, setCss] = useState(DEFAULT_CSS.trim());
    const [js, setJs] = useState(DEFAULT_JS.trim());

    const [activeTab, setActiveTab] = useState('html');
    const [consoleOutput, setConsoleOutput] = useState([]);
    const [showWelcomeModal, setShowWelcomeModal] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isConsoleOpen, setIsConsoleOpen] = useState(true);
    const [editorWidth, setEditorWidth] = useState(50); // Initial width percentage
    const [showPreview, setShowPreview] = useState(true); // New state for preview visibility

    // --- Firebase State & Refs ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState("Guest");
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    const containerRef = useRef(null);
    const iframeRef = useRef(null);
    const autoSaveTimerRef = useRef(null);

    // --- Core Effects: Firebase Initialization ---
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            setAuth(getAuth(app));
            setDb(getFirestore(app));
        } catch (e) {
            console.error("Error initializing Firebase:", e);
        }
    }, []);

    // --- Core Effects: Authentication & Data Loading ---
    useEffect(() => {
        if (!auth || !db) return;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                setUserId(user.uid);
                setUserName(user.displayName || user.email || "Anonymous");
                setIsAuthReady(true);
                setShowWelcomeModal(false);

                // Load project data from Firestore
                const projectDocRef = doc(db, `/artifacts/${appId}/users/${user.uid}/projects/my-project`);
                try {
                    const projectDocSnap = await getDoc(projectDocRef);
                    if (projectDocSnap.exists()) {
                        const data = projectDocSnap.data();
                        setHtml(data.html || DEFAULT_HTML.trim());
                        setCss(data.css || DEFAULT_CSS.trim());
                        setJs(data.js || DEFAULT_JS.trim());
                        setLastSaved(data.lastSaved ? new Date(data.lastSaved) : null);
                        console.log("Project loaded from Firestore.");
                    } else {
                        // Use default content if no project is found
                        setHtml(DEFAULT_HTML.trim());
                        setCss(DEFAULT_CSS.trim());
                        setJs(DEFAULT_JS.trim());
                        console.log("No existing project found. Using default content.");
                    }
                } catch (e) {
                    console.error("Error loading project:", e);
                    // Reset to defaults if loading fails
                    setHtml(DEFAULT_HTML.trim());
                    setCss(DEFAULT_CSS.trim());
                    setJs(DEFAULT_JS.trim());
                }
            } else {
                // User is signed out
                setUserId(null);
                setUserName("Guest");
                setIsAuthReady(false);
                setShowWelcomeModal(true);
                setConsoleOutput([]);
                setLastSaved(null);
            }
        });

        return () => unsubscribe();
    }, [auth, db]);

    // --- Firebase Actions ---
    const handleAnonymousSignIn = async () => {
        if (!auth) return;
        try {
            // Note: onAuthStateChanged will handle state updates
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
        } catch (e) {
            console.error("Anonymous sign-in failed:", e);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        try {
            if (auth.currentUser && auth.currentUser.isAnonymous) {
                // Link anonymous account
                await linkWithPopup(auth.currentUser, provider);
                console.log("Anonymous account linked with Google.");
            } else {
                // Standard sign-in
                await signInWithPopup(auth, provider);
                console.log("Signed in with Google.");
            }
            setShowWelcomeModal(false);
        } catch (error) {
            console.error("Google Sign-In failed:", error);
        }
    };

    const handleSignOut = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            console.log("User signed out.");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const saveProject = async () => {
        if (!db || !userId || !isAuthReady) {
            console.error("Firestore not ready or user not authenticated to save.");
            return;
        }

        setIsSaving(true);
        try {
            const projectDocRef = doc(db, `/artifacts/${appId}/users/${userId}/projects/my-project`);
            await setDoc(projectDocRef, {
                html,
                css,
                js,
                lastSaved: new Date().toISOString()
            }, { merge: true });
            setLastSaved(new Date());
            console.log("Project saved successfully!");
        } catch (e) {
            console.error("Error saving project:", e);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Core Effects: Auto-Save ---
    useEffect(() => {
        if (userId && isAuthReady) {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            autoSaveTimerRef.current = setTimeout(() => {
                saveProject();
            }, 2000); // 2 second debounce

            return () => {
                if (autoSaveTimerRef.current) {
                    clearTimeout(autoSaveTimerRef.current);
                }
            };
        }
    }, [html, css, js, userId, isAuthReady]);

    // --- Iframe Communication ---
    const handleIframeMessage = (event) => {
        if (iframeRef.current && event.source !== iframeRef.current.contentWindow) {
            return;
        }

        const { type, message } = event.data;
        if (type === 'log') {
            setConsoleOutput(prevOutput => [...prevOutput, String(message)]);
        }
        else if (type === 'prompt' || type === 'confirm' || type === 'alert') {
            console.warn(`Iframe code tried to call ${type}: "${message}" (Not interactive from preview)`);
        }
    };

    useEffect(() => {
        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, []);

    const updatePreview = () => {
        setConsoleOutput([]); // Clear console on explicit run
        if (iframeRef.current) {
            // Send the code to the iframe to update its content without reloading
            iframeRef.current.contentWindow.postMessage({ type: 'update', html, css, js }, '*');
        }
    };

    // --- Core Effects: Auto-Update Preview ---
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (showPreview) {
                updatePreview();
            }
        }, 500); // 500ms debounce for live preview

        return () => clearTimeout(timeoutId);
    }, [html, css, js, showPreview]);

    // --- Layout and Utility Functions ---

    const renderEditor = () => {
        const editorProps = {
            spellCheck: "false",
            className: "flex-grow p-4 bg-transparent text-gray-300 border-none outline-none resize-none font-mono text-sm leading-6 caret-cyan-400 focus:outline-none",
            autoFocus: true,
        };
        return (
            <div className="relative flex flex-col flex-grow">
                {renderActiveEditor()}
                {!showPreview && (
                    <div className="absolute top-4 right-4 z-10">
                        <button
                            onClick={() => setShowPreview(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 opacity-90 hover:opacity-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 01-4 4H4"></path></svg>
                            Show Preview
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderActiveEditor = () => {
        const editorProps = {
            spellCheck: "false",
            className: "flex-grow p-4 bg-transparent text-gray-300 border-none outline-none resize-none font-mono text-sm leading-6 caret-cyan-400 focus:outline-none",
            autoFocus: true,
        };

        switch (activeTab) {
            case 'html':
                return <textarea {...editorProps} value={html} onChange={(e) => setHtml(e.target.value)} />;
            case 'css':
                return <textarea {...editorProps} value={css} onChange={(e) => setCss(e.target.value)} />;
            case 'js':
                return <textarea {...editorProps} value={js} onChange={(e) => setJs(e.target.value)} />;
            default:
                return null;
        }
    };

    const handleExport = () => {
        if (!userId) {
            console.warn("Export requires sign-in. Please sign in (Google or Anonymous) to save and export your project files.");
            return;
        }

        const createAndDownloadFile = (filename, content, type) => {
            const blob = new Blob([content], { type: type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        createAndDownloadFile('index.html', html, 'text/html');
        createAndDownloadFile('style.css', css, 'text/css');
        createAndDownloadFile('script.js', js, 'text/javascript');
    };

    // Drag functionality for the splitter
    const startResize = (e) => {
        e.preventDefault();
        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', stopResize);
    };

    const onDrag = (e) => {
        if (!containerRef.current) return;
        const containerWidth = containerRef.current.offsetWidth;
        const newWidth = (e.clientX / containerWidth) * 100;

        if (newWidth > 10 && newWidth < 90) {
            setEditorWidth(newWidth);
        }
    };

    const stopResize = () => {
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', stopResize);
    };

    // --- Tailwind Classes ---
    const idePanelClass = "rounded-lg border border-gray-700 bg-gray-800 shadow-lg overflow-hidden";
    const idePanelHeaderClass = "p-3 font-bold text-sm border-b border-gray-700 bg-gray-900 flex items-center justify-between text-gray-200";
    const ideTabClass = "p-2 px-4 cursor-pointer text-gray-400 hover:text-cyan-400 transition-colors relative";
    const ideActiveTabClass = "bg-gray-900 text-cyan-400 border-b-2 border-cyan-400 rounded-t-md";
    const ideButtonClass = "px-4 py-2 text-sm rounded-full font-bold transition-all transform hover:scale-105";
    const scrollbarStyle = { scrollbarWidth: 'thin', scrollbarColor: '#4a5568 #2d3748' };

    return (
        <div className="flex flex-col h-screen overflow-hidden font-sans text-gray-300 bg-gray-950">
            {/* --- Welcome Modal --- */}
            {showWelcomeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="relative bg-gray-900 p-8 rounded-2xl max-w-xl text-center shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 opacity-20 -z-10"></div>
                        <h1 className="text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500 animate-pulse-text">
                            Welcome to Your Firebase IDE
                        </h1>
                        <p className="mb-8 text-lg text-gray-200 leading-relaxed">
                            {userId ? `Welcome back, ${userName}! Your progress is safe.` : `Login to save your progress permanently.`}
                        </p>
                        {/* Google Sign-In Button */}
                        <button
                            onClick={handleGoogleSignIn}
                            className={`
                                mb-4 w-full flex items-center justify-center
                                bg-gradient-to-r from-blue-600 to-indigo-700 text-white
                                px-8 py-4 rounded-full font-bold text-xl shadow-lg
                                hover:from-blue-700 hover:to-indigo-800 transition-all transform hover:-translate-y-1 hover:shadow-xl
                            `}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="h-7 w-7 mr-3" />
                            Login with Google to Continue
                        </button>

                        {/* Guest Mode Button */}
                        <button
                            onClick={handleAnonymousSignIn}
                            className={`
                                w-full flex items-center justify-center
                                bg-gray-700 text-gray-200
                                px-8 py-3 rounded-full font-semibold text-lg
                                hover:bg-gray-600 transition-all transform hover:scale-105
                            `}
                        >
                            Continue as Guest (No Save)
                        </button>

                        <p className="mt-6 text-sm text-gray-400">
                            Guests can code, but progress won't be saved unless you sign in.
                        </p>
                    </div>
                </div>
            )}

            {/* --- Main IDE Layout --- */}
            <div ref={containerRef} className="flex-grow flex flex-col p-2 gap-2">
                {/* Top Bar / Navbar */}
                <div className={`${idePanelClass} flex items-center p-3 bg-gray-900 border-gray-700 rounded-lg shadow-md`}>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 mr-3 text-gray-400 hover:text-cyan-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <div className="flex-grow flex space-x-1 border-r border-gray-700 pr-3">
                        <div
                            className={`${ideTabClass} ${activeTab === 'html' ? ideActiveTabClass : ''}`}
                            onClick={() => setActiveTab('html')}
                        >
                            index.html
                        </div>
                        <div
                            className={`${ideTabClass} ${activeTab === 'css' ? ideActiveTabClass : ''}`}
                            onClick={() => setActiveTab('css')}
                        >
                            style.css
                        </div>
                        <div
                            className={`${ideTabClass} ${activeTab === 'js' ? ideActiveTabClass : ''}`}
                            onClick={() => setActiveTab('js')}
                        >
                            script.js
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-auto">
                        <span className="text-xs text-gray-500 mr-2 hidden sm:inline-block">
                            {userId ? (
                                isSaving ? 'Saving...' : lastSaved ? `Last Saved: ${lastSaved.toLocaleTimeString()}` : 'Ready'
                            ) : 'Guest Mode (No Save)'}
                        </span>
                        <button
                            className={`${ideButtonClass} bg-gradient-to-r from-green-500 to-teal-600 text-white`}
                            onClick={updatePreview}
                        >
                            <span className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg> Run</span>
                        </button>
                        {userId && (
                            <button
                                className={`${ideButtonClass} bg-gradient-to-r from-blue-500 to-indigo-600 text-white ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                onClick={saveProject}
                                disabled={isSaving}
                            >
                                <span className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> {isSaving ? 'Saving...' : 'Save'}</span>
                            </button>
                        )}
                        <button
                            className={`${ideButtonClass} bg-gray-600 text-white hover:bg-gray-700 ${!userId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleExport}
                            disabled={!userId} // Export is disabled if userId is null (Guest Mode)
                        >
                            <span className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export</span>
                        </button>
                        {userId ? (
                            <button
                                className={`${ideButtonClass} bg-red-600 text-white hover:bg-red-700`}
                                onClick={handleSignOut}
                            >
                                <span className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Sign Out</span>
                            </button>
                        ) : (
                            <button
                                className={`${ideButtonClass} bg-blue-600 text-white hover:bg-blue-700`}
                                onClick={() => setShowWelcomeModal(true)}
                            >
                                <span className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg> Sign In</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Area: Sidebar + Editors/Preview */}
                <div className="flex-grow flex flex-col md:flex-row gap-2">
                    {/* Collapsible Project Sidebar */}
                    <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64 md:w-56' : 'w-0 overflow-hidden'}`}>
                        <div className={`${idePanelClass} h-full flex flex-col bg-gray-900 border-gray-700`}>
                            <div className={`${idePanelHeaderClass} text-base font-extrabold border-gray-700`}>
                                <span>User: {userName}</span>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-400 hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <ul className="p-2 text-sm flex-grow overflow-y-auto" style={scrollbarStyle}>
                                <li className="p-1 mt-1 text-gray-100 font-medium text-base">
                                    <span className="mr-1 text-blue-400">&#x25BC;</span>
                                    <span>my-project</span>
                                </li>
                                <li className="p-1 ml-4 text-gray-300 hover:bg-gray-700 rounded-md cursor-pointer flex items-center gap-2 transition-colors">
                                    <span className="text-gray-500">&#x25FE;</span>
                                    <span>index.html</span>
                                </li>
                                <li className="p-1 ml-4 text-gray-300 hover:bg-gray-700 rounded-md cursor-pointer flex items-center gap-2 transition-colors">
                                    <span className="text-gray-500">&#x25FE;</span>
                                    <span>style.css</span>
                                </li>
                                <li className="p-1 ml-4 text-gray-300 hover:bg-gray-700 rounded-md cursor-pointer flex items-center gap-2 transition-colors">
                                    <span className="text-gray-500">&#x25FE;</span>
                                    <span>script.js</span>
                                </li>
                            </ul>
                            <div className="p-2 border-t border-gray-700 text-xs text-gray-500">
                                User ID: <span className="text-gray-400 break-all">{userId || 'N/A (Guest)'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Code Editors & Preview Container */}
                    <div className="flex-grow flex flex-col gap-2">
                        {/* Editor and Preview Split Pane */}
                        <div className="flex-grow flex flex-col md:flex-row gap-0">
                            {/* Code Editors */}
                            <div
                                className={`${idePanelClass} flex flex-col transition-all duration-200 relative`}
                                style={{ width: showPreview ? `min(100%, ${editorWidth}%)` : '100%' }}
                            >
                                {renderEditor()}
                            </div>

                            {/* Draggable Divider - Hide if preview is closed */}
                            {showPreview && (
                                <div
                                    className="hidden md:block w-2 cursor-col-resize bg-gray-700 hover:bg-cyan-500 transition-colors duration-150"
                                    onMouseDown={startResize}
                                    title="Drag to resize"
                                />
                            )}

                            {/* Preview Pane - Hide if preview is closed */}
                            {showPreview && (
                                <div className={`${idePanelClass} flex flex-col transition-all duration-200`} style={{ width: `min(100%, ${100 - editorWidth}%)` }}>
                                    <div className={`${idePanelHeaderClass} border-gray-700 text-base`}>
                                        Live Preview
                                        <button
                                            onClick={() => setShowPreview(false)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-700"
                                            title="Hide Preview"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                    <iframe
                                        id="preview"
                                        title="live-preview"
                                        ref={iframeRef}
                                        className="w-full h-full bg-white"
                                        // Use a strict sandbox environment
                                        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                                        srcDoc={`
                                            <!DOCTYPE html>
                                            <html lang="en">
                                            <head>
                                                <meta charset="UTF-8">
                                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                                <title>Live Preview</title>
                                                <script src="https://cdn.tailwindcss.com"></script>
                                                <style id="preview-style"></style>
                                                <style>
                                                    /* Global preview styles to reset defaults or provide base theme */
                                                    html, body { margin: 0; padding: 0; min-height: 100%; box-sizing: border-box; }
                                                </style>
                                            </head>
                                            <body>
                                                <div id="preview-content"></div>
                                                <script id="preview-script"></script>
    
                                                <script>
                                                    // Function to send messages back to the parent IDE (React App)
                                                    const postMessage = (type, message) => {
                                                        // Convert complex types to string for transport
                                                        let formattedMessage = String(message);
                                                        try {
                                                            if (typeof message === 'object' && message !== null) {
                                                                // Handle array/object logging
                                                                formattedMessage = JSON.stringify(message, (key, value) => {
                                                                    if (value instanceof Node) return '[DOM Node]';
                                                                    return value;
                                                                }, 2);
                                                            }
                                                        } catch (e) {
                                                            formattedMessage = 'Error serializing object: ' + e.message;
                                                        }
                                                        parent.postMessage({ type, message: formattedMessage }, '*');
                                                    };
    
                                                    // Intercept console.log and other functions
                                                    const originalConsoleLog = console.log;
                                                    console.log = (...args) => {
                                                        originalConsoleLog(...args); // Log in the iframe's console too
                                                        try {
                                                            const message = args.map(arg => {
                                                                if (typeof arg === 'object' && arg !== null) {
                                                                    return JSON.stringify(arg, (key, value) => {
                                                                        if (value instanceof Node) return '[DOM Node]';
                                                                        return value;
                                                                    });
                                                                }
                                                                return String(arg);
                                                            }).join(' ');
                                                            postMessage('log', message);
                                                        } catch (e) {
                                                            postMessage('log', 'Error logging object to console.');
                                                        }
                                                    };
    
                                                    // Intercept window functions (as they are blocked by sandbox)
                                                    window.alert = (msg) => postMessage('alert', msg);
                                                    window.prompt = (msg) => postMessage('prompt', msg);
                                                    window.confirm = (msg) => postMessage('confirm', msg);
    
                                                    // Listener to receive code updates from the parent IDE
                                                    window.addEventListener('message', (event) => {
                                                        const { type, html, css, js } = event.data;
    
                                                        if (type === 'update') {
                                                            // 1. Update HTML
                                                            const contentDiv = document.getElementById('preview-content');
                                                            if (contentDiv) contentDiv.innerHTML = html;
    
                                                            // 2. Update CSS
                                                            const styleTag = document.getElementById('preview-style');
                                                            if (styleTag) styleTag.textContent = css;
    
                                                            // 3. Update JS (execute the new script)
                                                            const oldScript = document.getElementById('preview-script');
                                                            const newScript = document.createElement('script');
                                                            newScript.id = 'preview-script';
                                                            newScript.textContent = js;
    
                                                            if (oldScript) {
                                                                oldScript.remove();
                                                            }
                                                            document.body.appendChild(newScript);
                                                        }
                                                    });
    
                                                    // Initial message to log that the preview is ready
                                                    console.log("Preview environment loaded. Code running.");
                                                </script>
                                            </body>
                                            </html>
                                        `}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Console Panel */}
                        <div
                            className={`${idePanelClass} transition-all duration-300`}
                            style={{ height: isConsoleOpen ? '200px' : '40px' }}
                        >
                            <div className={idePanelHeaderClass} onClick={() => setIsConsoleOpen(!isConsoleOpen)} style={{ cursor: 'pointer' }}>
                                <span>Console Output ({consoleOutput.length})</span>
                                <div className="flex items-center space-x-2">
                                    <button onClick={(e) => { e.stopPropagation(); setConsoleOutput([]); }} className="text-gray-400 hover:text-red-400 transition-colors" title="Clear Console">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.74 9L15.3 12m-2.18 3L13 18m-4.5 0L6 18m-1.5-6h1.5M10.2 6L11 9m-1.5-3h4.5M3 6h18M6 6v13a2 2 0 002 2h8a2 2 0 002-2V6"></path></svg>
                                    </button>
                                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            {isConsoleOpen ? <polyline points="18 15 12 9 6 15"></polyline> : <polyline points="6 9 12 15 18 9"></polyline>}
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            {isConsoleOpen && (
                                <div className="p-2 text-xs overflow-y-auto h-[160px] bg-gray-900 font-mono" style={scrollbarStyle}>
                                    {consoleOutput.length === 0 ? (
                                        <p className="text-gray-500">Console is clear. Run the code to see output.</p>
                                    ) : (
                                        consoleOutput.map((log, index) => (
                                            <p key={index} className="text-green-400 border-b border-gray-800 last:border-b-0 py-[2px] whitespace-pre-wrap">
                                                {`> ${log}`}
                                            </p>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;

