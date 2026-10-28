import type { Cart } from '@domain/entities/cart'
import type { Favorite } from '@domain/entities/favorite'
import type { Nft } from '@domain/entities/nft'
import type { Order } from '@domain/entities/order'
import type { Profile } from '@domain/entities/profile'
import type { Quote } from '@domain/entities/quote'
import type { Receipt } from '@domain/entities/receipt'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@domain/entities/realtime-event'
import type { Session } from '@domain/entities/session'
import type { Wallet } from '@domain/entities/wallet'

import type { CatalogFacets, Page } from '@application/dtos/catalog'

import type {
  CartDto,
  CatalogFacetsDto,
  FavoriteDto,
  NftDto,
  OrderDto,
  PageDto,
  ProfileDto,
  QuoteDto,
  ReceiptDto,
  SessionDto,
  WalletDto,
} from '@adapters/http/contracts'
import {
  realtimeEvents,
  type NftUpdatedEventDto,
  type OrderUpdatedEventDto,
} from '@adapters/socket/contracts'

/**
 * DTO de transporte → modelo de domínio. O contrato foi desenhado com os
 * mesmos nomes do domínio; os mappers são o ponto único de adaptação caso o
 * formato da API mude, sem tocar em casos de uso ou interface.
 */
export const toNft = (dto: NftDto): Nft => ({
  id: dto.id,
  name: dto.name,
  description: dto.description,
  collection: { id: dto.collection.id, name: dto.collection.name },
  network: dto.network,
  creator: { name: dto.creator.name, avatarUrl: dto.creator.avatarUrl },
  images: dto.images.map((image) => ({ url: image.url, alt: image.alt })),
  editions: dto.editions.map((edition) => ({ ...edition })),
  featured: dto.featured,
  trendingScore: dto.trendingScore,
  createdAt: dto.createdAt,
  version: dto.version,
})

export const toNftPage = (dto: PageDto<NftDto>): Page<Nft> => ({ ...dto, items: dto.items.map(toNft) })

export const toFacets = (dto: CatalogFacetsDto): CatalogFacets => ({
  collections: dto.collections.map((option) => ({ ...option })),
  networks: dto.networks.map((option) => ({ ...option })),
  priceRange: { ...dto.priceRange },
})

export const toFavorite = (dto: FavoriteDto): Favorite => ({
  nftId: dto.nftId,
  createdAt: dto.createdAt,
  nft: toNft(dto.nft),
})

export const toCart = (dto: CartDto): Cart => ({
  owner: dto.owner,
  lines: dto.lines.map((line) => ({ ...line })),
  coupon: dto.coupon ? { ...dto.coupon } : null,
  summary: { ...dto.summary },
  itemCount: dto.itemCount,
  version: dto.version,
})

export const toQuote = (dto: QuoteDto): Quote => ({
  id: dto.id,
  lines: dto.lines.map((line) => ({ ...line })),
  coupon: dto.coupon ? { ...dto.coupon } : null,
  summary: { ...dto.summary },
  createdAt: dto.createdAt,
  expiresAt: dto.expiresAt,
})

export const toOrder = (dto: OrderDto): Order => ({
  id: dto.id,
  status: dto.status,
  version: dto.version,
  lines: dto.lines.map((line) => ({ ...line })),
  coupon: dto.coupon ? { ...dto.coupon } : null,
  summary: { ...dto.summary },
  collector: { ...dto.collector },
  payment: { ...dto.payment },
  transaction: dto.transaction ? { ...dto.transaction } : null,
  rejectionReason: dto.rejectionReason,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
})

export const toReceipt = (dto: ReceiptDto): Receipt => ({
  orderId: dto.orderId,
  issuedAt: dto.issuedAt,
  transaction: { ...dto.transaction },
  lines: dto.lines.map((line) => ({ ...line })),
  coupon: dto.coupon ? { ...dto.coupon } : null,
  summary: { ...dto.summary },
  collector: { ...dto.collector },
  payment: { ...dto.payment },
})

export const toSession = (dto: SessionDto): Session => ({
  user: { ...dto.user },
  accessToken: dto.accessToken,
  refreshToken: dto.refreshToken,
  accessExpiresAt: dto.accessExpiresAt,
  refreshExpiresAt: dto.refreshExpiresAt,
})

export const toProfile = (dto: ProfileDto): Profile => ({ ...dto })

export const toWallet = (dto: WalletDto): Wallet => ({ ...dto })

const isEnvelope = (
  value: unknown,
): value is {
  eventId: string
  version: number
  type: unknown
  resource: { id: string }
  payload: { id?: unknown }
} => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  const resource = candidate.resource as Record<string, unknown> | undefined
  return (
    typeof candidate.eventId === 'string' &&
    typeof candidate.version === 'number' &&
    typeof resource?.id === 'string' &&
    typeof candidate.payload === 'object' &&
    candidate.payload !== null
  )
}

/** Eventos malformados são descartados (`null`) em vez de corromper o estado. */
export const toNftUpdatedEvent = (raw: unknown): NftUpdatedEvent | null => {
  if (!isEnvelope(raw)) return null
  if (raw.type !== realtimeEvents.nftUpdated || raw.payload.id !== raw.resource.id) return null
  const dto = raw as NftUpdatedEventDto
  return { ...dto, resource: { type: 'nft', id: dto.resource.id }, payload: toNft(dto.payload) }
}

export const toOrderUpdatedEvent = (raw: unknown): OrderUpdatedEvent | null => {
  if (!isEnvelope(raw)) return null
  if (raw.type !== realtimeEvents.orderUpdated || raw.payload.id !== raw.resource.id) return null
  const dto = raw as OrderUpdatedEventDto
  return { ...dto, resource: { type: 'order', id: dto.resource.id }, payload: toOrder(dto.payload) }
}
