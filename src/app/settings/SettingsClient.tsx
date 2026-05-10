'use client'

import { useState, useTransition } from 'react'
import {
  saveSiteDetails,
  saveServiceTypes,
  saveVehicleTypes,
  savePriceMatrix,
  saveDiscountRules,
} from './actions'
import type { ServiceType, VehicleType, PriceMatrix, DiscountRule } from '@/lib/types'

const DAY_LABELS: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 0] as const

interface SiteDetails {
  id: string
  name: string
  location_name: string | null
  latitude: number | null
  longitude: number | null
}

interface Props {
  site: SiteDetails
  serviceTypes: ServiceType[]
  vehicleTypes: VehicleType[]
  priceMatrix: PriceMatrix
  discountRules: DiscountRule[]
}

interface DiscountRuleDraft {
  name: string
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6
  percentage: string
  active: boolean
}

export default function SettingsClient({
  site,
  serviceTypes: initServiceTypes,
  vehicleTypes: initVehicleTypes,
  priceMatrix: initPriceMatrix,
  discountRules: initDiscountRules,
}: Props) {
  // Site details
  const [siteName, setSiteName] = useState(site.name)
  const [locationName, setLocationName] = useState(site.location_name ?? '')
  const [lat, setLat] = useState(site.latitude?.toString() ?? '')
  const [lng, setLng] = useState(site.longitude?.toString() ?? '')
  const [siteError, setSiteError] = useState('')
  const [isSavingSite, startSaveSite] = useTransition()

  // Service types
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(initServiceTypes)
  const [newService, setNewService] = useState('')
  const [serviceError, setServiceError] = useState('')
  const [isSavingServices, startSaveServices] = useTransition()

  // Vehicle types
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(initVehicleTypes)
  const [newVehicle, setNewVehicle] = useState('')
  const [vehicleError, setVehicleError] = useState('')
  const [isSavingVehicles, startSaveVehicles] = useTransition()

  // Price matrix
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrix>(initPriceMatrix)
  const [priceError, setPriceError] = useState('')
  const [isSavingPrices, startSavePrices] = useTransition()

  // Discount rules
  const [discountDrafts, setDiscountDrafts] = useState<DiscountRuleDraft[]>(
    initDiscountRules.map(r => ({ ...r, percentage: String(r.percentage) }))
  )
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRuleDraft, setNewRuleDraft] = useState<DiscountRuleDraft>({
    name: '',
    day_of_week: 1,
    percentage: '',
    active: true,
  })
  const [discountError, setDiscountError] = useState('')
  const [isSavingDiscounts, startSaveDiscounts] = useTransition()

  // Toast
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Site details ──────────────────────────────────────────
  function handleSaveSite() {
    setSiteError('')
    const fd = new FormData()
    fd.set('name', siteName)
    fd.set('location_name', locationName)
    fd.set('latitude', lat)
    fd.set('longitude', lng)
    startSaveSite(async () => {
      const res = await saveSiteDetails(fd)
      if (res.error) setSiteError(res.error)
      else showToast('Site details saved')
    })
  }

  // ── Service types helpers ─────────────────────────────────
  function toggleService(i: number) {
    setServiceTypes(prev =>
      prev.map((s, idx) => (idx === i ? { ...s, active: !s.active } : s))
    )
  }

  function moveService(i: number, dir: 'up' | 'down') {
    setServiceTypes(prev => {
      const next = [...prev]
      const target = dir === 'up' ? i - 1 : i + 1
      if (target < 0 || target >= next.length) return prev
      const tmp = next[i]!
      next[i] = next[target]!
      next[target] = tmp
      return next
    })
  }

  function addService() {
    const name = newService.trim()
    if (!name) return
    if (serviceTypes.some(s => s.name.toLowerCase() === name.toLowerCase())) return
    setServiceTypes(prev => [...prev, { name, active: true }])
    setNewService('')
  }

  function handleSaveServices() {
    setServiceError('')
    startSaveServices(async () => {
      const res = await saveServiceTypes(serviceTypes)
      if (res.error) setServiceError(res.error)
      else showToast('Service types saved')
    })
  }

  // ── Vehicle types helpers ─────────────────────────────────
  function toggleVehicle(i: number) {
    setVehicleTypes(prev =>
      prev.map((v, idx) => (idx === i ? { ...v, active: !v.active } : v))
    )
  }

  function moveVehicle(i: number, dir: 'up' | 'down') {
    setVehicleTypes(prev => {
      const next = [...prev]
      const target = dir === 'up' ? i - 1 : i + 1
      if (target < 0 || target >= next.length) return prev
      const tmp = next[i]!
      next[i] = next[target]!
      next[target] = tmp
      return next
    })
  }

  function addVehicle() {
    const name = newVehicle.trim()
    if (!name) return
    if (vehicleTypes.some(v => v.name.toLowerCase() === name.toLowerCase())) return
    setVehicleTypes(prev => [...prev, { name, active: true }])
    setNewVehicle('')
  }

  function handleSaveVehicles() {
    setVehicleError('')
    startSaveVehicles(async () => {
      const res = await saveVehicleTypes(vehicleTypes)
      if (res.error) setVehicleError(res.error)
      else showToast('Vehicle types saved')
    })
  }

  // ── Price matrix helpers ──────────────────────────────────
  function handlePriceChange(service: string, vehicle: string, val: string) {
    const key = `${service}|${vehicle}`
    setPriceMatrix(prev => ({ ...prev, [key]: val === '' ? 0 : parseFloat(val) || 0 }))
  }

  function getPriceValue(service: string, vehicle: string): string {
    const key = `${service}|${vehicle}`
    const val = priceMatrix[key]
    return val === undefined || val === 0 ? '' : String(val)
  }

  function handleSavePrices() {
    setPriceError('')
    startSavePrices(async () => {
      const res = await savePriceMatrix(priceMatrix)
      if (res.error) setPriceError(res.error)
      else showToast('Prices saved')
    })
  }

  // ── Discount rules helpers ────────────────────────────────
  function draftsToRules(drafts: DiscountRuleDraft[]): DiscountRule[] {
    return drafts.map(d => ({
      name: d.name,
      day_of_week: d.day_of_week,
      percentage: parseInt(d.percentage, 10) || 0,
      active: d.active,
    }))
  }

  function validateDiscountDraft(
    draft: DiscountRuleDraft,
    otherDrafts: DiscountRuleDraft[],
  ): string | null {
    if (!draft.name.trim()) return 'Rule name is required'
    const pct = parseInt(draft.percentage, 10)
    if (isNaN(pct) || pct < 1 || pct > 100) return 'Discount must be between 1 and 100%'
    if (
      draft.active &&
      otherDrafts.some(d => d.active && d.day_of_week === draft.day_of_week)
    ) {
      return `An active rule for ${DAY_LABELS[draft.day_of_week] ?? ''} already exists`
    }
    return null
  }

  function updateDiscountDraft(
    i: number,
    field: keyof DiscountRuleDraft,
    value: string | boolean | (0 | 1 | 2 | 3 | 4 | 5 | 6),
  ) {
    setDiscountDrafts(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
    setDiscountError('')
  }

  function handleSaveRule(i: number) {
    const draft = discountDrafts[i]
    if (!draft) return
    const others = discountDrafts.filter((_, idx) => idx !== i)
    const validationError = validateDiscountDraft(draft, others)
    if (validationError) { setDiscountError(validationError); return }
    setDiscountError('')
    const updated = discountDrafts.map((d, idx) =>
      idx === i ? { ...d, name: d.name.trim() } : d
    )
    startSaveDiscounts(async () => {
      const res = await saveDiscountRules(draftsToRules(updated))
      if (res.error) setDiscountError(res.error)
      else { setDiscountDrafts(updated); showToast('Discount rule saved') }
    })
  }

  function handleDeleteRule(i: number) {
    setDiscountError('')
    const updated = discountDrafts.filter((_, idx) => idx !== i)
    startSaveDiscounts(async () => {
      const res = await saveDiscountRules(draftsToRules(updated))
      if (res.error) setDiscountError(res.error)
      else { setDiscountDrafts(updated); showToast('Rule deleted') }
    })
  }

  function handleAddRule() {
    const validationError = validateDiscountDraft(newRuleDraft, discountDrafts)
    if (validationError) { setDiscountError(validationError); return }
    setDiscountError('')
    const trimmed = { ...newRuleDraft, name: newRuleDraft.name.trim() }
    const updated = [...discountDrafts, trimmed]
    startSaveDiscounts(async () => {
      const res = await saveDiscountRules(draftsToRules(updated))
      if (res.error) setDiscountError(res.error)
      else {
        setDiscountDrafts(updated)
        setNewRuleDraft({ name: '', day_of_week: 1, percentage: '', active: true })
        setShowAddRule(false)
        showToast('Rule added')
      }
    })
  }

  const activeServices = serviceTypes.filter(s => s.active)
  const activeVehicles = vehicleTypes.filter(v => v.active)

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        {/* Page header */}
        <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>

        {/* ── 1. Site Details ─────────────────────────────── */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutral-900">Site Details</h2>

            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-neutral-700">
                Business name
              </label>
              <div className="mt-1">
                <input
                  id="siteName"
                  type="text"
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  placeholder="e.g. Yusuf's Hand Car Wash"
                  className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="locationName" className="block text-sm font-medium text-neutral-700">
                Location name
              </label>
              <div className="mt-1">
                <input
                  id="locationName"
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="e.g. Fish Hoek, Cape Town"
                  className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-neutral-700">
                  Latitude
                </label>
                <div className="mt-1">
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    placeholder="-34.0522"
                    className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-neutral-700">
                  Longitude
                </label>
                <div className="mt-1">
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    placeholder="18.4241"
                    className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {siteError && (
              <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {siteError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveSite}
              disabled={isSavingSite}
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
            >
              {isSavingSite && (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Save details
            </button>
          </div>
        </div>

        {/* ── 2. Service Types ─────────────────────────────── */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutral-900">Service Types</h2>

            <ul className="divide-y divide-neutral-100">
              {serviceTypes.map((s, i) => (
                <li key={s.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex-1 text-sm text-neutral-900">{s.name}</span>

                  <button
                    type="button"
                    onClick={() => toggleService(i)}
                    aria-pressed={s.active}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px] ${
                      s.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {s.active ? 'Active' : 'Inactive'}
                  </button>

                  <div className="flex flex-row gap-1">
                    <button
                      type="button"
                      onClick={() => moveService(i, 'up')}
                      disabled={i === 0}
                      aria-label={`Move ${s.name} up`}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveService(i, 'down')}
                      disabled={i === serviceTypes.length - 1}
                      aria-label={`Move ${s.name} down`}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      ↓
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Add new service type */}
            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <input
                type="text"
                value={newService}
                onChange={e => setNewService(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addService()}
                placeholder="New service type…"
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={addService}
                className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
              >
                Add
              </button>
            </div>

            {serviceError && (
              <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {serviceError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveServices}
              disabled={isSavingServices}
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
            >
              {isSavingServices && (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Save service types
            </button>
          </div>
        </div>

        {/* ── 3. Vehicle Types ─────────────────────────────── */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutral-900">Vehicle Types</h2>

            <ul className="divide-y divide-neutral-100">
              {vehicleTypes.map((v, i) => (
                <li key={v.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex-1 text-sm text-neutral-900">{v.name}</span>

                  <button
                    type="button"
                    onClick={() => toggleVehicle(i)}
                    aria-pressed={v.active}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px] ${
                      v.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {v.active ? 'Active' : 'Inactive'}
                  </button>

                  <div className="flex flex-row gap-1">
                    <button
                      type="button"
                      onClick={() => moveVehicle(i, 'up')}
                      disabled={i === 0}
                      aria-label={`Move ${v.name} up`}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveVehicle(i, 'down')}
                      disabled={i === vehicleTypes.length - 1}
                      aria-label={`Move ${v.name} down`}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      ↓
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Add new vehicle type */}
            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <input
                type="text"
                value={newVehicle}
                onChange={e => setNewVehicle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addVehicle()}
                placeholder="New vehicle type…"
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={addVehicle}
                className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
              >
                Add
              </button>
            </div>

            {vehicleError && (
              <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {vehicleError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveVehicles}
              disabled={isSavingVehicles}
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
            >
              {isSavingVehicles && (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Save vehicle types
            </button>
          </div>
        </div>

        {/* ── 4. Price Matrix ──────────────────────────────── */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Price Matrix</h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Prices in ZAR per wash. Only active service and vehicle types are shown.
              </p>
            </div>

            {activeServices.length === 0 || activeVehicles.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Enable at least one active service type and one active vehicle type to configure prices.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="pb-3 pr-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap">
                        Service
                      </th>
                      {activeVehicles.map(v => (
                        <th
                          key={v.name}
                          className="pb-3 px-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {v.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {activeServices.map(s => (
                      <tr key={s.name}>
                        <td className="py-3 pr-4 text-sm font-medium text-neutral-900 whitespace-nowrap">
                          {s.name}
                        </td>
                        {activeVehicles.map(v => (
                          <td key={v.name} className="py-3 px-2">
                            <div className="flex rounded-lg border border-neutral-300 focus-within:ring-2 focus-within:ring-sky-500">
                              <span className="flex items-center rounded-l-lg bg-neutral-100 px-2 text-sm text-neutral-500 border-r border-neutral-300 select-none">
                                R
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={getPriceValue(s.name, v.name)}
                                onChange={e => handlePriceChange(s.name, v.name, e.target.value)}
                                placeholder="0"
                                className="w-16 rounded-r-lg px-2 py-2 text-base text-neutral-900 focus:outline-none bg-white"
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {priceError && (
              <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {priceError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSavePrices}
              disabled={isSavingPrices || activeServices.length === 0 || activeVehicles.length === 0}
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
            >
              {isSavingPrices && (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Save all prices
            </button>
          </div>
        </div>

        {/* ── 5. Discount Rules ────────────────────────────── */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Discount Rules</h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Apply a percentage discount to all prices on a given day of the week.
              </p>
            </div>

            {discountDrafts.length === 0 && !showAddRule ? (
              <p className="text-sm text-neutral-500">No discount rules configured.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {discountDrafts.map((draft, i) => (
                  <li key={i} className="py-4 first:pt-0 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">
                          Rule name
                        </label>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={e => updateDiscountDraft(i, 'name', e.target.value)}
                          placeholder="e.g. Pensioner Tuesday"
                          className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">
                          Day of week
                        </label>
                        <select
                          value={draft.day_of_week}
                          onChange={e =>
                            updateDiscountDraft(
                              i,
                              'day_of_week',
                              parseInt(e.target.value, 10) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                            )
                          }
                          className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          {DAY_OPTIONS.map(d => (
                            <option key={d} value={d}>
                              {DAY_LABELS[d]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-neutral-500">Discount %</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={draft.percentage}
                          onChange={e => updateDiscountDraft(i, 'percentage', e.target.value)}
                          placeholder="20"
                          className="w-16 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-base text-center text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => updateDiscountDraft(i, 'active', !draft.active)}
                        aria-pressed={draft.active}
                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px] ${
                          draft.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {draft.active ? 'Active' : 'Inactive'}
                      </button>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveRule(i)}
                          disabled={isSavingDiscounts}
                          className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
                        >
                          {isSavingDiscounts ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            'Save'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(i)}
                          disabled={isSavingDiscounts}
                          className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-red-50 hover:border-red-300 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 min-h-[44px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Add rule form */}
            {showAddRule && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 space-y-3">
                <p className="text-sm font-medium text-sky-900">New discount rule</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Rule name
                    </label>
                    <input
                      type="text"
                      value={newRuleDraft.name}
                      onChange={e => setNewRuleDraft(d => ({ ...d, name: e.target.value }))}
                      placeholder="e.g. Pensioner Tuesday"
                      className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Day of week
                    </label>
                    <select
                      value={newRuleDraft.day_of_week}
                      onChange={e =>
                        setNewRuleDraft(d => ({
                          ...d,
                          day_of_week: parseInt(e.target.value, 10) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                        }))
                      }
                      className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {DAY_OPTIONS.map(d => (
                        <option key={d} value={d}>
                          {DAY_LABELS[d]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-neutral-600">Discount %</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newRuleDraft.percentage}
                      onChange={e => setNewRuleDraft(d => ({ ...d, percentage: e.target.value }))}
                      placeholder="20"
                      className="w-16 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-base text-center text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewRuleDraft(d => ({ ...d, active: !d.active }))}
                    aria-pressed={newRuleDraft.active}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px] ${
                      newRuleDraft.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {newRuleDraft.active ? 'Active' : 'Inactive'}
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddRule}
                      disabled={isSavingDiscounts}
                      className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
                    >
                      {isSavingDiscounts ? (
                        <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : null}
                      Add rule
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddRule(false)
                        setDiscountError('')
                        setNewRuleDraft({ name: '', day_of_week: 1, percentage: '', active: true })
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {discountError && (
              <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {discountError}
              </div>
            )}

            {!showAddRule && (
              <button
                type="button"
                onClick={() => { setShowAddRule(true); setDiscountError('') }}
                className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
              >
                Add rule
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Success toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg md:bottom-6"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
