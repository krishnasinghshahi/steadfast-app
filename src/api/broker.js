import axios from 'axios'

const baseURL = import.meta.env.VITE_BASE_URL

export const updateSelectedBrokerOnServer = async (broker) => {
  // Return early if no broker or invalid broker object
  if (!broker || !broker.brokerName || !broker.clientId) {
    console.log('No valid broker to set')
    return null
  }

  try {
    const response = await axios.post(`${baseURL}/set-broker`, { broker })
    console.log(response.data.message)
    return response.data
  } catch (error) {
    console.error('Error setting broker:', error)
    throw error
  }
}
