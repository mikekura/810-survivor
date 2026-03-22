(function (ns) {
  function createAdUnit(clientId, slotId, fullWidthResponsive) {
    var ad = document.createElement("ins");
    ad.className = "adsbygoogle";
    ad.style.display = "block";
    ad.setAttribute("data-ad-client", clientId);
    ad.setAttribute("data-ad-slot", slotId);
    ad.setAttribute("data-ad-format", "auto");
    if (fullWidthResponsive) {
      ad.setAttribute("data-full-width-responsive", "true");
    }
    return ad;
  }

  ns.Monetization = {
    init: function () {
      var config = ns.commerceConfig || {};
      var ads = config.adsense || {};
      var publisherId = ads.publisherId || "";
      var topSlot = ads.topSlot || "";
      var bottomSlot = ads.bottomSlot || "";
      var topContainer = document.getElementById("ad-top");
      var bottomContainer = document.getElementById("ad-bottom");
      var script;

      if (!topContainer || !bottomContainer) {
        return;
      }

      if (!publisherId) {
        topContainer.hidden = true;
        bottomContainer.hidden = true;
        return;
      }

      topContainer.hidden = !topSlot;
      bottomContainer.hidden = !bottomSlot;

      script = document.createElement("script");
      script.async = true;
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(publisherId);
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);

      if (topSlot) {
        topContainer.innerHTML = "";
        topContainer.appendChild(createAdUnit(publisherId, topSlot, true));
      }
      if (bottomSlot) {
        bottomContainer.innerHTML = "";
        bottomContainer.appendChild(createAdUnit(publisherId, bottomSlot, true));
      }

      script.addEventListener("load", function () {
        if (!window.adsbygoogle) {
          return;
        }
        if (topSlot) {
          window.adsbygoogle.push({});
        }
        if (bottomSlot) {
          window.adsbygoogle.push({});
        }
      });
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
