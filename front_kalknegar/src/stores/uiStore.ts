import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { TAB_ORBAT } from "@/types/constants";

export let prevToeIncludeSubordinates: boolean | undefined = undefined;

export const useUiStore = defineStore("ui", {
  state: () => ({
    modalOpen: false,
    editToolbarActive: false,
    measurementActive: false,
    getLocationActive: false,
    activeItem: null,
    activeStateItem: null,
    debugMode: false,
    mobilePanelOpen: false,
    layersPanelActive: false,
    activeTabIndex: TAB_ORBAT,
    showSearch: false,
    searchGeoMode: false,
    mapLayersPanelOpen: true,
    showToolbar: useLocalStorage("showToolbar", true),
    showTimeline: useLocalStorage("showTimeline", true),
    showLeftPanel: true,
    showOrbatBreadcrumbs: useLocalStorage("showOrbatBreadcrumbs", true),
    goToNextOnSubmit: useLocalStorage("goToNextOnSubmit", true),
    toeTabIndex: 0,
    toeIncludeSubordinates: useLocalStorage("toeIncludeSubordinates", true),
    prevToeIncludeSubordinates: undefined as boolean | undefined,
    prevSuppliesIncludeSubordinates: undefined as boolean | undefined,
    popperCounter: 0,
  }),
  getters: {
    shortcutsEnabled: (state) => !state.modalOpen,
    escEnabled: (state) =>
      !(
        state.modalOpen ||
        state.editToolbarActive ||
        state.measurementActive ||
        state.getLocationActive ||
        state.popperCounter > 0
      ),
  },
});

export const useWidthStore = defineStore("panelWidth", {
  state: () => ({
    orbatPanelWidth: useLocalStorage("orbatPanelWidth", 350),
    detailsWidth: useLocalStorage("detailsPanelWidth", 340),
  }),
  actions: {
    resetOrbatPanelWidth() {
      this.orbatPanelWidth = 350;
    },

    resetDetailsWidth() {
      this.detailsWidth = 340;
    },
  },
});
