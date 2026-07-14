import { normalizeApiResponse } from "./helpers";

describe("normalizeApiResponse", () => {
  it("unwraps a nested payload from axios-style responses", () => {
    const response = {
      data: {
        success: true,
        data: { id: 42, name: "Alpha" },
      },
    };

    expect(normalizeApiResponse(response)).toEqual({ id: 42, name: "Alpha" });
  });

  it("returns the raw payload when it is already unwrapped", () => {
    const payload = { id: 7, status: "ok" };

    expect(normalizeApiResponse(payload)).toEqual(payload);
  });
});
