(function (ns) {
  function text(ja, en) {
    return { ja: ja, en: en };
  }

  ns.survivorMeta = {
    specialItems: [
      {
        id: "item114514",
        pickupKind: "item114514",
        color: "#ffe07a",
        eliteOnly: true,
        name: text("114514メモ", "114514 Memo"),
        desc: text("真昼の熱に反応する不思議なメモ。拾うだけで場の勢いが変わる。", "A strange memo that reacts to noon heat. The whole run swings when you grab it."),
        effect: text("回復、全回収、追加XP、即時強化をまとめて起こす。", "Triggers healing, XP vacuum, bonus XP, and an instant upgrade all at once."),
        source: text("エリート / ボス限定ドロップ", "Elite / boss drop only")
      },
      {
        id: "yarimasuItem",
        pickupKind: "yarimasuItem",
        color: "#ffb86f",
        eliteOnly: true,
        name: text("やりますねえバッジ", "Yarimasu Badge"),
        desc: text("拾うと一気に攻めに転じる熱量バッジ。", "A hot-blooded badge that pushes the run into all-out offense."),
        effect: text("フレンジー状態になり、連射と一斉射が強化される。", "Grants frenzy and boosts rapid fire plus burst shots."),
        source: text("エリート / ボス限定ドロップ", "Elite / boss drop only")
      },
      {
        id: "iizoItem",
        pickupKind: "iizoItem",
        color: "#9cffb8",
        eliteOnly: true,
        name: text("いいゾ〜これ札", "Ii Zo Charm"),
        desc: text("守りに寄った落ち着いた札。危ない場面ほど頼りになる。", "A calm defensive charm that shines when the run gets dangerous."),
        effect: text("全回復し、長めのシールドを張る。", "Fully heals and grants a long shield."),
        source: text("エリート / ボス限定ドロップ", "Elite / boss drop only")
      },
      {
        id: "ikuikuItem",
        pickupKind: "ikuikuItem",
        color: "#ff91d7",
        eliteOnly: true,
        name: text("いくいくコール", "Ikuiku Call"),
        desc: text("攻め切る瞬間に反応するコール片。", "A call fragment that reacts when it's time to push hard."),
        effect: text("広範囲パルスで敵と敵弾を一気に消し飛ばす。", "Unleashes a huge pulse that wipes enemies and projectiles."),
        source: text("エリート / ボス限定ドロップ", "Elite / boss drop only")
      },
      {
        id: "loveItem",
        pickupKind: "loveItem",
        color: "#ff7fb3",
        eliteOnly: true,
        name: text("好きだったんだよ花", "Liked You Bloom"),
        desc: text("柔らかい色の花弁。生存寄りのビルドに噛み合う。", "A soft-colored bloom that fits sustain-oriented runs."),
        effect: text("回復しつつ、周囲に持続ダメージのオーラを展開する。", "Heals you and starts a damage aura around the player."),
        source: text("エリート / ボス限定ドロップ", "Elite / boss drop only")
      }
    ],

    fusionRecipes: [
      {
        id: "burstVacation",
        ingredients: ["item114514", "yarimasuItem"],
        color: "#ffb86f",
        name: text("烈日114514", "Heatburst 114514"),
        desc: text("攻撃寄りの二種合成。火力と連射の両方が永続で伸びる。", "An offensive fusion. Permanently boosts both damage and fire rate."),
        result: text("合成時に即強化+フレンジー発動。以後の攻撃性能も上昇。", "On fusion, triggers an upgrade and frenzy. Offensive power stays higher for the rest of the run.")
      },
      {
        id: "gentleWave",
        ingredients: ["iizoItem", "loveItem"],
        color: "#9cffb8",
        name: text("やさしい波動", "Gentle Wave"),
        desc: text("守り寄りの二種合成。HP、装甲、回収面が大きく伸びる。", "A defensive fusion that heavily improves HP, armor, and pickup utility."),
        result: text("全回復と長時間オーラに加え、耐久寄りの永続補正を得る。", "Grants full healing, a long aura, and permanent survival-oriented bonuses.")
      },
      {
        id: "vacuumNova",
        ingredients: ["item114514", "ikuikuItem"],
        color: "#ffe07a",
        name: text("114514ノヴァ", "114514 Nova"),
        desc: text("一掃寄りの二種合成。吸引と殲滅をまとめて強化する。", "A wipe-focused fusion that strengthens both vacuum and screen clearing."),
        result: text("大パルスと全回収を起こし、以後の回収範囲と特殊回転率が上がる。", "Triggers a huge pulse and full vacuum, then improves pickup range and special cooldowns.")
      },
      {
        id: "summerOverdrive",
        ingredients: ["yarimasuItem", "ikuikuItem"],
        color: "#d6d0ff",
        name: text("真夏オーバードライブ", "Summer Overdrive"),
        desc: text("速度寄りの二種合成。弾速、特殊回転率、連射圧が伸びる。", "A speed-oriented fusion that boosts projectile speed, special tempo, and firing pressure."),
        result: text("即時パルスと長時間フレンジーを起こし、以後の特殊攻撃も回りやすくなる。", "Triggers an instant pulse with a long frenzy and permanently speeds up specials.")
      }
    ],

    merchantOffers: [
      {
        id: "merchantHeal",
        kind: "pickup",
        pickupKind: "heal",
        color: "#9cffb8",
        baseCost: 18,
        label: text("冷えた麦茶", "Cold Mugicha"),
        desc: text("HPを35回復。", "Restore 35 HP.")
      },
      {
        id: "merchantMagnet",
        kind: "pickup",
        pickupKind: "magnet",
        color: "#7fe6ff",
        baseCost: 28,
        label: text("全回収氷片", "Vacuum Ice"),
        desc: text("落ちているXPを全部回収。", "Collect all XP currently on the ground.")
      },
      {
        id: "merchantChest",
        kind: "pickup",
        pickupKind: "chest",
        color: "#f6c453",
        baseCost: 44,
        label: text("宝箱", "Treasure Chest"),
        desc: text("その場で即強化を1回行う。", "Grants one immediate upgrade.")
      },
      {
        id: "merchantSpecial",
        kind: "special",
        color: "#ff91d7",
        baseCost: 60,
        label: text("エリート便", "Elite Parcel"),
        desc: text("エリート限定の特殊アイテムを1つ受け取る。", "Receive one elite-only special item.")
      },
      {
        id: "merchantFusion",
        kind: "fusion",
        color: "#d6d0ff",
        baseCost: 78,
        label: text("合成箱", "Fusion Crate"),
        desc: text("今の所持状況に合わせて、合成しやすい特殊アイテムを補充する。", "Provides a special item that helps complete a fusion with your current inventory.")
      }
    ]
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
