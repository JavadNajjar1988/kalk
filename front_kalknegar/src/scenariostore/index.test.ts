import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useScenario } from "./index";
import type { Scenario } from "@/types/scenarioModels";
import { ScenarioStatus } from "@/types/scenarioModels";

function createScenario(id: string): Scenario {
  return {
    id,
    type: "ORBAT-mapper",
    version: "0.41.0",
    name: "Autosave test",
    sides: [],
    events: [],
    layers: [],
    mapLayers: [],
  };
}

describe("useScenario", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("keeps io stable so dirty state survives repeated scenario reads", () => {
    const { scenario } = useScenario();

    scenario.value.io.loadFromObject(createScenario("autosave-test"));
    const io = scenario.value.io;

    scenario.value.store.markChanged();

    expect(io.savedDirty.value).toBe(true);
    expect(scenario.value.io).toBe(io);
    expect(scenario.value.io.savedDirty.value).toBe(true);
  });

  it("keeps dashboard status and objectives in autosave output", () => {
    const { scenario } = useScenario();
    const input = createScenario("status-persistence");
    input.status = ScenarioStatus.ACTIVE;
    input.objectives = ["حفظ منطقه عملیاتی"];

    scenario.value.io.loadFromObject(input);
    const saved = JSON.parse(scenario.value.io.stringifyScenario());

    expect(saved.status).toBe(ScenarioStatus.ACTIVE);
    expect(saved.objectives).toEqual(["حفظ منطقه عملیاتی"]);
  });

  it("preserves resource catalog links on equipment, personnel, and supplies after save and reload", () => {
    const { scenario } = useScenario();
    const input = createScenario("resource-links");
    input.equipment = [{ name: "تانک تی-۷۲", resourceId: "equipment-resource-1" }];
    input.personnel = [{ name: "گروه خدمه زرهی", resourceId: "personnel-resource-1" }];
    input.supplyCategories = [
      { name: "سوخت دیزل", uom: "لیتر", resourceId: "logistics-resource-1" },
    ];
    input.sides = [
      {
        id: "side-1",
        name: "نیروی خودی",
        standardIdentity: "3",
        groups: [
          {
            id: "group-1",
            name: "گروه رزمی",
            subUnits: [
              {
                id: "unit-1",
                name: "گردان زرهی",
                sidc: "10031000000000000000",
                linkedResourceId: "unit-resource-1",
                linkedResourceLabel: "گردان زرهی مرجع",
                participationStatus: "active",
                operationalRole: "اجرای تک در محور جنوبی",
                participationStartTime: 50,
                participationEndTime: 250,
                participationNotes: "هدف عملیاتی تصرف شد",
                sourceReference: "گزارش عملیات، صفحه ۱۲",
                equipment: [
                  {
                    name: "تانک تی-۷۲",
                    count: 12,
                    resourceId: "equipment-resource-1",
                  },
                ],
                personnel: [
                  {
                    name: "گروه خدمه زرهی",
                    count: 36,
                    resourceId: "personnel-resource-1",
                    participationStatus: "active",
                    operationalRole: "فرمانده گردان",
                    participationStartTime: 100,
                    participationEndTime: 200,
                    participationNotes: "هدایت عملیات در محور جنوبی",
                    sourceReference: "گزارش روزانه، صفحه ۳۵",
                  },
                ],
                supplies: [
                  {
                    name: "سوخت دیزل",
                    count: 5000,
                    onHand: 4200,
                    resourceId: "logistics-resource-1",
                  },
                ],
                subUnits: [],
              },
            ],
          },
        ],
      } as any,
    ];

    scenario.value.io.loadFromObject(input);
    const saved = JSON.parse(scenario.value.io.stringifyScenario());

    expect(saved.equipment[0].resourceId).toBe("equipment-resource-1");
    expect(saved.personnel[0].resourceId).toBe("personnel-resource-1");
    expect(saved.supplyCategories[0].resourceId).toBe("logistics-resource-1");
    expect(saved.sides[0].groups[0].subUnits[0].equipment[0].resourceId).toBe(
      "equipment-resource-1",
    );
    expect(saved.sides[0].groups[0].subUnits[0].personnel[0].resourceId).toBe(
      "personnel-resource-1",
    );
    expect(saved.sides[0].groups[0].subUnits[0].supplies[0]).toMatchObject({
      resourceId: "logistics-resource-1",
      count: 5000,
      onHand: 4200,
    });
    expect(saved.sides[0].groups[0].subUnits[0].personnel[0]).toMatchObject({
      participationStatus: "active",
      operationalRole: "فرمانده گردان",
      participationStartTime: 100,
      participationEndTime: 200,
      participationNotes: "هدایت عملیات در محور جنوبی",
      sourceReference: "گزارش روزانه، صفحه ۳۵",
    });
    expect(saved.sides[0].groups[0].subUnits[0].linkedResourceId).toBe("unit-resource-1");
    expect(saved.sides[0].groups[0].subUnits[0]).toMatchObject({
      participationStatus: "active",
      operationalRole: "اجرای تک در محور جنوبی",
      participationStartTime: 50,
      participationEndTime: 250,
      participationNotes: "هدف عملیاتی تصرف شد",
      sourceReference: "گزارش عملیات، صفحه ۱۲",
    });

    scenario.value.io.loadFromObject(saved);
    const savedAgain = JSON.parse(scenario.value.io.stringifyScenario());

    expect(savedAgain.equipment[0].resourceId).toBe("equipment-resource-1");
    expect(savedAgain.personnel[0].resourceId).toBe("personnel-resource-1");
    expect(savedAgain.supplyCategories[0].resourceId).toBe("logistics-resource-1");
    expect(savedAgain.sides[0].groups[0].subUnits[0].equipment[0].resourceId).toBe(
      "equipment-resource-1",
    );
    expect(savedAgain.sides[0].groups[0].subUnits[0].personnel[0].resourceId).toBe(
      "personnel-resource-1",
    );
    expect(
      savedAgain.sides[0].groups[0].subUnits[0].supplies[0].resourceId,
    ).toBe("logistics-resource-1");
    expect(savedAgain.sides[0].groups[0].subUnits[0].personnel[0]).toMatchObject({
      operationalRole: "فرمانده گردان",
      participationStartTime: 100,
      participationEndTime: 200,
      participationNotes: "هدایت عملیات در محور جنوبی",
      sourceReference: "گزارش روزانه، صفحه ۳۵",
    });
    expect(savedAgain.sides[0].groups[0].subUnits[0].linkedResourceId).toBe(
      "unit-resource-1",
    );
    expect(savedAgain.sides[0].groups[0].subUnits[0]).toMatchObject({
      participationStatus: "active",
      operationalRole: "اجرای تک در محور جنوبی",
      participationStartTime: 50,
      participationEndTime: 250,
      participationNotes: "هدف عملیاتی تصرف شد",
      sourceReference: "گزارش عملیات، صفحه ۱۲",
    });
  });

  it("preserves a positioned equipment resource link after save and reload", () => {
    const { scenario } = useScenario();
    const input = createScenario("positioned-equipment-link");
    input.layers = [
      {
        id: "layer-1",
        name: "تجهیزات مستقر",
        features: [
          {
            type: "Feature",
            id: "equipment-feature-1",
            geometry: { type: "Point", coordinates: [51.4, 35.7] },
            meta: { type: "Point", name: "تانک تی-۷۲" },
            properties: {
              resourceId: "equipment-resource-1",
              quantity: 3,
              participationStatus: "active",
              unitId: "unit-1",
            },
            style: { militarySymbolSidc: "10031000001205000000" } as any,
          },
        ],
      },
    ];

    scenario.value.io.loadFromObject(input);
    const saved = JSON.parse(scenario.value.io.stringifyScenario());
    expect(saved.layers[0].features[0].properties).toMatchObject({
      resourceId: "equipment-resource-1",
      quantity: 3,
      participationStatus: "active",
      unitId: "unit-1",
    });

    scenario.value.io.loadFromObject(saved);
    const savedAgain = JSON.parse(scenario.value.io.stringifyScenario());
    expect(savedAgain.layers[0].features[0].properties.resourceId).toBe(
      "equipment-resource-1",
    );
  });
});
