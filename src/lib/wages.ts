import type { PayType, WageSummary } from './types'

export type { WageSummary }

export interface StaffForWages {
  id: string
  full_name: string
  role: string
  pay_type: PayType
  daily_rate: number
  monthly_salary: number | null
}

export interface AttendanceRecord {
  staff_id: string
  date: string
  present: boolean
}

export function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function formatDisplayDate(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const parts = dateStr.split('-')
  const year = parts[0] ?? ''
  const month = parseInt(parts[1] ?? '1', 10)
  const day = parseInt(parts[2] ?? '1', 10)
  return `${day} ${months[month - 1] ?? ''} ${year}`
}

export function calculateWeeklyWages(
  staff: StaffForWages[],
  attendance: AttendanceRecord[],
  weekStart: string,
  weekEnd: string,
): WageSummary[] {
  return staff.map(member => {
    const daysWorked = attendance.filter(
      a => a.staff_id === member.id && a.present && a.date >= weekStart && a.date <= weekEnd,
    ).length

    const isSalaried = member.pay_type === 'monthly_salary'
    const monthlySalary = member.monthly_salary ?? 0
    const totalWage = isSalaried ? monthlySalary : daysWorked * member.daily_rate

    return {
      staffId: member.id,
      name: member.full_name,
      role: member.role,
      payType: member.pay_type,
      dailyRate: isSalaried ? 0 : member.daily_rate,
      monthlySalary: isSalaried ? monthlySalary : 0,
      daysWorked,
      totalWage,
    }
  })
}
