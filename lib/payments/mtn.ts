import axios from 'axios'

interface MTNPaymentRequest {
  amount: string
  currency: string
  externalId: string
  payer: {
    partyIdType: string
    partyId: string
  }
  payerMessage: string
  payeeNote: string
}

interface MTNPaymentResponse {
  financialTransactionId: string
  externalId: string
  amount: string
  currency: string
  payer: {
    partyIdType: string
    partyId: string
  }
  payerMessage: string
  payeeNote: string
  status: string
}

export class MTNMobileMoney {
  private apiKey: string
  private apiSecret: string
  private environment: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.MTN_API_KEY || ''
    this.apiSecret = process.env.MTN_API_SECRET || ''
    this.environment = process.env.MTN_ENVIRONMENT || 'sandbox'
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.mtn.com/v1' 
      : 'https://sandbox.momodeveloper.mtn.com/v1'
  }

  private async getAccessToken(): Promise<string> {
    // In production, implement proper OAuth2 flow
    // For now, using API key directly (sandbox mode)
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Ocp-Apim-Subscription-Key': this.apiKey,
          }
        }
      )
      return response.data.access_token
    } catch (error) {
      console.error('MTN token error:', error)
      throw new Error('Failed to get MTN access token')
    }
  }

  async requestPayment(
    phoneNumber: string,
    amount: number,
    externalId: string,
    payerMessage: string = 'Internet voucher payment',
    payeeNote: string = 'Voucher purchase'
  ): Promise<MTNPaymentResponse> {
    try {
      const token = await this.getAccessToken()
      
      const request: MTNPaymentRequest = {
        amount: amount.toFixed(2),
        currency: 'UGX',
        externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber.replace(/^\+/, ''), // Remove + if present
        },
        payerMessage,
        payeeNote,
      }

      const response = await axios.post(
        `${this.baseUrl}/collection/v1_0/requesttopay`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.environment === 'production' ? 'mtnuganda' : 'sandbox',
            'Content-Type': 'application/json',
            'X-Reference-Id': externalId,
          }
        }
      )

      return response.data
    } catch (error: any) {
      console.error('MTN payment error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'MTN payment request failed')
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<any> {
    try {
      const token = await this.getAccessToken()
      
      const response = await axios.get(
        `${this.baseUrl}/collection/v1_0/requesttopay/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.environment === 'production' ? 'mtnuganda' : 'sandbox',
          }
        }
      )

      return response.data
    } catch (error: any) {
      console.error('MTN status check error:', error.response?.data || error.message)
      throw new Error('Failed to check payment status')
    }
  }
}

