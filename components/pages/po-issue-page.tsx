"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/modal";
import { Eye, Send, FileText } from "lucide-react";
import { useProcurement } from "@/contexts/procurement-context";
import { Loader2 } from "lucide-react";

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

export function POIssuePage() {
  const { addRecord, updateRecord, moveRecordToStage } = useProcurement();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true); // Separate loading state for table
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [cancelForm, setCancelForm] = useState({
    remark: "",
  });
  const [poToCancel, setPoToCancel] = useState<any>(null);

  const [formData, setFormData] = useState({
    issueDate: "",
    supplierContact: "",
    modeOfSend: "WhatsApp",
    attachmentName: "",
  });
  const [posPending, setPosPending] = useState<any[]>([]);
  const [posHistory, setPosHistory] = useState<any[]>([]);

  // Fetch data from Google Sheets
  const fetchPOData = async () => {
    try {
      setTableLoading(true); // Set table loading only
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec?sheet=FMS&action=fetch"
      );
      const result = await response.json();

      if (result.success && result.data) {
        const pending: any[] = [];
        const history: any[] = [];

        // Process rows (skip header row)
        // Process rows (skip header row)
        for (let i = 7; i < result.data.length; i++) {
          const row = result.data[i];
          // Check if Planned1 (column H, index 7) is not null and Actual1 (column I, index 8) is null
          if (row[9] && row[9] !== "" && (!row[10] || row[10] === "")) {
            // Pending PO
            pending.push({
              id: `row-${i + 1}`,
              poNo: row[5] || `PO-${i + 1}`,
              indentNumber: row[1] || "", // Column B - Indent Number
              productNumber: row[2] || "", // Column C - Product Number
              supplierName: row[3] || "Supplier",
              materialName: row[4] || "Material",
              quantity: row[6] || 0,
              rate: row[7] || 0,
              deliveryDate: row[8] || "",
              status: "Pending",
              rowIndex: i + 1, // Store row index for updates
            });
          } else if (row[9] && row[9] !== "" && row[10] && row[10] !== "") {
            // History PO
            history.push({
              id: `row-${i + 1}`,
              poNo: row[5] || `PO-${i + 1}`,
              indentNumber: row[1] || "", // Column B - Indent Number
              productNumber: row[2] || "", // Column C - Product Number
              supplierName: row[3] || "Supplier",
              materialName: row[4] || "Material",
              quantity: row[6] || 0,
              rate: row[7] || 0,
              deliveryDate: row[8] || "",
              issueDate: row[11] || "", // Column J
              supplierContact: row[10] || "", // Column K
              modeOfSend: row[11] || "", // Column L
              attachmentName: row[14] || "", // Column M
              status: "Issued",
              rowIndex: i + 1,
            });
          }
        }

        setPosPending(pending);
        setPosHistory(history);
      }
    } catch (error) {
      console.error("Error fetching PO data:", error);
    } finally {
      setTableLoading(false); // Remove table loading
    }
  };

  useEffect(() => {
    fetchPOData();
  }, []);

  const handleIssuePO = (po: any) => {
    setSelectedPO(po);
    setFormData({
      issueDate: new Date().toISOString().split("T")[0],
      supplierContact: "",
      modeOfSend: "WhatsApp",
      attachmentName: "",
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
    if (selectedPO) {
      setSubmitLoading(true);
      console.log("✅ handleSubmit called for PO:", selectedPO);

      try {
        // const timestamp = new Date().toLocaleString();
        const timestamp = formatTimestamp();

        // Format issue date from "yyyy-mm-dd" to "dd/mm/yyyy"
        const formatIssueDate = (dateString: string) => {
          const date = new Date(dateString);
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        const formattedIssueDate = formatIssueDate(formData.issueDate);

        let fileLink = "";

        // Handle file upload if attachment exists
        if (formData.attachmentName) {
          console.log("📁 Uploading attachment:", formData.attachmentName);

          const fileInput = document.querySelector(
            'input[type="file"]'
          ) as HTMLInputElement;
          if (fileInput?.files?.[0]) {
            const file = fileInput.files[0];

            const base64Data = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64 = (e.target?.result as string).split(",")[1];
                resolve(base64);
              };
              reader.readAsDataURL(file);
            });

            const uploadPayload = {
              action: "uploadFile",
              base64Data: base64Data,
              fileName: file.name,
              mimeType: file.type,
              folderId: "1k5Hs55027DERG_l9rjG1tpaxds768orW",
            };

            console.log("📁 Uploading file to Google Apps Script...");

            // Make the request
            const uploadResponse = await fetch(
              "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec",
              {
                method: "POST",
                body: new URLSearchParams({
                  data: JSON.stringify(uploadPayload),
                }),
              }
            );

            const uploadResult = await uploadResponse.json();

            if (uploadResult.success && uploadResult.fileUrl) {
              fileLink = uploadResult.fileUrl;
              console.log("✅ File uploaded successfully:", fileLink);
            } else {
              console.error("❌ File upload failed");
              fileLink = "";
            }
          }
        }

        const updatePayload = {
          action: "update",
          sheetId: "1MtxLluyxLJwDV_2fxw4qG0wUOBE4Ys8Wd_ewLeP9czA",
          sheetName: "FMS",
          rowIndex: selectedPO.rowIndex,
          columnData: {
            K: timestamp, // Column I - Actual1 (current date in dd/mm/yyyy)
            L: formattedIssueDate, // Column J - Issue Date (formatted to dd/mm/yyyy)
            M: formData.supplierContact,
            N: formData.modeOfSend,
            O: fileLink, // Column M - File URL
          },
        };

        console.log(
          "📦 Update payload:",
          JSON.stringify(updatePayload, null, 2)
        );

        // Use no-cors mode to avoid CORS issues
        await fetch(
          "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec",
          {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              data: JSON.stringify(updatePayload),
            }),
          }
        );

        console.log("✅ Request sent successfully (no-cors mode)");

        // Wait a bit for the update to process
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Refresh data
        await fetchPOData();
        setIsModalOpen(false);
        setSelectedPO(null);
        console.log("✅ Update complete");
      } catch (error) {
        console.error("💥 Error updating PO:", error);
        alert("Error updating PO. Please try again.");
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";

    // Check if date is already in dd/mm/yyyy format
    if (dateString.includes("/") && dateString.split("/").length === 3) {
      return dateString;
    }

    // If it's in ISO format (2025-11-11T18:30:00.000Z)
    if (dateString.includes("T") && dateString.includes("-")) {
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (error) {
        console.error("Error formatting date:", error);
        return dateString;
      }
    }

    // If it's in yyyy-mm-dd format
    if (dateString.includes("-") && dateString.split("-").length === 3) {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    }

    return dateString;
  };

  const convertToInputFormat = (dateString: string) => {
    if (!dateString) return "";

    // If date is in dd/mm/yyyy format, convert to yyyy-mm-dd for input
    if (dateString.includes("/") && dateString.split("/").length === 3) {
      const [day, month, year] = dateString.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // If it's in ISO format, extract the date part
    if (dateString.includes("T")) {
      return dateString.split("T")[0];
    }

    return dateString;
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
      if (!poToCancel) return;

      const serialNumber = await generateCancelSerialNumber();
      const timestamp = new Date().toLocaleString();

      const rowData = [
        timestamp,
        serialNumber,
        poToCancel.indentNumber,
        poToCancel.productNumber,
        poToCancel.supplierName,
        poToCancel.materialName,
        poToCancel.quantity,
        poToCancel.rate,
        "PO Issue", // Stage changed from "Indent Details" to "PO Issue"
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
        console.log("PO cancelled successfully");
        setIsCancelOpen(false);
        setCancelForm({ remark: "" });
        setPoToCancel(null);

        // Refresh the data
        await fetchPOData();
      } else {
        console.error("Failed to cancel PO");
        alert("Failed to cancel PO. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling PO:", error);
      alert("Error cancelling PO: " + error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add this function to open cancel modal
  const openCancelModal = (po: any) => {
    setPoToCancel(po);
    setCancelForm({ remark: "" });
    setIsCancelOpen(true);
  };

  // Add this function to filter POs based on search query
  // Replace the filterPOs function with this updated version
  const filterPOs = (pos: any[]) => {
    if (!searchQuery.trim()) return pos;

    const query = searchQuery.toLowerCase();
    return pos.filter(
      (po) =>
        String(po.indentNumber || "")
          .toLowerCase()
          .includes(query) ||
        String(po.productNumber || "")
          .toLowerCase()
          .includes(query) ||
        String(po.poNo || "")
          .toLowerCase()
          .includes(query) ||
        String(po.supplierName || "")
          .toLowerCase()
          .includes(query) ||
        String(po.materialName || "")
          .toLowerCase()
          .includes(query) ||
        String(po.quantity || "").includes(query) ||
        String(po.rate || "").includes(query) ||
        (po.issueDate &&
          String(formatDateForDisplay(po.issueDate) || "")
            .toLowerCase()
            .includes(query)) ||
        String(po.supplierContact || "")
          .toLowerCase()
          .includes(query) ||
        String(po.modeOfSend || "")
          .toLowerCase()
          .includes(query) ||
        String(po.attachmentName || "")
          .toLowerCase()
          .includes(query) ||
        String(po.status || "")
          .toLowerCase()
          .includes(query)
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Header */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Issue PO</h2>

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
          Pending ({posPending.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            tab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          History ({posHistory.length})
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
          {tableLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading POs...</span>
            </div>
          ) : filterPOs(posPending).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No pending POs</p>
              <p className="text-sm mt-1">All indents have been issued.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Action",
                        "Indent No.", // New column
                        "Product No.", // New column
                        "PO No.",
                        "Supplier",
                        "Material",
                        "Qty",
                        "Rate",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filterPOs(posPending).map((po) => (
                      <tr
                        key={po.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleIssuePO(po)}
                              className="bg-green-600 hover:bg-green-700 text-xs flex items-center gap-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Issue PO
                            </Button>
                            <Button
                              onClick={() => openCancelModal(po)}
                              className="bg-red-600 hover:bg-red-700 text-xs flex items-center gap-1"
                            >
                              Cancel Po
                            </Button>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {po.indentNumber}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {po.productNumber}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {po.poNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {po.supplierName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {po.materialName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {po.quantity}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          ₹{po.rate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {filterPOs(posPending).map((po) => (
                  <div
                    key={po.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{po.poNo}</p>
                      </div>
                      <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Indent No.</p>
                        <p className="font-medium">{po.indentNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Product No.</p>
                        <p className="font-medium">{po.productNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Material</p>
                        <p className="font-medium">{po.materialName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Qty</p>
                        <p className="font-medium">{po.quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Rate</p>
                        <p className="font-medium">₹{po.rate}</p>
                      </div>
                      <div>
                        <p>Supplier Name</p>
                        <p className="text-sm text-gray-600">
                          {po.supplierName}
                        </p>
                        </div>
                    </div>

                    <Button
                      onClick={() => handleIssuePO(po)}
                      className="w-full bg-green-600 hover:bg-green-700 text-sm flex items-center justify-center gap-2 mt-2"
                    >
                      <Send className="w-4 h-4" />
                      Issue PO
                    </Button>
                    <Button
                      onClick={() => openCancelModal(po)}
                      className="w-full bg-red-600 hover:bg-red-700 text-sm flex items-center justify-center gap-2 mt-2"
                    >
                      Cancel PO
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
          {tableLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading history...</span>
            </div>
          ) : filterPOs(posHistory).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No history</p>
              <p className="text-sm mt-1">Issued POs will appear here.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Indent No.", // New column
                        "Product No.", // New column
                        "PO No.",
                        "Supplier",
                        "Material",
                        "Issue Date",
                        "Attachment",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filterPOs(posHistory).map((po) => (
                      <tr
                        key={po.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {po.indentNumber}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {po.productNumber}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {po.poNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {po.supplierName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {po.materialName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {formatDateForDisplay(po.issueDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {po.attachmentName ? (
                            <a
                              href={po.attachmentName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <FileText className="w-4 h-4" />
                              View File
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {filterPOs(posHistory).map((po) => (
                  <div
                    key={po.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{po.poNo}</p>
                        <p className="text-sm text-gray-600">
                          {po.supplierName}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full">
                        Issued
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Indent No.</p>
                        <p className="font-medium">{po.indentNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Product No.</p>
                        <p className="font-medium">{po.productNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Material</p>
                        <p className="font-medium">{po.materialName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Issue Date</p>
                        <p className="font-medium text-xs">
                          {formatDateForDisplay(po.issueDate)}
                        </p>
                      </div>
                      {po.attachmentName && (
                        <div className="col-span-2">
                          <p className="text-gray-500">Attachment</p>
                          <a
                            href={po.attachmentName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* === ISSUE PO MODAL === */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Purchase Order"
        className="max-w-lg w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <LabeledInput
            label="PO No."
            value={selectedPO?.poNo || ""}
            onChange={() => {}}
            disabled
          />
          <LabeledInput
            label="Indent No."
            value={selectedPO?.indentNumber || ""}
            onChange={() => {}}
            disabled
          />
          <LabeledInput
            label="Product No."
            value={selectedPO?.productNumber || ""}
            onChange={() => {}}
            disabled
          />
          <LabeledInput
            label="Issue Date"
            type="date"
            value={formData.issueDate}
            onChange={(e) =>
              setFormData({ ...formData, issueDate: e.target.value })
            }
            required
          />
          {/* <LabeledInput
            label="Supplier Contact"
            placeholder="Phone"
            value={formData.supplierContact}
            onChange={(e) =>
              setFormData({ ...formData, supplierContact: e.target.value })
            }
            required
          /> */}

          <LabeledInput
  label="Supplier Contact"
  placeholder="Phone Number"
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  maxLength={10}
  value={formData.supplierContact}
  onChange={(e) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setFormData({ ...formData, supplierContact: value });
  }}
  required
/>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode of Send
            </label>
            <select
              value={formData.modeOfSend}
              onChange={(e) =>
                setFormData({ ...formData, modeOfSend: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
               <option value="WhatsApp">WhatsApp</option>
    <option value="Email">Email</option>
            </select>
          </div> */}
          <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Mode of Send
  </label>

  {/* Read-only display */}
  <input
    type="text"
    value="WhatsApp"
    disabled
    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
  />
</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachment (PDF)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attachmentName: e.target.files?.[0]?.name || "",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {formData.attachmentName && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {formData.attachmentName}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>Issue PO</>
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
        title="Cancel PO"
        className="max-w-md w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleCancel} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Are you sure you want to cancel this PO? This action cannot be
              undone.
            </p>
          </div>

          {poToCancel && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">PO No:</span>
                <span className="font-medium">{poToCancel.poNo}</span>
                <span className="text-gray-500">Indent No:</span>
                <span className="font-medium">{poToCancel.indentNumber}</span>
                <span className="text-gray-500">Product No:</span>
                <span className="font-medium">{poToCancel.productNumber}</span>
                <span className="text-gray-500">Supplier:</span>
                <span className="font-medium">{poToCancel.supplierName}</span>
                <span className="text-gray-500">Material:</span>
                <span className="font-medium">{poToCancel.materialName}</span>
                <span className="text-gray-500">Quantity:</span>
                <span className="font-medium">{poToCancel.quantity}</span>
                <span className="text-gray-500">Rate:</span>
                <span className="font-medium">{poToCancel.rate}</span>
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
