import { AccessToken } from "livekit-server-sdk";

export type LiveKitCredentials = {
  url: string;
  apiKey: string;
  apiSecret: string;
};

export type IssueTokenInput = {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  ttlSeconds?: number;
};

export function isLiveKitMocked(): boolean {
  return process.env["MOCK_LIVEKIT"] === "1";
}

export async function issueLiveKitToken(
  creds: LiveKitCredentials,
  input: IssueTokenInput,
): Promise<{ token: string; url: string }> {
  const at = new AccessToken(creds.apiKey, creds.apiSecret, {
    identity: input.participantIdentity,
    name: input.participantName,
    ttl: input.ttlSeconds ?? 60 * 60,
  });
  at.addGrant({
    roomJoin: true,
    room: input.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return { token: await at.toJwt(), url: creds.url };
}

export function issueMockLiveKitToken(input: IssueTokenInput): { token: string; url: string } {
  const mockToken = Buffer.from(
    JSON.stringify({
      mock: true,
      room: input.roomName,
      identity: input.participantIdentity,
    }),
    "utf8",
  ).toString("base64url");
  return { token: mockToken, url: "wss://mock.livekit.test" };
}
