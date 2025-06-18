"use client"

import { useState, useEffect, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getNDADocumentsForStudent, uploadNDADocument } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { NDADocument } from "@/types"
import { FileText, Upload, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function StudentNDAPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<NDADocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null) // Track which document is being uploaded
  const [error, setError] = useState<string>("")
  const [errorDocId, setErrorDocId] = useState<string | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    if (!user) return
    try {
      console.log("Fetching NDA documents for user:", user.id)
      const docs = await getNDADocumentsForStudent(user.id)
      console.log("Fetched documents:", docs)
      setDocuments(docs)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError("Failed to load documents")
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, originalDoc: NDADocument) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Clear previous errors
    setError("")
    setErrorDocId(null)

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      setError("Please upload a PDF or Word document")
      setErrorDocId(originalDoc.id)
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size should be less than 10MB")
      setErrorDocId(originalDoc.id)
      return
    }

    setUploading(originalDoc.id)
    
    try {
      await uploadNDADocument(file, {
        title: `Signed: ${originalDoc.title}`,
        description: `Signed document in response to: ${originalDoc.title}`,
        type: "student",
        uploadedBy: user.id,
        studentId: user.id,
        status: "pending",
        originalDocumentId: originalDoc.id
      })

      // Reset file input
      if (fileInputRefs.current[originalDoc.id]) {
        fileInputRefs.current[originalDoc.id]!.value = ""
      }

      // Refresh documents
      await fetchDocuments()
    } catch (error) {
      console.error("Error uploading document:", error)
      setError("Failed to upload document. Please try again.")
      setErrorDocId(originalDoc.id)
    } finally {
      setUploading(null)
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

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "approved":
        return { variant: "default", icon: <CheckCircle className="h-4 w-4 mr-1" /> }
      case "rejected":
        return { variant: "destructive", icon: <XCircle className="h-4 w-4 mr-1" /> }
      case "pending":
        return { variant: "secondary", icon: <AlertCircle className="h-4 w-4 mr-1" /> }
      default:
        return { variant: "outline", icon: <Upload className="h-4 w-4 mr-1" /> }
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
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

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <MainLayout>
        <div className="space-y-8 max-w-5xl mx-auto px-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NDA Documents</h1>
            <p className="text-gray-500">View and sign your NDA documents</p>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No documents available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedDocuments).map(([originalId, docs]) => {
                  const originalDoc = docs.find(d => !d.originalDocumentId) || docs[0]
                  const signedDoc = docs.find(d => d.originalDocumentId === originalId)
                  const statusInfo = getStatusBadgeVariant(signedDoc?.status)
                  const isUploading = uploading === originalDoc.id
                  const hasError = errorDocId === originalDoc.id && error

                  return (
                    <Card key={originalId}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{originalDoc.title}</CardTitle>
                            <CardDescription>
                              Received {formatDate(originalDoc.uploadedAt)}
                            </CardDescription>
                          </div>
                          <Badge variant={statusInfo.variant as any} className="flex items-center">
                            {statusInfo.icon}
                            {signedDoc ? signedDoc.status : "Unsigned"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {originalDoc.description && (
                          <p className="text-gray-700 mb-4">{originalDoc.description}</p>
                        )}
                        
                        <div className="flex flex-col space-y-4">
                          {/* Show error if any */}
                          {hasError && (
                            <Alert variant="destructive">
                              <AlertDescription className="flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                {error}
                              </AlertDescription>
                            </Alert>
                          )}

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

                          {/* Signed Document Section */}
                          {signedDoc ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <FileText className="h-4 w-4" />
                                  <span>Your Signed Document</span>
                                  <span>({formatFileSize(signedDoc.fileSize)})</span>
                                  <span className="text-gray-400">•</span>
                                  <span>Submitted {formatDate(signedDoc.uploadedAt)}</span>
                                </div>

                                <div className="flex items-center gap-2">
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

                              {/* Show reupload option if rejected */}
                              {signedDoc.status === "rejected" && (
                                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                                  <div className="flex items-center gap-2 text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Please upload a new signed document</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept=".pdf,.doc,.docx"
                                      onChange={(e) => handleFileUpload(e, originalDoc)}
                                      ref={(el) => {
                                        fileInputRefs.current[originalDoc.id] = el
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => fileInputRefs.current[originalDoc.id]?.click()}
                                      disabled={isUploading}
                                      className="bg-white hover:bg-red-50"
                                    >
                                      {isUploading ? (
                                        <>
                                          <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                                          Uploading...
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="h-4 w-4 mr-1" />
                                          Upload New Document
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Show rejection reason if rejected */}
                              {signedDoc.status === "rejected" && signedDoc.rejectionReason && (
                                <Alert variant="destructive">
                                  <AlertDescription className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <span className="font-semibold">Rejection Reason:</span>
                                      <br />
                                      {signedDoc.rejectionReason}
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              )}

                              {/* Show pending message if pending */}
                              {signedDoc.status === "pending" && (
                                <Alert>
                                  <AlertDescription className="flex items-center gap-2 text-blue-700">
                                    <AlertCircle className="h-4 w-4" />
                                    Your document is pending approval. You'll be notified once it's reviewed.
                                  </AlertDescription>
                                </Alert>
                              )}

                              {/* Show success message if approved */}
                              {signedDoc.status === "approved" && (
                                <Alert>
                                  <AlertDescription className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="h-4 w-4" />
                                    Your document has been approved.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Upload className="h-4 w-4" />
                                <span>Upload Signed Document</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.doc,.docx"
                                  onChange={(e) => handleFileUpload(e, originalDoc)}
                                  ref={(el) => {
                                    fileInputRefs.current[originalDoc.id] = el
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => fileInputRefs.current[originalDoc.id]?.click()}
                                  disabled={isUploading}
                                >
                                  {isUploading ? (
                                    <>
                                      <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-1" />
                                      Upload
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
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