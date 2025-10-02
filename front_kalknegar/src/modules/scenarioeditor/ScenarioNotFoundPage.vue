<template>
  <main class="grid min-h-full place-items-center bg-blue-50 dark:bg-slate-800 px-6 py-24 sm:py-32 lg:px-8">
    <div class="text-center">
      <p class="text-base font-semibold text-indigo-500 dark:text-indigo-400">404</p>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-200 sm:text-5xl">
        سناریو یافت نشد
      </h1>
      <p class="mt-6 max-w-md text-base leading-7 text-slate-600 dark:text-slate-400">
        متأسفانه سناریویی که به دنبال آن هستید یافت نشد. ممکن است حذف شده باشد یا در این مرورگر وجود نداشته باشد.
      </p>
      <div class="mt-10 flex items-center justify-center gap-x-8">
        <router-link to="/" class="text-sm font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          ><span aria-hidden="true">&larr;</span> بازگشت به خانه
        </router-link>
        <a
          href="https://docs.orbat-mapper.app/guide/storage"
          class="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
          >مستندات <span aria-hidden="true">&rarr;</span></a
        >
      </div>
    </div>
  </main>
</template>
