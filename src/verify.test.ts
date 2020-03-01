import { toISOString, SimpleNonceStore } from './nonce_store'
import {
  verifyNonce,
  NonceFields,
  SignedFields,
  verifySignedFields,
} from './verify'

describe('verify', () => {
  it('verifyNonce', async () => {
    const timerStr = toISOString(new Date())
    const ns = new SimpleNonceStore()

    const v: NonceFields = {
      'openid.op_endpoint': '1',
      'openid.response_nonce': timerStr + 'foo',
    }
    await verifyNonce(v, ns)

    v['openid.response_nonce'] = timerStr + 'bar'
    await verifyNonce(v, ns)

    v['openid.op_endpoint'] = '2'
    await verifyNonce(v, ns)
  })
  it('verifySignedFields', async () => {
    async function doVerifySignedFields(v: SignedFields, pass: boolean) {
      let result = await Promise.resolve()
        .then(() => {
          return verifySignedFields(v)
        })
        .then(
          () => true,
          () => false,
        )
      expect(result).toEqual(pass)
    }
    // No claimed_id/identity, properly signed
    await doVerifySignedFields(
      {
        'openid.signed':
          'signed,op_endpoint,return_to,response_nonce,assoc_handle',
      },
      true,
    )

    // Everything properly signed, even empty claimed_id/identity
    await doVerifySignedFields(
      {
        'openid.signed':
          'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
      },
      true,
    )

    // With claimed_id/identity, properly signed
    await doVerifySignedFields(
      {
        'openid.signed':
          'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
        'openid.claimed_id': 'foo',
        'openid.identity': 'foo',
      },
      true,
    )

    // With claimed_id/identity, but those two not signed
    await doVerifySignedFields(
      {
        'openid.signed':
          'signed,op_endpoint,return_to,response_nonce,assoc_handle',
        'openid.claimed_id': 'foo',
        'openid.identity': 'foo',
      },
      false,
    )

    // Missing signature for op_endpoint
    await doVerifySignedFields(
      {
        'openid.signed':
          'signed,claimed_id,identity,return_to,response_nonce,assoc_handle',
        'openid.claimed_id': 'foo',
        'openid.identity': 'foo',
      },
      false,
    )

    // Missing signature for return_to
    await doVerifySignedFields(
      {
        'openid.signed':
          'signed,op_endpoint,claimed_id,identity,response_nonce,assoc_handle',
        'openid.claimed_id': 'foo',
        'openid.identity': 'foo',
      },
      false,
    )

    // Missing signature for response_nonce
    await doVerifySignedFields(
      {
        'openid.signed':
          'signed,op_endpoint,claimed_id,identity,return_to,assoc_handle',
        'openid.claimed_id': 'foo',
        'openid.identity': 'foo',
      },
      false,
    )

    // Missing signature for assoc_handle
    await doVerifySignedFields(
      {
        'openid.signed':
          'signed,op_endpoint,claimed_id,identity,return_to,response_nonce',
        'openid.claimed_id': 'foo',
        'openid.identity': 'foo',
      },
      false,
    )
  })
})
