import 'express'

declare module 'express-serve-static-core' {
  interface Request {
    organizationId?: string
    subdomain?: string | null
  }
}
