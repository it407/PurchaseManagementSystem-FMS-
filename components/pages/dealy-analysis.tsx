import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3, Calendar, ChevronDown } from "lucide-react";

interface DataRow {
  planned1?: string;
  timedelay?: string;
  planned2?: string;
  timedelay2?: string;
  planned3?: string;
  timedelay3?: string;
  planned4?: string;
  timedelay4?: string;
  planned5?: string;
  timedelay5?: string;
  planned6?: string;
  timedelay6?: string;
  planned7?: string;
  timedelay7?: string;
  planned8?: string;
  timedelay8?: string;
}

interface DelayCount {
  name: string;
  value: number;
  color: string;
}

const DelayAnalysis = () => {
  // const [data, setData] = useState([]);
  // const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("today");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showSixMonthDropdown, setShowSixMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedSixMonth, setSelectedSixMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [data, setData] = useState<DataRow[]>([]);
  const [filteredData, setFilteredData] = useState<DelayCount[]>([]);

  const [filterYear, setFilterYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  const WEB_URL =
    "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec";
  const SHEET_NAME = "FMS";

  // Fetch data from Google Sheets
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Try multiple API approaches
      let result = null;
      let formattedData = [];

      // Approach 1: Try with sheet parameter
      try {
        console.log("Trying API call with sheet parameter...");
        const response1 = await fetch(
          `${WEB_URL}?sheet=${SHEET_NAME}&action=fetch`
        );
        result = await response1.json();
        console.log("API Response (sheet parameter):", result);
      } catch (e) {
        console.log("First approach failed:", e);
      }

      // Approach 2: Try with sheetName parameter
      if (!result || !result.success) {
        try {
          console.log("Trying API call with sheetName parameter...");
          const response2 = await fetch(`${WEB_URL}?sheetName=${SHEET_NAME}`);
          result = await response2.json();
          console.log("API Response (sheetName parameter):", result);
        } catch (e) {
          console.log("Second approach failed:", e);
        }
      }

      // Approach 3: Try with sheetId and sheetName
      if (!result || !result.success) {
        try {
          console.log("Trying API call with sheetId...");
          const sheetId = "1MtxLluyxLJwDV_2fxw4qG0wUOBE4Ys8Wd_ewLeP9czA";
          const response3 = await fetch(
            `${WEB_URL}?sheetId=${sheetId}&sheetName=${SHEET_NAME}`
          );
          result = await response3.json();
          console.log("API Response (sheetId parameter):", result);
        } catch (e) {
          console.log("Third approach failed:", e);
        }
      }

      if (result && result.success && result.data) {
        console.log("✓ API call successful!");
        console.log("Raw data array length:", result.data.length);

        // FMS sheet has headers in row 5 (index 5), data starts from row 6
        if (result.data.length > 5) {
          // const headers = result.data[5]; // Row 5 has actual headers
          const headers = result.data[5] as string[];

          console.log("Headers from API (Row 5):", headers);

          // const rows = result.data.slice(6); // Data starts from row 6
          const rows = result.data.slice(6) as any[];

          console.log("Data rows count:", rows.length);

          // Find column indices for our needed columns
          const columnMap = {
            planned1: headers.indexOf("Planned1"),
            timedelay: headers.indexOf("Time Delay"),
            planned2: headers.indexOf("Planned2"),
            timedelay2: -1, // Need to find second "Time Delay"
            planned3: headers.indexOf("Planned3"),
            timedelay3: -1,
            planned4: headers.indexOf("Planned4"),
            timedelay4: -1,
            planned5: headers.indexOf("Planned5"),
            timedelay5: -1,
            planned6: headers.indexOf("Planned6"),
            timedelay6: -1,
            planned7: headers.indexOf("Planned7"),
            timedelay7: -1,
            planned8: headers.indexOf("Planned9"), // Notice: Planned9 in sheet
            timedelay8: -1,
          };

          // Find all "Time Delay" columns manually (there are multiple)
          // let timeDelayIndices = [];
          let timeDelayIndices: number[] = [];
          

          headers.forEach((header, idx) => {
            if (header === "Time Delay" || header === "time delay") {
              timeDelayIndices.push(idx);
            }
          });

          console.log("Time Delay column indices:", timeDelayIndices);

          // Map time delays to our structure
          if (timeDelayIndices.length >= 1)
            columnMap.timedelay = timeDelayIndices[0];
          if (timeDelayIndices.length >= 2)
            columnMap.timedelay2 = timeDelayIndices[1];
          if (timeDelayIndices.length >= 3)
            columnMap.timedelay3 = timeDelayIndices[2];
          if (timeDelayIndices.length >= 4)
            columnMap.timedelay4 = timeDelayIndices[3];
          if (timeDelayIndices.length >= 5)
            columnMap.timedelay5 = timeDelayIndices[4];
          if (timeDelayIndices.length >= 6)
            columnMap.timedelay6 = timeDelayIndices[5];
          if (timeDelayIndices.length >= 7)
            columnMap.timedelay7 = timeDelayIndices[6];
          if (timeDelayIndices.length >= 8)
            columnMap.timedelay8 = timeDelayIndices[7];

          console.log("Column mapping:", columnMap);

          // Create formatted objects using column indices
          formattedData = rows.map((row, index) => {
            const obj = {
              planned1: row[columnMap.planned1],
              timedelay: row[columnMap.timedelay],
              planned2: row[columnMap.planned2],
              timedelay2: row[columnMap.timedelay2],
              planned3: row[columnMap.planned3],
              timedelay3: row[columnMap.timedelay3],
              planned4: row[columnMap.planned4],
              timedelay4: row[columnMap.timedelay4],
              planned5: row[columnMap.planned5],
              timedelay5: row[columnMap.timedelay5],
              planned6: row[columnMap.planned6],
              timedelay6: row[columnMap.timedelay6],
              planned7: row[columnMap.planned7],
              timedelay7: row[columnMap.timedelay7],
              planned8: row[columnMap.planned8],
              timedelay8: row[columnMap.timedelay8],
            };

            // Debug first few rows
            if (index < 3) {
              console.log(`\nRow ${index + 1} mapped data:`, {
                planned1: obj.planned1,
                timedelay: obj.timedelay,
                planned2: obj.planned2,
                timedelay2: obj.timedelay2,
                planned3: obj.planned3,
                timedelay3: obj.timedelay3,
              });
            }

            return obj;
          });

          console.log("Total formatted rows:", formattedData.length);
          console.log("Sample formatted row:", formattedData[0]);
          setData(formattedData);
        }
      } else {
        console.error("❌ All API approaches failed or returned no data");
        console.error("Last result:", result);

        // Use mock data for testing
        console.log("🧪 Using MOCK DATA for testing...");
        const mockData = generateMockData();
        setData(mockData);
      }

      setLoading(false);
    } catch (error) {
      console.error("Fatal error fetching data:", error);

      // Use mock data on error
      console.log("🧪 Using MOCK DATA due to error...");
      const mockData = generateMockData();
      setData(mockData);
      setLoading(false);
    }
  };

  // Add this helper function after imports
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.trim() === "") return null;

    // Handle "DD/MM/YYYY HH:MM:SS" format
    if (dateStr.includes("/")) {
      const [datePart, timePart] = dateStr.split(" ");
      const [day, month, year] = datePart.split("/");
      return new Date(`${year}-${month}-${day}T${timePart || "00:00:00"}.000Z`);
    }

    // Fallback to standard parsing
    return new Date(dateStr);
  };

  // Generate mock data for testing
  const generateMockData = () => {
    const today = new Date();
    const mockRows = [];

    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      mockRows.push({
        planned1: date.toISOString(),
        timedelay: i % 3 === 0 ? "2:30:00" : i % 3 === 1 ? "-1:15:00" : "",
        planned2: i % 2 === 0 ? date.toISOString() : "",
        timedelay2: i % 4 === 0 ? "1:45:00" : i % 4 === 1 ? "-0:30:00" : "",
        planned3: i % 2 === 1 ? date.toISOString() : "",
        timedelay3: i % 5 === 0 ? "3:20:00" : "",
        planned4: i % 3 === 0 ? date.toISOString() : "",
        timedelay4: i % 3 === 0 ? "0:45:00" : "",
        planned5: i % 4 === 0 ? date.toISOString() : "",
        timedelay5: i % 4 === 0 ? "2:10:00" : "",
        planned6: i % 5 === 0 ? date.toISOString() : "",
        timedelay6: i % 5 === 0 ? "1:30:00" : "",
        planned7: i % 3 === 0 ? date.toISOString() : "",
        timedelay7: i % 3 === 0 ? "4:00:00" : "",
        planned8: i % 6 === 0 ? date.toISOString() : "",
        timedelay8: i % 6 === 0 ? "5:15:00" : "",
      });
    }

    console.log("Mock data generated:", mockRows.length, "rows");
    return mockRows;
  };

  // Parse time delay string (format: "4:02:56" or "-4:02:56")
  // Parse time delay string - handles both "HH:MM:SS" format and ISO date format
  const parseTimeDelay = (
    timeStr: string | undefined | null
  ): number | null => {
    if (!timeStr || timeStr.trim() === "") {
      console.log("Empty time delay string");
      return null;
    }

    console.log("Parsing time delay:", timeStr);

    // Check if it's an ISO date string (from Google Sheets)
    if (timeStr.includes("T") && timeStr.includes("Z")) {
      try {
        const date = new Date(timeStr);

        // Google Sheets stores time as days since 1899-12-30
        // For negative times, it uses dates before 1899-12-30
        const baseDate = new Date("1899-12-30T00:00:00.000Z");
        const diffMs = date.getTime() - baseDate.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);

        console.log(
          `ISO Date: ${timeStr} -> Seconds: ${diffSeconds} (Positive: ${
            diffSeconds > 0
          })`
        );
        return diffSeconds;
      } catch (e) {
        console.log("Failed to parse ISO date:", e);
        return null;
      }
    }

    // Handle "HH:MM:SS" format
    const isNegative = String(timeStr).trim().startsWith("-");
    const cleanStr = String(timeStr).trim().replace("-", "");

    const parts = cleanStr.split(":");
    if (parts.length !== 3) {
      console.log("Invalid time format:", timeStr);
      return null;
    }

    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const result = isNegative ? -totalSeconds : totalSeconds;

    console.log(
      `Time: ${timeStr} -> Seconds: ${result} (Positive: ${result > 0})`
    );
    return result;
  };

  // Check if delay should be counted
  const shouldCountDelay = (
    plannedValue: any,
    timeDelayValue: any
  ): boolean => {
    console.log(
      "Checking delay - Planned:",
      plannedValue,
      "TimeDelay:",
      timeDelayValue
    );

    // If planned is null/empty, don't count
    if (!plannedValue || plannedValue === null || plannedValue === undefined) {
      console.log("Planned is null/empty - NOT counting");
      return false;
    }

    // Convert to string and check if empty
    const plannedStr = String(plannedValue).trim();
    if (plannedStr === "") {
      console.log("Planned is empty string - NOT counting");
      return false;
    }

    // If timeDelay is null/empty, don't count
    if (
      !timeDelayValue ||
      timeDelayValue === null ||
      timeDelayValue === undefined
    ) {
      console.log("TimeDelay is null/empty - NOT counting");
      return false;
    }

    // Convert to string and check if empty
    const timeDelayStr = String(timeDelayValue).trim();
    if (timeDelayStr === "") {
      console.log("TimeDelay is empty string - NOT counting");
      return false;
    }

    // Parse time delay
    const delaySeconds = parseTimeDelay(timeDelayStr);

    // If parsing failed, don't count
    if (delaySeconds === null) {
      console.log("Failed to parse time delay - NOT counting");
      return false;
    }

    // Only count if positive (greater than 0)
    const shouldCount = delaySeconds > 0;
    console.log(`Delay seconds: ${delaySeconds}, Should count: ${shouldCount}`);
    return shouldCount;
  };

  // Calculate delays based on conditions
  const calculateDelays = (dataSet: DataRow[]): DelayCount[] => {
    console.log("=== Starting Delay Calculation ===");
    console.log("Dataset length:", dataSet.length);

    const delays = {
      issuePO: 0,
      followUp: 0,
      gateEntry: 0,
      weighment: 0,
      qc: 0,
      materialUnloading: 0,
      submitBill: 0,
      billEntryERP: 0,
    };

    dataSet.forEach((row, index) => {
      console.log(`\n--- Processing Row ${index + 1} ---`);

      // Issue PO Delay (Column J: planned1, Column P: timedelay)
      if (shouldCountDelay(row.planned1, row.timedelay)) {
        delays.issuePO++;
        console.log("✓ Issue PO delay counted");
      }

      // Follow Up Delay (Column Q: planned2, Column U: timedelay)
      if (shouldCountDelay(row.planned2, row.timedelay2)) {
        delays.followUp++;
        console.log("✓ Follow Up delay counted");
      }

      // Gate Entry Delay (Column V: planned3, Column AA: timedelay)
      if (shouldCountDelay(row.planned3, row.timedelay3)) {
        delays.gateEntry++;
        console.log("✓ Gate Entry delay counted");
      }

      // Weighment Delay (Column AB: planned4, Column AI: timedelay)
      if (shouldCountDelay(row.planned4, row.timedelay4)) {
        delays.weighment++;
        console.log("✓ Weighment delay counted");
      }

      // QC Delay (Column AJ: planned5, Column AP: timedelay)
      if (shouldCountDelay(row.planned5, row.timedelay5)) {
        delays.qc++;
        console.log("✓ QC delay counted");
      }

      // Material Unloading Delay (Column AQ: planned6, Column AU: timedelay)
      if (shouldCountDelay(row.planned6, row.timedelay6)) {
        delays.materialUnloading++;
        console.log("✓ Material Unloading delay counted");
      }

      // Submit Bill Delay (Column AV: planned7, Column AZ: timedelay)
      if (shouldCountDelay(row.planned7, row.timedelay7)) {
        delays.submitBill++;
        console.log("✓ Submit Bill delay counted");
      }

      // Bill Entry ERP Delay (Column BA: planned8, Column BE: timedelay)
      if (shouldCountDelay(row.planned8, row.timedelay8)) {
        delays.billEntryERP++;
        console.log("✓ Bill Entry ERP delay counted");
      }
    });

    console.log("\n=== Final Delay Counts ===");
    console.log(delays);

    return [
      { name: "Issue PO", value: delays.issuePO, color: "#3b82f6" },
      { name: "Follow Up", value: delays.followUp, color: "#10b981" },
      { name: "Gate Entry", value: delays.gateEntry, color: "#8b5cf6" },
      { name: "Weighment", value: delays.weighment, color: "#f59e0b" },
      { name: "QC", value: delays.qc, color: "#6366f1" },
      {
        name: "Material Unloading",
        value: delays.materialUnloading,
        color: "#06b6d4",
      },
      { name: "Submit Bill", value: delays.submitBill, color: "#ef4444" },
      { name: "Bill Entry ERP", value: delays.billEntryERP, color: "#ec4899" },
    ];
  };

  // Filter data based on selected filter
  // Filter data based on selected filter
  useEffect(() => {
    if (data.length === 0) return;

    console.log("\n=== Applying Filter ===");
    console.log("Filter Type:", filterType);

    let filtered = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterType === "today") {
      filtered = data.filter((row) => {
        const planned = row.planned1;
        if (!planned) return false;

        const rowDate = parseDate(planned); // ✅ CHANGE: Use parseDate
        if (!rowDate) return false;
        rowDate.setHours(0, 0, 0, 0);

        return rowDate.getTime() === today.getTime();
      });
    } else if (filterType === "last7days") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      filtered = data.filter((row) => {
        const planned = row.planned1;
        if (!planned) return false;

        const rowDate = parseDate(planned); // ✅ CHANGE: Use parseDate
        if (!rowDate) return false;
        rowDate.setHours(0, 0, 0, 0);

        return rowDate >= sevenDaysAgo && rowDate <= today;
      });
    } else if (filterType === "month" && selectedMonth) {
      filtered = data.filter((row) => {
        const planned = row.planned1;
        if (!planned) return false;

        const rowDate = parseDate(planned); // ✅ CHANGE: Use parseDate
        if (!rowDate) return false;
        const monthYear = `${rowDate.getFullYear()}-${String(
          rowDate.getMonth() + 1
        ).padStart(2, "0")}`;

        return monthYear === selectedMonth;
      });
    } else if (filterType === "sixmonth" && selectedSixMonth) {
      const [startMonth, endMonth] = selectedSixMonth.split("_");

      filtered = data.filter((row) => {
        const planned = row.planned1;
        if (!planned) return false;

        const rowDate = parseDate(planned); // ✅ CHANGE: Use parseDate
        if (!rowDate) return false;
        const monthYear = `${rowDate.getFullYear()}-${String(
          rowDate.getMonth() + 1
        ).padStart(2, "0")}`;

        return monthYear >= startMonth && monthYear <= endMonth;
      });
    } else if (filterType === "year" && selectedYear) {
      filtered = data.filter((row) => {
        const planned = row.planned1;
        if (!planned) return false;

        const rowDate = parseDate(planned); // ✅ CHANGE: Use parseDate
        if (!rowDate) return false;
        return rowDate.getFullYear().toString() === selectedYear;
      });
    } else {
      filtered = data;
    }

    console.log("Filtered data length:", filtered.length);
    setFilteredData(calculateDelays(filtered));
  }, [data, filterType, selectedMonth, selectedSixMonth, selectedYear]);

  // Generate month options (last 12 months)
  const getMonthOptions = (): { value: string; label: string }[] => {
    const months = [];
    const year = parseInt(filterYear || new Date().getFullYear().toString());

    for (let i = 0; i < 12; i++) {
      const monthIndex = i;
      const value = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      const date = new Date(year, monthIndex, 1);
      const label = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      months.push({ value, label });
    }
    return months;
  };

  // Generate six month options
  const getSixMonthOptions = (): { value: string; label: string }[] => {
    const year = filterYear || new Date().getFullYear().toString();
    const options = [
      { value: `${year}-01_${year}-06`, label: `Jan-Jun ${year}` },
      { value: `${year}-07_${year}-12`, label: `Jul-Dec ${year}` },
    ];
    return options;
  };

  // Generate year options
  const getYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      years.push({ value: year.toString(), label: year.toString() });
    }

    return years;
  };

  return (
    <div className=" p-0">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg  p-0 md:p-4 mb-4">
          {/* <h1 className="text-xl md:text-2xl font-bold text-blue-600 mb-4 md:mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
            Delay Analysis Dashboard
          </h1> */}

          {/* Filter Buttons - 2 filters per row on mobile */}
          {/* <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
            
            <button
              onClick={() => {
                setFilterType("today");
                setShowMonthDropdown(false);
                setShowSixMonthDropdown(false);
                setShowYearDropdown(false);
              }}
              className={`px-3 py-2 text-sm md:text-base rounded-lg font-medium transition-colors text-center ${
                filterType === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Today
            </button>

            
            <button
              onClick={() => {
                setFilterType("last7days");
                setShowMonthDropdown(false);
                setShowSixMonthDropdown(false);
                setShowYearDropdown(false);
              }}
              className={`px-3 py-2 text-sm md:text-base rounded-lg font-medium transition-colors text-center ${
                filterType === "last7days"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Last 7 Days
            </button>

            
            <div className="relative min-w-[100px]">
              <button
                onClick={() => {
                  setShowMonthDropdown(!showMonthDropdown);
                  setShowSixMonthDropdown(false);
                  setShowYearDropdown(false);
                }}
                className={`w-full px-3 py-2 text-sm md:text-base rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${
                  filterType === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="truncate">
                  {filterType === "month" && selectedMonth
                    ? getMonthOptions().find(
                        (opt) => opt.value === selectedMonth
                      )?.label || "Month"
                    : "Month"}
                </span>
                <ChevronDown size={14} className="flex-shrink-0" />
              </button>

              {showMonthDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto min-w-[140px]">
                  {getMonthOptions().map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterType("month");
                        setSelectedMonth(option.value);
                        setShowMonthDropdown(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 whitespace-nowrap"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            
            <div className="relative min-w-[120px]">
              <button
                onClick={() => {
                  setShowSixMonthDropdown(!showSixMonthDropdown);
                  setShowMonthDropdown(false);
                  setShowYearDropdown(false);
                }}
                className={`w-full px-3 py-2 text-sm md:text-base rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${
                  filterType === "sixmonth"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="truncate">
                  {filterType === "sixmonth" && selectedSixMonth
                    ? getSixMonthOptions().find(
                        (opt) => opt.value === selectedSixMonth
                      )?.label || "6 Months"
                    : "6 Months"}
                </span>
                <ChevronDown size={14} className="flex-shrink-0" />
              </button>

              {showSixMonthDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                  {getSixMonthOptions().map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterType("sixmonth");
                        setSelectedSixMonth(option.value);
                        setShowSixMonthDropdown(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 whitespace-nowrap"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            
            <div className="relative min-w-[100px]">
              <button
                onClick={() => {
                  setShowYearDropdown(!showYearDropdown);
                  setShowMonthDropdown(false);
                  setShowSixMonthDropdown(false);
                }}
                className={`w-full px-3 py-2 text-sm md:text-base rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${
                  filterType === "year"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="truncate">
                  {filterType === "year" && selectedYear
                    ? getYearOptions().find((opt) => opt.value === selectedYear)
                        ?.label || "Year"
                    : "Year"}
                </span>
                <ChevronDown size={14} className="flex-shrink-0" />
              </button>

              {showYearDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  {getYearOptions().map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterType("year");
                        setSelectedYear(option.value);
                        setFilterYear(option.value);
                        setShowYearDropdown(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 whitespace-nowrap"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div> */}



          <div className="flex items-center gap-2 mb-2 overflow-x-auto whitespace-nowrap">
  
  <button
    onClick={() => setFilterType('today')}
    className={`px-2 py-1 text-xs rounded ${
      filterType === 'today'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    Today
  </button>

  <button
    onClick={() => setFilterType('last7days')}
    className={`px-2 py-1 text-xs rounded ${
      filterType === 'last7days'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    7 Days
  </button>

  {/* Month */}
  <select
  className="px-2 py-1 text-xs bg-gray-100 rounded w-auto"
  value={selectedMonth}
  onChange={(e) => {
    setFilterType('month');
    setSelectedMonth(e.target.value);
  }}
>
  <option value="">Month</option>
  {getMonthOptions().map(m => (
    <option key={m.value} value={m.value}>{m.label}</option>
  ))}
</select>

  {/* 6 Months */}
  <select
    className="px-2 py-1 text-xs bg-gray-100 rounded"
    value={selectedSixMonth}
    onChange={(e) => {
      setFilterType('sixmonth');
      setSelectedSixMonth(e.target.value);
    }}
  >
    <option value="">6 Months</option>
    {getSixMonthOptions().map(m => (
      <option key={m.value} value={m.value}>{m.label}</option>
    ))}
  </select>

  {/* Year */}
  <select
    className="px-2 py-1 text-xs bg-gray-100 rounded"
    value={selectedYear}
    onChange={(e) => {
      setFilterType('year');
      setSelectedYear(e.target.value);
    }}
  >
    <option value="">Year</option>
    {getYearOptions().map(y => (
      <option key={y.value} value={y.value}>{y.label}</option>
    ))}
  </select>
</div>


          
          <div className="mb-4 text-sm text-gray-600 text-center md:text-left">
            Current Filter:{" "}
            <span className="font-semibold">
              {filterType === "today" && "Today"}
              {filterType === "last7days" && "Last 7 Days"}
              {filterType === "month" &&
                selectedMonth &&
                getMonthOptions().find((m) => m.value === selectedMonth)?.label}
              {filterType === "sixmonth" &&
                selectedSixMonth &&
                getSixMonthOptions().find((s) => s.value === selectedSixMonth)
                  ?.label}
              {filterType === "year" && selectedYear}
            </span>
          </div>

          {/* Chart - Larger on mobile */}
          {loading ? (
            <div className="flex items-center justify-center h-64 md:h-96">
              <div className="text-gray-500">Loading data...</div>
            </div>
          ) : (
            // <div className="h-80 md:h-96">
            //   <ResponsiveContainer width="100%" height="100%">
            //     <BarChart
            //       data={filteredData}
            //       margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
            //     >
            //       <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            //       <XAxis
            //         dataKey="name"
            //         angle={-45}
            //         textAnchor="end"
            //         height={80}
            //         interval={0}
            //         fontSize={12}
            //         tick={{ fontSize: 12 }}
            //       />
            //       <YAxis fontSize={12} />
            //       <Tooltip
            //         contentStyle={{
            //           backgroundColor: "white",
            //           border: "1px solid #e5e7eb",
            //           borderRadius: "6px",
            //           fontSize: "12px",
            //         }}
            //         formatter={(value) => [value, "Delay Count"]}
            //       />
            //       <Bar
            //         dataKey="value"
            //         radius={[4, 4, 0, 0]}
            //         animationDuration={1000}
            //       >
            //         {filteredData.map((entry, index) => (
            //           <Cell key={`cell-${index}`} fill={entry.color} />
            //         ))}
            //       </Bar>
            //     </BarChart>
            //   </ResponsiveContainer>
            // </div>


            <div className="h-40">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={filteredData}
      margin={{ top: 10, right: 0, left: 0, bottom: 40 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="name"
        angle={-35}
        textAnchor="end"
        fontSize={10}
        height={60}
        interval={0}
        
      />
      <YAxis fontSize={10} />
      <Tooltip />
      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
        {filteredData.map((e, i) => (
          <Cell key={i} fill={e.color} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>

          )}
        </div>
      </div>
    </div>
  );
};

export default DelayAnalysis;
