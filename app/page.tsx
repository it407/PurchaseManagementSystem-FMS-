
"use client";

import { useState, useEffect } from "react";
import { LoginPage } from "@/components/login-page";
import { Layout } from "@/components/layout";
import { ProcurementProvider } from "@/contexts/procurement-context";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string }>({
    email: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user data exists in localStorage on component mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({
          email: userData.username || userData.email,
          name: userData.name
        });
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (email: string, name: string) => {
    setIsLoggedIn(true);
    setUser({ email, name });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser({ email: '', name: '' });
    localStorage.removeItem("user"); // Clear localStorage on logout
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <ProcurementProvider>
      <Layout user={user} onLogout={handleLogout} />
    </ProcurementProvider>
  );
}