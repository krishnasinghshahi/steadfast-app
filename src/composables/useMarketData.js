import {
  BASE_URL,
  selectedMasterSymbol,
  niftyPrice,
  bankNiftyPrice,
  finniftyPrice,
  midcpniftyPrice,
  sensexPrice,
  bankexPrice,
  socket,
  ltpCallbacks,
  callStrikes,
  putStrikes,
  allSymbolsData,
  selectedExpiry,
  expiryDates,
  dataFetched,
  selectedPutStrike,
  selectedCallStrike,
  defaultCallSecurityId,
  defaultPutSecurityId,
  synchronizeOnLoad,
  callStrikeOffset,
  putStrikeOffset
} from '@/stores/globalStore'

// Trade Configuration Composables
import { getExchangeSegment } from '@/composables/useTradeConfiguration'

// WebSocket Composables
import { subscribeToOptions } from '@/composables/useWebSocket'

export const fetchTradingInstruments = async () => {
  const masterSymbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX']

  for (const symbol of masterSymbols) {
    try {
      let exchangeSymbol

      // Set the correct exchange symbol
      if (['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(symbol)) {
        exchangeSymbol = 'NFO'
      } else if (['SENSEX', 'BANKEX'].includes(symbol)) {
        exchangeSymbol = 'BFO'
      } else {
        throw new Error(`Unknown symbol: ${symbol}`)
      }

      // Use common endpoint for both brokers
      const response = await fetch(
        `${BASE_URL}/symbols?exchangeSymbol=${exchangeSymbol}&masterSymbol=${symbol}`
      )

      const data = await response.json()

      allSymbolsData[symbol] = {
        expiryDates: data.expiryDates || [],
        callStrikes: Array.isArray(data.callStrikes)
          ? data.callStrikes
              .sort((a, b) => parseInt(a.strikePrice) - parseInt(b.strikePrice))
              .map((strike) => ({ ...strike, strikePrice: parseInt(strike.strikePrice) }))
          : [],
        putStrikes: Array.isArray(data.putStrikes)
          ? data.putStrikes
              .sort((a, b) => parseInt(a.strikePrice) - parseInt(b.strikePrice))
              .map((strike) => ({ ...strike, strikePrice: parseInt(strike.strikePrice) }))
          : []
      }

      // Set initial price for each symbol
      const priceKey = `${symbol.toLowerCase()}Price`
      if (priceKey in window && window[priceKey].value === 'N/A') {
        window[priceKey].value = getInitialPrice(symbol)
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error)
      allSymbolsData[symbol] = { expiryDates: [], callStrikes: [], putStrikes: [] }
    }
  }

  // Update the reactive properties for the currently selected symbol
  updateSymbolData(selectedMasterSymbol.value)
  updateStrikesForExpiry(selectedExpiry.value)
  dataFetched.value = true

  // Cache the fetched data
  localStorage.setItem('cachedInstrumentsData', JSON.stringify(allSymbolsData))
}

export const updateSymbolData = (symbol) => {
  if (allSymbolsData[symbol]) {
    expiryDates.value = allSymbolsData[symbol].expiryDates
    callStrikes.value = allSymbolsData[symbol].callStrikes
    putStrikes.value = allSymbolsData[symbol].putStrikes
  } else {
    console.error(`No data found for ${symbol}`)
  }
}
export const getMasterSymbolPrice = () => {
  switch (selectedMasterSymbol.value) {
    case 'NIFTY':
      return parseFloat(niftyPrice.value)
    case 'BANKNIFTY':
      return parseFloat(bankNiftyPrice.value)
    case 'FINNIFTY':
      return parseFloat(finniftyPrice.value)
    case 'MIDCPNIFTY':
      return parseFloat(midcpniftyPrice.value)
    case 'SENSEX':
      return parseFloat(sensexPrice.value)
    case 'BANKEX':
      return parseFloat(bankexPrice.value)
    default:
      return 0
  }
}
export const subscribeToLTP = (securityId, callback) => {
  if (socket.value && socket.value.readyState === WebSocket.OPEN) {
    const exchangeSegment = getExchangeSegment()
    const symbolToSubscribe = `${exchangeSegment}|${securityId}`
    const data = {
      action: 'subscribe',
      symbols: [symbolToSubscribe]
    }
    socket.value.send(JSON.stringify(data))

    // Store the callback for this security ID
    ltpCallbacks.value[securityId] = callback
  }
}

export const updateStrikesForExpiry = (expiryDate, forceUpdate = false) => {
  let filteredCallStrikes, filteredPutStrikes

  if (allSymbolsData[selectedMasterSymbol.value]) {
    filteredCallStrikes = allSymbolsData[selectedMasterSymbol.value].callStrikes.filter(
      (strike) => strike.expiryDate === expiryDate
    )
    filteredPutStrikes = allSymbolsData[selectedMasterSymbol.value].putStrikes.filter(
      (strike) => strike.expiryDate === expiryDate
    )

    const uniqueStrikePrices = [
      ...new Set(
        [...filteredCallStrikes, ...filteredPutStrikes].map((strike) => strike.strikePrice)
      )
    ].sort((a, b) => a - b)

    filteredCallStrikes = uniqueStrikePrices.map(
      (strikePrice) =>
        filteredCallStrikes.find((strike) => strike.strikePrice === strikePrice) || {
          strikePrice,
          expiryDate,
          securityId: null,
          tradingSymbol: null
        }
    )
    filteredPutStrikes = uniqueStrikePrices.map(
      (strikePrice) =>
        filteredPutStrikes.find((strike) => strike.strikePrice === strikePrice) || {
          strikePrice,
          expiryDate,
          securityId: null,
          tradingSymbol: null
        }
    )

    callStrikes.value = filteredCallStrikes
    putStrikes.value = filteredPutStrikes
  } else {
    console.error(`No data found for ${selectedMasterSymbol.value}`)
    return
  }

  if (
    forceUpdate ||
    !selectedCallStrike.value.securityId ||
    !selectedPutStrike.value.securityId ||
    selectedCallStrike.value.expiryDate !== expiryDate
  ) {
    let currentPrice
    switch (selectedMasterSymbol.value) {
      case 'NIFTY':
        currentPrice = parseFloat(niftyPrice.value)
        break
      case 'BANKNIFTY':
        currentPrice = parseFloat(bankNiftyPrice.value)
        break
      case 'FINNIFTY':
        currentPrice = parseFloat(finniftyPrice.value)
        break
      case 'MIDCPNIFTY':
        currentPrice = parseFloat(midcpniftyPrice.value)
        break
      case 'SENSEX':
        currentPrice = parseFloat(sensexPrice.value)
        break
      case 'BANKEX':
        currentPrice = parseFloat(bankexPrice.value)
        break
      default:
        console.error(`Unknown master symbol: ${selectedMasterSymbol.value}`)
        return
    }

    if (currentPrice && !isNaN(currentPrice) && filteredCallStrikes.length > 0) {
      const nearestStrikeIndex = filteredCallStrikes.findIndex(
        (strike) =>
          Math.abs(strike.strikePrice - currentPrice) ===
          Math.min(...filteredCallStrikes.map((s) => Math.abs(s.strikePrice - currentPrice)))
      )

      const callOffsetIndex = nearestStrikeIndex - parseInt(callStrikeOffset.value)
      const putOffsetIndex = nearestStrikeIndex + parseInt(putStrikeOffset.value)

      selectedCallStrike.value = filteredCallStrikes[callOffsetIndex] || {}
      selectedPutStrike.value = filteredPutStrikes[putOffsetIndex] || {}
    }

    if (synchronizeOnLoad.value) {
      synchronizeStrikes()
      synchronizeOnLoad.value = false
    }

    defaultCallSecurityId.value = selectedCallStrike.value.securityId || 'N/A'
    defaultPutSecurityId.value = selectedPutStrike.value.securityId || 'N/A'
  }
}
export const synchronizeStrikes = () => {
  synchronizeCallStrikes()
  synchronizePutStrikes()
  updateSecurityIds()
  subscribeToOptions()
}
export const synchronizeCallStrikes = () => {
  if (selectedPutStrike.value && selectedPutStrike.value.strikePrice) {
    const matchingCallStrike = callStrikes.value.find(
      (strike) => strike.strikePrice === selectedPutStrike.value.strikePrice
    )
    if (matchingCallStrike) {
      selectedCallStrike.value = matchingCallStrike
    } else {
      selectedCallStrike.value = {}
    }
  }
  updateSecurityIds()
}

export const synchronizePutStrikes = () => {
  if (selectedCallStrike.value && selectedCallStrike.value.strikePrice) {
    const matchingPutStrike = putStrikes.value.find(
      (strike) => strike.strikePrice === selectedCallStrike.value.strikePrice
    )
    if (matchingPutStrike) {
      selectedPutStrike.value = matchingPutStrike
    } else {
      selectedPutStrike.value = {}
    }
  }
  updateSecurityIds()
}
export const updateSecurityIds = () => {
  // console.log('Updating Security IDs');
  defaultCallSecurityId.value = selectedCallStrike.value.securityId || 'N/A'
  defaultPutSecurityId.value = selectedPutStrike.value.securityId || 'N/A'
}
