"use client";

import type React from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/modal";
import { Eye, Plus } from "lucide-react";
import { useProcurement } from "@/contexts/procurement-context";
import { useEffect } from "react"; // Add this import


// Reusable Labeled Input (since Input doesn't support label)
function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  required = false,
  ...props
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
        {...props} 
      />
    </div>
  );
}

export function IndentPage() {
  const { records, addRecord, getRecordsByStage, moveRecordToStage, clearRecords } =
    useProcurement();
  const indents = getRecordsByStage("indent");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selected, setSelected] = useState<(typeof indents)[0] | null>(null);
  const [loading, setLoading] = useState(false);


  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState<CancelForm>({
    remark: ""
  });
  const [indentToCancel, setIndentToCancel] = useState<(typeof indents)[0] | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

// Remove the original displayedIndents declaration and replace it with:
const displayedIndents = getRecordsByStage("indent") || [];


const filteredIndents = displayedIndents.filter((indent) => {
  if (!searchTerm) return true;
  
  const term = searchTerm.toLowerCase();
  return (
    String(indent.indentNumber || '').toLowerCase().includes(term) ||
    String(indent.productNumber || '').toLowerCase().includes(term) ||
    String(indent.poNo || '').toLowerCase().includes(term) ||
    String(indent.supplierName || '').toLowerCase().includes(term) ||
    String(indent.materialName || '').toLowerCase().includes(term) ||
    String(indent.quantity || '').toLowerCase().includes(term) ||
    String(indent.rate || '').toLowerCase().includes(term) ||
    String(indent.deliveryDate || '').toLowerCase().includes(term) ||
    String(indent.status || '').toLowerCase().includes(term)
  );
});




  // Modal States
  interface MaterialItem {
    materialName: string;
    quantity: string;
    rate: string;
    unit: string;
  }

  interface CancelForm {
    remark: string;
  }

  // Form State
  const [form, setForm] = useState({
    supplierName: "",
    materials: [{ materialName: "", quantity: "", rate: "", unit: "" }] as MaterialItem[],
    poNumber: "", // Add this line
    quantity: "",
    rate: "",
    deliveryDate: "",
  });


  const resetForm = () => {
    setForm({
      supplierName: "",
      materials: [{ materialName: "", quantity: "", rate: "", unit: "" }],
      poNumber: "", // Add this line
      quantity: "",
      rate: "",
      deliveryDate: "",
    });
  };

  const addMaterial = () => {
    setForm((f) => ({
      ...f,
      materials: [...f.materials, { materialName: "", quantity: "", rate: "", unit: "" }],
    }));
  };

  const removeMaterial = (index: number) => {
    setForm((f) => ({
      ...f,
      materials: f.materials.filter((_, i) => i !== index),
    }));
  };

  const updateMaterial = (index: number, field: keyof MaterialItem, value: string) => {
    setForm((f) => ({
      ...f,
      materials: f.materials.map((material, i) =>
        i === index ? { ...material, [field]: value } : material
      ),
    }));
  };


  const unitOptions = [
    "","kg", "liter", "piece", "pack", "box", "meter", "gram", "ton", "bag", "carton", "roll", "pair", "other"
  ];



  // Add this function to generate indent numbers
  const generateIndentNumber = async () => {
    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbwbNemoTxYRwhjNd1l7DeKS5oc7XkopIlVwf9aqi7Z3ZvrmlGBQAv7ucGo_Fi9aY_uL/exec?sheet=FMS&action=fetch");
      const result = await response.json();

      if (result.success && result.data) {
        const sheetData = result.data.slice(6); // Skip header rows

        // Find the highest existing indent number
        let highestNumber = 0;
        sheetData.forEach((row: any[]) => {
          const indentNumber = row[1]; // Column B - Indent Number
          if (indentNumber && typeof indentNumber === 'string' && indentNumber.startsWith('IN-')) {
            const numberPart = parseInt(indentNumber.replace('IN-', ''));
            if (!isNaN(numberPart) && numberPart > highestNumber) {
              highestNumber = numberPart;
            }
          }
        });

        // Generate next indent number
        const nextNumber = highestNumber + 1;
        return `IN-${String(nextNumber).padStart(3, '0')}`;
      }
    } catch (error) {
      console.error("Error generating indent number:", error);
    }

    // Default to IN-001 if no data or error
    return 'IN-001';
  };


  const generateCancelSerialNumber = async () => {
    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbwbNemoTxYRwhjNd1l7DeKS5oc7XkopIlVwf9aqi7Z3ZvrmlGBQAv7ucGo_Fi9aY_uL/exec?sheet=Cancel&action=fetch");
      const result = await response.json();

      if (result.success && result.data) {
        const sheetData = result.data.slice(1); // Skip header row

        // Find the highest existing serial number
        let highestNumber = 0;
        sheetData.forEach((row: any[]) => {
          const serialNumber = row[1]; // Column B - Serial Number
          if (serialNumber && typeof serialNumber === 'string' && serialNumber.startsWith('SN-')) {
            const numberPart = parseInt(serialNumber.replace('SN-', ''));
            if (!isNaN(numberPart) && numberPart > highestNumber) {
              highestNumber = numberPart;
            }
          }
        });

        // Generate next serial number
        const nextNumber = highestNumber + 1;
        return `SN-${String(nextNumber).padStart(3, '0')}`;
      }
    } catch (error) {
      console.error("Error generating serial number:", error);
    }

    // Default to SN-001 if no data or error
    return 'SN-001';
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!indentToCancel) return;

      // Generate serial number
      const serialNumber = await generateCancelSerialNumber();
      const timestamp = new Date().toLocaleString();

      // Prepare row data for Cancel sheet
      const rowData = [
        timestamp,                    // Column A - Timestamp
        serialNumber,                // Column B - Serial Number (auto-generated)
        indentToCancel.indentNumber, // Column C - Indent No. (auto)
        indentToCancel.productNumber, // Column D - Product No. (auto)
        indentToCancel.supplierName, // Column E - Supplier Name (auto)
        indentToCancel.materialName, // Column F - Material Name (auto)
        indentToCancel.quantity,     // Column G - Quantity (auto)
        indentToCancel.rate,         // Column H - Rate (auto)
        "Indent Details",            // Column I - Stage (fixed as per requirement)
        cancelForm.remark            // Column J - Remark (user input)
      ];

      console.log("Submitting cancel data to Google Sheets:", rowData);

      // Submit to Google Apps Script - Cancel sheet
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
        console.log("Indent cancelled successfully");
        // Close both modals and reset form
        setIsCancelOpen(false);
        setIsViewOpen(false);
        setCancelForm({ remark: "" });
        setIndentToCancel(null);
        setSelected(null);

        // Refresh the data
        await fetchIndentsFromSheet();
      } else {
        console.error("Failed to cancel indent");
        alert("Failed to cancel indent. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling indent:", error);
      alert("Error cancelling indent: " + error);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to open cancel confirmation modal
  const openCancelModal = (indent: (typeof indents)[0]) => {
    setIndentToCancel(indent);
    setCancelForm({ remark: "" });
    setIsCancelOpen(true);
  };

  // Create Indent and submit to Google Sheets
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

     const htmlForm = e.target as HTMLFormElement;
  if (!htmlForm.checkValidity()) {
    htmlForm.reportValidity();
    return;
  }


    setLoading(true);

    try {
      // Generate indent number
      const indentNumber = await generateIndentNumber();

      // Format date to dd/mm/yyyy
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const timestamp = new Date().toLocaleString();
      const formattedDeliveryDate = formatDate(form.deliveryDate);

      // Submit each material as a separate row with product number
      const submissionPromises = form.materials.map(async (material, index) => {
        // Generate product number for each material (1, 2, 3, ...)
        const productNumber = index + 1;

        // Prepare row data for Google Sheets with correct column order
        const rowData = [
          timestamp,                    // Column A - Timestamp
          indentNumber,                // Column B - Indent Number (auto-generated)
          productNumber,               // Column C - Product Number (1, 2, 3, ...)
          form.supplierName,           // Column D - Supplier Name
          material.materialName,       // Column E - Material Name
          form.poNumber,               // Column F - PO number (manual)
          `${material.quantity} ${material.unit}`, // Column G - Quantity with unit
          Number(material.rate),       // Column H - Rate
          formattedDeliveryDate        // Column I - Delivery Date (formatted)
        ];

        console.log("Submitting data to Google Sheets:", rowData);

        // Submit to Google Apps Script
        const response = await fetch("https://script.google.com/macros/s/AKfycbwbNemoTxYRwhjNd1l7DeKS5oc7XkopIlVwf9aqi7Z3ZvrmlGBQAv7ucGo_Fi9aY_uL/exec", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            action: "insert",
            sheetName: "FMS",
            rowData: JSON.stringify(rowData)
          })
        });

        return response.json();
      });

      const results = await Promise.all(submissionPromises);
      const allSuccess = results.every(result => result.success);

      if (allSuccess) {
        resetForm();
        setIsCreateOpen(false);
        console.log("All materials created successfully in Google Sheets");
        await fetchIndentsFromSheet();
      } else {
        console.error("Failed to save some materials to Google Sheets");
        alert("Failed to save some materials. Please check the console for details.");
      }
    } catch (error) {
      console.error("Error creating indent:", error);
      alert("Error creating indent: " + error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndentsFromSheet = async () => {
    try {
      setLoading(true); // Add loading state
      const response = await fetch("https://script.google.com/macros/s/AKfycbwbNemoTxYRwhjNd1l7DeKS5oc7XkopIlVwf9aqi7Z3ZvrmlGBQAv7ucGo_Fi9aY_uL/exec?sheet=FMS&action=fetch");
      const result = await response.json();

      console.log("Fetched data from API:", result);

      if (result.success && result.data) {
        const sheetData = result.data.slice(6); // Remove header rows

        const formattedIndents = sheetData.map((row: any[], index: number) => {
          const quantityWithUnit = row[6] || ''; // Column G - Quantity with unit

          const formatDate = (dateString: string) => {
          if (!dateString) return '';
          
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
          } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return dateString;
          }
        };

          return {
            id: `sheet-${index}-${row[1]}-${row[2]}`,
            indentNumber: row[1] || '',
            productNumber: row[2] || '',
            poNo: row[5] || '',
            supplierName: row[3] || '',
            materialName: row[4] || '',
            quantity: quantityWithUnit, // Keep the full string with unit
            rate: row[7] || 0,
            deliveryDate: formatDate(row[8]),
            stage: "indent" as const,
            status: row[57] || '',
            createdAt: row[0] || '',
          };
        });

        console.log("Formatted indents:", formattedIndents);

        // Clear existing records and add new ones
        clearRecords();
        formattedIndents.forEach((indent: any) => {
          addRecord(indent);
        });
      } else {
        console.error("API response not successful:", result);
      }
    } catch (error) {
      console.error("Error fetching indents from sheet:", error);
    } finally {
      setLoading(false); // Remove loading state
    }
  };

  useEffect(() => {
    console.log("Component mounted, fetching data...");
    fetchIndentsFromSheet();
  }, []);




  const openView = (indent: (typeof indents)[0]) => {
    setSelected(indent);
    setIsViewOpen(true);
  };

  // const displayedIndents = indents || [];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Make Indent
        </h2>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Make Indent</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="mt-4">
  <Input
    type="text"
    placeholder="Search all columns..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full sm:max-w-md"
  />
