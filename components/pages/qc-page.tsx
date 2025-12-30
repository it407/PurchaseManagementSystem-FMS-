"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/modal";
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";

// Reusable Labeled Input
function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  required = false,
}: {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
}

interface Record {
  id: string;
  poNo: string;
  indentNumber: string;
  productNo: string;
  materialName: string;
  supplierName: string;
  quantity: string;
  plannedDate: string;
  rate?: string;
  status: string;
  qcReportNo?: string;
  sampleResult?: string;
  testDate?: string;
  approvalStatus?: string;
  rowIndex: number;
}

export function QCPage() {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [pending, setPending] = useState<Record[]>([]);
  const [history, setHistory] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    remark: "",
  });
  const [recordToCancel, setRecordToCancel] = useState<Record | null>(null);
  const [formData, setFormData] = useState({
    sampleResult: "Pass",
    testDate: "",
    approvalStatus: "Approved",
    qcReportNo: "", // Add this line
  });


  const formatOnlyDate = (value: any) => {
  if (!value) return "";

  let d: Date | null = null;

  // Case 1: MM/DD/YYYY, hh:mm:ss AM/PM
  if (value.includes(",")) {
    const temp = new Date(value);
    if (!isNaN(temp.getTime())) {
      d = temp;
    }
  }

  // Case 2: DD/MM/YYYY HH:mm:ss
  else if (value.includes("/")) {
    const datePart = value.split(" ")[0]; // "26/12/2025"
    const [day, month, year] = datePart.split("/");

    if (day && month && year) {
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
  }

  // Final formatting
  if (d) {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return value;
};


  // Fetch data from Google Sheets
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec?sheet=FMS&action=fetch"
      );
      const result = await response.json();

      if (result.success && result.data) {
        const pendingRecords: Record[] = [];
        const historyRecords: Record[] = [];

        // Process rows (skip header rows - start from row 6)
        for (let i = 7; i < result.data.length; i++) {
          const row = result.data[i];

          // Column AF (Planned5) is index 31, Column AG (Actual5) is index 32
          const planned5 = row[35]; // Column AF
          const actual5 = row[36]; // Column AG

          // Check if Planned5 is not null and Actual5 is null for pending
          if (
            planned5 &&
            planned5.trim() !== "" &&
            (!actual5 || actual5.trim() === "")
          ) {
            pendingRecords.push({
              id: `row-${i + 1}`,
              indentNumber: row[1] || "", // Column B: Indent Number
              productNo: row[2] || "", // Column C: Product No
              supplierName: row[3] || "Supplier",
              poNo: row[5] || `PO-${i + 1}`,
              materialName: row[4] || "Material",
              plannedDate: formatOnlyDate(row[35]),
              quantity: row[6] || "0",
              rate: row[7] || 0,
              status: "Verified",
              rowIndex: i + 1,
            });
          }
          // Check if both Planned5 and Actual5 are not null for history
          else if (
            planned5 &&
            planned5.trim() !== "" &&
            actual5 &&
            actual5.trim() !== ""
          ) {
            historyRecords.push({
              id: `row-${i + 1}`,
              indentNumber: row[1] || "", // Column B: Indent Number
              productNo: row[2] || "", // Column C: Product No
              supplierName: row[3] || "Supplier",
              poNo: row[5] || `PO-${i + 1}`,
              materialName: row[4] || "Material",
              plannedDate: formatOnlyDate(row[35]),
              quantity: row[6] || "0",
              rate: row[7] || 0,
              qcReportNo:
                row[37] ||
                `QC-${String(historyRecords.length + 1).padStart(3, "0")}`, // Column AH
              sampleResult: row[38] || "Pass", // Column AI
              testDate: row[39] || "", // Column AJ
              approvalStatus: row[40] || "Approved", // Column AK
              status: "QC Done",
              rowIndex: i + 1,
            });
          }
        }

        setPending(pendingRecords);
        setHistory(historyRecords);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleQC = (record: Record) => {
    setSelectedRecord(record);
    setFormData({
      sampleResult: "Pass",
      testDate: new Date().toISOString().split("T")[0],
      approvalStatus: "Approved",
      qcReportNo: `QC-${String(history.length + 1).padStart(3, "0")}`, // Add this line
    });
    setIsModalOpen(true);
  };

  const formatTimestamp = () => {
    const d = new Date();

    let month = String(d.getMonth() + 1).padStart(2, "0"); // MM
    let day = String(d.getDate()).padStart(2, "0"); // DD
    let year = d.getFullYear(); // YYYY

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert 0 → 12

    return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setSubmitLoading(true);
    try {
      // Get current date in dd/mm/yyyy format
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      // const timestamp = new Date().toLocaleString();
      const timestamp = formatTimestamp();

      // Prepare data for submission
      const submissionData = {
        action: "update",
        sheetId: "1MtxLluyxLJwDV_2fxw4qG0wUOBE4Ys8Wd_ewLeP9czA",
        sheetName: "FMS",
        rowIndex: selectedRecord.rowIndex,
        columnData: {
          AK: timestamp, // Column AG - Actual5 (current date)
          AL: formData.qcReportNo, // Column AH - QC Report No (now manual)
          AM: formData.sampleResult, // Column AI - Sample Result
          AN: formData.testDate, // Column AJ - Test Date
          AO: formData.approvalStatus, // Column AK - Approval Status
        },
      };

      // Submit to Google Sheets
      await fetch(
        "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        }
      );

      // Refresh data after a short delay
      setTimeout(async () => {
        await fetchData();
        setIsModalOpen(false);
        setSelectedRecord(null);
        setSubmitLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error submitting data:", error);
      setSubmitLoading(false);
    }
  };

  const generateCancelSerialNumber = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwbNemoTxYRwhjNd1l7DeKS5oc7XkopIlVwf9aqi7Z3ZvrmlGBQAv7ucGo_Fi9aY_uL/exec?sheet=Cancel&action=fetch"
      );
      const result = await response.json();

      if (result.success && result.data) {
        const sheetData = result.data.slice(1);
        let highestNumber = 0;
        sheetData.forEach((row: any[]) => {
          const serialNumber = row[1];
          if (
            serialNumber &&
            typeof serialNumber === "string" &&
            serialNumber.startsWith("SN-")
          ) {
            const numberPart = parseInt(serialNumber.replace("SN-", ""));
            if (!isNaN(numberPart) && numberPart > highestNumber) {
              highestNumber = numberPart;
            }
          }
        });
        const nextNumber = highestNumber + 1;
        return `SN-${String(nextNumber).padStart(3, "0")}`;
      }
    } catch (error) {
      console.error("Error generating serial number:", error);
    }
    return "SN-001";
  };

  // Add this cancel handler function
  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (!recordToCancel) return;

      const serialNumber = await generateCancelSerialNumber();
      const timestamp = new Date().toLocaleString();

      const rowData = [
        timestamp,
        serialNumber,
        recordToCancel.indentNumber,
        recordToCancel.productNo,
        recordToCancel.supplierName,
        recordToCancel.materialName,
        recordToCancel.quantity,
        recordToCancel.rate,
        "Quality Check", // Stage
        cancelForm.remark,
      ];

      console.log("Submitting cancel data to Google Sheets:", rowData);

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwbNemoTxYRwhjNd1l7DeKS5oc7XkopIlVwf9aqi7Z3ZvrmlGBQAv7ucGo_Fi9aY_uL/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            action: "insert",
            sheetName: "Cancel",
            rowData: JSON.stringify(rowData),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("QC record cancelled successfully");
        setIsCancelOpen(false);
        setCancelForm({ remark: "" });
        setRecordToCancel(null);

        // Refresh the data
        await fetchData();
      } else {
        console.error("Failed to cancel QC record");
        alert("Failed to cancel QC record. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling QC record:", error);
      alert("Error cancelling QC record: " + error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add this function to open cancel modal
  const openCancelModal = (record: Record) => {
    setRecordToCancel(record);
    setCancelForm({ remark: "" });
    setIsCancelOpen(true);
  };

  // Add this state near other useState declarations
  const [searchTerm, setSearchTerm] = useState("");

  // Add this function to filter records based on search term
  const filterRecords = (records: Record[]) => {
    if (!searchTerm.trim()) return records;

    const term = searchTerm.toLowerCase();
    return records.filter(
      (record) =>
        record.indentNumber?.toLowerCase().includes(term) ||
        record.productNo?.toLowerCase().includes(term) ||
        record.poNo?.toLowerCase().includes(term) ||
        record.materialName?.toLowerCase().includes(term) ||
        record.qcReportNo?.toLowerCase().includes(term) ||
        record.sampleResult?.toLowerCase().includes(term) ||
        record.approvalStatus?.toLowerCase().includes(term) ||
        record.status?.toLowerCase().includes(term)
    );
  };

  const parseDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return new Date(0);
  const [day, month, year] = dateStr.split("/");
  return new Date(Number(year), Number(month) - 1, Number(day));
};


  // Update the filtered records in both tabs
  // const filteredPending = filterRecords(pending);
  // const filteredHistory = filterRecords(history);


  const filteredPending = filterRecords(pending).sort((a, b) => {
  const dateA = parseDDMMYYYY(a.plannedDate);
  const dateB = parseDDMMYYYY(b.plannedDate);
  return dateA.getTime() - dateB.getTime(); // old → new
});

const filteredHistory = filterRecords(history).sort((a, b) => {
  const dateA = parseDDMMYYYY(a.plannedDate);
  const dateB = parseDDMMYYYY(b.plannedDate);
  return dateA.getTime() - dateB.getTime(); // old → new
});


  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Header */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
        Quality Check (QC)
      </h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            tab === "pending"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            tab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          History ({history.length})
        </button>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder={`Search in ${tab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )}

      {/* === PENDING TAB === */}
      {!loading && tab === "pending" && (
        <Card className="overflow-hidden">
          {pending.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No pending QC</p>
              <p className="text-sm mt-1">
                All verified materials have been QC checked.
              </p>
            </div>
          ) : filteredPending.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No matching records found</p>
              <p className="text-sm mt-1">Try adjusting your search terms.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              {/* <div className="hidden md:block overflow-x-auto"> */}
              <div className="hidden sm:block max-h-[500px] overflow-y-auto overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-20">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        planned Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indent No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredPending.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleQC(record)}
                              className="bg-green-600 hover:bg-red-700 text-xs flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              QC Check
                            </Button>
                            <Button
                              onClick={() => openCancelModal(record)}
                              className="bg-red-600 hover:bg-red-700 text-xs flex items-center gap-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.plannedDate}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.indentNumber}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.productNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.poNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.supplierName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.materialName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {filteredPending.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {record.poNo}
                        </p>
                        <p className="text-sm text-gray-600">
                          {record.materialName}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                        Verified
                      </span>
                    </div>

                    <Button
                      onClick={() => handleQC(record)}
                      className="w-full bg-green-600 hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      QC Check
                    </Button>
                    <Button
                      onClick={() => openCancelModal(record)}
                      className="w-full bg-red-600 hover:bg-red-700 text-sm flex items-center justify-center gap-2 mt-2"
                    >
                      Cancel QC Check
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* === HISTORY TAB === */}
      {!loading && tab === "history" && (
        <Card className="overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No QC history</p>
              <p className="text-sm mt-1">QC reports will appear here.</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No matching records found</p>
              <p className="text-sm mt-1">Try adjusting your search terms.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              {/* <div className="hidden md:block overflow-x-auto"> */}
              <div className="hidden sm:block max-h-[500px] overflow-y-auto overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-20">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Planned Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indent No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        QC Report No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approval Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredHistory.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.plannedDate}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.indentNumber}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.productNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.qcReportNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.poNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.supplierName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.materialName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              record.sampleResult === "Pass"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {record.sampleResult === "Pass" ? (
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                            )}
                            {record.sampleResult}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.testDate}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              record.approvalStatus === "Approved"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {record.approvalStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {filteredHistory.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {record.qcReportNo}
                        </p>
                        <p className="text-sm text-gray-600">{record.poNo}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          record.sampleResult === "Pass"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.sampleResult}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Material</p>
                        <p className="font-medium">{record.materialName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Approval</p>
                        <p className="font-medium">{record.approvalStatus}</p>
                      </div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                      <Eye className="w-4 h-4" />
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* === QC MODAL === */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Quality Check Form"
        className="max-w-lg w-full mx-4 sm:mx-auto"
        backdropClassName="bg-black/30"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <LabeledInput
            label="PO No."
            value={selectedRecord?.poNo || ""}
            onChange={() => {}}
            disabled
          />
          <LabeledInput
            label="PO No."
            value={selectedRecord?.supplierName || ""}
            onChange={() => {}}
            disabled
          />
          <LabeledInput
            label="Material Name"
            value={selectedRecord?.materialName || ""}
            onChange={() => {}}
            disabled
          />

          <LabeledInput
            label="QC Report No."
            value={formData.qcReportNo}
            onChange={(e) =>
              setFormData({ ...formData, qcReportNo: e.target.value })
            }
            placeholder="Enter QC Report Number"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sample Result
            </label>
            <select
              value={formData.sampleResult}
              onChange={(e) =>
                setFormData({ ...formData, sampleResult: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
          </div>

          <LabeledInput
            label="Test Date"
            type="date"
            value={formData.testDate}
            onChange={(e) =>
              setFormData({ ...formData, testDate: e.target.value })
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Approval Status
            </label>
            <select
              value={formData.approvalStatus}
              onChange={(e) =>
                setFormData({ ...formData, approvalStatus: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit QC"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
              disabled={submitLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Quality Check"
        className="max-w-md w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleCancel} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Are you sure you want to cancel this quality check record? This
              action cannot be undone.
            </p>
          </div>

          {recordToCancel && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">PO No:</span>
                <span className="font-medium">{recordToCancel.poNo}</span>
                <span className="text-gray-500">Indent No:</span>
                <span className="font-medium">
                  {recordToCancel.indentNumber}
                </span>
                <span className="text-gray-500">Product No:</span>
                <span className="font-medium">{recordToCancel.productNo}</span>
                <span className="text-gray-500">Material:</span>
                <span className="font-medium">
                  {recordToCancel.materialName}
                </span>
                <span className="text-gray-500">Quantity:</span>
                <span className="font-medium">{recordToCancel.quantity}</span>
                <span className="text-gray-500">Rate:</span>
                <span className="font-medium">{recordToCancel.rate}</span>
                <span className="text-gray-500">Status:</span>
                <span className="font-medium">{recordToCancel.status}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remark
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={cancelForm.remark}
              onChange={(e) => setCancelForm({ remark: e.target.value })}
              placeholder="Enter reason for cancellation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={submitLoading}
            >
              {submitLoading ? "Cancelling..." : "Confirm Cancel"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelOpen(false)}
              className="flex-1"
              disabled={submitLoading}
            >
              Go Back
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
