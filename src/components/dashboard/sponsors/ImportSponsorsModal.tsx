'use client'

import React, { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { importSponsorsAction, type ImportedSponsorItem } from '@/app/dashboard/sponsors/actions'

interface Props {
  existingSponsors: any[]
  onClose: () => void
  onSuccess: (refreshedSponsors: any[]) => void
}

interface ParsedRowPreview extends ImportedSponsorItem {
  rowIndex: number
  isExisting: boolean
  matchedSponsorName?: string
}

export function ImportSponsorsModal({ existingSponsors, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [parsedRows, setParsedRows] = useState<ParsedRowPreview[]>([])
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{
    created: number
    updated: number
    errors: string[]
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.classList.add('sponsor-form-open')
    return () => document.documentElement.classList.remove('sponsor-form-open')
  }, [])

  const normalize = (str?: string | null) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim()

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      setErrorMsg('Por favor seleccioná un archivo de Excel válido (.xlsx o .xls).')
      return
    }

    setFile(selectedFile)
    setErrorMsg(null)
    setIsProcessingFile(true)
    setImportResult(null)

    try {
      const buffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('El archivo Excel no contiene hojas de cálculo.')
      }

      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

      if (!rows || rows.length === 0) {
        throw new Error('La planilla está vacía.')
      }

      // Determinar si la primera fila es de encabezado
      let startIndex = 0
      const firstRowColA = String(rows[0]?.[0] || '').trim().toLowerCase()
      const headerKeywords = ['nombre', 'empresa', 'razon', 'razón', 'sponsor', 'plantilla', 'cliente', 'id']
      if (headerKeywords.some(kw => firstRowColA.includes(kw))) {
        startIndex = 1
      }

      const previews: ParsedRowPreview[] = []

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // Mapeo exacto según requerimiento:
        // Columna A (0): Nombre Empresa
        // Columna B (1): Actividad
        // Columna C (2): Página Web
        // Columna D (3): Teléfono
        // Columna E (4): Email
        // Columna F (5): Zona de Influencia
        const nombreEmpresa = String(row[0] || '').trim()
        if (!nombreEmpresa || nombreEmpresa === '-' || nombreEmpresa.toLowerCase() === 'undefined') {
          continue
        }

        const actividad = String(row[1] || '').trim()
        const websiteUrl = String(row[2] || '').trim()
        const telefono = String(row[3] || '').trim()
        const email = String(row[4] || '').trim()
        const zonaInfluencia = String(row[5] || '').trim()

        const normName = normalize(nombreEmpresa)
        const cleanEmail = email.includes('@') ? email.toLowerCase() : null

        const matched = existingSponsors.find(s => {
          const matchName = normalize(s.nombre_empresa || s.name) === normName
          const matchEmail = cleanEmail && s.email && s.email.toLowerCase() === cleanEmail
          return matchName || matchEmail
        })

        previews.push({
          rowIndex: i + 1,
          nombre_empresa: nombreEmpresa,
          actividad: actividad && actividad !== '-' ? actividad : null,
          website_url: websiteUrl && websiteUrl !== '-' ? websiteUrl : null,
          telefono: telefono && telefono !== '-' ? telefono : null,
          email: email && email !== '-' ? email : null,
          zona_influencia: zonaInfluencia && zonaInfluencia !== '-' ? zonaInfluencia : null,
          isExisting: !!matched,
          matchedSponsorName: matched ? (matched.nombre_empresa || matched.name) : undefined,
        })
      }

      if (previews.length === 0) {
        throw new Error('No se encontraron filas con datos válidos en la planilla.')
      }

      setParsedRows(previews)
    } catch (err: any) {
      console.error('[ImportSponsorsModal] Error al procesar:', err)
      setErrorMsg(err.message || 'Error al procesar el archivo Excel.')
      setParsedRows([])
    } finally {
      setIsProcessingFile(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return

    setIsImporting(true)
    setErrorMsg(null)

    try {
      const itemsToImport: ImportedSponsorItem[] = parsedRows.map(r => ({
        nombre_empresa: r.nombre_empresa,
        actividad: r.actividad,
        website_url: r.website_url,
        telefono: r.telefono,
        email: r.email,
        zona_influencia: r.zona_influencia,
      }))

      const res = await importSponsorsAction(itemsToImport)

      if (!res.success) {
        throw new Error(res.error || 'Error al importar los datos.')
      }

      setImportResult({
        created: res.createdCount || 0,
        updated: res.updatedCount || 0,
        errors: res.errors || [],
      })

      if (res.sponsors) {
        onSuccess(res.sponsors)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado durante la importación.')
    } finally {
      setIsImporting(false)
    }
  }

  const newCount = parsedRows.filter(r => !r.isExisting).length
  const updateCount = parsedRows.filter(r => r.isExisting).length

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
      style={{ colorScheme: 'dark' }}
    >
      <div className="glass border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Importar Sponsors desde Excel (.xlsx)
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Sobreescribe datos existentes y crea nuevos registros con campos manuales vacíos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Zona de Arrastrar y Soltar / Selección */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                : file
                ? 'border-white/20 bg-white/[0.03] hover:border-emerald-500/50'
                : 'border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                {file ? file.name : 'Hacé clic para seleccionar o arrastrá tu planilla .xlsx aquí'}
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-lg">
                Columnas esperadas: <strong>A:</strong> Nombre Empresa | <strong>B:</strong> Actividad | <strong>C:</strong> Página Web | <strong>D:</strong> Teléfono | <strong>E:</strong> Email | <strong>F:</strong> Zona de Influencia
              </p>
            </div>
          </div>

          {/* Estado de carga del archivo */}
          {isProcessingFile && (
            <div className="flex items-center justify-center gap-3 p-4 glass rounded-xl text-sm text-white/70">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              Analizando estructura de columnas de la planilla...
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Resultado de importación exitosa */}
          {importResult && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-base text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ¡Importación completada con éxito!
              </div>
              <div className="flex gap-4 text-xs">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                  ✨ <strong>{importResult.created}</strong> nuevos sponsors creados
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-200">
                  🔄 <strong>{importResult.updated}</strong> plantillas de sponsor sobreescritas
                </span>
              </div>
              {importResult.errors.length > 0 && (
                <div className="text-[11px] text-amber-300 space-y-1 pt-2 border-t border-white/10">
                  <p className="font-semibold">Observaciones menores detectadas:</p>
                  {importResult.errors.map((err, idx) => (
                    <p key={idx}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Previsualización de filas leídas */}
          {parsedRows.length > 0 && !importResult && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Previsualización de Datos ({parsedRows.length} filas detectadas)
                  </h4>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {newCount} Nuevos
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {updateCount} A Sobreescribir
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] italic">
                  * Los campos no provistos (ej. Nombre Contacto) se mantendrán o quedarán vacíos.
                </p>
              </div>

              <div className="border border-white/10 rounded-xl overflow-hidden glass">
                <div className="max-h-72 overflow-y-auto overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-white/60 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3">Fila</th>
                        <th className="py-2.5 px-3">Acción</th>
                        <th className="py-2.5 px-3">A: Nombre Empresa</th>
                        <th className="py-2.5 px-3">B: Actividad</th>
                        <th className="py-2.5 px-3">C: Página Web</th>
                        <th className="py-2.5 px-3">D: Teléfono</th>
                        <th className="py-2.5 px-3">E: Email</th>
                        <th className="py-2.5 px-3">F: Zona Influencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-2 px-3 text-white/40 font-mono text-[10px]">
                            #{row.rowIndex}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {row.isExisting ? (
                              <span
                                className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30"
                                title={`Sobreescribirá la ficha existente de: ${row.matchedSponsorName}`}
                              >
                                <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                                Sobreescribe
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                Nuevo
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-white whitespace-nowrap">
                            {row.nombre_empresa}
                          </td>
                          <td className="py-2 px-3 text-white/70 whitespace-nowrap">
                            {row.actividad || <span className="text-white/20 italic">—</span>}
                          </td>
                          <td className="py-2 px-3 text-blue-400 whitespace-nowrap max-w-[150px] truncate">
                            {row.website_url || <span className="text-white/20 italic">—</span>}
                          </td>
                          <td className="py-2 px-3 text-white/70 whitespace-nowrap">
                            {row.telefono || <span className="text-white/20 italic">—</span>}
                          </td>
                          <td className="py-2 px-3 text-white/70 whitespace-nowrap">
                            {row.email || <span className="text-white/20 italic">—</span>}
                          </td>
                          <td className="py-2 px-3 text-white/70 whitespace-nowrap">
                            {row.zona_influencia || <span className="text-white/20 italic">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer de Acciones */}
        <div className="flex items-center justify-between p-5 border-t border-white/10 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            {importResult ? 'Cerrar' : 'Cancelar'}
          </button>

          {!importResult && parsedRows.length > 0 && (
            <button
              type="button"
              disabled={isImporting}
              onClick={handleConfirmImport}
              className="btn-primary text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/20"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importando a Base de Datos...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar e Importar {parsedRows.length} Sponsors
                </>
              )}
            </button>
          )}

          {importResult && (
            <button
              type="button"
              onClick={onClose}
              className="btn-primary text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 font-bold"
            >
              Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
