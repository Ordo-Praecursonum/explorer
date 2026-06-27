import React, { useState } from 'react'
import Sidebar from './Sidebar'
import TopNavigation from './TopNavigation'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  return (
    <div className="app-bg min-h-screen flex">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      {/* Main Content */}
      <main className="flex-1 pl-0 lg:pl-60 transition-all duration-300">
        {/* Top Navigation */}
        <TopNavigation onMenuClick={toggleMobileSidebar} />

        {/* Page Content */}
        <div className="p-5 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}

export default Layout
