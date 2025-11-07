"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

// Data interfaces
export interface IndentRecord {
  id: string
  poNo: string
  supplierName: string
  materialName: string
  quantity: number
  rate: number
  deliveryDate: string
  status: string
}

export interface PORecord {
  id: string
  poNo: string
  supplierName: string
  materialName: string
  quantity: number
  rate: number
  deliveryDate: string
  issueDate?: string
  status: string
}

export interface FollowUpRecord {
  id: string
  poNo: string
  supplierName: string
  lastFollowUp: string
  nextFollowUp: string
  status: string
  remarks: string
}

export interface MaterialReceivingRecord {
  id: string
  poNo: string
  gateEntryNo: string
  materialName: string
  quantity: number
  receivedDate: string
  status: string
}

export interface WeighmentRecord {
  id: string
  gateEntryNo: string
  materialName: string
  grossWeight: number
  tareWeight: number
  netWeight: number
  status: string
}

export interface QCRecord {
  id: string
  materialName: string
  batchNo: string
  testResult: string
  remarks: string
  status: string
}

export interface MRNRecord {
  id: string
  mrnNo: string
  materialName: string
  quantity: number
  location: string
  status: string
}

export interface BillRecord {
  id: string
  billNo: string
  supplierName: string
  amount: number
  dueDate: string
  status: string
}

export interface QCReportRecord {
  id: string
  reportNo: string
  materialName: string
  testDate: string
  result: string
  status: string
}

export interface BillEntryRecord {
  id: string
  billNo: string
  supplierName: string
  amount: number
  entryDate: string
  status: string
}

export interface ProcurementRecord {
  id: string
  poNo: string
  supplierName: string
  materialName: string
  quantity: number
  rate: number
  deliveryDate: string
  stage: "indent" | "po" | "followup" | "receiving" | "weighment" | "qc" | "mrn" | "bills" | "qcreport" | "billentry"
  status:
    | "Pending"
    | "Completed"
    | "Issued"
    | "Follow-up Done"
    | "Received"
    | "Verified"
    | "QC Done"
    | "MRN Created"
    | "Bill Pending"
    | "QC Report Done"
    | "Bill Entered"
  createdAt: string
  [key: string]: any
}

interface ProcurementContextType {
  // Indent
  indents: IndentRecord[]
  addIndent: (indent: IndentRecord) => void
  updateIndent: (id: string, indent: Partial<IndentRecord>) => void

  // PO Issue
  posPending: PORecord[]
  posHistory: PORecord[]
  issuePO: (po: PORecord) => void

  // Follow-up
  followUps: FollowUpRecord[]
  addFollowUp: (followUp: FollowUpRecord) => void
  updateFollowUp: (id: string, followUp: Partial<FollowUpRecord>) => void

  // Material Receiving
  materialReceiving: MaterialReceivingRecord[]
  addMaterialReceiving: (record: MaterialReceivingRecord) => void
  updateMaterialReceiving: (id: string, record: Partial<MaterialReceivingRecord>) => void

  // Weighment
  weighments: WeighmentRecord[]
  addWeighment: (record: WeighmentRecord) => void
  updateWeighment: (id: string, record: Partial<WeighmentRecord>) => void

  // QC
  qcRecords: QCRecord[]
  addQCRecord: (record: QCRecord) => void
  updateQCRecord: (id: string, record: Partial<QCRecord>) => void

  // MRN
  mrnRecords: MRNRecord[]
  addMRNRecord: (record: MRNRecord) => void
  updateMRNRecord: (id: string, record: Partial<MRNRecord>) => void

  // Bills
  bills: BillRecord[]
  addBill: (bill: BillRecord) => void
  updateBill: (id: string, bill: Partial<BillRecord>) => void

  // QC Reports
  qcReports: QCReportRecord[]
  addQCReport: (report: QCReportRecord) => void
  updateQCReport: (id: string, report: Partial<QCReportRecord>) => void

  // Bill Entry
  billEntries: BillEntryRecord[]
  addBillEntry: (entry: BillEntryRecord) => void
  updateBillEntry: (id: string, entry: Partial<BillEntryRecord>) => void

  // New methods for unified records
  records: ProcurementRecord[]
  addRecord: (record: ProcurementRecord) => void
  updateRecord: (id: string, updates: Partial<ProcurementRecord>) => void
  moveRecordToStage: (id: string, newStage: ProcurementRecord["stage"], newStatus: ProcurementRecord["status"]) => void
  getRecordsByStage: (stage: ProcurementRecord["stage"], status?: ProcurementRecord["status"]) => ProcurementRecord[]
   clearRecords: () => void 
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined)

