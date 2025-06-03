import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { NhostProvider } from "@nhost/react";
import { nhost } from "./lib/nhost";
import Home from "./components/Home";
import Signup from "./components/Signup";
import Signin from "./components/Signin";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Initialize session when component mounts
    const currentSession = nhost.auth.getSession();
    setSession(currentSession);

    // Listen to auth state changes and update session accordingly
    const unsubscribe = nhost.auth.onAuthStateChanged((_, session) => {
      setSession(session);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NhostProvider nhost={nhost}>
      <Router>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={session ? <Home session={session} /> : <Signin />}
          />
        </Routes>
      </Router>
    </NhostProvider>
  );
}

export default App;
