import type { AxiosInstance } from 'axios'

import type { Order } from '@domain/entities/order'
import type { Quote } from '@domain/entities/quote'
import type { Receipt } from '@domain/entities/receipt'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'
import type { CreateOrderPayload, OrderGateway } from '@application/ports/gateways/order.gateway'
import type { QuoteGateway } from '@application/ports/gateways/quote.gateway'

import {
  apiRoutes,
  IDEMPOTENCY_KEY_HEADER,
  type CreateOrderRequest,
  type OrderDto,
  type QuoteDto,
  type ReceiptDto,
} from '@adapters/http/contracts'
import { toOrder, toQuote, toReceipt } from '@adapters/mappers/api.mapper'

export class HttpQuoteGateway implements QuoteGateway {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async create(): Promise<Quote> {
    const { data } = await this.http.post<QuoteDto>(apiRoutes.quotes)
    return toQuote(data)
  }
}

export class HttpOrderGateway implements OrderGateway {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async create(payload: CreateOrderPayload, idempotencyKey: string): Promise<Order> {
    const body: CreateOrderRequest = payload
    const { data } = await this.http.post<OrderDto>(apiRoutes.orders, body, {
      headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
    })
    return toOrder(data)
  }

  async findById(id: string, options: RequestOptions = {}): Promise<Order> {
    const { data } = await this.http.get<OrderDto>(apiRoutes.order(id), { ...options })
    return toOrder(data)
  }

  async receipt(orderId: string, options: RequestOptions = {}): Promise<Receipt> {
    const { data } = await this.http.get<ReceiptDto>(apiRoutes.receipt(orderId), { ...options })
    return toReceipt(data)
  }
}