</div>

      {/* Table / Cards */}
      <Card className="mt-6 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading indents...</span>
          </div>
        ) : filteredIndents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg font-medium">No indents yet</p>
            <p className="text-sm mt-1">Click "New" to create one.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Action",
                      "Indent No.",
                      "Product No.",
                      "PO No.",  // Add PO No. back
                      "Supplier",
                      "Material",
                      "Qty",
                      "Rate",
                      "Delivery",
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
                  {filteredIndents.map((i) => (
                    <tr
                      key={i.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openView(i)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {i.indentNumber}  {/* Changed from i.poNo */}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {i.productNumber} {/* NEW COLUMN */}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {i.poNo}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {i.supplierName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {i.materialName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {i.quantity}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        ₹{i.rate}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {i.deliveryDate}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          {i.status}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-4 p-4">
              {indents.map((i) => (
                <div
                  key={i.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{i.poNo}</p>
                      <p className="text-sm text-gray-600">{i.supplierName}</p>

                      <p className="text-xs text-gray-500">
                        Indent: {i.indentNumber} | Product: {i.productNumber} {/* NEW */}
                      </p>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      {i.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Material</p>
                      <p className="font-medium">{i.materialName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Qty</p>
                      <p className="font-medium">{i.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Rate</p>
                      <p className="font-medium">₹{i.rate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Delivery</p>
                      <p className="font-medium text-xs">{i.deliveryDate}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      onClick={() => openView(i)}
                      variant="outline"
                      className="w-full justify-center text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* === CREATE INDENT MODAL === */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Indent"
        className="max-w-lg w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <LabeledInput
            label="Supplier Name"
            value={form.supplierName}
            onChange={(e) =>
              setForm((f) => ({ ...f, supplierName: e.target.value }))
            }
            placeholder="ABC Suppliers Ltd."
            required
          />

          <LabeledInput
            label="PO Number"
            value={form.poNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, poNumber: e.target.value.toUpperCase() }))
            }
            placeholder="PO-2024-001"
            required
          />


          {/* Materials Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Materials
              </label>
              <Button
                type="button"
                onClick={addMaterial}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Material
              </Button>
            </div>

            {form.materials.map((material, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm text-gray-700">Material #{index + 1}</h4>
                  {form.materials.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeMaterial(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <LabeledInput
                  label="Material Name"
                  value={material.materialName}
                  onChange={(e) => updateMaterial(index, 'materialName', e.target.value)}
                  placeholder="Steel Rods 12mm"
                  
                />

                {/* Fixed Quantity and Unit Layout */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <LabeledInput
                      label="Quantity"
                      type="number"
                      value={material.quantity}
                      onChange={(e) => updateMaterial(index, 'quantity', e.target.value)}
                      placeholder="100"
                      
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={material.unit}
                      onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <LabeledInput
                  label="Rate (₹)"
                  type="number"
                  value={material.rate}
                  onChange={(e) => updateMaterial(index, 'rate', e.target.value)}
                  placeholder="850"
                  
                />
              </div>
            ))}
          </div>

          <LabeledInput
            label="Delivery Date"
            type="date"
            value={form.deliveryDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, deliveryDate: e.target.value }))
            }
            required
          />

          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Indent"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>


      {/* === VIEW INDENT MODAL === */}
      {selected && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setSelected(null);
          }}
          title="Indent Details"
          className="max-w-lg w-full mx-4 sm:mx-auto"
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="text-gray-500">PO No.</span>
                <p className="font-semibold">{selected.poNo}</p>
              </div>
              <div>
                <span className="text-gray-500">Indent No.</span>
                <p className="font-semibold">{selected.indentNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Product No.</span> {/* NEW */}
                <p className="font-semibold">{selected.productNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Status</span>
                <p className="font-semibold">{selected.status}</p>
              </div>
              <div>
                <span className="text-gray-500">Supplier</span>
                <p className="font-semibold">{selected.supplierName}</p>
              </div>
              <div>
                <span className="text-gray-500">Material</span>
                <p className="font-semibold">{selected.materialName}</p>
              </div>
              <div>
                <span className="text-gray-500">Quantity</span>
                <p className="font-semibold">{selected.quantity}</p>
              </div>
              <div>
                <span className="text-gray-500">Rate</span>
                <p className="font-semibold">₹{selected.rate}</p>
              </div>
              <div>
                <span className="text-gray-500">Delivery</span>
                <p className="font-semibold">{selected.deliveryDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Total</span>
                <p className="font-semibold">
                  ₹{selected.quantity * selected.rate}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row pt-4">
              <Button
                onClick={() => {
                  setIsViewOpen(false);
                  setSelected(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700"
              >
                Close
              </Button>
              <Button
                onClick={() => openCancelModal(selected)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Cancel Indent
              </Button>
            </div>


          </div>
        </Modal>
      )}
      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Indent"
        className="max-w-md w-full mx-4 sm:mx-auto"
      >
        <form onSubmit={handleCancel} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Are you sure you want to cancel this indent? This action cannot be undone.
            </p>
          </div>

          {indentToCancel && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">Indent No:</span>
                <span className="font-medium">{indentToCancel.indentNumber}</span>
                <span className="text-gray-500">Product No:</span>
                <span className="font-medium">{indentToCancel.productNumber}</span>
                <span className="text-gray-500">Supplier:</span>
                <span className="font-medium">{indentToCancel.supplierName}</span>
                <span className="text-gray-500">Material:</span>
                <span className="font-medium">{indentToCancel.materialName}</span>
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
              disabled={loading}
            >
              {loading ? "Cancelling..." : "Confirm Cancel"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Go Back
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
