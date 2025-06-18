"use client"

import { useState, useEffect, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getAllNDADocuments, uploadNDADocument, updateNDADocumentStatus, getUsers } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { NDADocument, User } from "@/types"
import { FileText, Upload, Download, CheckCircle, XCircle, Search, ChevronDown, Filter, SortAsc, SortDesc } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export default function AdminNDAPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<NDADocument[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [rejectionReason, setRejectionReason] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<NDADocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // New state for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [studentSearchOpen, setStudentSearchOpen] = useState(false)
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [docsData, studentsData] = await Promise.all([
        getAllNDADocuments(),
        getUsers()
      ])
      setDocuments(docsData)
      setStudents(studentsData.filter(u => u.role === "student"))
      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load data")
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !selectedStudentIds.length) return

    setUploading(true)
    try {
      console.log("Uploading NDA document for students:", selectedStudentIds)
      // Upload document for each selected student
      await Promise.all(
        selectedStudentIds.map(studentId => {
          console.log("Uploading document for student:", studentId)
          return uploadNDADocument(file, {
            title: title.trim(),
            description: description.trim(),
            type: "admin",
            uploadedBy: user.id,
            status: "approved",
            studentId
          })
        })
      )
      console.log("Successfully uploaded NDA documents")

      // Reset form
      setTitle("")
      setDescription("")
      setSelectedStudentIds([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Refresh documents
      await fetchData()
    } catch (error) {
      console.error("Error uploading document:", error)
      setError("Failed to upload document")
    } finally {
      setUploading(false)
    }
  }

  const handleStatusUpdate = async (documentId: string, status: "approved" | "rejected") => {
    if (!user) return

    try {
      await updateNDADocumentStatus(
        documentId,
        status,
        user.id,
        status === "rejected" ? rejectionReason : undefined
      )

      // Reset state
      setSelectedDocument(null)
      setRejectionReason("")

      // Show success message
      setSuccess(status === "approved" 
        ? "Document has been approved successfully"
        : "Document has been rejected and student will be notified to reupload"
      )

      // Refresh documents
      await fetchData()
    } catch (error) {
      console.error("Error updating document status:", error)
      setError("Failed to update document status")
    }
  }

  const formatDate = (date: Date | any) => {
    if (!date) return "Unknown"
    const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
    return formatDistanceToNow(dateObj, { addSuffix: true })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Filter and sort documents
  const filteredAndSortedDocuments = Object.entries(documents.reduce((acc, doc) => {
    const key = doc.originalDocumentId || doc.id
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(doc)
    return acc
  }, {} as Record<string, NDADocument[]>))
  .filter(([_, docs]) => {
    const originalDoc = docs.find(d => !d.originalDocumentId) || docs[0]
    const student = students.find(s => s.id === originalDoc.studentId)
    const searchLower = searchQuery.toLowerCase()
    
    // Apply search filter
    if (searchQuery && !(
      originalDoc.title.toLowerCase().includes(searchLower) ||
      student?.name.toLowerCase().includes(searchLower) ||
      student?.email.toLowerCase().includes(searchLower)
    )) {
      return false
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const signedDoc = docs.find(d => d.originalDocumentId === originalDoc.id)
      if (!signedDoc) return statusFilter === "pending"
      return signedDoc.status === statusFilter
    }

    return true
  })
  .sort(([_, docsA], [__, docsB]) => {
    const dateA = (docsA.find(d => !d.originalDocumentId) || docsA[0]).uploadedAt
    const dateB = (docsB.find(d => !d.originalDocumentId) || docsB[0]).uploadedAt
    const comparison = dateA > dateB ? -1 : 1
    return sortOrder === "desc" ? comparison : -comparison
  })

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <MainLayout>
        <div className="space-y-8 max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NDA Documents</h1>
              <p className="text-gray-500">Send and manage NDA documents for students</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {statusFilter === "all" ? "All Status" : statusFilter}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40">
                  <div className="space-y-1">
                    {["all", "pending", "approved", "rejected"].map((status) => (
                      <Button
                        key={status}
                        variant={statusFilter === status ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setStatusFilter(status as any)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send NDA Document</CardTitle>
              <CardDescription>Send an NDA document to specific students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Input
                  placeholder="Document Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Document Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={studentSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedStudentIds.length === 0
                        ? "Select students..."
                        : `${selectedStudentIds.length} student${selectedStudentIds.length === 1 ? "" : "s"} selected`}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search students..." />
                      <CommandEmpty>No students found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {students.map((student) => (
                          <CommandItem
                            key={student.id}
                            onSelect={() => {
                              setSelectedStudentIds(ids => 
                                ids.includes(student.id)
                                  ? ids.filter(id => id !== student.id)
                                  : [...ids, student.id]
                              )
                            }}
                          >
                            <div className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selectedStudentIds.includes(student.id)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}>
                              <CheckCircle className={cn(
                                "h-4 w-4",
                                selectedStudentIds.includes(student.id) ? "opacity-100" : "opacity-0"
                              )} />
                            </div>
                            <span>{student.name}</span>
                            <span className="ml-2 text-gray-500">({student.email})</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!title.trim() || !selectedStudentIds.length || uploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search and Documents List */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search by title, student name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {filteredAndSortedDocuments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    {searchQuery
                      ? "No documents match your search"
                      : "No documents uploaded yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredAndSortedDocuments.map(([originalId, docs]) => {
                  const originalDoc = docs.find(d => !d.originalDocumentId) || docs[0]
                  const signedDocs = docs.filter(d => d.originalDocumentId === originalId)
                  const student = students.find(s => s.id === originalDoc.studentId)

                  return (
                    <Card key={originalId}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{originalDoc.title}</CardTitle>
                            <CardDescription>
                              Sent {formatDate(originalDoc.uploadedAt)}
                              {student && (
                                <> • To: {student.name} ({student.email})</>
                              )}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={
                              signedDocs.length > 0
                                ? signedDocs[0].status === "approved"
                                  ? "default"
                                  : signedDocs[0].status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                                : "secondary"
                            }
                          >
                            {signedDocs.length > 0 ? signedDocs[0].status : "Pending Signature"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {originalDoc.description && (
                          <p className="text-gray-700 mb-4">{originalDoc.description}</p>
                        )}
                        
                        <div className="flex flex-col space-y-4">
                          {/* Original Document */}
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <FileText className="h-4 w-4" />
                              <span>Original Document</span>
                              <span>({formatFileSize(originalDoc.fileSize)})</span>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <a
                                href={originalDoc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          </div>

                          {/* Signed Documents */}
                          {signedDocs.map((signedDoc) => (
                            <div key={signedDoc.id} className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <FileText className="h-4 w-4" />
                                  <span>Signed Document</span>
                                  <span>({formatFileSize(signedDoc.fileSize)})</span>
                                  <span className="text-gray-400">•</span>
                                  <span>Submitted {formatDate(signedDoc.uploadedAt)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {signedDoc.status === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => handleStatusUpdate(signedDoc.id, "approved")}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>

                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Request Reupload
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Request Document Reupload</DialogTitle>
                                            <DialogDescription>
                                              Please provide a reason why the document needs to be reuploaded
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4 mt-4">
                                            <Textarea
                                              placeholder="Explain what needs to be corrected..."
                                              value={rejectionReason}
                                              onChange={(e) => setRejectionReason(e.target.value)}
                                              rows={3}
                                            />
                                            <Button
                                              variant="destructive"
                                              onClick={() => handleStatusUpdate(signedDoc.id, "rejected")}
                                              disabled={!rejectionReason.trim()}
                                            >
                                              Request Reupload
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                  >
                                    <a
                                      href={signedDoc.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </a>
                                  </Button>
                                </div>
                              </div>

                              {signedDoc.status === "rejected" && signedDoc.rejectionReason && (
                                <Alert variant="destructive">
                                  <AlertDescription className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <span className="font-semibold">Reupload Requested:</span>
                                      <br />
                                      {signedDoc.rejectionReason}
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              )}

                              {signedDoc.status === "approved" && (
                                <Alert>
                                  <AlertDescription className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="h-4 w-4" />
                                    Document has been approved
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
} 