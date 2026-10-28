/** "ID do token: #0042" do Figma, derivado do id do NFT (ex.: nft-042 → #0042). */
export const tokenIdOf = (nftId: string): string => `#${nftId.replace(/\D/g, '').padStart(4, '0')}`
