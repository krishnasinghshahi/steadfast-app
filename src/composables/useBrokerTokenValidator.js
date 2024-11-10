import axios from 'axios'
import { tokenStatus, supportedBrokers } from '@/stores/globalStore'

const flattradeFundLimits = async () => {
  const jKey = localStorage.getItem('FLATTRADE_API_TOKEN')

  // Find the Flattrade broker details
  let clientId = null
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('broker_Flattrade_')) {
      const brokerDetails = JSON.parse(localStorage.getItem(key))
      clientId = brokerDetails.clientId
      break
    }
  }

  if (!jKey || !clientId) {
    throw new Error('Token or client ID is missing for Flattrade.')
  }

  const jData = JSON.stringify({ uid: clientId, actid: clientId })
  const payload = `jKey=${jKey}&jData=${jData}`

  try {
    const res = await axios.post('https://piconnect.flattrade.in/PiConnectTP/Limits', payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return res.data
  } catch (error) {
    throw new Error('Error fetching Flattrade fund limits: ' + error.message)
  }
}

const shoonyaFundLimits = async () => {
  const jKey = localStorage.getItem('SHOONYA_API_TOKEN')

  // Find the Shoonya broker details
  let clientId = null
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('broker_Shoonya_')) {
      const brokerDetails = JSON.parse(localStorage.getItem(key))
      clientId = brokerDetails.clientId
      break
    }
  }

  if (!jKey || !clientId) {
    throw new Error('Token or client ID is missing for Shoonya.')
  }

  const jData = JSON.stringify({ uid: clientId, actid: clientId })
  const payload = `jKey=${jKey}&jData=${jData}`

  try {
    const res = await axios.post('https://api.shoonya.com/NorenWClientTP/Limits', payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return res.data
  } catch (error) {
    throw new Error('Error fetching Shoonya fund limits: ' + error.message)
  }
}

const validateToken = async (brokerName) => {
  switch (brokerName) {
    case 'Flattrade':
      await flattradeFundLimits()
      tokenStatus.Flattrade = 'valid'
      break
    case 'Shoonya':
      await shoonyaFundLimits()
      tokenStatus.Shoonya = 'valid'
      break
    default:
      throw new Warning('No broker valid broker found')
  }
}

const checkAllTokens = async () => {
  // First, get list of configured brokers
  const configuredBrokers = supportedBrokers.filter((broker) => {
    // Check if this broker exists in localStorage
    return Object.keys(localStorage).some((key) => key.startsWith(`broker_${broker}_`))
  })

  // Only validate tokens for configured brokers
  for (const broker of configuredBrokers) {
    try {
      await validateToken(broker)
    } catch (error) {
      console.warn(`Failed to validate token for ${broker}:`, error)
      tokenStatus[broker] = 'invalid'
    }
  }
}

const getBrokerStatus = (brokerName) => {
  // Find the broker details
  let brokerDetails = null
  let brokerToken = null
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith(`broker_${brokerName}_`)) {
      brokerDetails = JSON.parse(localStorage.getItem(key))
      brokerToken = localStorage.getItem(`${brokerName.toUpperCase()}_API_TOKEN`)
      break
    }
  }

  if (!brokerDetails) {
    return 'Broker not found'
  }

  if (!brokerToken) {
    return 'Token missing'
  } else {
    return tokenStatus[brokerName] || 'unknown'
  }
}

export { validateToken, checkAllTokens, getBrokerStatus, tokenStatus }
