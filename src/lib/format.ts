export function formatZAR(amount: number): string {
  const parts = amount.toFixed(2).split('.')
  const integer = parts[0] ?? '0'
  const decimal = parts[1] ?? '00'
  const withThousands = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `R${withThousands}.${decimal}`
}
