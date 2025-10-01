import React, { useState, useEffect, useRef } from 'react';

// --- Firebase Initialization (Required Globals) ---
import {
    getAuth,
    signInAnonymously,
    GoogleAuthProvider,
    signInWithPopup,
    linkWithPopup,
    onAuthStateChanged,
    signOut,
    signInWithCustomToken
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Global variables provided by the canvas environment
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Default Code Content ---
const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <style>
        /* Embedded Tailwind-like styles for offline use */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #1f2937;
            color: #f9fafb;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 1rem;
        }
        .container {
            max-width: 42rem;
            padding: 2rem;
            text-align: center;
            background-color: #374151;
            border-radius: 0.5rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        }
        .container:hover {
            transform: scale(1.02);
        }
        h1 {
            font-size: 2.25rem;
            font-weight: 800;
            color: #60a5fa;
            margin-bottom: 1rem;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        p {
            font-size: 1.125rem;
            color: #d1d5db;
            margin-bottom: 1.5rem;
        }
        .highlight {
            font-weight: 700;
            color: #34d399;
        }
        button {
            padding: 0.75rem 2rem;
            background: linear-gradient(to right, #8b5cf6, #6366f1);
            color: white;
            border: none;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 1.125rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        button:hover {
            background: linear-gradient(to right, #7c3aed, #4f46e5);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello Firebase IDE!</h1>
        <p>
            Edit the code above and click <span class="highlight">Run</span>, or wait for the auto-update!
        </p>
        <button id="actionButton">
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

// --- COMPLETE OFFLINE CSS STYLES ---
const APP_STYLES = `
/* --- CSS Reset & Base Styles --- */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* --- Global Layout & Base Styles --- */
body, html {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #0f172a;
    color: #e5e7eb;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

#root {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

/* --- Scrollbar Style --- */
.custom-scrollbar {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #4b5563 #1f2937;
}
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #4b5563;
    border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background-color: #1f2937;
}

/* --- Flex Utilities --- */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-grow { flex-grow: 1; }
.flex-shrink-0 { flex-shrink: 0; }
.flex-shrink { flex-shrink: 1; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }

/* --- Spacing --- */
.p-0 { padding: 0; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-4 { padding: 1rem; }
.px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.py-0 { padding-top: 0; padding-bottom: 0; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.m-0 { margin: 0; }
.m-1 { margin: 0.25rem; }
.m-2 { margin: 0.5rem; }
.mr-1 { margin-right: 0.25rem; }
.mr-2 { margin-right: 0.5rem; }
.mr-3 { margin-right: 0.75rem; }
.ml-1 { margin-left: 0.25rem; }
.ml-2 { margin-left: 0.5rem; }
.ml-4 { margin-left: 1rem; }
.ml-auto { margin-left: auto; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-1 { margin-top: 0.25rem; }
.gap-0 { gap: 0; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }

/* --- Text & Colors --- */
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }

.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
.font-medium { font-weight: 500; }

.text-gray-300 { color: #d1d5db; }
.text-gray-400 { color: #9ca3af; }
.text-gray-500 { color: #6b7280; }
.text-gray-900 { color: #111827; }
.text-white { color: #ffffff; }
.text-cyan-400 { color: #22d3ee; }
.text-blue-400 { color: #60a5fa; }
.text-red-500 { color: #ef4444; }
.text-green-400 { color: #34d399; }

.text-center { text-align: center; }

.break-all { word-break: break-all; }
.whitespace-nowrap { white-space: nowrap; }

/* --- Background Colors --- */
.bg-slate-900 { background-color: #0f172a; }
.bg-gray-800 { background-color: #1f2937; }
.bg-gray-900 { background-color: #111827; }
.bg-gray-700 { background-color: #374151; }
.bg-gray-600 { background-color: #4b5563; }
.bg-white { background-color: #ffffff; }

/* --- Borders --- */
.border { border-width: 1px; }
.border-t { border-top-width: 1px; }
.border-r { border-right-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-l { border-left-width: 1px; }
.border-gray-700 { border-color: #374151; }
.border-gray-800 { border-color: #1f2937; }

.rounded { border-radius: 0.25rem; }
.rounded-sm { border-radius: 0.125rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-full { border-radius: 9999px; }

/* --- Layout --- */
.h-screen { height: 100vh; }
.h-full { height: 100%; }
.h-4 { height: 1rem; }
.h-6 { height: 1.5rem; }
.h-7 { height: 1.75rem; }
.h-8 { height: 2rem; }
.h-12 { height: 3rem; }
.h-16 { height: 4rem; }
.h-24 { height: 6rem; }
.h-32 { height: 8rem; }
.h-40 { height: 10rem; }
.h-auto { height: auto; }

.w-full { width: 100%; }
.w-0 { width: 0; }
.w-2 { width: 0.5rem; }
.w-4 { width: 1rem; }
.w-6 { width: 1.5rem; }
.w-7 { width: 1.75rem; }
.w-8 { width: 2rem; }
.w-12 { width: 3rem; }
.w-16 { width: 4rem; }
.w-48 { width: 12rem; }
.w-56 { width: 14rem; }
.w-64 { width: 16rem; }
.w-auto { width: auto; }

.min-w-0 { min-width: 0; }
.min-h-0 { min-height: 0; }

.overflow-hidden { overflow: hidden; }
.overflow-x-hidden { overflow-x: hidden; }
.overflow-y-auto { overflow-y: auto; }
.overflow-y-hidden { overflow-y: hidden; }

.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }

.top-0 { top: 0; }
.left-0 { left: 0; }
.right-0 { right: 0; }
.bottom-0 { bottom: 0; }

.z-50 { z-index: 50; }

/* --- Transitions & Animations --- */
.transition-all { transition: all 0.3s ease; }
.transition-colors { transition: color 0.3s ease, background-color 0.3s ease; }
.transition-transform { transition: transform 0.3s ease; }
.duration-150 { transition-duration: 150ms; }
.duration-200 { transition-duration: 200ms; }
.duration-300 { transition-duration: 300ms; }

.transform { transform: translateX(0) translateY(0) rotate(0) skewX(0) skewY(0) scaleX(1) scaleY(1); }
.hover\\:scale-105:hover { transform: scale(1.05); }
.hover\\:-translate-y-1:hover { transform: translateY(-0.25rem); }

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* --- Panels --- */
.ide-panel {
    border-radius: 0.5rem;
    border: 1px solid #374151;
    background-color: #1f2937;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
}

.ide-panel-header {
    padding: 0.5rem 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    border-bottom: 1px solid #374151;
    background-color: #111827;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #e5e7eb;
    flex-shrink: 0;
    min-height: 2.5rem;
}

/* --- Tabs --- */
.ide-tab {
    padding: 0.375rem 0.75rem;
    cursor: pointer;
    color: #9ca3af;
    position: relative;
    transition: color 0.2s;
    border-top-left-radius: 0.375rem;
    border-top-right-radius: 0.375rem;
    white-space: nowrap;
    font-size: 0.875rem;
    flex-shrink: 0;
}

.ide-tab:hover {
    color: #22d3ee;
}

.ide-tab-active {
    background-color: rgba(31, 41, 55, 0.4);
    color: #22d3ee;
    border-bottom: 2px solid #22d3ee;
    margin-bottom: -1px;
}

/* --- Buttons --- */
.button {
    padding: 0.375rem 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    border-radius: 0.5rem;
    transition: all 0.2s;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    white-space: nowrap;
    border: none;
    outline: none;
    flex-shrink: 0;
    min-height: 2rem;
}

.button:hover:not(:disabled) {
    transform: scale(1.05);
}
.button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* Specific gradient buttons */
.btn-run {
    background: linear-gradient(to right, #10b981, #0d9488);
    color: white;
}
.btn-run:hover {
    background: linear-gradient(to right, #059669, #0f766e);
}

.btn-save {
    background: linear-gradient(to right, #3b82f6, #4f46e5);
    color: white;
}
.btn-save:hover {
    background: linear-gradient(to right, #2563eb, #4338ca);
}

.btn-google {
    background: linear-gradient(to right, #2563eb, #4f46e5);
    color: white;
}

.btn-guest {
    background-color: #4b5563;
    color: #e5e7eb;
}
.btn-guest:hover {
    background-color: #374151;
}

.btn-signout {
    background-color: #dc2626;
    color: white;
}
.btn-signout:hover {
    background-color: #b91c1c;
}

/* --- Sidebar --- */
.sidebar {
    transition: all 0.3s ease-in-out;
    background-color: #111827;
    border: 1px solid #374151;
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: 0.5rem;
}

.sidebar-header {
    padding: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    border-bottom: 1px solid #374151;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    min-height: 3rem;
}

.sidebar-item {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    color: #d1d5db;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
    flex-shrink: 0;
}

.sidebar-item:hover {
    background-color: #374151;
}

/* --- Console --- */
.console {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    background-color: #111827;
    flex-grow: 1;
    padding: 0.5rem;
    line-height: 1.25;
}

.console p {
    color: #9ca3af;
    border-bottom: 1px solid #1f2937;
    padding: 0.125rem 0;
    word-break: break-all;
    margin: 0;
}

.console p:last-child {
    border-bottom: none;
}

/* Editor textarea */
.editor-textarea {
    flex-grow: 1;
    padding: 0.75rem;
    background-color: transparent;
    color: #e5e7eb;
    border: none;
    outline: none;
    resize: none;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    caret-color: #22d3ee;
    min-height: 0;
    width: 100%;
}

/* --- Modal & Overlay Styles --- */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
}

.modal-content {
    position: relative;
    background-color: #111827;
    padding: 1.5rem;
    border-radius: 0.75rem;
    max-width: 26rem;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    border: 1px solid #374151;
}

.modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(to right, #22d3ee, #6366f1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.modal-p {
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    color: #d1d5db;
    line-height: 1.5;
}

.modal-footer {
    margin-top: 1rem;
    font-size: 0.75rem;
    color: #9ca3af;
}

/* --- Mobile-First Responsive Design --- */

/* Small screens (mobile) */
@media (max-width: 767px) {
    .ide-panel-header {
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
        min-height: 2.25rem;
    }
    
    .ide-tab {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
    }
    
    .button {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        min-height: 1.75rem;
    }
    
    .editor-textarea {
        padding: 0.5rem;
        font-size: 0.75rem;
    }
    
    .sidebar-header {
        padding: 0.5rem;
        font-size: 0.75rem;
        min-height: 2.5rem;
    }
    
    .sidebar-item {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
    }
    
    .modal-content {
        padding: 1rem;
        margin: 0.5rem;
    }
    
    .modal-title {
        font-size: 1.25rem;
    }
}

/* Extra small screens */
@media (max-width: 480px) {
    .ide-tab {
        padding: 0.25rem 0.375rem;
        font-size: 0.7rem;
    }
    
    .button {
        padding: 0.25rem;
        font-size: 0.7rem;
    }
    
    .button-text {
        display: none;
    }
    
    .button-icon-only {
        padding: 0.375rem;
    }
}

/* --- Mobile-Specific Components --- */
.mobile-tab-selector {
    display: none;
}

.mobile-bottom-bar {
    display: none;
}

@media (max-width: 767px) {
    .desktop-only {
        display: none !important;
    }
    
    .mobile-tab-selector {
        display: flex;
        background-color: #111827;
        border-top: 1px solid #374151;
        padding: 0.5rem;
        gap: 0.5rem;
    }
    
    .mobile-tab-button {
        flex: 1;
        padding: 0.5rem;
        background-color: #374151;
        border: none;
        border-radius: 0.375rem;
        color: #e5e7eb;
        font-size: 0.75rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .mobile-tab-button.active {
        background-color: #22d3ee;
        color: #111827;
        font-weight: 600;
    }
    
    .mobile-bottom-bar {
        display: flex;
        background-color: #111827;
        border-top: 1px solid #374151;
        padding: 0.5rem;
        gap: 0.5rem;
        justify-content: space-around;
    }
    
    .mobile-bottom-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 0.625rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: all 0.2s;
        flex: 1;
    }
    
    .mobile-bottom-button.active {
        color: #22d3ee;
        background-color: rgba(34, 211, 238, 0.1);
    }
    
    .mobile-bottom-button svg {
        margin-bottom: 0.25rem;
    }
}

/* --- Cursor Utilities --- */
.cursor-col-resize {
    cursor: col-resize;
}
.cursor-pointer {
    cursor: pointer;
}
.cursor-not-allowed {
    cursor: not-allowed;
}

/* --- SVG Icon Sizing --- */
svg {
    display: inline-block;
    vertical-align: middle;
    flex-shrink: 0;
}

/* --- Layout Containers --- */
.main-container {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    background-color: #0f172a;
}

.content-area {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.editor-preview-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* --- Utility Classes for Mobile --- */
.no-scroll {
    overflow: hidden;
}

.touch-action-none {
    touch-action: none;
}

/* --- Preview Iframe --- */
.preview-iframe {
    width: 100%;
    height: 100%;
    background: white;
    border: none;
}

/* --- Code Playground Specific Styles --- */
.code-playground {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.playground-area {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.editor-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.preview-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* --- FIXED LAYOUT STYLES --- */
.editor-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.preview-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.split-view {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
    gap: 0;
}

.editor-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.preview-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.code-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.editor-content {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
}

.preview-content {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
}

/* Center the content properly */
.centered-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.full-height {
    height: 100%;
}

.full-width {
    width: 100%;
}

/* --- NEW: Code Editor directly under tabs --- */
.code-editor-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.code-tabs-container {
    display: flex;
    background-color: #111827;
    border-bottom: 1px solid #374151;
    padding: 0 0.75rem;
    flex-shrink: 0;
}

.code-tab {
    padding: 0.75rem 1rem;
    cursor: pointer;
    color: #9ca3af;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    font-size: 0.875rem;
    font-weight: 500;
}

.code-tab:hover {
    color: #22d3ee;
    background-color: rgba(34, 211, 238, 0.05);
}

.code-tab-active {
    color: #22d3ee;
    border-bottom-color: #22d3ee;
    background-color: rgba(34, 211, 238, 0.1);
}

.code-editor-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.code-textarea {
    flex: 1;
    padding: 1rem;
    background-color: transparent;
    color: #e5e7eb;
    border: none;
    outline: none;
    resize: none;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    caret-color: #22d3ee;
    width: 100%;
    min-height: 0;
}

/* Mobile specific for new layout */
@media (max-width: 767px) {
    .code-tab {
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
    }
    
    .code-textarea {
        padding: 0.75rem;
        font-size: 0.75rem;
    }
}

/* --- FIXED: Playground starts under IDE nav --- */
.ide-workspace {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    margin-top: 0;
}

.workspace-content {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
    gap: 0.5rem;
    padding: 0;
}

/* Remove extra padding from main containers */
.main-workspace {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    padding: 0;
    margin: 0;
}
`;

// --- Main App Component ---
const App = () => {
    // --- State Management ---
    const [html, setHtml] = useState(DEFAULT_HTML.trim());
    const [css, setCss] = useState(DEFAULT_CSS.trim());
    const [js, setJs] = useState(DEFAULT_JS.trim());

    const [activeTab, setActiveTab] = useState('html');
    const [consoleOutput, setConsoleOutput] = useState([]);
    const [showWelcomeModal, setShowWelcomeModal] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isConsoleOpen, setIsConsoleOpen] = useState(false);
    const [editorWidth, setEditorWidth] = useState(50);
    const [showPreview, setShowPreview] = useState(true);
    const [mobileView, setMobileView] = useState('editor');

    // --- Firebase State ---
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState("Guest");
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [authError, setAuthError] = useState(null);

    const containerRef = useRef(null);
    const iframeRef = useRef(null);
    const autoSaveTimerRef = useRef(null);

    // --- Check if mobile screen ---
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // --- Firebase Auth Listener ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed:", user);
            if (user) {
                setUserId(user.uid);
                setUserName(user.displayName || user.email || "Anonymous");
                setAuthError(null);

                // Load user data only if signed in (not guest)
                if (!user.isAnonymous) {
                    const projectDocRef = doc(db, `/artifacts/${appId}/users/${user.uid}/projects/my-project`);
                    try {
                        const projectDocSnap = await getDoc(projectDocRef);
                        if (projectDocSnap.exists()) {
                            const data = projectDocSnap.data();
                            console.log("Loaded project data:", data);
                            setHtml(data.html || DEFAULT_HTML.trim());
                            setCss(data.css || DEFAULT_CSS.trim());
                            setJs(data.js || DEFAULT_JS.trim());
                            setLastSaved(data.lastSaved ? new Date(data.lastSaved) : null);
                        }
                    } catch (e) {
                        console.error("Error loading project:", e);
                    }
                } else {
                    // Guest user - use defaults
                    setHtml(DEFAULT_HTML.trim());
                    setCss(DEFAULT_CSS.trim());
                    setJs(DEFAULT_JS.trim());
                }

                setShowWelcomeModal(false);

            } else {
                console.log("No user, setting to guest mode");
                setUserId(null);
                setUserName("Guest");
                setConsoleOutput([]);
                setLastSaved(null);
                setShowWelcomeModal(true);
            }

            setIsAuthReady(true);
            setAuthChecked(true);
        });

        // Custom token sign-in logic for the Canvas environment
        if (initialAuthToken) {
            console.log("Attempting custom token sign-in");
            signInWithCustomToken(auth, initialAuthToken).catch(e => {
                console.error("Custom token sign-in failed, falling back to anonymous:", e);
                signInAnonymously(auth).catch(err => {
                    console.error("Anonymous sign-in fallback failed:", err);
                    setAuthError(err.message);
                });
            });
        } else {
            // Start as guest by default
            console.log("Starting as guest user");
            signInAnonymously(auth).catch(e => {
                console.error("Anonymous sign-in failed:", e);
                setAuthError(e.message);
            });
        }

        return () => unsubscribe();
    }, []);

    // --- Mobile layout effect ---
    useEffect(() => {
        if (isMobile) {
            setShowPreview(mobileView === 'preview');
            setIsConsoleOpen(mobileView === 'console');
        }
    }, [mobileView, isMobile]);

    // --- Authentication Handlers ---
    const handleAnonymousSignIn = async () => {
        console.log("Starting anonymous sign-in");
        try {
            await signInAnonymously(auth);
            setShowWelcomeModal(false);
            setAuthError(null);
        } catch (e) {
            console.error("Anonymous sign-in failed:", e);
            setAuthError(e.message);
        }
    };

    const handleGoogleSignIn = async () => {
        console.log("Starting Google sign-in");
        const provider = new GoogleAuthProvider();
        try {
            // Add scopes if needed
            provider.addScope('profile');
            provider.addScope('email');

            // Set custom parameters
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            let result;
            if (auth.currentUser && auth.currentUser.isAnonymous) {
                console.log("Linking anonymous account with Google");
                result = await linkWithPopup(auth.currentUser, provider);
            } else {
                console.log("Regular Google sign-in");
                result = await signInWithPopup(auth, provider);
            }

            console.log("Google sign-in successful:", result.user);
            setShowWelcomeModal(false);
            setAuthError(null);
        } catch (error) {
            console.error("Google Sign-In failed:", error);
            setAuthError(error.message);

            // If linking fails, try regular sign-in
            if (error.code === 'auth/credential-already-in-use') {
                try {
                    console.log("Retrying with regular Google sign-in");
                    await signInWithPopup(auth, provider);
                    setShowWelcomeModal(false);
                    setAuthError(null);
                } catch (retryError) {
                    console.error("Retry also failed:", retryError);
                    setAuthError(retryError.message);
                }
            }
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setAuthError(null);
        } catch (error) {
            console.error("Error signing out:", error);
            setAuthError(error.message);
        }
    };

    // --- Data Persistence ---
    const saveProject = async () => {
        if (!userId || !isAuthReady) {
            console.warn("Cannot save: User is a guest or auth not ready.");
            return;
        }
        setIsSaving(true);
        try {
            const projectDocRef = doc(db, `/artifacts/${appId}/users/${userId}/projects/my-project`);
            await setDoc(projectDocRef, {
                html, css, js,
                lastSaved: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setLastSaved(new Date());
            console.log("Project saved successfully");
        } catch (e) {
            console.error("Error saving project:", e);
            setAuthError("Failed to save project: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save effect
    useEffect(() => {
        if (userId && isAuthReady) {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            autoSaveTimerRef.current = setTimeout(() => {
                saveProject();
            }, 2000);
            return () => {
                if (autoSaveTimerRef.current) {
                    clearTimeout(autoSaveTimerRef.current);
                }
            };
        }
    }, [html, css, js, userId, isAuthReady]);

    // --- Iframe Communication (Console Logging) ---
    const handleIframeMessage = (event) => {
        // Accept messages from any origin for development
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
        setShowPreview(true);
        if (isMobile) setMobileView('preview');
        setConsoleOutput([]);
        if (iframeRef.current) {
            iframeRef.current.contentWindow.postMessage({ type: 'update', html, css, js }, '*');
        }
    };

    // Live update effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (showPreview) {
                updatePreview();
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [html, css, js, showPreview]);

    // --- Editor and Layout Logic ---
    const renderEditor = () => {
        const editorProps = {
            spellCheck: "false",
            className: "code-textarea",
            autoFocus: !isMobile,
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
            console.warn("Export requires sign-in. Please sign in to download your files.");
            setAuthError("Please sign in to export files");
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

    // Split Pane Resizing Logic (desktop only)
    const startResize = (e) => {
        if (isMobile) return;
        e.preventDefault();
        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', stopResize);
    };

    const onDrag = (e) => {
        if (!containerRef.current || isMobile) return;
        const containerWidth = containerRef.current.offsetWidth;
        const newWidth = ((e.clientX - containerRef.current.offsetLeft) / containerWidth) * 100;
        if (newWidth > 10 && newWidth < 90) {
            setEditorWidth(newWidth);
        }
    };

    const stopResize = () => {
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', stopResize);
    };

    // Mobile view handlers
    const handleMobileViewChange = (view) => {
        setMobileView(view);
    };

    return (
        <div className="main-container">
            {/* Inline ALL styles for complete offline functionality */}
            <style>{APP_STYLES}</style>

            {/* Show loading until auth is checked */}
            {!authChecked && (
                <div className="flex items-center justify-center h-full w-full bg-slate-900 text-cyan-400">
                    <p className="p-4 text-center font-bold text-lg text-cyan-400 animate-pulse">Loading IDE...</p>
                </div>
            )}

            {/* Conditional Rendering of Modal and Main Content */}
            {authChecked && (
                <>
                    {/* --- Welcome Modal (Overlay) --- */}
                    {showWelcomeModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h1 className="modal-title">
                                    Welcome to Your Firebase IDE
                                </h1>
                                <p className="modal-p">
                                    {userId ? `Welcome back, ${userName}! Your progress is safe.` : `Start coding right away!`}
                                </p>

                                {authError && (
                                    <div className="mb-4 p-2 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
                                        Auth Error: {authError}
                                    </div>
                                )}

                                <button
                                    onClick={handleGoogleSignIn}
                                    className={`mb-4 w-full button btn-google`}
                                >
                                    {/* Inline SVG for Google logo to avoid external dependency */}
                                    <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" width="24" height="24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Login with Google to Save Progress
                                </button>
                                <button
                                    onClick={handleAnonymousSignIn}
                                    className={`w-full button btn-guest`}
                                >
                                    Continue as Guest (Start Coding)
                                </button>
                                <p className="modal-footer">
                                    Guests can code freely, but progress won't be saved unless you sign in.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* --- Main IDE Layout --- */}
                    <div className="main-workspace">
                        {/* Top Bar / Navbar - Compact for mobile */}
                        <div className="ide-panel flex items-center px-2 py-1 flex-shrink-0 m-2 mb-0">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-1 mr-2 text-gray-400 hover:text-cyan-400 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                            </button>

                            {/* Button Group - Compact for mobile */}
                            <div className="flex items-center ml-auto gap-1 flex-shrink-0">
                                <span className="text-xs text-gray-500 desktop-only mr-2 whitespace-nowrap">
                                    {userId ? (
                                        isSaving ? 'Saving...' : lastSaved ? `Saved: ${lastSaved.toLocaleTimeString()}` : 'Ready'
                                    ) : 'Guest Mode'}
                                </span>
                                <button
                                    className={`button btn-run p-1 desktop-only:px-2`}
                                    onClick={updatePreview}
                                    title="Run Code"
                                >
                                    <span className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                        <span className="desktop-only ml-1">Run</span>
                                    </span>
                                </button>
                                {userId && (
                                    <button
                                        className={`button btn-save p-1 desktop-only:px-2`}
                                        onClick={saveProject}
                                        disabled={isSaving}
                                        title="Save Project"
                                    >
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            </svg>
                                            <span className="desktop-only ml-1">{isSaving ? '...' : 'Save'}</span>
                                        </span>
                                    </button>
                                )}
                                <button
                                    className={`button btn-guest p-1 desktop-only:px-2`}
                                    onClick={handleExport}
                                    disabled={!userId}
                                    title="Export Files"
                                >
                                    <span className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span className="desktop-only ml-1">Export</span>
                                    </span>
                                </button>
                                {userId ? (
                                    <button
                                        className={`button btn-signout p-1 desktop-only:px-2`}
                                        onClick={handleSignOut}
                                        title="Sign Out"
                                    >
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="desktop-only ml-1">Sign Out</span>
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        className={`button btn-google p-1 desktop-only:px-2`}
                                        onClick={() => setShowWelcomeModal(true)}
                                        title="Sign In"
                                    >
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="desktop-only ml-1">Sign In</span>
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Main Workspace - Starts directly under nav */}
                        <div className="ide-workspace">
                            <div className="workspace-content">
                                {/* Collapsible Project Sidebar */}
                                <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-48 md:w-56 flex-shrink-0' : 'w-0 overflow-hidden'}`}>
                                    <div className="sidebar h-full">
                                        <div className="sidebar-header">
                                            <span className="text-sm">User: {userName}</span>
                                            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-400 hover:text-white transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                        <ul className="p-2 text-sm flex-grow custom-scrollbar">
                                            <li className="p-1 mt-1 text-gray-100 font-medium text-sm">
                                                <span className="mr-1 text-blue-400">&#x25BC;</span>
                                                <span>my-project</span>
                                            </li>
                                            <li className="sidebar-item ml-3" onClick={() => { setActiveTab('html'); setIsSidebarOpen(false); }}>
                                                <span className="text-gray-500">&#x25FE;</span>
                                                <span>index.html</span>
                                            </li>
                                            <li className="sidebar-item ml-3" onClick={() => { setActiveTab('css'); setIsSidebarOpen(false); }}>
                                                <span className="text-gray-500">&#x25FE;</span>
                                                <span>style.css</span>
                                            </li>
                                            <li className="sidebar-item ml-3" onClick={() => { setActiveTab('js'); setIsSidebarOpen(false); }}>
                                                <span className="text-gray-500">&#x25FE;</span>
                                                <span>script.js</span>
                                            </li>
                                        </ul>
                                        <div className="p-2 border-t border-gray-700 text-xs text-gray-500 flex-shrink-0">
                                            User ID: <span className="text-gray-400 break-all">{userId || 'N/A (Guest)'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Playground Content */}
                                <div className="flex-grow flex flex-col gap-1 full-height">
                                    {/* Editor and Preview Split Pane */}
                                    <div className="split-view">
                                        {/* Code Editors - Show on desktop or when mobile view is editor */}
                                        {(!isMobile || mobileView === 'editor') && (
                                            <div
                                                className="editor-panel"
                                                style={{
                                                    width: showPreview && !isMobile ? `${editorWidth}%` : '100%',
                                                    display: isMobile && mobileView !== 'editor' ? 'none' : 'flex'
                                                }}
                                            >
                                                {/* Code Editor directly under tabs */}
                                                <div className="code-editor-section full-height">
                                                    {/* Code Tabs */}
                                                    <div className="code-tabs-container">
                                                        <div
                                                            className={`code-tab ${activeTab === 'html' ? 'code-tab-active' : ''}`}
                                                            onClick={() => setActiveTab('html')}
                                                        >
                                                            index.html
                                                        </div>
                                                        <div
                                                            className={`code-tab ${activeTab === 'css' ? 'code-tab-active' : ''}`}
                                                            onClick={() => setActiveTab('css')}
                                                        >
                                                            style.css
                                                        </div>
                                                        <div
                                                            className={`code-tab ${activeTab === 'js' ? 'code-tab-active' : ''}`}
                                                            onClick={() => setActiveTab('js')}
                                                        >
                                                            script.js
                                                        </div>
                                                    </div>

                                                    {/* Code Editor Area */}
                                                    <div className="code-editor-wrapper">
                                                        {renderEditor()}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Draggable Divider (Hidden on mobile) */}
                                        {showPreview && !isMobile && (
                                            <div
                                                className="hidden md:block w-2 cursor-col-resize bg-gray-700 hover:bg-cyan-400 transition-colors duration-150"
                                                onMouseDown={startResize}
                                                title="Drag to resize"
                                            />
                                        )}

                                        {/* Preview Pane - Show on desktop or when mobile view is preview */}
                                        {showPreview && (!isMobile || mobileView === 'preview') && (
                                            <div
                                                className="preview-panel"
                                                style={{
                                                    width: !isMobile ? `${100 - editorWidth}%` : '100%',
                                                    display: isMobile && mobileView !== 'preview' ? 'none' : 'flex'
                                                }}
                                            >
                                                <div className="preview-container full-height">
                                                    <div className="ide-panel full-height">
                                                        <div className="ide-panel-header text-sm">
                                                            Live Preview
                                                            <button
                                                                onClick={() => {
                                                                    setShowPreview(false);
                                                                    if (isMobile) setMobileView('editor');
                                                                }}
                                                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-sm hover:bg-gray-700"
                                                                title="Hide Preview"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <div className="preview-content">
                                                            <iframe
                                                                id="preview"
                                                                title="live-preview"
                                                                ref={iframeRef}
                                                                className="preview-iframe"
                                                                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                                                                srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><style id="preview-style"></style></head><body><script>
                                                                    window.addEventListener('message', (event) => {
                                                                        if (event.data.type === 'update') {
                                                                            document.open();
                                                                            document.write(event.data.html);
                                                                            document.close();
                                                                            const styleTag = document.getElementById('preview-style');
                                                                            if (styleTag) styleTag.textContent = event.data.css;
                                                                            const scriptTag = document.createElement('script');
                                                                            scriptTag.textContent = event.data.js;
                                                                            document.body.appendChild(scriptTag);
                                                                        }
                                                                    });
                                                                    console.log = function() { 
                                                                        parent.postMessage({ type: 'log', message: Array.from(arguments).join(' ') }, '*'); 
                                                                    };
                                                                </script></body></html>`}
                                                            ></iframe>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Console Panel - Show on desktop or when mobile view is console */}
                                    {(isConsoleOpen && !isMobile) || (isMobile && mobileView === 'console') ? (
                                        <div className="ide-panel h-32 md:h-40 flex-shrink-0">
                                            <div className="ide-panel-header text-sm font-bold">
                                                Console
                                                <button
                                                    onClick={() => {
                                                        setIsConsoleOpen(false);
                                                        if (isMobile) setMobileView('editor');
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-sm hover:bg-gray-700"
                                                    title="Hide Console"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="console custom-scrollbar">
                                                {consoleOutput.length === 0 ? (
                                                    <p className="text-gray-500 border-none">Run your code to see console output here...</p>
                                                ) : (
                                                    consoleOutput.map((output, index) => (
                                                        <p key={index}>
                                                            <span className="text-cyan-400 mr-2">&gt;</span>{output}
                                                        </p>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Mobile Bottom Navigation Bar */}
                            {isMobile && (
                                <div className="mobile-bottom-bar">
                                    <button
                                        className={`mobile-bottom-button ${mobileView === 'editor' ? 'active' : ''}`}
                                        onClick={() => handleMobileViewChange('editor')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="16 18 22 12 16 6"></polyline>
                                            <polyline points="8 6 2 12 8 18"></polyline>
                                        </svg>
                                        Code
                                    </button>
                                    <button
                                        className={`mobile-bottom-button ${mobileView === 'preview' ? 'active' : ''}`}
                                        onClick={() => handleMobileViewChange('preview')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                            <circle cx="8" cy="8" r="2"></circle>
                                            <polyline points="22,16 16,16 14,18"></polyline>
                                        </svg>
                                        Preview
                                    </button>
                                    <button
                                        className={`mobile-bottom-button ${mobileView === 'console' ? 'active' : ''}`}
                                        onClick={() => handleMobileViewChange('console')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="4 17 10 11 4 5"></polyline>
                                            <line x1="12" y1="19" x2="20" y2="19"></line>
                                        </svg>
                                        Console
                                    </button>
                                    <button
                                        className="mobile-bottom-button"
                                        onClick={updatePreview}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                        Run
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default App;

