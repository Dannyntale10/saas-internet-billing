import axios from 'axios'

interface AirtelPaymentRequest {
  amount: string
  currency: string
  reference: string
  transactionId: string
  msisdn: string
}

interface AirtelPaymentResponse {
  transactionId: string
  status: string
  message: string
  data?: any
}

export class AirtelMoney {
  private apiKey: string
  private apiSecret: string
  private environment: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.AIRTEL_API_KEY || ''
    this.apiSecret = process.env.AIRTEL_API_SECRET || ''
    this.environment = process.env.AIRTEL_ENVIRONMENT || 'sandbox'
    this.baseUrl = this.environment === 'production'
      ? 'https://openapiuat.airtel.africa'
      : 'https://openapiuat.airtel.africa' // Airtel sandbox URL
  }

  private async getAccessToken(): Promise<string> {
    try {
      const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')
      
      const response = await axios.post(
        `${this.baseUrl}/auth/oauth2/token`,
        {
          grant_type: 'client_credentials',
        },
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
          }
        }
      )
      
      return response.data.access_token
    } catch (error) {
      console.error('Airtel token error:', error)
      throw new Error('Failed to get Airtel access token')
    }
  }

  async requestPayment(
    phoneNumber: string,
    amount: number,
    reference: string,
    transactionId: string
  ): Promise<AirtelPaymentResponse> {
    try {
      const token = await this.getAccessToken()
      
      const request: AirtelPaymentRequest = {
        amount: amount.toFixed(2),
        currency: 'UGX',
        reference,
        transactionId,
        msisdn: phoneNumber.replace(/^\+/, ''), // Remove + if present
      }

      const response = await axios.post(
        `${this.baseUrl}/merchant/v1/payments`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Country': 'UG',
            'X-Currency': 'UGX',
          }
        }
      )

      return response.data
    } catch (error: any) {
      console.error('Airtel payment error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Airtel payment request failed')
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<any> {
    try {
      const token = await this.getAccessToken()
      
      const response = await axios.get(
        `${this.baseUrl}/standard/v1/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Country': 'UG',
            'X-Currency': 'UGX',
          }
        }
      )

      return response.data
    } catch (error: any) {
      console.error('Airtel status check error:', error.response?.data || error.message)
      throw new Error('Failed to check payment status')
    }
  }
}

