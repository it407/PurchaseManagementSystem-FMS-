
"use client";

import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  userPage: string; 
}

// All available menu items
const allMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: "ChartBar" },
  { id: "indent", label: "Create PO", icon: "FileText" },
  { id: "po-issue", label: "Issue PO", icon: "Send" },
  { id: "follow-up", label: "Follow-up", icon: "RefreshCw" },
  { id: "material-receiving", label: "Gate Entry", icon: "Truck" },
  { id: "weighment", label: "Weighment", icon: "Scale" },
  { id: "qc", label: "Quality Check", icon: "Beaker" },
  { id: "mrn", label: "MRN Generation", icon: "Package" },
  { id: "bills", label: "Submit Bills", icon: "DollarSign" },
  { id: "bill-entry", label: "Bill Entry", icon: "Receipt" },

  
  { id: "CalenderView", label: "Calender View", icon: "Receipt" },

  



];

const iconMap: Record<string, React.ReactNode> = {
  // ... (iconMap same as before)
};

export function Sidebar({
  currentPage,
  onPageChange,
  isOpen,
  onToggle,
  userPage,
}: SidebarProps) {
  
  // Filter menu items based on user's page access
// Filter menu items based on user's page access
const getFilteredMenuItems = () => {
  // If user has "All" or "admin" in page, show all items
  if (!userPage || userPage.trim() === "" || 
      userPage.toLowerCase().includes("all") || 
      userPage.toLowerCase().includes("admin")) {
    return allMenuItems;
  }

  // Split the userPage string by comma and trim each item
  const allowedPages = userPage.split(',').map(page => page.trim().toLowerCase());
  
  // Filter menu items based on allowed pages - match by both id and label
  return allMenuItems.filter(item => {
    const itemLabelLower = item.label.toLowerCase();
    const itemIdLower = item.id.toLowerCase();
    
    return allowedPages.some(allowedPage => 
      itemLabelLower.includes(allowedPage) || itemIdLower.includes(allowedPage)
    );
  });
};
  const filteredMenuItems = getFilteredMenuItems();

  /* Desktop Sidebar */
  const DesktopSidebar = () => (
    <aside
      className={`
        hidden md:flex flex-col
        ${isOpen ? "w-64" : "w-20"}
        bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        text-white overflow-hidden
        transition-all duration-300 ease-in-out
        border-r border-slate-700 shadow-2xl
        relative z-40
      `}
    >
      <div className="p-5 flex items-center justify-between">
        <div
          className={`flex items-center gap-3 overflow-hidden transition-all ${
            isOpen ? "w-40" : "w-0"
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent whitespace-nowrap">
            FMS
          </h2>
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition-all duration-200 hover:scale-110 active:scale-95 shadow"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <div
            className="transition-transform duration-300"
            style={{ transform: isOpen ? "rotate(0deg)" : "rotate(180deg)" }}
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {filteredMenuItems.map((item) => { // Use filteredMenuItems here
          const isActive = currentPage === item.id;
          const Icon = iconMap[item.icon];

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onPageChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200 relative overflow-hidden
                  ${
                    isActive
                      ? "text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }
                `}
                title={!isOpen ? item.label : ""}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl animate-pulse" />
                )}
                <div className="absolute inset-0 bg-slate-700 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                <div
                  className={`relative z-10 transition-all duration-200 ${
                    isActive ? "scale-110" : "group-hover:scale-125"
                  }`}
                >
                  {Icon}
                </div>
                <span
                  className={`
                    relative z-10 text-sm font-medium whitespace-nowrap overflow-hidden
                    transition-all duration-300
                    ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"}
                  `}
                >
                  {item.label}
                </span>
                {!isOpen && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-slate-800">
                    {item.label}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600" />
    </aside>
  );

  /* Mobile Drawer */
  const MobileDrawer = () => (
    <div className="md:hidden">
      {/* Hamburger */}
      <button
        onClick={onToggle}
        className="fixed top-5 left-4 size-9 z-50 p-2 bg-slate-800 rounded-lg shadow-lg hover:bg-slate-700 transition-colors flex justify-center items-center"
        aria-label="Open menu"
      >
        <Menu className=" size-7 text-white" />
      </button>

      {/* Backdrop + Drawer */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onToggle}>
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Procurement
                </h2>
              </div>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {filteredMenuItems.map((item) => { // Use filteredMenuItems here
                const isActive = currentPage === item.id;
                const Icon = iconMap[item.icon];

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      onToggle();
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                          : "text-slate-300 hover:text-white hover:bg-slate-700"
                      }
                    `}
                  >
                    <div className={isActive ? "scale-110" : ""}>{Icon}</div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileDrawer />
    </>
  );
}
