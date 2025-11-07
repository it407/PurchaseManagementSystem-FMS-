
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Package, Clock, FileText, AlertTriangle, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CancelDataTable } from "../pages/canceltable"; // Adjust path as needed

export function Dashboard() {
  const [viewType, setViewType] = useState<"total" | "pending">("total");
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheetData, setSheetData] = useState<any[]>([]);

  useEffect(() => {
    fetchSheetData();
  }, []);

  // FMS sheet data fetch karo
  const fetchSheetData = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Fetching FMS sheet data...");

      const url = `https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec?sheet=FMS&action=fetch`;

      const response = await fetch(url);
      const data = await response.json();
      console.log("FMS Sheet API Response:", data);

      if (data.success && data.data) {
        setSheetData(data.data);
        calculateDashboardData(data.data);
      } else {
        setError("Failed to fetch sheet data");
      }
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      setError("Network error: Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Frontend mein hi data calculate karo
  const calculateDashboardData = (data: any[]) => {
    console.log("Calculating dashboard data from", data.length, "rows");

    // Column indexes (0-based)
    const COLUMNS = {
      PO: 4, // Column E
      ISSUE_PO: 10, // Column J
      FOLLOW_UP: 17, // Column Q
      MATERIAL_RECEIVING: 22, // Column V
      WEIGHMENT: 27, // Column AA
      QC: 34, // Column AH
      MATERIAL_UNLOADING: 41, // Column AO
      SUBMIT_BILL: 46 // Column AT
    };

    let result = {
      totalPO: 0,
      totalIssuePO: 0,
      totalFollowUp: 0,
      totalMaterialReceiving: 0,
      totalWeighment: 0,
      totalQC: 0,
      totalMaterialUnloading: 0,
      totalSubmitBill: 0,
      pendingIssuePO: 0,
      pendingFollowUp: 0,
      pendingMaterialReceiving: 0,
      pendingWeighment: 0,
      pendingQC: 0,
      pendingMaterialUnloading: 0,
      pendingSubmitBill: 0
    };

    // Row 6 se start karo (headers skip karo)
    for (let i = 6; i < data.length; i++) {
      const row = data[i];

      // Total counts (any non-empty value)
      if (row[COLUMNS.PO] && row[COLUMNS.PO].toString().trim() !== "") result.totalPO++;
      if (row[COLUMNS.ISSUE_PO] && row[COLUMNS.ISSUE_PO].toString().trim() !== "") result.totalIssuePO++;
      if (row[COLUMNS.FOLLOW_UP] && row[COLUMNS.FOLLOW_UP].toString().trim() !== "") result.totalFollowUp++;
      if (row[COLUMNS.MATERIAL_RECEIVING] && row[COLUMNS.MATERIAL_RECEIVING].toString().trim() !== "") result.totalMaterialReceiving++;
      if (row[COLUMNS.WEIGHMENT] && row[COLUMNS.WEIGHMENT].toString().trim() !== "") result.totalWeighment++;
      if (row[COLUMNS.QC] && row[COLUMNS.QC].toString().trim() !== "") result.totalQC++;
      if (row[COLUMNS.MATERIAL_UNLOADING] && row[COLUMNS.MATERIAL_UNLOADING].toString().trim() !== "") result.totalMaterialUnloading++;
      if (row[COLUMNS.SUBMIT_BILL] && row[COLUMNS.SUBMIT_BILL].toString().trim() !== "") result.totalSubmitBill++;

      // Pending counts (empty or "Null" values)
      if (!row[COLUMNS.ISSUE_PO] || row[COLUMNS.ISSUE_PO].toString().trim() === "" || row[COLUMNS.ISSUE_PO].toString().trim().toLowerCase() === "null") {
        result.pendingIssuePO++;
      }
      if (!row[COLUMNS.FOLLOW_UP] || row[COLUMNS.FOLLOW_UP].toString().trim() === "" || row[COLUMNS.FOLLOW_UP].toString().trim().toLowerCase() === "null") {
        result.pendingFollowUp++;
      }
      if (!row[COLUMNS.MATERIAL_RECEIVING] || row[COLUMNS.MATERIAL_RECEIVING].toString().trim() === "" || row[COLUMNS.MATERIAL_RECEIVING].toString().trim().toLowerCase() === "null") {
        result.pendingMaterialReceiving++;
      }
      if (!row[COLUMNS.WEIGHMENT] || row[COLUMNS.WEIGHMENT].toString().trim() === "" || row[COLUMNS.WEIGHMENT].toString().trim().toLowerCase() === "null") {
        result.pendingWeighment++;
      }
      if (!row[COLUMNS.QC] || row[COLUMNS.QC].toString().trim() === "" || row[COLUMNS.QC].toString().trim().toLowerCase() === "null") {
        result.pendingQC++;
      }
      if (!row[COLUMNS.MATERIAL_UNLOADING] || row[COLUMNS.MATERIAL_UNLOADING].toString().trim() === "" || row[COLUMNS.MATERIAL_UNLOADING].toString().trim().toLowerCase() === "null") {
        result.pendingMaterialUnloading++;
      }
      if (!row[COLUMNS.SUBMIT_BILL] || row[COLUMNS.SUBMIT_BILL].toString().trim() === "" || row[COLUMNS.SUBMIT_BILL].toString().trim().toLowerCase() === "null") {
        result.pendingSubmitBill++;
      }
    }

    console.log("Calculated dashboard data:", result);
    setDashboardData(result);
  };

  // Get current user info
  const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  };

  const user = getCurrentUser();
  const userRole = user?.role || "user";
  const userName = user?.name || "User";

  // Mock data for development (remove when API is working)
  const mockData = {
    totalPO: 45,
    totalIssuePO: 38,
    totalFollowUp: 32,
    totalMaterialReceiving: 28,
    totalWeighment: 25,
    totalQC: 22,
    totalMaterialUnloading: 20,
    totalSubmitBill: 18,
    pendingIssuePO: 7,
    pendingFollowUp: 6,
    pendingMaterialReceiving: 5,
    pendingWeighment: 4,
    pendingQC: 3,
    pendingMaterialUnloading: 2,
    pendingSubmitBill: 1,
  };

  const stats = viewType === "total" ? [
    {
      label: "Total PO",
      value: dashboardData?.totalPO || mockData.totalPO,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "Column E"
    },
    {
      label: "Total Issue PO",
      value: dashboardData?.totalIssuePO || mockData.totalIssuePO,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50",
      description: "Column J"
    },
    {
      label: "Total Follow Up",
      value: dashboardData?.totalFollowUp || mockData.totalFollowUp,
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
      description: "Column Q"
    },
    {
      label: "Total Material Receiving",
      value: dashboardData?.totalMaterialReceiving || mockData.totalMaterialReceiving,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
      description: "Column V"
    },
    {
      label: "Total Weighment",
      value: dashboardData?.totalWeighment || mockData.totalWeighment,
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      description: "Column AA"
    },
    {
      label: "Total Quality Check",
      value: dashboardData?.totalQC || mockData.totalQC,
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      description: "Column AH"
    },
    {
      label: "Total Material Unloading",
      value: dashboardData?.totalMaterialUnloading || mockData.totalMaterialUnloading,
      icon: Package,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      description: "Column AO"
    },
    {
      label: "Total Submit Bill",
      value: dashboardData?.totalSubmitBill || mockData.totalSubmitBill,
      icon: FileText,
      color: "text-red-600",
      bg: "bg-red-50",
      description: "Column AT"
    }
  ] : [
    {
      label: "Pending Issue PO",
      value: dashboardData?.pendingIssuePO || mockData.pendingIssuePO,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50",
      description: "Column J (Null values)"
    },
    {
      label: "Pending Follow Up",
      value: dashboardData?.pendingFollowUp || mockData.pendingFollowUp,
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
      description: "Column Q"
    },
    {
      label: "Pending Material Receiving",
      value: dashboardData?.pendingMaterialReceiving || mockData.pendingMaterialReceiving,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
      description: "Column V"
    },
    {
      label: "Pending Weighment",
      value: dashboardData?.pendingWeighment || mockData.pendingWeighment,
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      description: "Column AA"
    },
    {
      label: "Pending Quality Check",
      value: dashboardData?.pendingQC || mockData.pendingQC,
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      description: "Column AH"
    },
    {
      label: "Pending Material Unloading",
      value: dashboardData?.pendingMaterialUnloading || mockData.pendingMaterialUnloading,
      icon: Package,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      description: "Column AO"
    },
    {
      label: "Pending Submit Bill",
      value: dashboardData?.pendingSubmitBill || mockData.pendingSubmitBill,
      icon: FileText,
      color: "text-red-600",
      bg: "bg-red-50",
      description: "Column AT"
    }
  ];

  // Rest of the component remains the same...
  // [Previous JSX code remains unchanged]

  // Sample recent activity data
  const recentActivity = [
    { poNo: "PO-001", material: "Steel Rods", supplier: "ABC Suppliers", stage: "ISSUE_PO", time: "2 hours ago" },
    { poNo: "PO-002", material: "Cement", supplier: "XYZ Corp", stage: "FOLLOW_UP", time: "4 hours ago" },
    { poNo: "PO-003", material: "Electrical Wires", supplier: "Electro Ltd", stage: "MATERIAL_RECEIVING", time: "1 day ago" },
    { poNo: "PO-004", material: "PVC Pipes", supplier: "Plasto Inc", stage: "WEIGHMENT", time: "2 days ago" },
  ];

  const alerts = [
    { type: "warning", icon: AlertCircle, message: "3 QC pending" },
    { type: "danger", icon: FileText, message: "2 bills pending" },
    { type: "info", icon: AlertTriangle, message: "1 delayed delivery" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
          <Badge variant="secondary">{format(new Date(), "EEEE, MMMM d")}</Badge>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
          <Badge variant="secondary">{format(new Date(), "EEEE, MMMM d")}</Badge>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchSheetData} className="bg-red-600 hover:bg-red-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome, {userName} • {userRole === "admin" ? "All Users Data" : "Your Data"} • {viewType === "total" ? "Total Tasks" : "Pending Tasks"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time Range Filter */}

          {/* View Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewType === "total" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("total")}
              className={`text-xs ${viewType === "total"
                ? "bg-white shadow-sm text-black hover:text-white"
                : "text-black hover:text-white"
                }`}
            >
              Total Task
            </Button>

            <Button
              variant={viewType === "pending" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("pending")}
              className={`text-xs ${viewType === "pending"
                ? "bg-white shadow-sm text-black hover:text-white"
                : "text-black hover:text-white"
                }`}
            >
              Pending Task
            </Button>

          </div>

          <Badge variant="secondary" className="hidden sm:inline-flex">
            {format(new Date(), "EEEE, MMMM d")}
          </Badge>
        </div>
      </div>



      {/* Stats Grid - 8 Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="p-4 sm:p-5">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.bg} mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pie Chart - Task Distribution */}
        <Card className="p-4 sm:p-5 border-0 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {viewType === "total" ? "Total Tasks Distribution" : "Pending Tasks Distribution"}
          </h3>
          <div className="h-80 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={viewType === "total" ? [
                    { name: 'PO', value: dashboardData?.totalPO || mockData.totalPO },
                    { name: 'Issue PO', value: dashboardData?.totalIssuePO || mockData.totalIssuePO },
                    { name: 'Follow Up', value: dashboardData?.totalFollowUp || mockData.totalFollowUp },
                    { name: 'Material Receiving', value: dashboardData?.totalMaterialReceiving || mockData.totalMaterialReceiving },
                    { name: 'Weighment', value: dashboardData?.totalWeighment || mockData.totalWeighment },
                    { name: 'QC', value: dashboardData?.totalQC || mockData.totalQC },
                    { name: 'Material Unloading', value: dashboardData?.totalMaterialUnloading || mockData.totalMaterialUnloading },
                    { name: 'Submit Bill', value: dashboardData?.totalSubmitBill || mockData.totalSubmitBill }
                  ] : [
                    { name: 'Issue PO', value: dashboardData?.pendingIssuePO || mockData.pendingIssuePO },
                    { name: 'Follow Up', value: dashboardData?.pendingFollowUp || mockData.pendingFollowUp },
                    { name: 'Material Receiving', value: dashboardData?.pendingMaterialReceiving || mockData.pendingMaterialReceiving },
                    { name: 'Weighment', value: dashboardData?.pendingWeighment || mockData.pendingWeighment },
                    { name: 'QC', value: dashboardData?.pendingQC || mockData.pendingQC },
                    { name: 'Material Unloading', value: dashboardData?.pendingMaterialUnloading || mockData.pendingMaterialUnloading },
                    { name: 'Submit Bill', value: dashboardData?.pendingSubmitBill || mockData.pendingSubmitBill }
                  ]}
                  cx="50%"
                  cy="42%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  className="text-[10px] sm:text-xs"
                >
                  {(viewType === "total" ? [
                    '#3b82f6', // blue-500
                    '#10b981', // green-500  
                    '#8b5cf6', // purple-500
                    '#f59e0b', // orange-500
                    '#6366f1', // indigo-500
                    '#f59e0b', // amber-500
                    '#06b6d4', // cyan-500
                    '#ef4444'  // red-500
                  ] : [
                    '#10b981', // green-500
                    '#8b5cf6', // purple-500
                    '#f59e0b', // orange-500
                    '#6366f1', // indigo-500
                    '#f59e0b', // amber-500
                    '#06b6d4', // cyan-500
                    '#ef4444'  // red-500
                  ]).map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [value, 'Count']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '10px',
                    paddingTop: '8px'
                  }}
                  iconSize={8}
                  className="sm:text-xs"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Graph - Progress Overview */}
        <Card className="p-4 sm:p-5 border-0 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Progress Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={viewType === "total" ? [
                  { name: 'PO', value: dashboardData?.totalPO || mockData.totalPO },
                  { name: 'Issue PO', value: dashboardData?.totalIssuePO || mockData.totalIssuePO },
                  { name: 'Follow Up', value: dashboardData?.totalFollowUp || mockData.totalFollowUp },
                  { name: 'Material Receiving', value: dashboardData?.totalMaterialReceiving || mockData.totalMaterialReceiving },
                  { name: 'Weighment', value: dashboardData?.totalWeighment || mockData.totalWeighment },
                  { name: 'QC', value: dashboardData?.totalQC || mockData.totalQC },
                  { name: 'Material Unloading', value: dashboardData?.totalMaterialUnloading || mockData.totalMaterialUnloading },
                  { name: 'Submit Bill', value: dashboardData?.totalSubmitBill || mockData.totalSubmitBill }
                ] : [
                  { name: 'Issue PO', value: dashboardData?.pendingIssuePO || mockData.pendingIssuePO },
                  { name: 'Follow Up', value: dashboardData?.pendingFollowUp || mockData.pendingFollowUp },
                  { name: 'Material Receiving', value: dashboardData?.pendingMaterialReceiving || mockData.pendingMaterialReceiving },
                  { name: 'Weighment', value: dashboardData?.pendingWeighment || mockData.pendingWeighment },
                  { name: 'QC', value: dashboardData?.pendingQC || mockData.pendingQC },
                  { name: 'Material Unloading', value: dashboardData?.pendingMaterialUnloading || mockData.pendingMaterialUnloading },
                  { name: 'Submit Bill', value: dashboardData?.pendingSubmitBill || mockData.pendingSubmitBill }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <YAxis fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [value, 'Count']}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  fill="hsl(217, 91%, 35%)"
                  animationDuration={1000}
                >
                  {(viewType === "total" ? [
                    { name: 'PO', color: '#3b82f6' },
                    { name: 'Issue PO', color: '#10b981' },
                    { name: 'Follow Up', color: '#8b5cf6' },
                    { name: 'Material Receiving', color: '#f59e0b' },
                    { name: 'Weighment', color: '#6366f1' },
                    { name: 'QC', color: '#f59e0b' },
                    { name: 'Material Unloading', color: '#06b6d4' },
                    { name: 'Submit Bill', color: '#ef4444' }
                  ] : [
                    { name: 'Issue PO', color: '#10b981' },
                    { name: 'Follow Up', color: '#8b5cf6' },
                    { name: 'Material Receiving', color: '#f59e0b' },
                    { name: 'Weighment', color: '#6366f1' },
                    { name: 'QC', color: '#f59e0b' },
                    { name: 'Material Unloading', color: '#06b6d4' },
                    { name: 'Submit Bill', color: '#ef4444' }
                  ]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
<CancelDataTable />
    </div>
  );
}