/**
 * Create a store file to manage the state of the detected wallet providers. 
 * This file provides a centralized place to store and synchronize the detected wallet providers, 
 * ensuring that your dapp always has access to the latest provider information.
 */

// Extends WindowEventMap interface, including a custom event eip6963:announceProvider.
declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent
  }
}

// An array to store the detected wallet providers.
let providers: EIP6963ProviderDetail[] = []

// Object containing two methods. The store holds the state of detected Ethereum wallet providers.
// It's implemented as an external store, making it available for subscription and synchronization
// across the dapp.
export const store = {
  // Returns the current state of providers.
  value: () => providers,
  // Subscribes to provider announcements and updates the store accordingly.
  // Takes a callback function to be invoked on each store update, returning a function to
  // unsubscribe from the event.
  subscribe: (callback: () => void) => {
    function onAnnouncement(event: EIP6963AnnounceProviderEvent) {
      if (providers.map((p) => p.info.uuid).includes(event.detail.info.uuid))
        return
      providers = [...providers, event.detail]
      callback()
    }

    // Listen for eip6963:announceProvider and call onAnnouncement when the event is triggered.
    window.addEventListener("eip6963:announceProvider", onAnnouncement)

    // Dispatch the event, which triggers the event listener in the MetaMask wallet.
    window.dispatchEvent(new Event("eip6963:requestProvider"))

    // Return a function that removes the event listener.
    return () =>
      window.removeEventListener("eip6963:announceProvider", onAnnouncement)
  },
}