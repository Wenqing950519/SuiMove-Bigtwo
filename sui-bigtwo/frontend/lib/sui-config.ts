export const SUI_BIGTWO_PACKAGE_ID =
  "0x6c8f32af9df2d393125dd9755ec986e85c745c7b68b5421085f5b1c2a2259d44"

export const SUI_BIGTWO_MODULE = "big_two"
export const SUI_BIGTWO_STAKE_MODULE = "stake_session"
export const SUI_BIGTWO_NETWORK = "testnet"
export const SUI_BIGTWO_CHAIN = "sui:testnet"
export const SUI_BIGTWO_PUBLISH_DIGEST = "HYb4CQzLLXTDpaQVfueT4iXkBuaYL7Ho3UD5MQBcycPF"
export const SUI_BIGTWO_UPGRADE_CAP =
  "0x07260ec299f92f9023ee0b805ce4e5073b82ae7acb10e452f8d57e1d2c3886f4"

export function explorerTxUrl(digest: string): string {
  return `https://suiscan.xyz/testnet/tx/${digest}`
}

export function explorerObjectUrl(objectId: string): string {
  return `https://suiscan.xyz/testnet/object/${objectId}`
}
