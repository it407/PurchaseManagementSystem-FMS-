"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Package,
  Clock,
  FileText,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CancelDataTable } from "../pages/canceltable"; // Adjust path as needed

import DelayAnalysis from "../pages/dealy-analysis";

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheetData, setSheetData] = useState<any[]>([]);

  const [amountData, setAmountData] = useState<any>({});

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
        calculateAmounts(data.data);
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

  const calculateAmounts = (data: any[]) => {
    console.log("Calculating amounts from", data.length, "rows");

    // Column indexes (0-based)
    const COLUMNS = {
      QUANTITY: 6, // Column G
      RATE: 7, // Column H

      // Stage planned and actual columns
      PLANNED1: 9, // Column J
      ACTUAL1: 10, // Column K
      PLANNED2: 16, // Column Q
      ACTUAL2: 17, // Column R
      PLANNED3: 21, // Column V
      ACTUAL3: 22, // Column W
      PLANNED4: 27, // Column AB
      ACTUAL4: 28, // Column AC
      PLANNED5: 35, // Column AJ
      ACTUAL5: 36, // Column AK
      PLANNED6: 42, // Column AQ
      ACTUAL6: 43, // Column AR
      PLANNED7: 47, // Column AV
      ACTUAL7: 48, // Column AW
      PLANNED9: 52, // Column BA
      ACTUAL9: 53, // Column BB
    };

    const amounts = {
      stage1: 0,
      stage2: 0,
      stage3: 0,
      stage4: 0,
      stage5: 0,
      stage6: 0,
      stage7: 0,
      stage9: 0,
    };

    // Helper function to check if value exists
    const hasValue = (value: any) => {
      return (
        value &&
        value.toString().trim() !== "" &&
        value.toString().trim().toLowerCase() !== "null"
      );
    };

    // Row 6 se start karo (headers skip karo)
    for (let i = 7; i < data.length; i++) {
      const row = data[i];

      // Get quantity and rate
      const quantity = parseFloat(row[COLUMNS.QUANTITY]) || 0;
      const rate = parseFloat(row[COLUMNS.RATE]) || 0;
      const amount = quantity * rate;

      // Stage 1: Planned1 is NOT NULL AND Actual1 is NULL
      if (hasValue(row[COLUMNS.PLANNED1]) && !hasValue(row[COLUMNS.ACTUAL1])) {
        amounts.stage1 += amount;
      }

      // Stage 2: Planned2 is NOT NULL AND Actual2 is NULL
      if (hasValue(row[COLUMNS.PLANNED2]) && !hasValue(row[COLUMNS.ACTUAL2])) {
        amounts.stage2 += amount;
      }

      // Stage 3: Planned3 is NOT NULL AND Actual3 is NULL
      if (hasValue(row[COLUMNS.PLANNED3]) && !hasValue(row[COLUMNS.ACTUAL3])) {
        amounts.stage3 += amount;
      }

      // Stage 4: Planned4 is NOT NULL AND Actual4 is NULL
      if (hasValue(row[COLUMNS.PLANNED4]) && !hasValue(row[COLUMNS.ACTUAL4])) {
        amounts.stage4 += amount;
      }

      // Stage 5: Planned5 is NOT NULL AND Actual5 is NULL
      if (hasValue(row[COLUMNS.PLANNED5]) && !hasValue(row[COLUMNS.ACTUAL5])) {
        amounts.stage5 += amount;
      }

      // Stage 6: Planned6 is NOT NULL AND Actual6 is NULL
      if (hasValue(row[COLUMNS.PLANNED6]) && !hasValue(row[COLUMNS.ACTUAL6])) {
        amounts.stage6 += amount;
      }

      // Stage 7: Planned7 is NOT NULL AND Actual7 is NULL
      if (hasValue(row[COLUMNS.PLANNED7]) && !hasValue(row[COLUMNS.ACTUAL7])) {
        amounts.stage7 += amount;
      }

      // Stage 9: Planned9 is NOT NULL AND Actual9 is NULL
      if (hasValue(row[COLUMNS.PLANNED9]) && !hasValue(row[COLUMNS.ACTUAL9])) {
        amounts.stage9 += amount;
      }
    }

    console.log("Calculated amounts:", amounts);
    setAmountData(amounts);
  };

  // Frontend mein hi data calculate karo
  const calculateDashboardData = (data: any[]) => {
    console.log("Calculating dashboard data from", data.length, "rows");

    // Updated Column indexes (0-based) as per your requirements
    const COLUMNS = {
      PO: 5, // Column F (changed from 4 to 5)
      ISSUE_PO: 10, // Column K (changed from 10 to 10 - same)
      FOLLOW_UP: 17, // Column R (changed from 17 to 17 - same)
      GATE_ENTRY: 22, // Column W (changed from MATERIAL_RECEIVING to GATE_ENTRY)
      WEIGHMENT: 28, // Column AC (changed from 27 to 28)
      QC: 36, // Column AK (changed from 34 to 36)
      MATERIAL_UNLOADING: 43, // Column AR (changed from 41 to 43)
      SUBMIT_BILL: 48, // Column AW (changed from 46 to 48)
      BILL_ENTRY_ERP: 53, // Column BB (new column)

      // New condition columns - aapke bataye columns
      ISSUE_PO_CONDITION: 9, // Column I
      FOLLOW_UP_CONDITION: 16, // Column P
      GATE_ENTRY_CONDITION: 21, // Column U
      WEIGHMENT_CONDITION: 27, // Column AB
      QC_CONDITION: 35, // Column AJ
      MATERIAL_UNLOADING_CONDITION: 42, // Column AQ
      SUBMIT_BILL_CONDITION: 47, // Column AV
      BILL_ENTRY_ERP_CONDITION: 52, // Column BA

      // Delay columns
      ISSUE_PO_DELAY: 15, // Column P
      FOLLOW_UP_DELAY: 20, // Column U
      GATE_ENTRY_DELAY: 26, // Column AA
      WEIGHMENT_DELAY: 34, // Column AI
      QC_DELAY: 41, // Column AP
      MATERIAL_UNLOADING_DELAY: 46, // Column AU
      SUBMIT_BILL_DELAY: 51, // Column AZ
      BILL_ENTRY_ERP_DELAY: 56, // Column BE
    };

    let result = {
      totalPO: 0,
      totalIssuePO: 0,
      totalFollowUp: 0,
      totalGateEntry: 0,
      totalWeighment: 0,
      totalQC: 0,
      totalMaterialUnloading: 0,
      totalSubmitBill: 0,
      totalBillEntryERP: 0,
      pendingIssuePO: 0,
      pendingFollowUp: 0,
      pendingGateEntry: 0,
      pendingWeighment: 0,
      pendingQC: 0,
      pendingMaterialUnloading: 0,
      pendingSubmitBill: 0,
      pendingBillEntryERP: 0,
      // Delay counts
      delayIssuePO: 0,
      delayFollowUp: 0,
      delayGateEntry: 0,
      delayWeighment: 0,
      delayQC: 0,
      delayMaterialUnloading: 0,
      delaySubmitBill: 0,
      delayBillEntryERP: 0,
    };

    // Helper function to check if value exists
    const hasValue = (value: any) => {
      return (
        value &&
        value.toString().trim() !== "" &&
        value.toString().trim().toLowerCase() !== "null"
      );
    };

    // NEW: Helper function to check if delay value is positive (contains "+")
    // SIMPLE: Helper function to check if delay value contains "+" sign
    // Helper function to check if delay value is positive
    // Helper function to check if delay value is positive
    const isPositiveDelay = (value: any) => {
      if (!hasValue(value)) {
        console.log("Delay value is empty/null");
        return false;
      }

      const strValue = value.toString().trim();
      console.log("Checking delay value:", strValue);

      // Handle "HH:MM:SS" format (like "1:00:00" or "-46:59:27")
      if (strValue.includes(":")) {
        // Check if negative (starts with -)
        const isNegative = strValue.startsWith("-");

        // Parse time parts
        const cleanStr = strValue.replace("-", "");
        const parts = cleanStr.split(":");

        if (parts.length === 3) {
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;
          const seconds = parseInt(parts[2]) || 0;

          const totalSeconds = hours * 3600 + minutes * 60 + seconds;
          const finalSeconds = isNegative ? -totalSeconds : totalSeconds;

          console.log(
            `Time: ${strValue} -> Seconds: ${finalSeconds} (Positive: ${
              finalSeconds > 0
            })`
          );

          // Only count if positive (greater than 0)
          return finalSeconds > 0;
        }
      }

      // Check if value contains "+" sign (backup check)
      const hasPlus = strValue.includes("+");
      console.log("Has + sign:", hasPlus);

      return hasPlus;
    };

    // Row 6 se start karo (headers skip karo)
    for (let i = 7; i < data.length; i++) {
      const row = data[i];

      // Total counts (any non-empty value)
      if (hasValue(row[COLUMNS.PO])) result.totalPO++;

      // Issue PO - count only if condition column has value
      if (hasValue(row[COLUMNS.ISSUE_PO_CONDITION])) {
        if (hasValue(row[COLUMNS.ISSUE_PO])) result.totalIssuePO++;
      }

      // Follow Up - count only if condition column has value
      if (hasValue(row[COLUMNS.FOLLOW_UP_CONDITION])) {
        if (hasValue(row[COLUMNS.FOLLOW_UP])) result.totalFollowUp++;
      }

      // Gate Entry - count only if condition column has value
      if (hasValue(row[COLUMNS.GATE_ENTRY_CONDITION])) {
        if (hasValue(row[COLUMNS.GATE_ENTRY])) result.totalGateEntry++;
      }

      // Weighment - count only if condition column has value
      if (hasValue(row[COLUMNS.WEIGHMENT_CONDITION])) {
        if (hasValue(row[COLUMNS.WEIGHMENT])) result.totalWeighment++;
      }

      // QC - count only if condition column has value
      if (hasValue(row[COLUMNS.QC_CONDITION])) {
        if (hasValue(row[COLUMNS.QC])) result.totalQC++;
      }

      // Material Unloading - count only if condition column has value
      if (hasValue(row[COLUMNS.MATERIAL_UNLOADING_CONDITION])) {
        if (hasValue(row[COLUMNS.MATERIAL_UNLOADING]))
          result.totalMaterialUnloading++;
      }

      // Submit Bill - count only if condition column has value
      if (hasValue(row[COLUMNS.SUBMIT_BILL_CONDITION])) {
        if (hasValue(row[COLUMNS.SUBMIT_BILL])) result.totalSubmitBill++;
      }

      // Bill Entry ERP - count only if condition column has value
      if (hasValue(row[COLUMNS.BILL_ENTRY_ERP_CONDITION])) {
        if (hasValue(row[COLUMNS.BILL_ENTRY_ERP])) result.totalBillEntryERP++;
      }

      // Pending counts (empty or "Null" values) - with condition check
      if (hasValue(row[COLUMNS.ISSUE_PO_CONDITION])) {
        if (!hasValue(row[COLUMNS.ISSUE_PO])) {
          result.pendingIssuePO++;
        }
      }

      if (hasValue(row[COLUMNS.FOLLOW_UP_CONDITION])) {
        if (!hasValue(row[COLUMNS.FOLLOW_UP])) {
          result.pendingFollowUp++;
        }
      }

      if (hasValue(row[COLUMNS.GATE_ENTRY_CONDITION])) {
        if (!hasValue(row[COLUMNS.GATE_ENTRY])) {
          result.pendingGateEntry++;
        }
      }

      if (hasValue(row[COLUMNS.WEIGHMENT_CONDITION])) {
        if (!hasValue(row[COLUMNS.WEIGHMENT])) {
          result.pendingWeighment++;
        }
      }

      if (hasValue(row[COLUMNS.QC_CONDITION])) {
        if (!hasValue(row[COLUMNS.QC])) {
          result.pendingQC++;
        }
      }

      if (hasValue(row[COLUMNS.MATERIAL_UNLOADING_CONDITION])) {
        if (!hasValue(row[COLUMNS.MATERIAL_UNLOADING])) {
          result.pendingMaterialUnloading++;
        }
      }

      if (hasValue(row[COLUMNS.SUBMIT_BILL_CONDITION])) {
        if (!hasValue(row[COLUMNS.SUBMIT_BILL])) {
          result.pendingSubmitBill++;
        }
      }

      if (hasValue(row[COLUMNS.BILL_ENTRY_ERP_CONDITION])) {
        if (!hasValue(row[COLUMNS.BILL_ENTRY_ERP])) {
          result.pendingBillEntryERP++;
        }
      }

      // Delay counts (ONLY positive values with "+" sign) - with condition check
      if (hasValue(row[COLUMNS.ISSUE_PO_CONDITION])) {
        if (isPositiveDelay(row[COLUMNS.ISSUE_PO_DELAY])) {
          result.delayIssuePO++;
        }
      }

      if (hasValue(row[COLUMNS.FOLLOW_UP_CONDITION])) {
        if (isPositiveDelay(row[COLUMNS.FOLLOW_UP_DELAY])) {
          result.delayFollowUp++;
        }
      }

      if (hasValue(row[COLUMNS.GATE_ENTRY_CONDITION])) {
        if (isPositiveDelay(row[COLUMNS.GATE_ENTRY_DELAY])) {
          result.delayGateEntry++;
        }
      }

      if (hasValue(row[COLUMNS.WEIGHMENT_CONDITION])) {
        if (isPositiveDelay(row[COLUMNS.WEIGHMENT_DELAY])) {
          result.delayWeighment++;
        }
      }

      if (hasValue(row[COLUMNS.QC_CONDITION])) {
        if (isPositiveDelay(row[COLUMNS.QC_DELAY])) {
          result.delayQC++;
        }
      }

      if (hasValue(row[COLUMNS.MATERIAL_UNLOADING_CONDITION])) {
        if (isPositiveDelay(row[COLUMNS.MATERIAL_UNLOADING_DELAY])) {
          result.delayMaterialUnloading++;
        }
      }

      if (hasValue(row[COLUMNS.SUBMIT_BILL_CONDITION])) {
        if (isPositiveDelay(row[COLUMNS.SUBMIT_BILL_DELAY])) {
          result.delaySubmitBill++;
        }
      }

      if (hasValue(row[COLUMNS.BILL_ENTRY_ERP_CONDITION])) {
        if (isPositiveDelay(row[COLUMNS.BILL_ENTRY_ERP_DELAY])) {
          result.delayBillEntryERP++;
        }
      }
    }

    console.log("Calculated dashboard data:", result);
    setDashboardData(result);
  };

  // Get current user info
  const getCurrentUser = () => {
    if (typeof window === "undefined") return null;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  };

  const user = getCurrentUser();
  const userRole = user?.role || "user";
  const userName = user?.name || "User";

  const stats = [
    // {
    //   label: "Total PO",
    //   value: dashboardData?.totalPO || 0,
    //   pending: 0,
    //   delay: 0,
    //   icon: Package,
    //   color: "text-blue-600",
    //   bg: "bg-blue-50",
    //   amount: 0, // PO doesn't have amount calculation
    // },
    {
      label: "Total Issue PO",
      value: dashboardData?.totalIssuePO || 0,
      pending: dashboardData?.pendingIssuePO || 0,
      delay: dashboardData?.delayIssuePO || 0,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50",
      amount: amountData.stage1 || 0, // Stage 1
    },
    {
      label: "Total Follow Up",
      value: dashboardData?.totalFollowUp || 0,
      pending: dashboardData?.pendingFollowUp || 0,
      delay: dashboardData?.delayFollowUp || 0,
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
      amount: amountData.stage2 || 0, // Stage 2
    },
    {
      label: "Total Gate Entry",
      value: dashboardData?.totalGateEntry || 0,
      pending: dashboardData?.pendingGateEntry || 0,
      delay: dashboardData?.delayGateEntry || 0,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
      amount: amountData.stage3 || 0, // Stage 3
    },
    {
      label: "Total Weighment",
      value: dashboardData?.totalWeighment || 0,
      pending: dashboardData?.pendingWeighment || 0,
      delay: dashboardData?.delayWeighment || 0,
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      amount: amountData.stage4 || 0, // Stage 4
    },
    {
      label: "Total Quality Check",
      value: dashboardData?.totalQC || 0,
      pending: dashboardData?.pendingQC || 0,
      delay: dashboardData?.delayQC || 0,
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      amount: amountData.stage5 || 0, // Stage 5
    },
    {
      label: "Total Material Unloading",
      value: dashboardData?.totalMaterialUnloading || 0,
      pending: dashboardData?.pendingMaterialUnloading || 0,
      delay: dashboardData?.delayMaterialUnloading || 0,
      icon: Package,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      amount: amountData.stage6 || 0, // Stage 6
    },
    {
      label: "Total Submit Bill",
      value: dashboardData?.totalSubmitBill || 0,
      pending: dashboardData?.pendingSubmitBill || 0,
      delay: dashboardData?.delaySubmitBill || 0,
      icon: FileText,
      color: "text-red-600",
      bg: "bg-red-50",
      amount: amountData.stage7 || 0, // Stage 7
    },
    {
      label: "Total Bill Entry ERP",
      value: dashboardData?.totalBillEntryERP || 0,
      pending: dashboardData?.pendingBillEntryERP || 0,
      delay: dashboardData?.delayBillEntryERP || 0,
      icon: FileText,
      color: "text-pink-600",
      bg: "bg-pink-50",
      amount: amountData.stage9 || 0, // Stage 9
    },
  ];

  // Sample recent activity data
  const recentActivity = [
    {
      poNo: "PO-001",
      material: "Steel Rods",
      supplier: "ABC Suppliers",
      stage: "ISSUE_PO",
      time: "2 hours ago",
    },
    {
      poNo: "PO-002",
      material: "Cement",
      supplier: "XYZ Corp",
      stage: "FOLLOW_UP",
      time: "4 hours ago",
    },
    {
      poNo: "PO-003",
      material: "Electrical Wires",
      supplier: "Electro Ltd",
      stage: "MATERIAL_RECEIVING",
      time: "1 day ago",
    },
    {
      poNo: "PO-004",
      material: "PVC Pipes",
      supplier: "Plasto Inc",
      stage: "WEIGHMENT",
      time: "2 days ago",
    },
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
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Dashboard
          </h1>
          <Badge variant="secondary">
            {format(new Date(), "EEEE, MMMM d")}
          </Badge>
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
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Dashboard
          </h1>
          <Badge variant="secondary">
            {format(new Date(), "EEEE, MMMM d")}
          </Badge>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={fetchSheetData}
            className="bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    // <div className="space-y-6 pb-8">
    <div className="space-y-2 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-blue-600 sm:text-2xl">
            Dashboard
          </h1>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {format(new Date(), "EEEE, MMMM d")}
        </Badge>
      </div>

      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card
            className="border border-gray-200 bg-white shadow-sm rounded-xl
  h-32 sm:h-28
  pt-6 sm:pt-2
  px-3 pb-3 sm:p-2
  flex flex-col justify-between relative"
          >
           
            {stat.amount > 0 && (
              <div
                className="
    absolute top-2 right-2
    bg-gray-100 text-gray-700
    text-[11px] px-2 py-0.5 rounded-full
    sm:bg-transparent sm:px-0 sm:text-xs sm:font-bold
  "
              >
                ₹ {stat.amount.toLocaleString("en-IN")}
              </div>
            )}

            <div className="p-2 flex flex-col justify-between h-full">
              {/* ICON + TITLE + VALUE */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full ${stat.bg}`}
                >
                  <stat.icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 leading-tight">
                    {stat.label}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>

              {/* PENDING / DELAY */}
              <div className="flex justify-between text-xs font-semibold mt-2">
                <span className="text-blue-600">Pending: {stat.pending}</span>
                <span className="text-rose-600">Delay: {stat.delay}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

    

      {/* Charts + Delay Analysis (ONE ROW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* ================= PIE CHART ================= */}
        <div className="lg:col-span-3">
          <Card className="p-3 border-0 shadow-sm h-72">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Total Tasks Distribution
            </h3>

            {/* ⬇️ SAME OLD PIE CHART (NO CHANGE) */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "PO", value: dashboardData?.totalPO || 0 },
                      {
                        name: "Issue PO",
                        value: dashboardData?.totalIssuePO || 0,
                      },
                      {
                        name: "Follow Up",
                        value: dashboardData?.totalFollowUp || 0,
                      },
                      {
                        name: "Gate Entry",
                        value: dashboardData?.totalGateEntry || 0,
                      },
                      {
                        name: "Weighment",
                        value: dashboardData?.totalWeighment || 0,
                      },
                      { name: "QC", value: dashboardData?.totalQC || 0 },
                      {
                        name: "Material Unloading",
                        value: dashboardData?.totalMaterialUnloading || 0,
                      },
                      {
                        name: "Submit Bill",
                        value: dashboardData?.totalSubmitBill || 0,
                      },
                      {
                        name: "Bill Entry ERP",
                        value: dashboardData?.totalBillEntryERP || 0,
                      },
                    ]}
                    cx="50%"
                    cy="42%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={50}
                    dataKey="value"
                    className="text-[10px]"
                  >
                    {[
                      "#3b82f6",
                      "#10b981",
                      "#8b5cf6",
                      "#f59e0b",
                      "#6366f1",
                      "#f59e0b",
                      "#06b6d4",
                      "#ef4444",
                      "#ec4899",
                    ].map((color, index) => (
                      <Cell key={index} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  {/* <Legend wrapperStyle={{ fontSize: "10px" }} iconSize={8} /> */}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* ================= PROGRESS OVERVIEW ================= */}
        <div className="lg:col-span-4">
          <Card className="p-3 border-0 shadow-sm h-72">
            <h3 className="text-sm font-semibold text-gray-900 -mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Progress Overview
            </h3>

            {/* ⬇️ SAME OLD BAR CHART (NO CHANGE) */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "PO", value: dashboardData?.totalPO || 0 },
                    {
                      name: "Issue PO",
                      value: dashboardData?.totalIssuePO || 0,
                    },
                    {
                      name: "Follow Up",
                      value: dashboardData?.totalFollowUp || 0,
                    },
                    {
                      name: "Gate Entry",
                      value: dashboardData?.totalGateEntry || 0,
                    },
                    {
                      name: "Weighment",
                      value: dashboardData?.totalWeighment || 0,
                    },
                    { name: "QC", value: dashboardData?.totalQC || 0 },
                    {
                      name: "Material Unloading",
                      value: dashboardData?.totalMaterialUnloading || 0,
                    },
                    {
                      name: "Submit Bill",
                      value: dashboardData?.totalSubmitBill || 0,
                    },
                    {
                      name: "Bill Entry ERP",
                      value: dashboardData?.totalBillEntryERP || 0,
                    },
                  ]}
                  // margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  margin={{ top: 20, right: 10, left: 0, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    fontSize={10}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={50}
                  />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[
                      "#3b82f6",
                      "#10b981",
                      "#8b5cf6",
                      "#f59e0b",
                      "#6366f1",
                      "#f59e0b",
                      "#06b6d4",
                      "#ef4444",
                      "#ec4899",
                    ].map((color, index) => (
                      <Cell key={index} fill={color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* ================= DELAY ANALYSIS ================= */}
        <div className="lg:col-span-5">
          <Card className="p-3 border-0 shadow-sm h-72 overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-900 -mb-6 ">
              Delay Analysis Dashboard
            </h3>

            <div className="h-56 overflow-y-auto pr-2 -mx-4">
              <DelayAnalysis />
            </div>
          </Card>
        </div>
      </div>

      <div>
        <CancelDataTable />
      </div>
    </div>
  );
}
