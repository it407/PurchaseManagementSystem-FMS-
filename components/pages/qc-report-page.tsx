"use client";

import type React from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/modal";
import { Eye, FileCheck } from "lucide-react";
import { useProcurement } from "@/contexts/procurement-context";
import { useEffect } from "react";
import { Loader2, ExternalLink } from "lucide-react";

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

interface QCReportRecord {
  id: string;
  poNo: string;
  qcReportNo: string;
  submissionDate?: string;
  planned8?: string;
  actual8?: string;
  rowIndex: number;
  reportLink?: string;
  status?: string; // Add this line
}

export function QCReportPage() {
  // const [tab, setTab] = useState<"pending" | "history">("pending");
  const { getRecordsByStage, updateRecord, moveRecordToStage: moveToStage } = useProcurement();

  // Pending: Bills that have been submitted to accounts
  // const pending = getRecordsByStage("bills", "Submitted");
  // History: QC Reports that have been processed
  // const history = getRecordsByStage("qcreport", "QC Report Done");

  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [selectedRecord, setSelectedRecord] = useState<(typeof pending)[0] | null>(null);

  






   const [tab, setTab] = useState<"pending" | "history">("pending");
  const [pending, setPending] = useState<QCReportRecord[]>([]);
  const [history, setHistory] = useState<QCReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<QCReportRecord | null>(null);

  const handleSubmitQCReport = (record: QCReportRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleViewReport = (record: QCReportRecord) => {
    if (record.reportLink) {
      window.open(record.reportLink, '_blank');
    }
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
      const currentDate = `${day}/${month}/${year}`;

      // Generate report link using folder ID
      const reportLink = `https://drive.google.com/drive/folders/1k5Hs55027DERG_l9rjG1tpaxds768orW`;

      // Prepare data for submission
      const submissionData = {
        action: "update",
        sheetId: "1MtxLluyxLJwDV_2fxw4qG0wUOBE4Ys8Wd_ewLeP9czA",
        sheetName: "FMS",
        rowIndex: selectedRecord.rowIndex,
        columnData: {
          "AY": currentDate, // Column AY - Actual8 (current date)
          "AZ": reportLink, // Column AZ - Report Link
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
        const pendingRecords: QCReportRecord[] = [];
        const historyRecords: QCReportRecord[] = [];

        // Process rows (skip header rows - start from row 6)
        for (let i = 6; i < result.data.length; i++) {
          const row = result.data[i];
          
          // Column AX (Planned8) is index 49, Column AY (Actual8) is index 50
          const planned8 = row[50]; // Column AX
          const actual8 = row[51]; // Column AY

          // Check if Planned8 is not null and Actual8 is null for pending
          if (planned8 && planned8.trim() !== "" && (!actual8 || actual8.trim() === "")) {
            pendingRecords.push({
              id: `row-${i + 1}`,
              poNo: row[3] || `PO-${i + 1}`,
              qcReportNo: row[33] || `QC-REPORT-${String(pendingRecords.length + 1).padStart(3, "0")}`, // Column AH
              rowIndex: i + 1,
            });
          } 
          // Check if both Planned8 and Actual8 are not null for history
          else if (planned8 && planned8.trim() !== "" && actual8 && actual8.trim() !== "") {
            historyRecords.push({
              id: `row-${i + 1}`,
              poNo: row[3] || `PO-${i + 1}`,
              qcReportNo: row[33] || `QC-REPORT-${String(historyRecords.length + 1).padStart(3, "0")}`, // Column AH
              submissionDate: row[50] || "", // Column AY (Actual8)
              rowIndex: i + 1,
              reportLink: row[51] || "", // Column AZ - Report Link
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

  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Header */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
        Submit QC Report to Accounts
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

      {loading && (
  <div className="flex justify-center items-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
)}

      {/* === PENDING TAB === */}
      {tab === "pending" && (
        <Card className="overflow-hidden">
          {pending.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No pending QC reports</p>
              <p className="text-sm mt-1">All bills have been processed.</p>
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
                        QC Report No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pending.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Button
                            onClick={() => handleSubmitQCReport(record)}
                            className="bg-blue-600 hover:bg-blue-700 text-xs flex items-center gap-1"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            Submit
                          </Button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.qcReportNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.poNo}</td>
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
                {pending.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{record.qcReportNo}</p>
                        <p className="text-sm text-gray-600">{record.poNo}</p>
                      </div>
                      <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                        {record.status}
                      </span>
                    </div>

                    {/* Action Button First */}
                    <Button
                      onClick={() => handleSubmitQCReport(record)}
                      className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <FileCheck className="w-4 h-4" />
                      Submit Report
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
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No QC report history</p>
              <p className="text-sm mt-1">Submitted reports will appear here.</p>
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
                        QC Report No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submission Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {history.map((record) => (
  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
    <td className="px-4 py-3">
      <button 
        onClick={() => handleViewReport(record)}
        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
      >
        <ExternalLink className="w-4 h-4" />
        View
      </button>
    </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {record.qcReportNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{record.poNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {record.submissionDate}
                        </td>
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
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{record.qcReportNo}</p>
                        <p className="text-sm text-gray-600">{record.poNo}</p>
                      </div>
                      <span className="text-xs font-medium text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full">
                        Done
                      </span>
                    </div>

                    <div className="text-sm mb-4">
                      <p className="text-gray-500">Submitted on</p>
                      <p className="font-medium">{record.submissionDate}</p>
                    </div>

                    {/* Action Button First */}
                     <button 
    onClick={() => handleViewReport(record)}
    className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
  >
    <ExternalLink className="w-4 h-4" />
    View Report
  </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* === SUBMIT QC REPORT MODAL === */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit QC Report to Accounts"
        className="max-w-lg w-full mx-4 sm:mx-auto"
        backdropClassName="bg-black/30"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <LabeledInput label="QC Report No." value={selectedRecord?.qcReportNo || ""} onChange={() => {}} disabled />
          <LabeledInput label="PO No." value={selectedRecord?.poNo || ""} onChange={() => {}} disabled />
          <LabeledInput
            label="Submission Date"
            value={new Date().toISOString().split("T")[0]}
            onChange={() => {}}
            disabled
          />

          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Button 
    type="submit" 
    className="flex-1 bg-blue-600 hover:bg-blue-700"
    disabled={submitLoading}
  >
    {submitLoading ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Submitting...
      </>
    ) : (
      "Submit Report"
    )}
  </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}