import Mux from '@mux/mux-node'

let muxVideoClient: Mux['video'] | null = null

function assertMuxEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set. Please add it to your environment.`)
  }
  return value
}

export function getMuxVideoClient(): Mux['video'] {
  if (muxVideoClient) {
    return muxVideoClient
  }

  const tokenId = assertMuxEnv('MUX_TOKEN_ID', process.env.MUX_TOKEN_ID)
  const tokenSecret = assertMuxEnv('MUX_TOKEN_SECRET', process.env.MUX_TOKEN_SECRET)

  const mux = new Mux({
    tokenId,
    tokenSecret,
  })

  muxVideoClient = mux.video
  return muxVideoClient
}


