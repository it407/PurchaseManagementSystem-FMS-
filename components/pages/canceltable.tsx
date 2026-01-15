"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface CancelData {
    timestamp: string;
    serialNo: string;
    indentNo: string;
    productNo: string;
    supplierName: string;
    materialName: string;
    quantity: string;
    rate: string;
    stage: string;
    remarks: string;
}

export function CancelDataTable() {
    const [cancelData, setCancelData] = useState<CancelData[]>([]);
    const [filteredData, setFilteredData] = useState<CancelData[]>([]);
    const [loading, setLoading] = useState(false);
    const [stageFilter, setStageFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [availableStages, setAvailableStages] = useState<string[]>([]);
    const [searchFilter, setSearchFilter] = useState("");


    useEffect(() => {
        fetchCancelData();
    }, []);

    // Cancel sheet data fetch karo
    const fetchCancelData = async () => {
        setLoading(true);
        try {
            console.log("Fetching Cancel sheet data...");

            const url = `https://script.google.com/macros/s/AKfycbwRdlSHvnytTCn0x5ElNPG_nh8Ge_ZVZJDiEOY1Htv3UOgEwMQj5EZUyPSUxQFOmym0/exec?sheet=Cancel&action=fetch`;

            const response = await fetch(url);
            const data = await response.json();
            console.log("Cancel Sheet API Response:", data);

            if (data.success && data.data) {
                const processedData = processCancelData(data.data);
                setCancelData(processedData);
                setFilteredData(processedData);

                // Extract unique stages
                const stages = [...new Set(processedData.map((item: CancelData) => item.stage).filter(Boolean))] as string[];
                setAvailableStages(stages);
            }
        } catch (error) {
            console.error("Error fetching cancel data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Cancel sheet data process karo
    const processCancelData = (data: any[]): CancelData[] => {
        console.log("Processing cancel data from", data.length, "rows");

        // Column indexes (0-based)
        const COLUMNS = {
            TIMESTAMP: 0, // ✅ Column A - timestamp
            SERIAL_NO: 1, // Column B
            INDENT_NO: 2, // Column C
            PRODUCT_NO: 3, // Column D
            SUPPLIER_NAME: 4, // Column E
            MATERIAL_NAME: 5, // Column F
            QUANTITY: 6, // Column G
            RATE: 7, // Column H
            STAGE: 8, // Column I
            REMARKS: 9 // Column J
        };

        const result: CancelData[] = [];

        // Row 1 se start karo (headers skip karo - adjust according to your sheet)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];

            // Check if row has basic required data
            if (row[COLUMNS.SERIAL_NO] && row[COLUMNS.SERIAL_NO].toString().trim() !== "") {
                result.push({
                    timestamp: row[COLUMNS.TIMESTAMP]?.toString() || "",
                    serialNo: row[COLUMNS.SERIAL_NO]?.toString() || "",
                    indentNo: row[COLUMNS.INDENT_NO]?.toString() || "",
                    productNo: row[COLUMNS.PRODUCT_NO]?.toString() || "",
                    supplierName: row[COLUMNS.SUPPLIER_NAME]?.toString() || "",
                    materialName: row[COLUMNS.MATERIAL_NAME]?.toString() || "",
                    quantity: row[COLUMNS.QUANTITY]?.toString() || "",
                    rate: row[COLUMNS.RATE]?.toString() || "",
                    stage: row[COLUMNS.STAGE]?.toString() || "",
                    remarks: row[COLUMNS.REMARKS]?.toString() || ""
                });
            }
        }

        console.log("Processed cancel data:", result);
        return result;
    };

    // Filters apply karo
    useEffect(() => {
        let filtered = [...cancelData];

        // Stage filter
        if (stageFilter !== "all") {
            filtered = filtered.filter(item => item.stage === stageFilter);
        }

        // Date filter
        if (dateFilter) {
            filtered = filtered.filter(item => {
                if (!item.timestamp) return false;

                const itemDate = new Date(item.timestamp);
                const filterDate = new Date(dateFilter);

                return itemDate.toDateString() === filterDate.toDateString();
            });
        }

        // Search filter
        if (searchFilter) {
            const searchTerm = searchFilter.toLowerCase();
            filtered = filtered.filter(item =>
                item.serialNo.toLowerCase().includes(searchTerm) ||
                item.indentNo.toLowerCase().includes(searchTerm) ||
                item.productNo.toLowerCase().includes(searchTerm) ||
                item.supplierName.toLowerCase().includes(searchTerm) ||
                item.materialName.toLowerCase().includes(searchTerm) ||
                item.quantity.toLowerCase().includes(searchTerm) ||
                item.rate.toLowerCase().includes(searchTerm) ||
                item.stage.toLowerCase().includes(searchTerm) ||
                item.remarks.toLowerCase().includes(searchTerm)
            );
        }

        setFilteredData(filtered);
    }, [stageFilter, dateFilter, searchFilter, cancelData]);

    return (
        <Card className="p-4 sm:p-5 border-0 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h3 className="text-2xl font-semibold text-blue-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Cancel Data
                </h3>

                {/* Filters */}
                {/* --- MOBILE VIEW --- */}
                <div className="w-full flex flex-col gap-3 sm:hidden">

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    {/* Stage + Date */}
                    <div className="w-full flex flex-row gap-3">
                        <select
                            value={stageFilter}
                            onChange={(e) => setStageFilter(e.target.value)}
                            className="w-1/2 text-xs border border-gray-300 rounded-md px-3 py-2 
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Stages</option>
                            {availableStages.map((stage, index) => (
                                <option key={index} value={stage}>{stage}</option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-1/2 text-xs border border-gray-300 rounded-md px-3 py-2 
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>



                {/* --- DESKTOP VIEW (exact old layout) --- */}
                <div className="hidden sm:flex flex-wrap gap-2">

                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="text-xs border border-gray-300 rounded-md px-3 py-1.5 
               focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                    />

                    <select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        className="text-xs border border-gray-300 rounded-md px-3 py-1.5 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Stages</option>
                        {availableStages.map((stage, index) => (
                            <option key={index} value={stage}>{stage}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="text-xs border border-gray-300 rounded-md px-3 py-1.5 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">Serial No.</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">Indent No.</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">Product No.</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">Supplier Name</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">Material Name</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">Quantity</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">Rate</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">Stage</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-3 text-gray-900">{item.serialNo}</td>
                                        <td className="py-2 px-3 text-gray-900">{item.indentNo}</td>
                                        <td className="py-2 px-3 text-gray-900">{item.productNo}</td>
                                        <td className="py-2 px-3 text-gray-900">{item.supplierName}</td>
                                        <td className="py-2 px-3 text-gray-900">{item.materialName}</td>
                                        <td className="py-2 px-3 text-gray-900">{item.quantity}</td>
                                        <td className="py-2 px-3 text-gray-900">{item.rate}</td>
                                        <td className="py-2 px-3">
                                            <Badge variant="secondary" className="text-xs">
                                                {item.stage}
                                            </Badge>
                                        </td>
                                        <td className="py-2 px-3 text-gray-900">{item.remarks}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-4 px-3 text-center text-gray-500">
                                        No data found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            {/* Summary */}
            <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                    Showing {filteredData.length} of {cancelData.length} records
                    {stageFilter !== "all" && ` • Stage: ${stageFilter}`}
                    {dateFilter && ` • Date: ${new Date(dateFilter).toLocaleDateString()}`}
                    {searchFilter && ` • Search: "${searchFilter}"`}
                </p>
            </div>
        </Card>
    );
}