"use client";

import type React from "react";
// import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/modal";
import { Eye, FileInput } from "lucide-react";
import { useProcurement } from "@/contexts/procurement-context";
import { useState, useEffect } from "react";
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
        required={required} 
      />
    </div>
  );
}

interface BillEntryRecord {
  id: string;
  poNo: string;
  indentNumber: string;
  productNo: string;
  billNo: string;
  amount: number;
  enteredBy?: string;
  entryDate?: string;
  planned9?: string;
  actual9?: string;
  rowIndex: number;
  erpLink?: string;
}

export function BillEntryPage() {
  // const [tab, setTab] = useState<"pending" | "history">("pending");
  const { getRecordsByStage, updateRecord, moveRecordToStage: moveToStage } = useProcurement();

  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [pending, setPending] = useState<BillEntryRecord[]>([]);
  const [history, setHistory] = useState<BillEntryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    remark: ""
  });
  const [recordToCancel, setRecordToCancel] = useState<BillEntryRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BillEntryRecord | null>(null);
  const [formData, setFormData] = useState({
    enteredBy: "",
    billNo: "",
    amount: "",
    purchaseOrderNo: "",
  });

  const handleBillEntry = (record: BillEntryRecord) => {
    setSelectedRecord(record);
    setFormData({
      enteredBy: "",
      billNo: record.billNo,
      amount: String(record.amount || 0),
      purchaseOrderNo:"", // Add this line - prefill with existing PO number
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setSubmitLoading(true);
    try {
      // Get current date in dd/mm/yyyy format
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const timestamp = new Date().toLocaleString();



      // Prepare data for submission
      const submissionData = {
        action: "update",
        sheetId: "1MtxLluyxLJwDV_2fxw4qG0wUOBE4Ys8Wd_ewLeP9czA",
        sheetName: "FMS",
        rowIndex: selectedRecord.rowIndex,
        columnData: {
          "BB": timestamp, // Column BC - Actual9 (current date)
          "BC": formData.enteredBy, // Column BD - Entered By
          "BD": formData.purchaseOrderNo,
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
        setSubmitLoading(false);
      }, 1500);

    } catch (error) {
      console.error("Error submitting data:", error);
      setSubmitLoading(false);
    }
  };


  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec?sheet=FMS&action=fetch"
      );
      const result = await response.json();

      if (result.success && result.data) {
        const pendingRecords: BillEntryRecord[] = [];
        const historyRecords: BillEntryRecord[] = [];

        // Process rows (skip header rows - start from row 6)
        for (let i = 6; i < result.data.length; i++) {
          const row = result.data[i];

          // Column BB (Planned9) is index 53, Column BC (Actual9) is index 54
          const planned9 = row[52]; // Column BB
          const actual9 = row[53]; // Column BC

          // Check if Planned9 is not null and Actual9 is null for pending
          if (planned9 && planned9.trim() !== "" && (!actual9 || actual9.trim() === "")) {
            pendingRecords.push({
              id: `row-${i + 1}`,
              indentNumber: row[1] || "", // Column B: Indent Number
              productNo: row[2] || "", // Column C: Product No
              poNo: row[5] || `PO-${i + 1}`,
              billNo: row[47] || 0, // Column AU
              amount: parseFloat(row[48]) || 0, // Column K
              rowIndex: i + 1,
            });
          }
          // Check if both Planned9 and Actual9 are not null for history
          else if (planned9 && planned9.trim() !== "" && actual9 && actual9.trim() !== "") {
            historyRecords.push({
              id: `row-${i + 1}`,
              indentNumber: row[1] || "", // Column B: Indent Number
              productNo: row[2] || "", // Column C: Product No
              poNo: row[5] || `PO-${i + 1}`,
              billNo: row[49] || `BILL-${String(historyRecords.length + 1).padStart(3, "0")}`, // Column AU
              amount: parseFloat(row[48]) || 0, // Column K
              enteredBy: row[54] || "", // Column BD - Entered By
              entryDate: row[56] || "", // Column BC (Actual9)
              rowIndex: i + 1,
              erpLink: row[56] || "", // Column BE - ERP Link
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
        "N/A", // supplierName (not available in this context)
        "N/A", // materialName (not available in this context)
        "0", // quantity (not available in this context)
        recordToCancel.amount || "0",
        "ERP Bill Entry", // Stage
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
        console.log("ERP bill entry record cancelled successfully");
        setIsCancelOpen(false);
        setCancelForm({ remark: "" });
        setRecordToCancel(null);

        // Refresh the data
        await fetchData();
      } else {
        console.error("Failed to cancel ERP bill entry record");
        alert("Failed to cancel ERP bill entry record. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling ERP bill entry record:", error);
      alert("Error cancelling ERP bill entry record: " + error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add this function to open cancel modal
  const openCancelModal = (record: BillEntryRecord) => {
    setRecordToCancel(record);
    setCancelForm({ remark: "" });
    setIsCancelOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Header */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Bill Entry in ERP</h2>

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


      {/* === PENDING TAB === */}
      {tab === "pending" && (
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No pending ERP entries</p>
              <p className="text-sm mt-1">All QC reports have been entered in ERP.</p>
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
                        Bill No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pending.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleBillEntry(record)}
                              className="bg-teal-600 hover:bg-teal-700 text-xs flex items-center gap-1"
                            >
                              <FileInput className="w-3.5 h-3.5" />
                              ERP Entry
                            </Button>
                            <Button
                              onClick={() => openCancelModal(record)}
                              className="bg-red-600 hover:bg-red-700 text-xs flex items-center gap-1"
                            >
                              Cancel ERP Entery
                            </Button>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{record.indentNumber}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.productNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.billNo || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.poNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-green-700">
                          ₹{record.amount?.toLocaleString("en-IN") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {pending.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{record.poNo}</p>
                        <p className="text-sm text-gray-600">Bill: {record.billNo || "Auto"}</p>
                      </div>
                      <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                        QC Done
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-gray-500">Indent No.</p>
                        <p className="font-medium text-gray-900">{record.indentNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Product No.</p>
                        <p className="font-medium text-gray-900">{record.productNo}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-bold text-green-700">
                        ₹{record.amount?.toLocaleString("en-IN") || "—"}
                      </p>
                    </div>

                    {/* Action Button First */}
                    <Button
                      onClick={() => handleBillEntry(record)}
                      className="w-full bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-2"
                    >
                      <FileInput className="w-4 h-4" />
                      Enter in ERP
                    </Button>
                    <Button
                      onClick={() => openCancelModal(record)}
                      className="w-full bg-red-600 hover:bg-red-700 text-sm flex items-center justify-center gap-2 mt-2"
                    >
                      Cancel ERP
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
            <div className="flex justify-center items-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No ERP history</p>
              <p className="text-sm mt-1">Completed entries will appear here.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indent No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entry By
                      </th>

                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{record.indentNumber}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.productNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.billNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.poNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-green-700">
                          ₹{record.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.entryDate}</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{record.billNo}</p>
                        <p className="text-sm text-gray-600">{record.poNo}</p>
                      </div>
                      <span className="text-xs font-medium text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full">
                        ERP Done
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-gray-500">Indent No.</p>
                        <p className="font-medium text-gray-900">{record.indentNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Product No.</p>
                        <p className="font-medium text-gray-900">{record.productNo}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-medium text-green-700">₹{record.amount.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Entered on</p>
                        <p className="font-medium">{record.entryDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* === ERP ENTRY MODAL === */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ERP Bill Entry"
        className="max-w-lg w-full mx-4 sm:mx-auto"
        backdropClassName="bg-black/30"
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          <LabeledInput
            label="Purchase Order Number"
            value={formData.purchaseOrderNo}
            onChange={(e) => setFormData({ ...formData, purchaseOrderNo: e.target.value })}
            placeholder="Enter Purchase Order Number"
            required
            
          />
          <LabeledInput label="Bill No." value={formData.billNo} onChange={() => { }} disabled />
          <LabeledInput label="PO No." value={selectedRecord?.poNo || ""} onChange={() => { }} disabled />
          <LabeledInput
            label="Amount (₹)"
            value={formData.amount}
            onChange={() => { }}
            disabled
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entered By
            </label>
            <select
              value={formData.enteredBy}
              onChange={(e) => setFormData({ ...formData, enteredBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select</option>
              <option value="Accounts Executive">Accounts Executive</option>
              <option value="Finance Manager">Finance Manager</option>
            </select>
          </div>



          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Complete ERP Entry"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel ERP Bill Entry"
        className="max-w-md w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleCancel} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Are you sure you want to cancel this ERP bill entry record? This action cannot be undone.
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
                <span className="text-gray-500">Bill No:</span>
                <span className="font-medium">{recordToCancel.billNo}</span>
                <span className="text-gray-500">Amount:</span>
                <span className="font-medium">₹{recordToCancel.amount?.toLocaleString("en-IN") || "—"}</span>
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