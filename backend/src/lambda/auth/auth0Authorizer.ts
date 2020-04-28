import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev--rqtdh77.eu.auth0.com/.well-known/jwks.json'
const auth0Secret = process.env.AUTH_0_SECRET
const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJBvERl2/55lvxMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi0tcnF0ZGg3Ny5ldS5hdXRoMC5jb20wHhcNMjAwNDI4MDk1MzE2WhcN
MzQwMTA1MDk1MzE2WjAkMSIwIAYDVQQDExlkZXYtLXJxdGRoNzcuZXUuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu8so4wezd4RMDi2Q
sfUoWLQsGc31jSHaEI73FQWoEzMvvw6H6BjrN+wqIpFQd+TSNGn/+y8eyCH47g0/
ZXvtu6d8P1CXl46D5iXw29QoaFXcJy0rRiSA6IFPq55EfctdRhajOXygzp0YucWE
YDIN+oqSYqDgztIItNRvnDdYq7JjysX2b3/UwgmM7eHiZgJ3sraIVbnMD1UnPZwT
C/yP+koV58EFwIKVaixITMB8mt9/yVvULAuUnVa+G2fPAzLAjfgBfD4z3zcMHfwc
v/Q48DWbsv0yIQW2Hyx3kiGs5/L93IZcp/ch1GDVo5C5A/e7jInVc0kFl5QAq9of
fHzx6QIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBR648lKDi+g
Z0YZxhjy9jgAPA9IgTAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AHf0JGt4JoerKF/ST3dpTg5QhtSwImuh/X9EY+vmTExfohY+aAyFk7aR/9gn3vzW
NwOO9rfVkTP9+HWEAwM8faueT+X8TfNj5+nTr4gcug6UywoIM3RIpYd4VnXOYnWW
f6RKorD1Za7iaa2Opow4jL9fcgTG6V2MTVLenDDY0BpMOypM2BsuPBhF1dUuEOGu
fXsq0ujH/ft5GgnYwdk379Kd+31ww5ME0OxrSDHFRvofjIeV+/kxjD6lhVnBVhRY
EhSz/uGSj7OxATzEwtp0HXBlO41QSoDVJ3dkJnPO/gpfbkXoedZsYh8DtW+vDcl5
nnjnY3B7LEUJqXyIY9n/5Aw=
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
