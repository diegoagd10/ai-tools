import { bearer, get } from './http'

export const fetchProfile = (accessToken: string) => get('/v1/profile', bearer(accessToken))
