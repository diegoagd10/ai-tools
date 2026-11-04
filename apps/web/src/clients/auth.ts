import type { LoginInput } from '@ai-tools/shared'
import { post } from './http'

export const login = (input: LoginInput, clientIp: string) => post('/v1/login', input, clientIp)
