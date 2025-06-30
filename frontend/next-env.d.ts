/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
/// <reference types="vite/client" />

// https://eips.ethereum.org/EIPS/eip-1193 implementation 
// EIP - 6963 introduces an alternative wallet detection mechanism to the window.ethereum injected provider.
// This alternative mechanism enables dapps to support wallet interoperability by discovering multiple injected wallet providers in a user's browser.

// Describes metadata related to a provider based on EIP-6963.
interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

// Represents the structure of a provider based on EIP-1193.
interface EIP1193Provider {
  isStatus?: boolean
  host?: string
  path?: string
  sendAsync?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void
  ) => void
  send?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void
  ) => void
  request: (request: {
    method: string
    params?: Array<unknown>
  }) => Promise<unknown>
}

// Combines the provider's metadata with an actual provider object, creating a complete picture of a
// wallet provider at a glance.
interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: EIP1193Provider
}

// Represents the structure of an event dispatched by a wallet to announce its presence based on EIP-6963.
type EIP6963AnnounceProviderEvent = {
  detail: {
    info: EIP6963ProviderInfo
    provider: EIP1193Provider
  }
}

// An error object with optional properties, commonly encountered when handling eth_requestAccounts errors.
interface WalletError {
  code?: string
  message?: string
}