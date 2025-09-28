import "./dayjs";
import { createApp } from "vue";
import { createPinia } from "pinia";
import "./styles.css";
import App from "./App.vue";
import { router } from "./router";
import persianNumberDirectives from "@/utils/persianNumberDirective";

// Import React integration bridge with error handling
try {
  import("./integrations/react-bridge");
} catch (error) {
  console.warn("React bridge integration failed to load:", error);
}

// Create and mount Vue app with error handling
try {
  const app = createApp(App);
  app.use(router);
  app.use(createPinia());
  
  // Register Persian number directives globally
  Object.entries(persianNumberDirectives).forEach(([name, directive]) => {
    app.directive(name, directive as any);
  });
  
  // Global error handler
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue Error:', err, info);
  };
  
  app.mount("#app");
  console.log('🍍 Orbat application started successfully with Persian number support');
} catch (error) {
  console.error('Failed to start Orbat application:', error);
  // Display error message to user
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial, sans-serif;">
      <h2>Application Failed to Start</h2>
      <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
      <p>Please refresh the page or check the console for more details.</p>
    </div>
  `;
}
