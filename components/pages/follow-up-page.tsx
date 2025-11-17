"use client";

import type React from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/modal";
import { Eye, MessageSquare } from "lucide-react";
import { useProcurement } from "@/contexts/procurement-context";
import { useEffect } from "react"; // Add this import with other imports

// Fixed LabeledInput
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

export function FollowUpPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<
    (typeof pending)[0] | null
  >(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    remark: "",
  });
  const [recordToCancel, setRecordToCancel] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    expectedDelivery: "",
  });
  const [recordToEdit, setRecordToEdit] = useState<any>(null);

  const handleEdit = (record: any) => {
    setRecordToEdit(record);

    // Convert the date from MM/DD/YYYY to YYYY-MM-DD format for input[type="date"]
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return "";

      // If date is in MM/DD/YYYY format
      if (dateString.includes("/")) {
        const [month, day, year] = dateString.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      return dateString;
    };

    setEditFormData({
      expectedDelivery: formatDateForInput(record.expectedDelivery),
    });
    setIsEditModalOpen(true);
  };

  // Add this function to handle the edit submission
  // const handleEditSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (recordToEdit) {
  //     try {
  //       setSubmitLoading(true);

  //       // Format date to dd/mm/yyyy
  //       const formatDateToDDMMYYYY = (dateString: string) => {
  //         const date = new Date(dateString);
  //         const day = String(date.getDate()).padStart(2, "0");
  //         const month = String(date.getMonth() + 1).padStart(2, "0");
  //         const year = date.getFullYear();
  //         return `${day}/${month}/${year}`;
  //       };

  //       const formattedExpectedDate = new Date(
  //         formData.expectedDelivery
  //       ).toLocaleString("en-US", {
  //         year: "numeric",
  //         month: "2-digit",
  //         day: "2-digit",
  //         hour: "2-digit",
  //         minute: "2-digit",
  //         second: "2-digit",
  //         hour12: true,
  //       });

  //       const updatePayload = {
  //         action: "update",
  //         sheetId: "1MtxLluyxLJwDV_2fxw4qG0wUOBE4Ys8Wd_ewLeP9czA",
  //         sheetName: "FMS",
  //         rowIndex: recordToEdit.rowIndex,
  //         columnData: {
  //           S: formattedExpectedDate, // Expected Date - formatted as dd/mm/yyyy
  //         },
  //       };

  //       await fetch(
  //         "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec",
  //         {
  //           method: "POST",
  //           mode: "no-cors",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify(updatePayload),
  //         }
  //       );

  //       // Refresh data after a short delay
  //       setTimeout(async () => {
  //         await fetchFollowUpData();
  //         setIsEditModalOpen(false);
  //         setRecordToEdit(null);
  //         setSubmitLoading(false);
  //       }, 1500);
  //     } catch (error) {
  //       console.error("Error updating expected delivery:", error);
  //       alert("Error updating expected delivery. Please try again.");
  //       setSubmitLoading(false);
  //     }
  //   }
  // };

  // Replace the existing handleEditSubmit function with this updated version
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recordToEdit) {
      try {
        setSubmitLoading(true);

        // Format date to match your timestamp format (MM/DD/YYYY, HH:MM:SS AM/PM)
        const formatTimestamp = (dateString: string) => {
          const d = new Date(dateString);

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

        const formattedExpectedDate = formatTimestamp(
          editFormData.expectedDelivery
        );

        const updatePayload = {
          action: "update",
          sheetId: "1MtxLluyxLJwDV_2fxw4qG0wUOBE4Ys8Wd_ewLeP9czA",
          sheetName: "FMS",
          rowIndex: recordToEdit.rowIndex,
          columnData: {
            S: formattedExpectedDate, // Expected Date - formatted as MM/DD/YYYY, HH:MM:SS AM/PM
          },
        };

        console.log("Update payload for edit:", updatePayload);

        await fetch(
          "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec",
          {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatePayload),
          }
        );

        // Refresh data after a short delay
        setTimeout(async () => {
          await fetchFollowUpData();
          setIsEditModalOpen(false);
          setRecordToEdit(null);
          setSubmitLoading(false);
        }, 1500);
      } catch (error) {
        console.error("Error updating expected delivery:", error);
        alert("Error updating expected delivery. Please try again.");
        setSubmitLoading(false);
      }
    }
  };

  const [formData, setFormData] = useState({
    expectedDelivery: "",
    remarks: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false); // Add this line

  const handleFollowUp = (record: (typeof pending)[0]) => {
    setSelectedRecord(record);
    setFormData({
      expectedDelivery: record.deliveryDate || "",
      remarks: "",
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
    if (selectedRecord) {
      try {
        setSubmitLoading(true); // Add this line
        // const timestamp = new Date().toLocaleString();
        const timestamp = formatTimestamp();

        const currentDate = new Date().toISOString().split("T")[0];

        // Format date to dd/mm/yyyy
        // Format date same as timestamp (MM/DD/YYYY, HH:MM:SS AM/PM)
        const formatDate = (dateString: string) => {
          return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true, // for AM/PM format
          });
        };

        const formattedExpectedDate = formatDate(formData.expectedDelivery);
        const formattedCurrentDate = formatDate(currentDate);

        const updatePayload = {
          action: "update",
          sheetId: "1MtxLluyxLJwDV_2fxw4qG0wUOBE4Ys8Wd_ewLeP9czA",
          sheetName: "FMS",
          rowIndex: selectedRecord.rowIndex,
          columnData: {
            R: timestamp, // Actual2 (Follow-up done date) - formatted
            S: formattedExpectedDate, // Expected Date - formatted
            T: formData.remarks, // Remarks
          },
        };
        console.log("updatePayload", updatePayload);

        await fetch(
          "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec",
          {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatePayload),
          }
        );

        // Refresh data after a short delay
        setTimeout(async () => {
          await fetchFollowUpData();
          setIsModalOpen(false);
          setSelectedRecord(null);
          setSubmitLoading(false); // Add this line
        }, 1500);
      } catch (error) {
        console.error("Error updating follow-up:", error);
        alert("Error updating follow-up. Please try again.");
        setSubmitLoading(false); // Add this line
      }
    }
  };

  // Fetch data from Google Sheets
  const fetchFollowUpData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec?sheet=FMS&action=fetch"
      );
      const result = await response.json();

      if (result.success && result.data) {
        const pendingData: any[] = [];
        const historyData: any[] = [];

        // Process rows (skip header rows - start from row 6)
        for (let i = 7; i < result.data.length; i++) {
          const row = result.data[i];

          if (row[16] && row[16] !== "" && (!row[17] || row[17] === "")) {
            // Pending follow-up
            pendingData.push({
              id: `row-${i + 1}`,
              indentNumber: row[1] || "", // Column B: Indent Number
              productNo: row[2] || "", // Column C: Product No
              poNo: row[5] || `PO-${i + 1}`,
              supplierName: row[3] || "Supplier",
              materialName: row[4] || "Material",
              quantity: row[6] || 0,
              rate: row[7] || 0,
              deliveryDate: row[8] || "",
              expectedDelivery: row[8] || "", // Column N
              status: "Pending",
              rowIndex: i + 1,
            });
          } else if (row[16] && row[16] !== "" && row[17] && row[17] !== "") {
            // History - both Planned2 and Actual2 are not null
            historyData.push({
              id: `row-${i + 1}`,
              indentNumber: row[1] || "", // Column B: Indent Number
              productNo: row[2] || "", // Column C: Product No
              poNo: row[5] || `PO-${i + 1}`,
              supplierName: row[3] || "Supplier",
              materialName: row[4] || "Material",
              quantity: row[6] || 0,
              rate: row[5] || 0,
              deliveryDate: row[8] || "",
              remark: row[19] || "",
              expectedDelivery: row[18] || "", // Column N
              status: "Follow-up Done",
              rowIndex: i + 1,
            });
          }
        }

        setPending(pendingData);
        setHistory(historyData);
      }
    } catch (error) {
      console.error("Error fetching follow-up data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUpData();
  }, []);

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
        "Follow-up", // Stage changed to "Follow-up"
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
        console.log("Record cancelled successfully");
        setIsCancelOpen(false);
        setCancelForm({ remark: "" });
        setRecordToCancel(null);

        // Refresh the data
        await fetchFollowUpData();
      } else {
        console.error("Failed to cancel record");
        alert("Failed to cancel record. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling record:", error);
      alert("Error cancelling record: " + error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add this function to open cancel modal
  const openCancelModal = (record: any) => {
    setRecordToCancel(record);
    setCancelForm({ remark: "" });
    setIsCancelOpen(true);
  };

  const filterRecords = (records: any[]) => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();
    return records.filter(
      (record) =>
        String(record.indentNumber || "")
          .toLowerCase()
          .includes(query) ||
        String(record.productNo || "")
          .toLowerCase()
          .includes(query) ||
        String(record.poNo || "")
          .toLowerCase()
          .includes(query) ||
        String(record.supplierName || "")
          .toLowerCase()
          .includes(query) ||
        String(record.materialName || "")
          .toLowerCase()
          .includes(query) ||
        String(record.quantity || "").includes(query) ||
        String(record.rate || "").includes(query) ||
        String(record.expectedDelivery || "")
          .toLowerCase()
          .includes(query) ||
        String(record.deliveryDate || "")
          .toLowerCase()
          .includes(query) ||
        String(record.remarks || "")
          .toLowerCase()
          .includes(query) ||
        String(record.status || "")
          .toLowerCase()
          .includes(query)
    );
  };

  const formatDateToDDMMYYYY = (dateString: string) => {
    if (!dateString) return "";

    try {
      // Agar date already "2025-11-15T00:00:00.000Z" format mein hai
      if (dateString.includes("T")) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }

      // Agar date already kisi aur format mein hai, to as it is return karo
      return dateString;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Original string return karo agar error aaye
    }
  };

  // Replace the existing formatDateToDDMMYYYY function with this:
