'use client'

import { useState, useRef } from 'react'

interface ImportResult {
  imported: number
  skipped: number
  errors: number
  errorDetails: string[]
}

interface Props {
  type: 'revenue' | 'costs'
  templateHref: string
  importHref: string
}

function isImportResult(data: unknown): data is ImportResult {
  return (
    data !== null &&
    typeof data === 'object' &&
    'imported' in data &&
    typeof (data as Record<string, unknown>).imported === 'number'
  )
}

function isErrorResponse(data: unknown): data is { error: string } {
  return (
    data !== null &&
    typeof data === 'object' &&
    'error' in data &&
    typeof (data as Record<string, unknown>).error === 'string'
  )
}

export default function ImportPanel({ type, templateHref, importHref }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setError('')

    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result
      if (typeof text !== 'string') return
      const lines = text
        .split('\n')
        .map(l => l.replace(/\r$/, ''))
        .filter(l => l.length > 0)
      const headers = lines[0]?.split(',') ?? []
      const dataLines = lines.slice(1).filter(l => l.trim()).slice(0, 5)
      setPreviewHeaders(headers)
      setPreviewRows(dataLines.map(l => l.split(',')))
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setIsImporting(true)
    setError('')

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch(importHref, { method: 'POST', body: fd })
      const data: unknown = await res.json()

      if (!res.ok) {
        setError(isErrorResponse(data) ? data.error : 'Import failed')
        return
      }

      if (isImportResult(data)) {
        setResult(data)
      } else {
        setError('Unexpected response from server')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setIsImporting(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError('')
    setPreviewHeaders([])
    setPreviewRows([])
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const unitLabel = type === 'revenue' ? 'days' : 'rows'

  return (
    <div className="space-y-4">
      {/* Template link */}
      <p className="text-sm text-neutral-600">
        Not sure of the format?{' '}
        <a
          href={templateHref}
          className="font-medium text-sky-600 hover:text-sky-700 hover:underline focus:outline-none focus:underline"
        >
          Download template
        </a>
      </p>

      {/* File input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Select CSV file
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-neutral-700
            file:mr-3 file:rounded-lg file:border-0 file:py-2 file:px-4
            file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700
            hover:file:bg-sky-100 focus:outline-none"
        />
        {fileName && (
          <p className="mt-1 text-xs text-neutral-400">{fileName}</p>
        )}
      </div>

      {/* Preview */}
      {previewRows.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-2">
            Preview — first {previewRows.length} rows
          </p>
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="min-w-full text-xs">
              <thead className="bg-neutral-50">
                <tr>
                  {previewHeaders.map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-left font-medium text-neutral-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {previewRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="max-w-[110px] truncate px-3 py-2 text-neutral-700 whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import button */}
      {previewRows.length > 0 && !result && (
        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting}
          className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
        >
          {isImporting && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {isImporting ? 'Importing… please wait' : 'Import'}
        </button>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-medium text-green-800">
              Import complete: {result.imported} {unitLabel} imported
              {result.skipped > 0 && `, ${result.skipped} skipped`}
              {result.errors > 0 && `, ${result.errors} errors`}
            </p>
          </div>

          {result.skipped > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              {result.skipped} {result.skipped === 1 ? 'day' : 'days'} skipped — already had data
            </div>
          )}

          {result.errors > 0 && result.errorDetails.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="mb-2 text-sm font-medium text-red-700">
                {result.errors} rows had errors:
              </p>
              <ul className="list-disc space-y-1 pl-4">
                {result.errorDetails.slice(0, 10).map((msg, i) => (
                  <li key={i} className="text-xs text-red-600">
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  )
}
