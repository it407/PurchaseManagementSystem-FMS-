

"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Dashboard } from "@/components/pages/dashboard"
import { IndentPage } from "@/components/pages/indent-page"
import { POIssuePage } from "@/components/pages/po-issue-page"
import { FollowUpPage } from "@/components/pages/follow-up-page"
import { MaterialReceivingPage } from "@/components/pages/material-receiving-page"
import { WeighmentPage } from "@/components/pages/weighment-page"
import { QCPage } from "@/components/pages/qc-page"
import { MRNPage } from "@/components/pages/mrn-page"
import { BillsPage } from "@/components/pages/bills-page"
import { QCReportPage } from "@/components/pages/qc-report-page"
import { BillEntryPage } from "@/components/pages/bill-entry-page"

interface LayoutProps {
  user: { email: string; name: string; page: string } | null
  onLogout: () => void
}

export function Layout({ user, onLogout }: LayoutProps) {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  // User data localStorage se load karo
 useEffect(() => {
  const storedUser = localStorage.getItem("user")
  if (storedUser) {
    const userData = JSON.parse(storedUser)
    setUserData(userData)
    
    // Agar user ke pass specific page hai to usi page par redirect karo
    if (userData.page && userData.page !== "" && !userData.page.toLowerCase().includes("all")) {
      // User ke allowed pages ko check karo
      const allowedPages = userData.page.split(',').map((page: string) => page.trim().toLowerCase());
      
      // Pehla allowed page set karo as current page
      if (allowedPages.length > 0) {
        const firstPage = getPageIdFromName(allowedPages[0]);
        if (firstPage) {
          setCurrentPage(firstPage);
        }
      }
    }
  }
}, [])


const getPageIdFromName = (pageName: string) => {
  const pageMap: Record<string, string> = {
    'dashboard': 'dashboard',
    'make indent': 'indent',
    'create po': 'indent',
    'issue po': 'po-issue',
    'po-issue': 'po-issue',
    'follow-up': 'follow-up',
    'follow up': 'follow-up',
    'gate entry': 'material-receiving',
    'weighment': 'weighment',
    'quality check': 'qc',
    'qc': 'qc',
    'mrn generation': 'mrn',
    'mrn': 'mrn',
    'submit bills': 'bills',
    'bills': 'bills',
    'bill entry': 'bill-entry'
  };
  
  return pageMap[pageName] || 'dashboard';
}

  const renderPage = () => {
    // Agar user data available nahi hai to loading show karo
    if (!userData) {
      return <div className="flex justify-center items-center h-64">Loading...</div>
    }

    // Current page ke according render karo, chahe user ke pass koi bhi page access ho
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "indent":
        return <IndentPage />
      case "po-issue":
        return <POIssuePage />
      case "follow-up":
        return <FollowUpPage />
      case "material-receiving":
        return <MaterialReceivingPage />
      case "weighment":
        return <WeighmentPage />
      case "qc":
        return <QCPage />
      case "mrn":
        return <MRNPage />
      case "bills":
        return <BillsPage />
      case "qc-report":
        return <QCReportPage />
      case "bill-entry":
        return <BillEntryPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userPage={userData?.page || ""}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <div className="p-6">{renderPage()}</div>
        </main>
        <footer className="bg-gray-900 text-gray-400 text-center py-3 text-sm">
          Powered by Botivate
        </footer>
      </div>
    </div>
  )
}