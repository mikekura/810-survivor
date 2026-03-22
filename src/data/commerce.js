(function (ns) {
  ns.commerceConfig = {
    // Paste your Stripe Payment Links here.
    // Example: "https://buy.stripe.com/abcd1234"
    stripePaymentLinks: {
      poolMonitor: "https://buy.stripe.com/9B614f6lf4PU47a79gaAw00",
      summerFestival: "https://buy.stripe.com/5kQ3cn393bei7jm3X4aAw01",
      noonAwakening: "https://buy.stripe.com/14A00bgZTgyCcDGbpwaAw02",
      nightPatrol: "https://buy.stripe.com/14A3cnfVP6Y21Z2gJQaAw05",
      ramuneDrive: "https://buy.stripe.com/28E9AL4d7aae3362T0aAw03",
      stationMaster: "https://buy.stripe.com/bJe7sDeRLcim0UYctAaAw04",
      score81000: "",
      score114514: "",
      score162000: "",
      score243000: "",
      score324000: "",
      score405000: ""
    },
    stripeServer: {
      baseUrl: "",
      successUrl: "",
      cancelUrl: ""
    },
    // Paste your AdSense IDs here.
    // publisherId example: "ca-pub-1234567890123456"
    // slot example: "1234567890"
    adsense: {
      publisherId: "",
      topSlot: "",
      bottomSlot: "",
      autoAds: false
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
