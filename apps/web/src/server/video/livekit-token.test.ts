import { describe, expect, it } from "vitest";

import { issueMockLiveKitToken } from "./livekit-token";

describe("issueMockLiveKitToken", () => {
  it("returns decodable mock payload", () => {
    const { token, url } = issueMockLiveKitToken({
      roomName: "appt_demo",
      participantIdentity: "user-1",
      participantName: "Demo",
    });
    expect(url).toContain("mock.livekit");
    const json = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as {
      mock: boolean;
      room: string;
    };
    expect(json.mock).toBe(true);
    expect(json.room).toBe("appt_demo");
  });
});
