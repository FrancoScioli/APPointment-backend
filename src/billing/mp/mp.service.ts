import axios, { AxiosError } from 'axios'
import { Injectable } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'

const MP_BASE = 'https://api.mercadopago.com'

@Injectable()
export class MpService {
  private token = process.env.MP_ACCESS_TOKEN!
  private headers = { Authorization: `Bearer ${this.token}` }

  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {
    axios.interceptors.response.use(undefined, (err: AxiosError<any>) => {
      // Logueamos de forma uniforme los errores de MP
      this.logger.error('MP API error', {
        ctx: 'mp.api',
        url: err.config?.url,
        method: err.config?.method,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      })
      return Promise.reject(err)
    })
  }

  async createPlan(input: {
    reason: string; frequency_type: 'months'; frequency: number;
    transaction_amount: number; currency_id: 'ARS'|'USD'; trial_period_days?: number
  }) {
    const { data } = await axios.post(`${MP_BASE}/preapproval_plan`, input, { headers: this.headers })
    this.logger.info('MP plan created', { ctx: 'mp.createPlan', id: data?.id, reason: input.reason })
    return data
  }

  async createSubscription(preapproval: {
    preapproval_plan_id: string; payer_email: string; back_url?: string; auto_recurring?: any
  }) {
    const { data } = await axios.post(`${MP_BASE}/preapproval`, preapproval, { headers: this.headers })
    this.logger.info('MP subscription created', {
      ctx: 'mp.createSubscription', id: data?.id, plan: preapproval.preapproval_plan_id
    })
    return data
  }

  async getSubscription(id: string) {
    const { data } = await axios.get(`${MP_BASE}/preapproval/${id}`, { headers: this.headers })
    this.logger.info('MP subscription fetched', { ctx: 'mp.getSubscription', id })
    return data
  }
}
