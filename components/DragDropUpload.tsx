'use client'

import { useState, useRef, DragEvent } from 'react'
import { Upload, X, File, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface FileWithPreview extends File {
  preview?: string
  status?: 'uploading' | 'success' | 'error'
  error?: string
}

interface DragDropUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
}

export function DragDropUpload({
  onUpload,
  accept = '*/*',
  multiple = true,
  maxSize = 10,
  maxFiles = 10,
}: DragDropUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`
    }
    return null
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return

    const newFiles: FileWithPreview[] = []
    const remainingSlots = maxFiles - files.length

    Array.from(fileList).slice(0, remainingSlots).forEach((file) => {
      const error = validateFile(file)
      if (!error) {
        const fileWithPreview: FileWithPreview = file
        if (file.type.startsWith('image/')) {
          fileWithPreview.preview = URL.createObjectURL(file)
        }
        fileWithPreview.status = 'uploading'
        newFiles.push(fileWithPreview)
      }
    })

    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const file = newFiles[index]
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    try {
      await onUpload(files)
      // Mark files as successful
      setFiles((prev) =>
        prev.map((file) => ({ ...file, status: 'success' as const }))
      )
    } catch (error: any) {
      // Mark files as error
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          status: 'error' as const,
          error: error.message || 'Upload failed',
        }))
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
          files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          disabled={files.length >= maxFiles}
        />

        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          Drag and drop files here, or click to select
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {accept !== '*/*' && `Accepted: ${accept}`}
          {maxSize && ` • Max size: ${maxSize}MB`}
          {maxFiles && ` • Max files: ${maxFiles}`}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <File className="h-5 w-5 text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                {file.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {file.error}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {file.status === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {file.status === 'uploading' && (
                  <div className="h-5 w-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}

          <Button
            onClick={handleUpload}
            disabled={uploading || files.some((f) => f.status === 'uploading')}
            className="w-full"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  )
}

