export type PortfolioTrade = {
  pair: string
  side: string
  price: number
  amount: number
  fee: number
  createdAt: string
}

export type PortfolioBalance = {
  symbol: string
  available: number
  locked: number
}

export type PortfolioQuote = {
  price: number
  change24hPercent: number | null
}

export type PortfolioSummary = {
  totalValue: number | null
  availableCash: number | null
  invested: number | null
  unrealised: number | null
  realised: number | null
  volume: number | null
  dayMove: number | null
  dayChangePercent: number | null
  marks: Map<string, { averageDisplay: number | null; unrealisedDisplay: number | null }>
  uncosted: boolean
}

const quoteSymbol = 'USDT'

function finite(value: number) {
  return Number.isFinite(value) ? value : null
}

export function summarizePortfolio(
  balances: PortfolioBalance[],
  trades: PortfolioTrade[],
  prices: Map<string, PortfolioQuote>,
): PortfolioSummary {
  const empty: PortfolioSummary = {
    totalValue: null,
    availableCash: null,
    invested: null,
    unrealised: null,
    realised: null,
    volume: null,
    dayMove: null,
    dayChangePercent: null,
    marks: new Map(),
    uncosted: false,
  }
  if (balances.length === 0 && trades.length === 0) return empty

  const books = new Map<string, { quantity: number; cost: number; realised: number }>()
  const ordered = [...trades].sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  let volumeQuote = 0
  let traded = false

  for (const trade of ordered) {
    const [base, quote] = trade.pair.split('/')
    if (!base || quote !== quoteSymbol) continue
    if (!(trade.price > 0) || !(trade.amount > 0) || trade.fee < 0) continue
    traded = true
    volumeQuote += trade.price * trade.amount
    const book = books.get(base) ?? { quantity: 0, cost: 0, realised: 0 }
    if (trade.side === 'buy') {
      book.cost += trade.price * trade.amount + trade.fee
      book.quantity += trade.amount
    } else if (trade.side === 'sell' && book.quantity > 0) {
      const covered = Math.min(trade.amount, book.quantity)
      const average = book.cost / book.quantity
      const soldCost = average * covered
      const proceeds = (trade.price * trade.amount - trade.fee) * (covered / trade.amount)
      book.realised += proceeds - soldCost
      book.cost -= soldCost
      book.quantity -= covered
      if (covered < trade.amount) empty.uncosted = true
    } else if (trade.side === 'sell') {
      empty.uncosted = true
    }
    books.set(base, book)
  }

  const quotePrice = prices.get(quoteSymbol)?.price
  const quoteReady = quotePrice !== undefined && quotePrice > 0
  let total = 0
  let pricedCount = 0
  let investedQuote = 0
  let unrealisedQuote = 0
  let realisedQuote = 0
  let costed = false
  let unrealisedComplete = true
  let dayMove = 0
  let dayKnown = 0
  let dayMissing = false

  for (const balance of balances) {
    const quantity = balance.available + balance.locked
    const quote = prices.get(balance.symbol)
    if (quote && quote.price > 0 && quantity > 0) {
      total += quantity * quote.price
      pricedCount += 1
      if (quote.change24hPercent === null) dayMissing = true
      else {
        const previous = quote.price / (1 + quote.change24hPercent / 100)
        dayMove += quantity * (quote.price - previous)
        dayKnown += 1
      }
    }
    if (balance.symbol === quoteSymbol) continue
    const book = books.get(balance.symbol)
    if (!book || book.quantity <= 0 || book.cost <= 0) {
      if (quantity > 0) empty.uncosted = true
      empty.marks.set(balance.symbol, { averageDisplay: null, unrealisedDisplay: null })
      continue
    }
    let openQuantity = book.quantity
    let openCost = book.cost
    if (quantity + 1e-12 < openQuantity) {
      const ratio = Math.max(quantity, 0) / openQuantity
      openCost *= ratio
      openQuantity = quantity
    } else if (quantity > openQuantity + 1e-12) {
      empty.uncosted = true
    }
    if (openQuantity <= 0 || openCost <= 0) {
      empty.marks.set(balance.symbol, { averageDisplay: null, unrealisedDisplay: null })
      continue
    }
    const averageQuote = openCost / openQuantity
    const currentQuote = quoteReady && quote && quote.price > 0 ? quote.price / quotePrice : null
    const unrealised = currentQuote === null ? null : (currentQuote - averageQuote) * openQuantity
    empty.marks.set(balance.symbol, {
      averageDisplay: quoteReady ? averageQuote * quotePrice : null,
      unrealisedDisplay: unrealised !== null && quoteReady ? unrealised * quotePrice : null,
    })
    investedQuote += openCost
    costed = true
    if (unrealised === null) unrealisedComplete = false
    else unrealisedQuote += unrealised
  }

  realisedQuote = [...books.values()].reduce((sum, book) => sum + book.realised, 0)

  const cash = balances.find((balance) => balance.symbol === quoteSymbol)
  return {
    totalValue: pricedCount > 0 ? total : null,
    availableCash: quoteReady ? (cash?.available ?? 0) * quotePrice : null,
    invested: costed && quoteReady ? investedQuote * quotePrice : null,
    unrealised: costed && quoteReady && unrealisedComplete ? unrealisedQuote : null,
    realised: traded && quoteReady ? realisedQuote * quotePrice : null,
    volume: traded && quoteReady ? volumeQuote * quotePrice : null,
    dayMove: dayKnown > 0 && !dayMissing ? dayMove : null,
    dayChangePercent: dayKnown > 0 && !dayMissing && total - dayMove > 0 ? (dayMove / (total - dayMove)) * 100 : null,
    marks: empty.marks,
    uncosted: empty.uncosted,
  }
}

export function basketSeries(
  holdings: { symbol: string; quantity: number }[],
  histories: { symbol: string; points: { time: number; price: number }[] }[],
) {
  const hour = 60 * 60 * 1000
  const series = histories.map((history) => {
    const buckets = new Map<number, number>()
    for (const point of history.points) {
      if (!(point.price > 0)) continue
      buckets.set(Math.floor(point.time / hour) * hour, point.price)
    }
    return { symbol: history.symbol, buckets }
  })
  const times = [...new Set(series.flatMap((item) => [...item.buckets.keys()]))].sort((left, right) => left - right)
  const last = new Map<string, number>()
  const points: { time: number; value: number }[] = []
  for (const time of times) {
    let ready = true
    let value = 0
    for (const holding of holdings) {
      const row = series.find((item) => item.symbol === holding.symbol)
      const next = row?.buckets.get(time)
      if (next !== undefined) last.set(holding.symbol, next)
      const price = last.get(holding.symbol)
      if (price === undefined) {
        ready = false
        break
      }
      value += holding.quantity * price
    }
    if (ready) points.push({ time, value })
  }
  return points.filter((point) => finite(point.value) !== null)
}
