// Configuration for the application
// Environment variables are injected by Vite at build time or runtime

export const config = {
  // RPC address for bypass mode (optional)
  rpcAddress: process.env.RPC_ADDRESS || '',

  // Chain name for bypass mode (optional)
  chainName: process.env.CHAIN_NAME || '',

  // Helper to check if bypass mode is active
  isBypassMode: !!process.env.RPC_ADDRESS,

  // Base URL for the chain's REST/LCD API (custom-module queries such as
  // attestation origin verification). When REST_ADDRESS is set we call it
  // directly; otherwise we use the dev proxy path "/lcd" (see vite.config.ts).
  restBase: process.env.REST_ADDRESS || '/lcd',
}
