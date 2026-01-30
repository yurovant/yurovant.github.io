const initAnalytics = () => {
  const CSS_SELECTOR = ".some-selector";

  // The most important part
  document.addEventListener("click", (event) => {
    const target = event.target.closest(CSS_SELECTOR);

    if (!target) {
      return;
    }

    const { retailerName, productId } = target.dataset;

    console.warn("retailerName", retailerName);
    console.warn("productId", productId);
  });
};

initAnalytics();
