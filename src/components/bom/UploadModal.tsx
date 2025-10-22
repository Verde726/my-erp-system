'use client'

/**
 * BOM Upload Modal Component
 * Drag & drop CSV upload with validation and results display
 */

import { useState, useCallback } from 'react'
import { useUploadBom } from '@/hooks/useBom'
import { downloadTemplate } from '@/lib/csv-parser'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadModalProps {
  open: boolean
  onClose: () => void
}

export function UploadModal({ open, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const uploadMutation = useUploadBom()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile)
      uploadMutation.reset()
    }
  }, [uploadMutation])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      uploadMutation.reset()
    }
  }, [uploadMutation])

  const handleUpload = async () => {
    if (!file) return

    try {
      await uploadMutation.mutateAsync(file)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleClose = () => {
    setFile(null)
    uploadMutation.reset()
    onClose()
  }

  const handleDownloadTemplate = () => {
    downloadTemplate('bom', true, true)
  }

  const results = uploadMutation.data

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload BOM Inventory</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add or update BOM items in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Need a template?</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* Drag & Drop Zone */}
          {!uploadMutation.isSuccess && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                dragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              )}
            >
              <Upload
                className={cn(
                  'mx-auto h-12 w-12 mb-4',
                  dragging ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <div className="space-y-2">
                <p className="font-medium">
                  {file ? file.name : 'Drag and drop your CSV file here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="secondary" className="mt-4" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>
          )}

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center space-y-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadMutation.isSuccess && results && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Created
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.summary.created}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Updated
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {results.summary.updated}
                  </div>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900 dark:text-red-100">
                      Errors
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.summary.errors}
                  </div>
                </div>
              </div>

              {/* Parse Errors */}
              {results.parseErrors && results.parseErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                      Validation Errors
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.parseErrors.slice(0, 10).map((error: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-sm text-red-800 dark:text-red-200 font-mono"
                      >
                        Row {error.row}
                        {error.field && ` (${error.field})`}: {error.message}
                      </div>
                    ))}
                    {results.parseErrors.length > 10 && (
                      <div className="text-sm text-red-600 italic">
                        ...and {results.parseErrors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Processing Errors */}
              {results.processingErrors && results.processingErrors.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Processing Errors
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.processingErrors.map((error: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-sm text-yellow-800 dark:text-yellow-200 font-mono"
                      >
                        {error.partNumber}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {uploadMutation.isError && (
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2 text-red-900 dark:text-red-100">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Upload Failed</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {uploadMutation.error?.message || 'An error occurred during upload'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {uploadMutation.isSuccess ? (
              <Button onClick={handleClose}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
