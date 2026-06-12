export const SUI_BIGTWO_PACKAGE_ID =
  "0x94b3f4d9451736b6af3679228852d1749dbb6949dded8da8dbb0cade7682f985"

export const SUI_BIGTWO_MODULE = "big_two"
export const SUI_BIGTWO_NETWORK = "testnet"
export const SUI_BIGTWO_CHAIN = "sui:testnet"
export const SUI_BIGTWO_PUBLISH_DIGEST = "J6HWyu8trVtFcqE8biD5zCaW3PPYznaVc7gsrwdvm6fX"

export function explorerTxUrl(digest: string): string {
  return `https://suiscan.xyz/testnet/tx/${digest}`
}

export function explorerObjectUrl(objectId: string): string {
  return `https://suiscan.xyz/testnet/object/${objectId}`
}