export async function GET() {
  const csv = [
    'date,service_type,quantity,unit_price,line_total,day_total_income,card_total,cash_total,wash_count',
    '2024-01-15,Full Wash,5,150.00,750.00,990.00,490.00,500.00,8',
    '2024-01-15,Mini Wash,3,80.00,240.00,,,,',
    '2024-01-16,Full Wash,4,150.00,600.00,600.00,300.00,300.00,4',
  ].join('\n') + '\n'

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="revenue-import-template.csv"',
    },
  })
}