export function ProcurementProvider({ children }: { children: React.ReactNode }) {
  const [indents, setIndents] = useState<IndentRecord[]>([
    {
      id: "1",
      poNo: "PO-2025-001",
      supplierName: "Supplier A",
      materialName: "Steel Sheets",
      quantity: 100,
      rate: 500,
      deliveryDate: "2025-11-15",
      status: "Pending",
    },
  ])

  const [posPending, setPosPending] = useState<PORecord[]>([
    {
      id: "1",
      poNo: "PO-2025-001",
      supplierName: "Supplier A",
      materialName: "Steel Sheets",
      quantity: 100,
      rate: 500,
      deliveryDate: "2025-11-15",
      status: "Pending",
    },
  ])

  const [posHistory, setPosHistory] = useState<PORecord[]>([])
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([])
  const [materialReceiving, setMaterialReceiving] = useState<MaterialReceivingRecord[]>([])
  const [weighments, setWeighments] = useState<WeighmentRecord[]>([])
  const [qcRecords, setQcRecords] = useState<QCRecord[]>([])
  const [mrnRecords, setMrnRecords] = useState<MRNRecord[]>([])
  const [bills, setBills] = useState<BillRecord[]>([])
  const [qcReports, setQcReports] = useState<QCReportRecord[]>([])
  const [billEntries, setBillEntries] = useState<BillEntryRecord[]>([])

  const [records, setRecords] = useState<ProcurementRecord[]>([]);

  const addRecord = useCallback((record: ProcurementRecord) => {
  setRecords((prevRecords) => [...prevRecords, record])
}, [])



const updateRecord = useCallback((id: string, updates: Partial<ProcurementRecord>) => {
  setRecords((prevRecords) => prevRecords.map((r) => (r.id === id ? { ...r, ...updates } : r)))
}, [])

 const clearRecords = useCallback(() => {
    setRecords([])
  }, [])


  const moveRecordToStage = useCallback(
  (id: string, newStage: ProcurementRecord["stage"], newStatus: ProcurementRecord["status"]) => {
    setRecords((prevRecords) => {
      return prevRecords.map((r) => {
        if (r.id === id) {
          return { ...r, stage: newStage, status: newStatus }
        }
        return r
      })
    })
  },
  [],
)

  const getRecordsByStage = useCallback(
  (stage: ProcurementRecord["stage"], status?: ProcurementRecord["status"]) => {
    return records.filter((r) => r.stage === stage && (!status || r.status === status))
  },
  [records],
)

  const value: ProcurementContextType = {
    // Indent
    indents,
    addIndent: (indent) => setIndents([...indents, indent]),
    updateIndent: (id, updates) => setIndents(indents.map((i) => (i.id === id ? { ...i, ...updates } : i))),

    // PO Issue
    posPending,
    posHistory,
    issuePO: (po) => {
      setPosPending(posPending.filter((p) => p.id !== po.id))
      setPosHistory([...posHistory, { ...po, status: "Issued" }])
    },

    // Follow-up
    followUps,
    addFollowUp: (followUp) => setFollowUps([...followUps, followUp]),
    updateFollowUp: (id, updates) => setFollowUps(followUps.map((f) => (f.id === id ? { ...f, ...updates } : f))),

    // Material Receiving
    materialReceiving,
    addMaterialReceiving: (record) => setMaterialReceiving([...materialReceiving, record]),
    updateMaterialReceiving: (id, updates) =>
      setMaterialReceiving(materialReceiving.map((m) => (m.id === id ? { ...m, ...updates } : m))),

    // Weighment
    weighments,
    addWeighment: (record) => setWeighments([...weighments, record]),
    updateWeighment: (id, updates) => setWeighments(weighments.map((w) => (w.id === id ? { ...w, ...updates } : w))),

    // QC
    qcRecords,
    addQCRecord: (record) => setQcRecords([...qcRecords, record]),
    updateQCRecord: (id, updates) => setQcRecords(qcRecords.map((q) => (q.id === id ? { ...q, ...updates } : q))),

    // MRN
    mrnRecords,
    addMRNRecord: (record) => setMrnRecords([...mrnRecords, record]),
    updateMRNRecord: (id, updates) => setMrnRecords(mrnRecords.map((m) => (m.id === id ? { ...m, ...updates } : m))),

    // Bills
    bills,
    addBill: (bill) => setBills([...bills, bill]),
    updateBill: (id, updates) => setBills(bills.map((b) => (b.id === id ? { ...b, ...updates } : b))),

    // QC Reports
    qcReports,
    addQCReport: (report) => setQcReports([...qcReports, report]),
    updateQCReport: (id, updates) => setQcReports(qcReports.map((r) => (r.id === id ? { ...r, ...updates } : r))),

    // Bill Entry
    billEntries,
    addBillEntry: (entry) => setBillEntries([...billEntries, entry]),
    updateBillEntry: (id, updates) => setBillEntries(billEntries.map((e) => (e.id === id ? { ...e, ...updates } : e))),

    // New methods for unified records
    records,
    addRecord,
    updateRecord,
    moveRecordToStage,
    getRecordsByStage,
    clearRecords, 
  }

  return <ProcurementContext.Provider value={value}>{children}</ProcurementContext.Provider>
}

export function useProcurement() {
  const context = useContext(ProcurementContext)
  if (!context) {
    throw new Error("useProcurement must be used within ProcurementProvider")
  }
  return context
}
