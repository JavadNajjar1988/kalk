import type { Router } from "vue-router";

export function dashboardSectionUrl(path = "/dashboard/scenarios") {
  const configured = import.meta.env.VITE_PARENT_ORIGIN?.trim();
  if (configured) {
    return new URL(path, configured).toString();
  }

  const { protocol, hostname, port, origin } = window.location;
  const dashboardOrigin = port === "5180" ? `${protocol}//${hostname}:3000` : origin;
  return new URL(path, dashboardOrigin).toString();
}

export function goToPreviousStep(router: Router, fallback: string) {
  if (window.history.state?.back) {
    router.back();
    return;
  }

  if (/^https?:\/\//.test(fallback)) {
    window.location.assign(fallback);
    return;
  }

  void router.replace(fallback);
}
