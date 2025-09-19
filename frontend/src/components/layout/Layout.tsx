import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export const Layout: React.FC = () => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}