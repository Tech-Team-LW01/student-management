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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { FileText, Upload, Download, CheckCircle, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

  // Group documents by original document ID
  const groupedDocuments = documents.reduce((acc, doc) => {
    const key = doc.originalDocumentId || doc.id
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(doc)
    return acc
  }, {} as Record<string, NDADocument[]>)

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NDA Documents</h1>
            <p className="text-gray-500">Send and manage NDA documents for students</p>
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
                <Select
                  value={selectedStudentIds[0]}
                  onValueChange={(value) => setSelectedStudentIds([value])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Documents List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">All Documents</h2>
            
            {documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No documents uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedDocuments).map(([originalId, docs]) => {
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
                                        className="text-green-600"
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
                                            className="text-red-600"
                                          >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Reject
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Reject Document</DialogTitle>
                                            <DialogDescription>
                                              Please provide a reason for rejection
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4 mt-4">
                                            <Textarea
                                              placeholder="Rejection reason"
                                              value={rejectionReason}
                                              onChange={(e) => setRejectionReason(e.target.value)}
                                              rows={3}
                                            />
                                            <Button
                                              variant="destructive"
                                              onClick={() => handleStatusUpdate(signedDoc.id, "rejected")}
                                              disabled={!rejectionReason.trim()}
                                            >
                                              Confirm Rejection
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
                                  <AlertDescription>
                                    Rejection reason: {signedDoc.rejectionReason}
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