const formatDateToDDMMYYYYWithTime = (dateString: string) => {
  if (!dateString) return "";

  try {
    // If date is in "MM/DD/YYYY, HH:MM:SS AM/PM" format (from Google Sheets)
    if (dateString.includes("/") && dateString.includes(",")) {
      const [datePart, timePart] = dateString.split(",");
      const [month, day, year] = datePart.split("/");
      const [time, ampm] = timePart.trim().split(" ");
      
      // Extract hours and minutes from time (HH:MM:SS)
      const [hours, minutes] = time.split(":");
      
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year} ${hours}:${minutes} ${ampm}`;
    }

    // If date is in ISO format or datetime-local format
    if (dateString.includes("T")) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      
      return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
    }

    // If already has some other format but contains time, try to parse it
    if (dateString.includes(":")) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        
        return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
      }
    }

    // If no time information found, return just date
    return dateString;
  } catch (error) {
    console.error("Error formatting date with time:", error);
    return dateString;
  }
};

  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Header */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
        Follow-up
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

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-64">
          <Input
            type="text"
            placeholder="Search all columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* === PENDING TAB === */}
      {tab === "pending" && (
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-lg mt-2">Loading...</p>
            </div>
          ) : filterRecords(pending).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">
                {searchQuery
                  ? "No matching records found"
                  : "No pending follow-ups"}
              </p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "All follow-ups have been completed."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray,gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
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
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filterRecords(pending).map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleFollowUp(record)}
                              className="bg-purple-600 hover:bg-purple-700 text-xs flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Follow-up
                            </Button>
                            <Button
                              onClick={() => openCancelModal(record)}
                              className="bg-red-600 hover:bg-red-700 text-xs flex items-center gap-1"
                            >
                              Cancel Follow-up
                            </Button>
                          </div>
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
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.supplierName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.materialName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {filterRecords(pending).map((record) => (
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
                          {record.supplierName}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Indent No.</p>
                        <p className="font-medium">{record.indentNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Product No.</p>
                        <p className="font-medium">{record.productNo}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Material</p>
                        <p className="font-medium">{record.materialName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Expected</p>
                        <p className="font-medium text-xs">
                          {record.expectedDelivery || record.deliveryDate}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleFollowUp(record)}
                      className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Follow-up
                    </Button>
                    <Button
                      onClick={() => openCancelModal(record)}
                      className="w-full bg-red-600 hover:bg-red-700 text-sm flex items-center justify-center gap-2 mt-2"
                    >
                      Cancel Follow-up
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* === HISTORY TAB === */}
      {tab === "history" && (
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-lg mt-2">Loading...</p>
            </div>
          ) : filterRecords(history).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No follow-up history</p>
              <p className="text-sm mt-1">Followed-up POs will appear here.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <td className="px-4 py-3">Action</td>
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
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Date
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remark
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filterRecords(history).map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Button
                            onClick={() => handleEdit(record)}
                            className="bg-green-600 hover:bg-green-700 text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Edit
                          </Button>
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
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.supplierName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.materialName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {formatDateToDDMMYYYYWithTime(record.expectedDelivery)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 break-words text-center">
                          {record.remark}
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
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
                {filterRecords(history).map((record) => (
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
                          {record.supplierName}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                        {record.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Indent No.</p>
                        <p className="font-medium">{record.indentNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Product No.</p>
                        <p className="font-medium">{record.productNo}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Material</p>
                        <p className="font-medium">{record.materialName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Expected</p>
                        <p className="font-medium text-xs">
                         {formatDateToDDMMYYYYWithTime(record.expectedDelivery)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm mb-4">
                      <p className="text-gray-500">Remark</p>
                      <p className="font-medium text-xs">{record.remark}</p>
                    </div>

                    <Button
                      onClick={() => handleEdit(record)}
                      className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Edit Expected Date
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* === FOLLOW-UP MODAL === */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Follow-up"
        className="max-w-lg w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <LabeledInput
            label="PO No."
            value={selectedRecord?.poNo || ""}
            onChange={() => {}}
            disabled
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Delivery Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.expectedDelivery} // store full datetime string: "YYYY-MM-DDTHH:MM"
              onChange={(e) =>
                setFormData({ ...formData, expectedDelivery: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks / Notes
            </label>
            <textarea
              placeholder="Enter follow-up remarks..."
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={submitLoading} // Add this line
            >
              {submitLoading ? "Submitting..." : "Submit Follow-up"}{" "}
              {/* Change this line */}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Record"
        className="max-w-md w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleCancel} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Are you sure you want to cancel this record? This action cannot be
              undone.
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
                <span className="text-gray-500">Supplier:</span>
                <span className="font-medium">
                  {recordToCancel.supplierName}
                </span>
                <span className="text-gray-500">Material:</span>
                <span className="font-medium">
                  {recordToCancel.materialName}
                </span>
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

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Expected Date"
        className="max-w-md w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <LabeledInput
            label="PO No."
            value={recordToEdit?.poNo || ""}
            onChange={() => {}}
            disabled
          />
          <LabeledInput
            label="Indent No."
            value={recordToEdit?.indentNumber || ""}
            onChange={() => {}}
            disabled
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Delivery Date & Time
            </label>
            <input
              type="datetime-local"
              value={editFormData.expectedDelivery}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  expectedDelivery: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={submitLoading}
            >
              {submitLoading ? "Updating..." : "Update Delivery Date"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
