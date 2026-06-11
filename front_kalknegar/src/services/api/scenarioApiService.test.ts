import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "./baseApiClient";
import { ScenarioApiService } from "./scenarioApiService";
import type { Scenario } from "@/types/scenarioModels";

function createScenario(id = "scenario-1"): Scenario {
  return {
    id,
    type: "ORBAT-mapper",
    version: "0.40.0",
    meta: {
      createdDate: "2026-01-01T00:00:00.000Z",
      lastModifiedDate: "2026-01-01T00:00:00.000Z",
    },
    name: "Scenario",
    description: "",
    startTime: 0,
    timeZone: "UTC",
    symbologyStandard: "2525",
    sides: [],
    events: [],
    layers: [],
    mapLayers: [],
    settings: {
      rangeRingGroups: [],
      statuses: [],
      supplyClasses: [],
      supplyUoMs: [],
      map: { baseMapId: "osm" },
    },
    metadata: {},
  } as Scenario;
}

function apiResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("ScenarioApiService.save", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not create a new scenario when update fails with unauthorized", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      apiResponse(401, {
        success: false,
        message: "Could not validate credentials",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const service = new ScenarioApiService();

    await expect(service.save(createScenario())).rejects.toMatchObject({
      name: "ApiClientError",
      status: 401,
      message: "Could not validate credentials",
    } satisfies Partial<ApiClientError>);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("PUT");
  });

  it("creates the scenario only when update fails with not found", async () => {
    const created = createScenario("scenario-1");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        apiResponse(404, {
          success: false,
          message: "Not found",
        }),
      )
      .mockResolvedValueOnce(
        apiResponse(200, {
          success: true,
          data: { content: created, id: created.id },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const service = new ScenarioApiService();
    const result = await service.save(created);

    expect(result.id).toBe(created.id);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("PUT");
    expect(fetchMock.mock.calls[1][1]?.method).toBe("POST");
  });
});
