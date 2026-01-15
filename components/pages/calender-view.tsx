"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Calendar, Filter, Download, Eye, AlertCircle } from "lucide-react";
import { Modal } from "@/components/modal";

// Types
interface MaterialArrival {
    id: string;
    materialName: string;
    supplierName: string;
    quantity: number;
    amount: number;
    actualDate: string; // ISO format
    plannedDate?: string;
    poNumber: string;
    indentNumber: string;
    materialCondition?: string;
    status: "fully-received" | "partial" | "delayed";
}

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    allDay: boolean;
    extendedProps: {
        materials: MaterialArrival[];
        totalQuantity: number;
        totalAmount: number;
        count: number;
    };
    backgroundColor?: string;
    borderColor?: string;
}

export default function MaterialArrivalCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedMaterials, setSelectedMaterials] = useState<MaterialArrival[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        material: "all-materials",
        supplier: "all-suppliers",
        status: "all"
    });


    const [filteredSuppliers, setFilteredSuppliers] = useState<string[]>([]);



    // Add these state variables
    const [materialSearch, setMaterialSearch] = useState("");
    const [supplierSearch, setSupplierSearch] = useState("");


    const filteredEvents = useMemo(() => {
        return events.map(event => {
            const materials = event.extendedProps.materials;

            // पहले फ़िल्टर किए गए मटेरियल निकालें
            const filteredDateMaterials = materials.filter(material => {
                // Material फ़िल्टर
                if (filters.material !== "all-materials" &&
                    !material.materialName.toLowerCase().includes(filters.material.toLowerCase())) {
                    return false;
                }

                // Supplier फ़िल्टर
                if (filters.supplier !== "all-suppliers" &&
                    !material.supplierName.toLowerCase().includes(filters.supplier.toLowerCase())) {
                    return false;
                }

                // Status फ़िल्टर
                if (filters.status !== "all" && material.status !== filters.status) {
                    return false;
                }

                return true;
            });

            // अगर कोई मटेरियल नहीं बचा तो null return करें
            if (filteredDateMaterials.length === 0) return null;

            // नया event object बनाएं (original को modify नहीं करें)
            const newEvent = {
                ...event,
                extendedProps: {
                    ...event.extendedProps,
                    materials: filteredDateMaterials,
                    count: filteredDateMaterials.length,
                    totalQuantity: filteredDateMaterials.reduce((sum, m) => sum + m.quantity, 0),
                    totalAmount: filteredDateMaterials.reduce((sum, m) => sum + m.amount, 0),
                }
            };

            // Event title update करें
            if (filteredDateMaterials.length === 1) {
                newEvent.title = `${filteredDateMaterials[0].materialName} - ${filteredDateMaterials[0].quantity} Qty`;
            } else if (filteredDateMaterials.length <= 3) {
                newEvent.title = filteredDateMaterials.map(m => `${m.materialName} - ${m.quantity}`).join(', ');
            } else {
                newEvent.title = `${filteredDateMaterials.length} Material Arrivals`;
            }

            return newEvent;
        }).filter(event => event !== null) as CalendarEvent[]; // null events remove करें
    }, [events, filters]);

    // Get unique materials and suppliers from events
    const allMaterials = useMemo(() => {
        const materials = new Set<string>();
        events.forEach(event => {
            event.extendedProps.materials.forEach(material => {
                if (material.materialName) {
                    materials.add(material.materialName);
                }
            });
        });
        return Array.from(materials).sort();
    }, [events]);
    const allSuppliers = useMemo(() => {
        const suppliers = new Set<string>();

        // यहाँ हम suppliers को filter करेंगे based on selected material
        if (filters.material !== "all-materials") {
            // अगर material filter लगा है, तो केवल उस material के suppliers दिखाएं
            events.forEach(event => {
                event.extendedProps.materials.forEach(material => {
                    // Check if material name matches the filter
                    if (material.materialName.toLowerCase().includes(filters.material.toLowerCase())) {
                        if (material.supplierName) {
                            suppliers.add(material.supplierName);
                        }
                    }
                });
            });
        } else {
            // अगर "all-materials" है, तो सभी suppliers दिखाएं
            events.forEach(event => {
                event.extendedProps.materials.forEach(material => {
                    if (material.supplierName) {
                        suppliers.add(material.supplierName);
                    }
                });
            });
        }

        return Array.from(suppliers).sort();
    }, [events, filters.material]); // filters.material को dependency में जोड़ें
    // Filter materials and suppliers based on search
    const filteredMaterials = useMemo(() => {
        if (!materialSearch.trim()) return allMaterials;
        return allMaterials.filter(material =>
            material.toLowerCase().includes(materialSearch.toLowerCase())
        );
    }, [allMaterials, materialSearch]);

    // Suppliers filter based on both material filter and search
    const filteredSuppliersList = useMemo(() => {
        let supplierList = allSuppliers;

        // Supplier search filter
        if (supplierSearch.trim()) {
            supplierList = supplierList.filter(supplier =>
                supplier.toLowerCase().includes(supplierSearch.toLowerCase())
            );
        }

        return supplierList;
    }, [allSuppliers, supplierSearch]);

    // Fetch material arrival data from Google Sheets
    const fetchMaterialArrivals = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                "https://script.google.com/macros/s/AKfycbwbNemoTxYRwhjNd1l7DeKS5oc7XkopIlVwf9aqi7Z3ZvrmlGBQAv7ucGo_Fi9aY_uL/exec?sheet=FMS&action=fetch"
            );
            const result = await response.json();

            if (result.success && result.data) {
                const materials: MaterialArrival[] = [];

                // Process rows (skip headers - row 7)
                for (let i = 7; i < result.data.length; i++) {
                    const row = result.data[i];

                    // Extract relevant columns
                    const actualDate = row[43]; // Column AN (Actual6)
                    const materialName = row[4]; // Column E
                    const supplierName = row[3]; // Column D
                    const quantity = parseFloat(row[6]) || 0; // Column G
                    const rate = parseFloat(row[7]) || 0; // Column H
                    const amount = quantity * rate;
                    const poNumber = row[5]; // Column F
                    const indentNumber = row[1]; // Column B
                    const plannedDate = row[42]; // Column AM (Planned6)

                    // Check if actual date exists and material is received
                    if (actualDate && actualDate.trim() !== "" && materialName) {
                        // Determine status
                        let status: "fully-received" | "partial" | "delayed" = "fully-received";

                        // Check for partial quantity (example logic)
                        if (quantity > 0 && quantity < 100) {
                            status = "partial";
                        }

                        // Check if delayed (actual date > planned date)
                        if (plannedDate && actualDate) {
                            const planned = new Date(plannedDate);
                            const actual = new Date(actualDate);
                            if (actual > planned) {
                                status = "delayed";
                            }
                        }

                        materials.push({
                            id: `${i + 1}-${indentNumber}`,
                            materialName,
                            supplierName,
                            quantity,
                            amount,
                            actualDate: formatDateForCalendar(actualDate),
                            plannedDate,
                            poNumber,
                            indentNumber,
                            status
                        });
                    }
                }

                // Group materials by date
                const groupedByDate: Record<string, MaterialArrival[]> = {};

                materials.forEach(material => {
                    const dateKey = material.actualDate.split('T')[0]; // YYYY-MM-DD
                    if (!groupedByDate[dateKey]) {
                        groupedByDate[dateKey] = [];
                    }
                    groupedByDate[dateKey].push(material);
                });

                // Create calendar events
                const calendarEvents: CalendarEvent[] = [];

                Object.entries(groupedByDate).forEach(([date, dateMaterials]) => {
                    const totalQuantity = dateMaterials.reduce((sum, m) => sum + m.quantity, 0);
                    const totalAmount = dateMaterials.reduce((sum, m) => sum + m.amount, 0);

                    // Determine color based on status
                    let backgroundColor = "#10b981"; // Green - fully received
                    let borderColor = "#059669";

                    if (dateMaterials.some(m => m.status === "partial")) {
                        backgroundColor = "#f59e0b"; // Yellow - partial
                        borderColor = "#d97706";
                    } else if (dateMaterials.some(m => m.status === "delayed")) {
                        backgroundColor = "#ef4444"; // Red - delayed
                        borderColor = "#dc2626";
                    }

                    // Create event title
                    let title = "";
                    if (dateMaterials.length === 1) {
                        title = `${dateMaterials[0].materialName} - ${dateMaterials[0].quantity} Qty`;
                    } else if (dateMaterials.length <= 3) {
                        title = dateMaterials.map(m => `${m.materialName} - ${m.quantity}`).join(', ');
                    } else {
                        title = `${dateMaterials.length} Material Arrivals`;
                    }

                    calendarEvents.push({
                        id: `event-${date}`,
                        title,
                        start: date,
                        allDay: true,
                        extendedProps: {
                            materials: dateMaterials,
                            totalQuantity,
                            totalAmount,
                            count: dateMaterials.length
                        },
                        backgroundColor,
                        borderColor
                    });
                });

                setEvents(calendarEvents);
            }
        } catch (error) {
            console.error("Error fetching material arrivals:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Date formatter
    const formatDateForCalendar = (dateString: string): string => {
        try {
            // Handle different date formats from Google Sheets
            if (dateString.includes('/')) {
                const [day, month, year] = dateString.split(' ')[0].split('/');
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            return new Date(dateString).toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    };

    // Format date for display
    const formatDisplayDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Handle date click
    const handleDateClick = (info: any) => {
        const dateStr = info.dateStr;

        // filteredEvents से event ढूंढें (original events से नहीं)
        const event = filteredEvents.find(e => e.start === dateStr);

        if (event) {
            setSelectedDate(dateStr);
            setSelectedMaterials(event.extendedProps.materials);
            setIsModalOpen(true);
        } else {
            // अगर filteredEvents में नहीं है, तो original events से check करें
            const originalEvent = events.find(e => e.start === dateStr);
            if (originalEvent) {
                setSelectedDate(dateStr);

                // फ़िल्टर लगाएं
                const filteredMaterials = originalEvent.extendedProps.materials.filter(material => {
                    if (filters.material !== "all-materials" &&
                        !material.materialName.toLowerCase().includes(filters.material.toLowerCase())) {
                        return false;
                    }

                    if (filters.supplier !== "all-suppliers" &&
                        !material.supplierName.toLowerCase().includes(filters.supplier.toLowerCase())) {
                        return false;
                    }

                    if (filters.status !== "all" && material.status !== filters.status) {
                        return false;
                    }

                    return true;
                });

                setSelectedMaterials(filteredMaterials);
                setIsModalOpen(true);
            }
        }
    };


    // Handle event click
    const handleEventClick = (info: any) => {
        const event = info.event;
        setSelectedDate(event.startStr);

        // फ़िल्टर किए हुए मटेरियल ढूंढें
        const filteredEvent = filteredEvents.find(e => e.id === event.id);

        if (filteredEvent) {
            setSelectedMaterials(filteredEvent.extendedProps.materials);
        } else {
            // अगर filteredEvents में नहीं है, तो original से filter करें
            const originalEvent = events.find(e => e.id === event.id);
            if (originalEvent) {
                const filteredMaterials = originalEvent.extendedProps.materials.filter(material => {
                    if (filters.material !== "all-materials" &&
                        !material.materialName.toLowerCase().includes(filters.material.toLowerCase())) {
                        return false;
                    }

                    if (filters.supplier !== "all-suppliers" &&
                        !material.supplierName.toLowerCase().includes(filters.supplier.toLowerCase())) {
                        return false;
                    }

                    if (filters.status !== "all" && material.status !== filters.status) {
                        return false;
                    }

                    return true;
                });

                setSelectedMaterials(filteredMaterials);
            }
        }

        setIsModalOpen(true);
    };



    const handleClearFilters = () => {
        setFilters({
            material: "all-materials",
            supplier: "all-suppliers",
            status: "all"
        });
        setMaterialSearch("");
        setSupplierSearch("");
    };

    

    useEffect(() => {
        fetchMaterialArrivals();
    }, [fetchMaterialArrivals]);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-8 h-8" />
                        Material Arrival Calendar
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Track actual material arrivals date-wise with detailed information
                    </p>
                </div>

                <div className="flex items-center gap-3">

                    <Button
                        onClick={() => fetchMaterialArrivals()}
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Filters */}
            {/* Filters */}
            

            <Card className="p-4">
  <div className="flex flex-col gap-4">

    {/* FILTER GRID */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      {/* Material */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Filter className="w-4 h-4 inline mr-1" />
          Material Name
        </label>
        <Select
          value={filters.material}
          onValueChange={(value) =>
            setFilters({ ...filters, material: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Material" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <div className="p-2 border-b">
              <Input
                placeholder="Search material..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                className="h-8 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <SelectItem value="all-materials">All Materials</SelectItem>

            {filteredMaterials.map((material) => (
              <SelectItem key={material} value={material}>
                {material}
              </SelectItem>
            ))}

            {filteredMaterials.length === 0 && (
              <div className="p-2 text-sm text-gray-500 text-center">
                No materials found
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Supplier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Truck className="w-4 h-4 inline mr-1" />
          Supplier
        </label>
        <Select
          value={filters.supplier}
          onValueChange={(value) =>
            setFilters({ ...filters, supplier: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Supplier" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <div className="p-2 border-b">
              <Input
                placeholder="Search supplier..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="h-8 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <SelectItem value="all-suppliers">All Suppliers</SelectItem>

            {filteredSuppliersList.map((supplier) => (
              <SelectItem key={supplier} value={supplier}>
                {supplier}
              </SelectItem>
            ))}

            {filteredSuppliersList.length === 0 && (
              <div className="p-2 text-sm text-gray-500 text-center">
                No suppliers found
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="col-span-1 md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            setFilters({ ...filters, status: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="fully-received">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Fully Received
              </span>
            </SelectItem>
            <SelectItem value="partial">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Partial
              </span>
            </SelectItem>
            <SelectItem value="delayed">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Delayed
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Button */}
      <div className="flex items-end">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setFilters({
              material: "all-materials",
              supplier: "all-suppliers",
              status: "all",
            });
            setMaterialSearch("");
            setSupplierSearch("");
          }}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  </div>
</Card>


            {/* Stats Cards */}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800">Total Arrivals</p>
                            <p className="text-2xl font-bold text-green-900">{events.length}</p>
                            <p className="text-xs text-green-700">Days with material arrivals</p>
                        </div>
                        <Package className="w-8 h-8 text-green-600" />
                    </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800">Total Quantity</p>
                            <p className="text-2xl font-bold text-blue-900">
                                {events.reduce((sum, e) => sum + e.extendedProps.totalQuantity, 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-700">Total material quantity received</p>
                        </div>
                        <Truck className="w-8 h-8 text-blue-600" />
                    </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-800">Total Value</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {Math.round(events.reduce((sum, e) => sum + e.extendedProps.totalAmount, 0)).toLocaleString()}
                                {/* Math.round() और simple toLocaleString() */}
                            </p>
                            <p className="text-xs text-purple-700">Total material value received</p>
                        </div>
                        <Eye className="w-8 h-8 text-purple-600" />
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-800">Delayed Arrivals</p>
                            <p className="text-2xl font-bold text-orange-900">
                                {events.filter(e => e.extendedProps.materials.some(m => m.status === "delayed")).length}
                            </p>
                            <p className="text-xs text-orange-700">Days with delayed arrivals</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-orange-600" />
                    </div>
                </Card>
            </div>

            {/* Calendar */}
         <Card className="p-4">
  {loading ? (
    <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ) : (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={filteredEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        height={window.innerWidth < 768 ? 500 : "auto"} 
        eventContent={(eventInfo) => (
          <div className="fc-event-content p-1">
            <div className="text-xs font-semibold truncate">
              {eventInfo.event.title}
            </div>
            <div className="text-xs opacity-90">
              {eventInfo.event.extendedProps.count} items
            </div>
          </div>
        )}
        eventDisplay="block"
        dayMaxEvents={3}
        views={{
          dayGridMonth: {
            dayMaxEventRows: 3,
          },
        }}
      />
    </div>
  )}

  {/* Legend */}
  <div className="mt-6 flex flex-wrap gap-4 items-center text-sm">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-green-500"></div>
      <span>Fully Received</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
      <span>Partial Quantity</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-red-500"></div>
      <span>Delayed Arrival</span>
    </div>
  </div>

  {/* Custom CSS for mobile header layout */}
  <style jsx global>{`
    .fc-header-toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 0.25rem;
    }

    .fc-header-toolbar .fc-left,
    .fc-header-toolbar .fc-right {
      display: flex;
      gap: 0.5rem;
    }

    .fc-header-toolbar .fc-center {
      text-align: center;
      margin: 0.25rem 0;
    }

    /* MOBILE CUSTOMIZATION */
    @media (max-width: 768px) {
      .fc-header-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      /* First row: arrows + today + title centered */
      .fc-header-toolbar .fc-left,
      .fc-header-toolbar .fc-center {
        order: 1;
        justify-content: center;
        width: 100%;
      }

      .fc-header-toolbar .fc-right {
        order: 2;
        justify-content: flex-end; /* Second row aligned to right */
        margin-top: 0.25rem;
        width: 100%;
      }
    }
  `}</style>
</Card>


            {/* Date Details Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Material Arrivals - ${selectedDate ? formatDisplayDate(selectedDate) : ''}`}
                className="max-w-4xl"
            >
                {selectedMaterials.length > 0 ? (
                    <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total Materials</p>
                                <p className="text-2xl font-bold">{selectedMaterials.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total Quantity</p>
                                <p className="text-2xl font-bold">
                                    {selectedMaterials.reduce((sum, m) => sum + m.quantity, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total Value</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₹{selectedMaterials.reduce((sum, m) => sum + m.amount, 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>

                        {/* Materials Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Material
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Supplier
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            PO Number
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {selectedMaterials.map((material) => (
                                        <tr key={material.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">{material.materialName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Truck className="w-4 h-4 text-gray-400" />
                                                    {material.supplierName}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-semibold">
                                                {material.quantity.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-green-600">
                                                    ₹{material.amount.toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {material.poNumber}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    className={
                                                        material.status === "fully-received"
                                                            ? "bg-green-100 text-green-800"
                                                            : material.status === "partial"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                    }
                                                >
                                                    {material.status === "fully-received"
                                                        ? "Fully Received"
                                                        : material.status === "partial"
                                                            ? "Partial"
                                                            : "Delayed"}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No material arrivals for selected date
                    </div>
                )}
            </Modal>

            {/* Instructions */}
            <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    How to Use Calendar
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
                    <li>Click on any date with colored events to view material details</li>
                    <li>Green: Fully received materials</li>
                    <li>Yellow: Partial quantity received</li>
                    <li>Red: Delayed arrivals</li>
                    <li>Use filters to search specific materials or suppliers</li>
                    <li>Export report for analysis and follow-up</li>
                </ul>
            </Card>
        </div>
    );
}