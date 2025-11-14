'use client'

import { useState } from 'react'
import { Upload, Download, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { exportToCSV, exportToExcel } from '@/lib/export'
import Papa from 'papaparse'

interface BulkOperationsProps {
  onBulkCreate?: (data: any[]) => Promise<void>
  onBulkUpdate?: (data: any[]) => Promise<void>
  template?: any[]
  entityName?: string
}

export function BulkOperations({
  onBulkCreate,
  onBulkUpdate,
  template = [],
  entityName = 'items'
}: BulkOperationsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadResult(null)

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const data = results.data as any[]
            
            if (onBulkCreate) {
              await onBulkCreate(data)
            } else if (onBulkUpdate) {
              await onBulkUpdate(data)
            }
            
            setUploadResult({
              success: data.length,
              errors: results.errors.map(e => e.message)
            })
          } catch (error: any) {
            setUploadResult({
              success: 0,
              errors: [error.message || 'Bulk operation failed']
            })
          } finally {
            setIsUploading(false)
          }
        },
        error: (error) => {
          setUploadResult({
            success: 0,
            errors: [error.message]
          })
          setIsUploading(false)
        }
      })
    } catch (error: any) {
      setUploadResult({
        success: 0,
        errors: [error.message || 'File upload failed']
      })
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = () => {
    if (template.length > 0) {
      exportToCSV(template, `${entityName}-template`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer transition-colors">
          <Upload className="h-4 w-4" />
          <span>Upload CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        {template.length > 0 && (
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Template</span>
          </button>
        )}
      </div>

      {isUploading && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
            <span>Processing CSV file...</span>
          </div>
        </div>
      )}

      {uploadResult && (
        <div
          className={`p-4 rounded-lg ${
            uploadResult.errors.length === 0
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-yellow-50 dark:bg-yellow-900/20'
          }`}
        >
          <div className="flex items-start gap-2">
            {uploadResult.errors.length === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  uploadResult.errors.length === 0
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-yellow-800 dark:text-yellow-300'
                }`}
              >
                {uploadResult.success} {entityName} processed successfully
              </p>
              {uploadResult.errors.length > 0 && (
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <p className="font-medium">Errors:</p>
                  <ul className="list-disc list-inside mt-1">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

