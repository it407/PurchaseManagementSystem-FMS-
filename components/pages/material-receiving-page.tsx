
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/modal";
import { Eye, Truck, Loader2, Upload } from "lucide-react";

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
  supplierName: string;
  materialName: string;
  quantity: string;
  rate?: string;
  planned2: string;
  actual1: string;
  gateEntryNo?: string;
  vehicleNo?: string;
  driverName?: string;
  status?: string;
  rowIndex: number;
}

export function MaterialReceivingPage() {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [pending, setPending] = useState<Record[]>([]);
  const [history, setHistory] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    remark: ""
  });
  const [recordToCancel, setRecordToCancel] = useState<Record | null>(null);


  const [formData, setFormData] = useState({
    vehicleNo: "",
    driverName: "",
    attachment: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, attachment: file });
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

          // Column T (Planned2) is index 19, Column U (Actual1) is index 20
          const planned2 = row[21]; // Column T
          const actual1 = row[22]; // Column U

          // Check if Planned2 is not null and Actual1 is null for pending
          if (planned2 && planned2.trim() !== "" && (!actual1 || actual1.trim() === "")) {
            pendingRecords.push({
              id: `row-${i + 1}`,
              indentNumber: row[1] || "", // Column B: Indent Number
              productNo: row[2] || "", // Column C: Product No
              poNo: row[5] || `PO-${i + 1}`,
              supplierName: row[3] || "Supplier",
              materialName: row[4] || "Material",
              quantity: row[6] || "0",
              rate: row[7] || 0,
              planned2: planned2,
              actual1: actual1 || "",
              rowIndex: i + 1,
            });
          }
          // Check if both Planned2 and Actual1 are not null for history
          else if (planned2 && planned2.trim() !== "" && actual1 && actual1.trim() !== "") {
            historyRecords.push({
              id: `row-${i + 1}`,
              indentNumber: row[1] || "", // Column B: Indent Number
              productNo: row[2] || "", // Column C: Product No
              poNo: row[5] || `PO-${i + 1}`,
              supplierName: row[2] || "Supplier",
              materialName: row[4] || "Material",
              quantity: row[5] || "0",
              planned2: planned2,
              actual1: actual1,
              gateEntryNo: row[43] || `GE-${String(historyRecords.length + 1).padStart(3, "0")}`, // Column V
              vehicleNo: row[23] || "N/A", // Column W
              driverName: row[24] || "N/A", // Column X
              status: "Received",
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

  const handleReceiveMaterial = (record: Record) => {
    setSelectedRecord(record);
    setFormData({ vehicleNo: "", driverName: "", attachment: null }); // ✅ Fixed: added attachment property
    setIsModalOpen(true);
  };


  const formatTimestamp = () => {
  const d = new Date();
  
  let month = String(d.getMonth() + 1).padStart(2, '0'); // MM
  let day = String(d.getDate()).padStart(2, '0');        // DD
  let year = d.getFullYear();                            // YYYY
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 0 → 12
  
  return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setSubmitLoading(true);
    try {
      // const timestamp = new Date().toLocaleString();
      const timestamp = formatTimestamp();

      let fileLink = "";

      // Handle file upload if attachment exists
      if (formData.attachment) {
        console.log("📁 Uploading attachment:", formData.attachment.name);

        // Store the file in a variable so TypeScript knows it's not null
        const file = formData.attachment;

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file); // ✅ Now using the variable
        });

        const uploadPayload = {
          action: "uploadFile",
          base64Data: base64Data,
          fileName: formData.attachment.name,
          mimeType: formData.attachment.type,
          folderId: "1k5Hs55027DERG_l9rjG1tpaxds768orW"
        };

        console.log("📁 Uploading file to Google Apps Script...");

        const uploadResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec",
          {
            method: "POST",
            body: new URLSearchParams({
              data: JSON.stringify(uploadPayload)
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

      // Prepare data for submission
      const submissionData = {
        action: "update",
        sheetId: "1MtxLluyxLJwDV_2fxw4qG0wUOBE4Ys8Wd_ewLeP9czA",
        sheetName: "FMS",
        rowIndex: selectedRecord.rowIndex,
        columnData: {
          "W": timestamp, // Column U - Actual1 (current date)
          "X": formData.vehicleNo, // Column V - Vehicle No
          "Y": formData.driverName, // Column W - Driver Name
          "Z": fileLink, // Column X - Attachment File
        }
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
        setFormData({ vehicleNo: "", driverName: "", attachment: null });
        setSubmitLoading(false);
      }, 1500);

    } catch (error) {
      console.error("Error submitting data:", error);
      setSubmitLoading(false);
    }
  };



  const generateCancelSerialNumber = async () => {
    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbwbNemoTxYRwhjNd1l7DeKS5oc7XkopIlVwf9aqi7Z3ZvrmlGBQAv7ucGo_Fi9aY_uL/exec?sheet=Cancel&action=fetch");
      const result = await response.json();

      if (result.success && result.data) {
        const sheetData = result.data.slice(1);
        let highestNumber = 0;
        sheetData.forEach((row: any[]) => {
          const serialNumber = row[1];
          if (serialNumber && typeof serialNumber === 'string' && serialNumber.startsWith('SN-')) {
            const numberPart = parseInt(serialNumber.replace('SN-', ''));
            if (!isNaN(numberPart) && numberPart > highestNumber) {
              highestNumber = numberPart;
            }
          }
        });
        const nextNumber = highestNumber + 1;
        return `SN-${String(nextNumber).padStart(3, '0')}`;
      }
    } catch (error) {
      console.error("Error generating serial number:", error);
    }
    return 'SN-001';
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
        "Gate Entry", // Stage
        cancelForm.remark
      ];

      console.log("Submitting cancel data to Google Sheets:", rowData);

      const response = await fetch("https://script.google.com/macros/s/AKfycbwbNemoTxYRwhjNd1l7DeKS5oc7XkopIlVwf9aqi7Z3ZvrmlGBQAv7ucGo_Fi9aY_uL/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "insert",
          sheetName: "Cancel",
          rowData: JSON.stringify(rowData)
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log("Record cancelled successfully");
        setIsCancelOpen(false);
        setCancelForm({ remark: "" });
        setRecordToCancel(null);

        // Refresh the data
        await fetchData();
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
    return records.filter(record =>
      record.indentNumber?.toLowerCase().includes(term) ||
      record.productNo?.toLowerCase().includes(term) ||
      record.poNo?.toLowerCase().includes(term) ||
      record.supplierName?.toLowerCase().includes(term) ||
      record.materialName?.toLowerCase().includes(term) ||
      record.quantity?.toLowerCase().includes(term) ||
      record.gateEntryNo?.toLowerCase().includes(term) ||
      record.vehicleNo?.toLowerCase().includes(term) ||
      record.driverName?.toLowerCase().includes(term) ||
      record.status?.toLowerCase().includes(term)
    );
  };

  // Update the filtered records in both tabs
  const filteredPending = filterRecords(pending);
  const filteredHistory = filterRecords(history);

  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Header */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Gate Entry</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${tab === "pending"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${tab === "history"
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
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        {searchTerm && (
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            className="text-sm"
          >
            Clear
          </Button>
        )}
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
              <p className="text-lg font-medium">No pending deliveries</p>
              <p className="text-sm mt-1">All followed-up POs have been received.</p>
            </div>
          ) : filteredPending.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No matching records found</p>
              <p className="text-sm mt-1">Try adjusting your search terms.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredPending.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleReceiveMaterial(record)}
                              className="bg-purple-600 hover:bg-purple-700 text-xs flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              Receive
                            </Button>
                            <Button
                              onClick={() => openCancelModal(record)}
                              className="bg-red-600 hover:bg-red-700 text-xs flex items-center gap-1"
                            >
                              Cancel Receive
                            </Button>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{record.indentNumber}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.productNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{record.poNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.supplierName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.materialName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.quantity}</td>
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
                        <p className="font-semibold text-gray-900">{record.poNo}</p>
                        <p className="text-sm text-gray-600">{record.supplierName}</p>
                      </div>
                      <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                        Followed-up
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
                        <p className="text-gray-500">Qty</p>
                        <p className="font-medium">{record.quantity}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleReceiveMaterial(record)}
                      className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4" />
                      Receive Material
                    </Button>

                    <Button
                      onClick={() => openCancelModal(record)}
                      className="w-full bg-red-600 hover:bg-red-700 text-sm flex items-center justify-center gap-2 mt-2"
                    >
                      Cancel Receive
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
              <p className="text-lg font-medium">No received materials</p>
              <p className="text-sm mt-1">Received items will appear here.</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No matching records found</p>
              <p className="text-sm mt-1">Try adjusting your search terms.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approved By
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
                        Material
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{record.gateEntryNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{record.indentNumber}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.productNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.poNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.materialName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.vehicleNo}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
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
                {filteredHistory.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{record.gateEntryNo}</p>
                        <p className="text-sm text-gray-600">{record.poNo}</p>
                      </div>
                      <span className="text-xs font-medium text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full">
                        Received
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
                        <p className="text-gray-500">Vehicle</p>
                        <p className="font-medium text-xs">{record.vehicleNo}</p>
                      </div>
                    </div>


                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* === RECEIVE MATERIAL MODAL === */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gate Entry"
        className="max-w-lg w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <LabeledInput label="PO No." value={selectedRecord?.poNo || ""} onChange={() => { }} disabled />
          <LabeledInput
            label="Vehicle No."
            placeholder="e.g. MH-04-AB-1234"
            value={formData.vehicleNo}
            onChange={(e) =>
              setFormData({ ...formData, vehicleNo: e.target.value.toUpperCase() })
            }
            required
          />
          <LabeledInput
            label="Driver Name"
            placeholder="Enter driver name"
            value={formData.driverName}
            onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachment File
            </label>

            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"  // ✅ allow all formats
                  capture="environment"              // ✅ on phones it gives camera option
                />
                <div className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-md p-3 hover:border-blue-500 transition-colors">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formData.attachment
                      ? formData.attachment.name
                      : "Upload or Take Photo"}
                  </span>
                </div>
              </label>

              {formData.attachment && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, attachment: null })}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Supported: Images, PDF, Word documents
            </p>
          </div>



          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Receive Material"
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
        title="Cancel Gate Entry"
        className="max-w-md w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleCancel} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Are you sure you want to cancel this Gate Entry record? This action cannot be undone.
            </p>
          </div>

          {recordToCancel && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">PO No:</span>
                <span className="font-medium">{recordToCancel.poNo}</span>
                <span className="text-gray-500">Indent No:</span>
                <span className="font-medium">{recordToCancel.indentNumber}</span>
                <span className="text-gray-500">Product No:</span>
                <span className="font-medium">{recordToCancel.productNo}</span>
                <span className="text-gray-500">Supplier:</span>
                <span className="font-medium">{recordToCancel.supplierName}</span>
                <span className="text-gray-500">Material:</span>
                <span className="font-medium">{recordToCancel.materialName}</span>
                <span className="text-gray-500">Quantity:</span>
                <span className="font-medium">{recordToCancel.quantity}</span>
                <span className="text-gray-500">Rate:</span>
                <span className="font-medium">{recordToCancel.rate}</span>
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