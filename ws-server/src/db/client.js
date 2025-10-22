import { config } from '../config.js'

/**
 * Universal Database Client (KISS Architecture)
 * 
 * Only executes queries - no specific operations
 * Templates handle all the logic
 */

class DatabaseClient {
  constructor() {
    this.graphqlEndpoint = `${config.supabase.url}/graphql/v1`
    this.apiKey = config.supabase.serviceKey
  }

  /**
   * Universal query execution (KISS)
   */
  async executeQuery(query, variables = {}, userToken = null) {
    const headers = {
      'Content-Type': 'application/json',
      'apiKey': this.apiKey
    }
    
    // Add user token if provided for authenticated operations
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`
    }

    const response = await fetch(this.graphqlEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    })

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
    }

    return result.data
  }

}

// Export singleton instance
export const dbClient = new DatabaseClient()

