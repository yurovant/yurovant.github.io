// QUICK REFERENCE TABLE
// Scenario                      | Risk Level | Recommendation
// Timer updates reactive data   | High       | Clear it to avoid errors
// Timer triggers a route change | High       | Clear it to avoid "ghost" navigation
// Timer is > 1 second           | Medium     | Clear it to free up memory
// Timer is < 100ms              | Low        | Usually safe, but clearing is still cleaner

import { onMounted, onUnmounted } from "vue";

export default {
  setup() {
    let timerId = null;

    onMounted(() => {
      timerId = setTimeout(() => {
        console.log("Action performed!");
      }, 5000);
    });

    onUnmounted(() => {
      // Always play it safe
      if (timerId) {
        clearTimeout(timerId);
      }
    });
  },
};
