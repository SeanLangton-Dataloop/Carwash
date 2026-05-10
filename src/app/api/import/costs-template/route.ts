export async function GET() {
  const csv = [
    'date,category,description,amount,notes',
    '2024-01-15,cos,Cleaning chemicals,350.00,Monthly supply order',
    '2024-01-15,capex,Pressure washer pump replacement,2500.00,',
  ].join('\n') + '\n'

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="costs-import-template.csv"',
    },
  })
}
