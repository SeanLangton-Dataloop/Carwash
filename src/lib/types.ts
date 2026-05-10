// Discriminated unions
export type UserRole = 'admin' | 'manager'
export type CostCategory = 'cos' | 'capex'
export type StaffRole = 'owner' | 'supervisor' | 'washer'

export type Site = {
  id: string
  name: string
  owner_id: string
  timezone: string
  location_name: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

export type DailyRevenue = {
  id: string
  site_id: string
  date: string
  total_revenue: number
  cash_total: number
  card_total: number
  wash_count: number
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type RevenueLineItem = {
  id: string
  daily_revenue_id: string
  site_id: string
  service_type: string
  vehicle_type: string
  quantity: number
  unit_price: number
  line_total: number
}

export type Cost = {
  id: string
  site_id: string
  date: string
  amount: number
  category: CostCategory
  description: string
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type Staff = {
  id: string
  site_id: string
  full_name: string
  daily_rate: number
  role: StaffRole
  is_active: boolean
  phone: string | null
  created_at: string
  updated_at: string
}

export type Attendance = {
  id: string
  site_id: string
  staff_id: string
  date: string
  present: boolean
  created_by: string
  created_at: string
}

export type DailyWeather = {
  id: string
  site_id: string
  date: string
  weather_code: number
  weather_label: string
  temp_max_c: number
  fetched_at: string
}

export type AppConfig = {
  key: string
  value: unknown
  site_id: string
  updated_at: string
}

export type Profile = {
  id: string
  full_name: string
  email: string
  role: UserRole
  site_id: string
  created_at: string
  updated_at: string
}

// Price matrix key format: "ServiceName|VehicleType"
export type PriceMatrix = Record<string, number>

export type DiscountRule = {
  name: string
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6
  percentage: number
  active: boolean
}

export type ServiceType = { name: string; active: boolean }
export type VehicleType = { name: string; active: boolean }

export type PayType = 'daily_rate' | 'monthly_salary'

export type WageSummary = {
  staffId: string
  name: string
  role: string
  payType: PayType
  dailyRate: number      // 0 when pay_type = 'monthly_salary'
  monthlySalary: number  // 0 when pay_type = 'daily_rate'
  daysWorked: number     // always tracked, even for salaried staff
  totalWage: number      // dailyRate × daysWorked for daily; monthlySalary for salaried
}
