import { computed, onMounted, ref } from "vue";
import { type ScenarioMetadata } from "@/scenariostore/localdb";
import { scenarioApiService } from "@/services/api/scenarioApiService";
import { useIndexedDb } from "@/scenariostore/localdb";
import type { MenuItemData } from "@/components/types";
import type { StoredScenarioAction } from "@/types/constants";
import { MAP_EDIT_MODE_ROUTE } from "@/router/names";
import type { Scenario } from "@/types/scenarioModels";
import { nanoid } from "@/utils";
import { useRouter } from "vue-router";
import { normalizeImportedScenarioId } from "./browserScenarioImport";

export const DEMO_SCENARIOS = [
  {
    name: "آزادسازی خرمشهر – عملیات بیت‌المقدس (۱۳۶۱)",
    id: "Operation_Beit_ol_Moqaddas_1982_FA",
    summary:
      "این سناریو پیشروی مشترک ارتش جمهوری اسلامی ایران و سپاه پاسداران از شرق کارون تا محاصره و آزادسازی خرمشهر در عملیات بیت‌المقدس (اردیبهشت–خرداد ۱۳۶۱) را مدل‌سازی می‌کند.",
    imageUrl:
      "/scenarios/images/خرمشهر.jpg",
  },
  {
    name: "عملیات مرصاد (۱۳۶۷) – مقابله با تهاجم منافقین/حمایت عراق",
    id: "Operation_Mersad_1988_FA",
    summary:
      "این سناریو محور نفوذ نیروهای منافقین (با پشتیبانی عراق) از مرز قصرشیرین به‌سوی کرند غرب و اسلام‌آباد غرب و سپس سدّ و انهدام آن‌ها در «تنگه مرصاد» توسط نیروهای ایران را مدل‌سازی می‌کند (تیر ۱۳۶۷).",
    imageUrl:
      "/scenarios/images/مرصاد.jpg",
  },
 
];

export function useBrowserScenarios() {
  const router = useRouter();
  const storedScenarios = ref<ScenarioMetadata[]>([]);
  const activeSort = ref("lastModified");

  const sortOptions = computed<MenuItemData[]>(() => [
    {
      label: "نام",
      action: () => {
        storedScenarios.value.sort((a, b) => a.name.localeCompare(b.name));
        activeSort.value = "name";
      },
      active: activeSort.value === "name",
    },
    {
      label: "آخرین تغییر",
      action: () => {
        activeSort.value = "lastModified";
        storedScenarios.value.sort((a, b) => +b.modified - +a.modified);
      },
      active: activeSort.value === "lastModified",
    },
    {
      label: "ایجاد شده",
      action: () => {
        activeSort.value = "created";
        storedScenarios.value.sort((a, b) => +b.created - +a.created);
      },
      active: activeSort.value === "created",
    },
  ]);

  async function onAction(action: StoredScenarioAction, scenario: ScenarioMetadata) {
    const { /* deleteScenario, listScenarios, duplicateScenario, */ downloadAsJson } =
      await useIndexedDb();
    switch (action) {
      case "open":
        await router.push({
          name: MAP_EDIT_MODE_ROUTE,
          params: { scenarioId: scenario.id },
        });
        break;
      case "delete":
        if (
          window.confirm(
            `آیا مطمئن هستید که می‌خواهید سناریوی "${scenario.name}" را برای همیشه حذف کنید؟`,
          )
        ) {
          await scenarioApiService.remove(scenario.id);
        }
        break;
      case "download":
        await downloadAsJson(scenario.id);
        break;
      case "duplicate":
        {
          const scn = await scenarioApiService.getById(scenario.id);
          // حذف شناسه برای ایجاد
          const { id: _oldId, meta, ...rest } = scn as any;
          await scenarioApiService.create({ ...(rest as any), id: crypto.randomUUID() } as any);
        }
        break;
    }

    await reloadScenarios();

    async function reloadScenarios() {
      const items = await scenarioApiService.list();
      // list() از نوع ScenarioMetadata نیست دقیقاً، اما میدان‌های متناظر را دارد
      storedScenarios.value = items as unknown as ScenarioMetadata[];
      storedScenarios.value.reverse();
    }
  }

  async function loadScenario(v: Scenario) {
    const { addScenario, getScenarioInfo, putScenario } = await useIndexedDb();
    const importedScenario = normalizeImportedScenarioId(v);

    const existingScenarioInfo = await getScenarioInfo(importedScenario.id ?? nanoid());
    if (existingScenarioInfo) {
      let scenarioId = importedScenario.id;
      if (
        window.confirm(
          "سناریویی با همین شناسه در مرورگر ذخیره شده است. آیا می‌خواهید آن را با این سناریو جایگزین کنید؟",
        )
      ) {
        scenarioId = await putScenario(importedScenario);
      } else {
        scenarioId = await addScenario(importedScenario, nanoid());
      }
      await router.push({ name: MAP_EDIT_MODE_ROUTE, params: { scenarioId } });
    } else {
      const scenarioId = await addScenario(importedScenario);
      await router.push({ name: MAP_EDIT_MODE_ROUTE, params: { scenarioId } });
    }
  }

  async function importScenario(scenarioId: string) {
    const { loadScenario } = await useIndexedDb();
    const scenario = await loadScenario(scenarioId);
    if (scenario) {
      return scenario;
    }
  }

  onMounted(async () => {
    const items = await scenarioApiService.list();
    storedScenarios.value = items as unknown as ScenarioMetadata[];
    storedScenarios.value.reverse();
  });

  return { storedScenarios, sortOptions, onAction, loadScenario, importScenario };
}
