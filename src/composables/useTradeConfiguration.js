import { computed } from 'vue'

import {
  exchangeSymbols,
  selectedBroker,
  selectedExchange,
  lotsPerSymbol,
  selectedMasterSymbol,
  selectedQuantity,
  availableQuantities,
  quantities
} from '@/stores/globalStore'

export const getExchangeSegment = () => {
  if (!selectedBroker.value || !selectedExchange.value) {
    throw new Error('Broker or exchange not selected')
  }

  // Check if the symbol exists in the selected exchange
  const symbolExistsInExchange = exchangeSymbols.value[selectedExchange.value]?.includes(
    selectedMasterSymbol.value
  )
  if (!symbolExistsInExchange) {
    throw new Error(
      `Symbol ${selectedMasterSymbol.value} is not valid for exchange ${selectedExchange.value}`
    )
  }

  if (
    selectedBroker.value?.brokerName === 'Flattrade' ||
    selectedBroker.value?.brokerName === 'Shoonya'
  ) {
    switch (selectedExchange.value) {
      case 'NSE':
        return 'NFO'
      case 'BSE':
        return 'BFO'
      default:
        throw new Error(`Exchange ${selectedExchange.value} is not supported for Flattrade`)
    }
  } else {
    throw new Error('Unsupported broker')
  }
}

export const selectedLots = computed({
  get: () => lotsPerSymbol.value[selectedMasterSymbol.value] || 1,
  set: (value) => {
    lotsPerSymbol.value[selectedMasterSymbol.value] = value
    saveLots()
  }
})

export const getProductTypeValue = (productType) => {
  if (selectedBroker.value?.brokerName === 'Flattrade') {
    return productType === 'Intraday' ? 'I' : 'M'
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    return productType === 'Intraday' ? 'I' : 'M'
  }
  return productType
}

export const getTransactionType = (type) => {
  if (selectedBroker.value?.brokerName === 'Flattrade') {
    return type === 'BUY' ? 'B' : 'S'
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    return type === 'BUY' ? 'B' : 'S'
  }
  return type
}

export const productTypes = computed(() => {
  if (selectedBroker.value?.brokerName === 'Flattrade') {
    return ['Intraday', 'Margin']
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    return ['Intraday', 'Margin']
  }
  return []
})

export const updateAvailableQuantities = () => {
  const instrument = quantities.value[selectedMasterSymbol.value]
  if (instrument) {
    availableQuantities.value = Array.from({ length: instrument.maxLots }, (_, i) => ({
      lots: i + 1,
      quantity: (i + 1) * instrument.lotSize
    }))
  } else {
    availableQuantities.value = []
  }
  // Ensure selectedQuantity is in the available quantities list
  if (!availableQuantities.value.some((q) => q.quantity === selectedQuantity.value)) {
    selectedQuantity.value = availableQuantities.value[0]?.quantity || 0
  }
}

export const orderTypes = computed(() => {
  if (
    selectedBroker.value?.brokerName === 'Flattrade' ||
    selectedBroker.value?.brokerName === 'Shoonya'
  ) {
    return ['MKT', 'LMT', 'LMT_LTP']
  }
  return []
})
export const displayOrderTypes = computed(() => {
  return orderTypes.value.map((type) => {
    switch (type) {
      case 'MKT':
        return 'Market'
      case 'LMT':
        return 'Limit'
      case 'LMT_LTP':
        return 'Limit at LTP'
      default:
        return type
    }
  })
})
export const saveLots = () => {
  localStorage.setItem('lotsPerSymbol', JSON.stringify(lotsPerSymbol.value))
}
export const loadLots = () => {
  const savedLots = localStorage.getItem('lotsPerSymbol')
  if (savedLots) {
    lotsPerSymbol.value = JSON.parse(savedLots)
  }
}
export const updateSelectedQuantity = () => {
  const instrument = quantities.value[selectedMasterSymbol.value]
  if (instrument) {
    const maxLots = instrument.maxLots // Use maxLots from the instrument
    const lots = Math.min(Math.max(1, selectedLots.value), maxLots)
    lotsPerSymbol.value[selectedMasterSymbol.value] = lots
    selectedQuantity.value = lots * instrument.lotSize
    saveLots()
  }
}
