import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import SimpleAppSidebar from "./SimpleAppSidebar";

const SimpleAppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* sidebar hidden on mobile unless toggled */}
      <SimpleAppSidebar
        className={`${sidebarOpen ? "block" : "hidden"} sm:block`}
      />
      <main className="flex-1 overflow-auto relative">
        {/* mobile menu button */}
        <button
          className="sm:hidden p-4"
          onClick={() => setSidebarOpen((o) => !o)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <Outlet />
      </main>
    </div>
  );
};

export default SimpleAppLayout;
