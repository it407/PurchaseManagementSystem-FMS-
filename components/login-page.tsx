

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

import Logo from "../image/zoff.png"
import Image from "next/image"

interface LoginPageProps {
  onLogin: (username: string, name: string, role: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Use GET request with callback parameter (JSONP approach)
      const url = `https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&callback=handleLoginResponse`

      // Create script element for JSONP
      const script = document.createElement('script');
      script.src = url;

      // Define the callback function
      (window as any).handleLoginResponse = (response: any) => {
        // Clean up
        document.head.removeChild(script);
        delete (window as any).handleLoginResponse;

        if (response.success) {
          const userData = response.user;

          // Store user data in localStorage
          localStorage.setItem("user", JSON.stringify({
            name: userData.name,
            username: userData.username,
            id: userData.id,
            role: userData.role,
            page: userData.page,
            loginTime: new Date().toISOString()
          }))

          onLogin(userData.username, userData.name, userData.role)
        } else {
          setError(response.error || "Invalid username or password")
        }
        setIsLoading(false);
      };

      document.head.appendChild(script);

    } catch (error) {
      console.error("Login error:", error)
      setError("Failed to connect to server. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">

        
 <div className="flex items-center bg-orange-100 p-4 rounded-t-lg">
  {/* Logo */}
  <div className="flex items-center justify-center w-24 h-10 bg-orange-600 text-white font-bold text-lg rounded mr-3 shadow-sm">
    ZOFF
  </div>

  {/* Title */}
  <div>
    <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
      Purchase Management System
    </h1>
  </div>
</div>




        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <Input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">Use your registered credentials to login</p>
        </div>
      </Card>
    </div>
  )
}
