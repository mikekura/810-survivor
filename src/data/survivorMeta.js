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
        desc: text("真昼の熱で反応する不思議なメモ。拾った瞬間に流れを変える。", "A strange memo that reacts to noon heat and swings the run the moment you grab it."),
        effect: text("回復、全回収、追加経験値、即時強化をまとめて起動。", "Triggers healing, full pickup vacuum, bonus XP, and an instant upgrade all at once."),
        source: text("エリート / ボス限定ドロップ", "Elite / boss drop only")
      },
      {
        id: "yarimasuItem",
        pickupKind: "yarimasuItem",
        color: "#ffb86f",
        eliteOnly: true,
        name: text("やりますねえバッジ", "Yarimasu Badge"),
        desc: text("攻めに寄せたい時に火を付ける熱血バッジ。", "A hot-blooded badge that pushes the run into all-out offense."),
        effect: text("フレンジーを付与し、連射とバースト性能を強化。", "Grants frenzy and boosts rapid fire plus burst shots."),
        source: text("エリート / ボス限定ドロップ", "Elite / boss drop only")
      },
      {
        id: "iizoItem",
        pickupKind: "iizoItem",
        color: "#9cffb8",
        eliteOnly: true,
        name: text("いいゾこれチャーム", "Ii Zo Charm"),
        desc: text("危険な場面ほど頼りになる守り寄りの護符。", "A calm defensive charm that shines when the run gets dangerous."),
        effect: text("全回復し、長めのシールドを得る。", "Fully heals and grants a long shield."),
        source: text("エリート / ボス限定ドロップ", "Elite / boss drop only")
      },
      {
        id: "ikuikuItem",
        pickupKind: "ikuikuItem",
        color: "#ff91d7",
        eliteOnly: true,
        name: text("いくいくコール", "Ikuiku Call"),
        desc: text("押し切る時にだけ反応するコールの欠片。", "A call fragment that reacts when it's time to push hard."),
        effect: text("巨大パルスで敵と敵弾を一掃する。", "Unleashes a huge pulse that wipes enemies and projectiles."),
        source: text("エリート / ボス限定ドロップ", "Elite / boss drop only")
      },
      {
        id: "loveItem",
        pickupKind: "loveItem",
        color: "#ff7fb3",
        eliteOnly: true,
        name: text("好きだったんだよブルーム", "Liked You Bloom"),
        desc: text("継戦型ビルドに噛み合う柔らかな色の花。", "A soft-colored bloom that fits sustain-oriented runs."),
        effect: text("回復しつつ、プレイヤー周囲にダメージオーラを展開。", "Heals you and starts a damage aura around the player."),
        source: text("エリート / ボス限定ドロップ", "Elite / boss drop only")
      }
    ],

    fusionRecipes: [
      {
        id: "burstVacation",
        ingredients: ["item114514", "yarimasuItem"],
        color: "#ffb86f",
        name: text("熱波休暇", "Heatburst Holiday"),
        desc: text("攻撃系の融合。火力と連射の両方を底上げする。", "An offensive fusion that permanently boosts both damage and fire rate."),
        result: text("融合時に即時強化とフレンジーを発動。以降ずっと攻撃性能が高い。", "Triggers an upgrade and frenzy on fusion, then keeps offensive power higher for the rest of the run.")
      },
      {
        id: "gentleWave",
        ingredients: ["iizoItem", "loveItem"],
        color: "#9cffb8",
        name: text("やさしい波", "Gentle Wave"),
        desc: text("守備系の融合。HP、防御、回収性能を大きく伸ばす。", "A defensive fusion that heavily improves HP, armor, and pickup utility."),
        result: text("全回復と長時間オーラを付与し、継戦向きの補正を得る。", "Grants full healing, a long aura, and permanent survival-oriented bonuses.")
      },
      {
        id: "vacuumNova",
        ingredients: ["item114514", "ikuikuItem"],
        color: "#ffe07a",
        name: text("114514ノヴァ", "114514 Nova"),
        desc: text("一掃系の融合。回収と全体処理を同時に強化する。", "A wipe-focused fusion that strengthens both vacuum and screen clearing."),
        result: text("巨大パルスと全回収を発動し、回収範囲と特殊回転率も伸びる。", "Triggers a huge pulse and full vacuum, then improves pickup range and special cooldowns.")
      },
      {
        id: "summerOverdrive",
        ingredients: ["yarimasuItem", "ikuikuItem"],
        color: "#d6d0ff",
        name: text("真夏オーバードライブ", "Summer Overdrive"),
        desc: text("速度系の融合。弾速、特殊回転、制圧力をまとめて上げる。", "A speed-oriented fusion that boosts projectile speed, special tempo, and firing pressure."),
        result: text("即時パルスと長時間フレンジーを発動し、特殊のテンポも速くなる。", "Triggers an instant pulse with a long frenzy and permanently speeds up specials.")
      }
    ],

    trueFusionRecipes: [
      {
        id: "solarMyth",
        ingredients: ["burstVacation", "summerOverdrive"],
        color: "#fff1c4",
        trueEvolution: true,
        name: text("真進化・白昼神話", "True Evolution: Solar Myth"),
        desc: text("攻撃融合をさらに束ねた真進化。武器すべての回転が一段上がる。", "A true evolution built from offensive fusions that pushes every weapon into a higher gear."),
        result: text("剣・斧・杖・ビーム・通常弾がすべて強化され、発動時に大規模バーストを起こす。", "Enhances sword, axe, wand, beam, and basic fire all at once, then detonates a huge burst on activation.")
      },
      {
        id: "tidalSanctuary",
        ingredients: ["gentleWave", "vacuumNova"],
        color: "#dffbff",
        trueEvolution: true,
        name: text("真進化・潮騒聖域", "True Evolution: Tidal Sanctuary"),
        desc: text("守備融合を極めた真進化。回復・吸引・防御をまとめて完成させる。", "A true evolution that perfects sustain, vacuum, and defense."),
        result: text("定期回復、長時間シールド、広域吸引、被弾時反撃がすべて強化される。", "Adds periodic healing, long shields, wide vacuum, and stronger retaliatory bursts.")
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
        label: text("全回収アイス", "Vacuum Ice"),
        desc: text("地面の経験値をすべて回収。", "Collect all XP currently on the ground.")
      },
      {
        id: "merchantChest",
        kind: "pickup",
        pickupKind: "chest",
        color: "#f6c453",
        baseCost: 44,
        label: text("宝箱", "Treasure Chest"),
        desc: text("その場で強化を1つ獲得。", "Grants one immediate upgrade.")
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
        label: text("融合箱", "Fusion Crate"),
        desc: text("手持ちの片割れに合わせて、足りない特殊アイテムを補う。", "Provides a special item that helps complete a fusion with your current inventory.")
      }
    ]
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
