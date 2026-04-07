Student Portfolio Builder: Users can input data to generate a downloadable personal portfolio/resume.
	
Using completely offline AI models which run directly in the browser via ONNX Runtime Web and Transformers.js, even on low-end devices. When the user wants to print, it prints neatly as a professional ATS resume.

Frontend:	React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4
State:		Zustand 5
AI:		ONNX Runtime Web, Transformers.js, Gemini API
Auth/DB:	Firebase (Auth + Firestore + Cloud Functions)
Offline:	IndexedDB, Service Worker (PWA)
Backend:	None -- everything runs in-browser. No server.