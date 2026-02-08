// Session helpers will be implemented when needed
// For now, use useSession() from next-auth/react on client
// and auth() from next-auth on server

export async function getCurrentUser() {
  // TODO: Implement when we need server-side session access
  return null
}

export async function requireAuth() {
  // TODO: Implement when we need server-side auth checking
  throw new Error('Not implemented')
}
