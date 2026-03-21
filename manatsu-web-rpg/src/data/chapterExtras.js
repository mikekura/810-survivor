(function (ns) {
  function line(speaker, text) {
    return { speaker: speaker, text: text };
  }

  ns.chapterExtras = {
    1: {
      battle: { attackPatterns: ["drizzle", "sweep"] },
      requiredObjectives: 3,
      interactives: [
        {
          id: "station-board",
          label: "案内板",
          type: "inspect",
          actionLabel: "しらべる",
          x: 130,
          y: 154,
          width: 44,
          height: 52,
          required: true,
          firstLines: [
            line("SYSTEM", "駅前案内板。手書きで『今日は8:10から暑い』と追記されている。"),
            line("主人公", "8:10……変に具体的だな。")
          ],
          repeatLines: [
            line("SYSTEM", "『8:10』のメモだけが妙に新しい。")
          ]
        },
        {
          id: "locker-810",
          label: "ロッカー810",
          type: "puzzle",
          actionLabel: "番号を入れる",
          x: 560,
          y: 152,
          width: 52,
          height: 56,
          required: true,
          prompt: "ロッカー810の暗証番号を入力",
          answer: "810",
          firstLines: [
            line("SYSTEM", "ロッカーの札に『810』と刻まれている。"),
            line("主人公", "暗証番号まで同じとは限らないけど、試してみる価値はある。")
          ],
          successLines: [
            line("SYSTEM", "カチリと開いた。中には町の簡易地図と、学校への近道メモが入っている。"),
            line("主人公", "駅前に置く情報じゃないだろこれ。")
          ],
          failLines: [
            line("SYSTEM", "違う番号だ。内部からセミの鳴き声だけ返ってきた。")
          ],
          rewardItem: {
            name: "駅前地図",
            description: "学校への近道と、意味深な数字メモが書かれている。"
          }
        },
        {
          id: "cooler-box",
          label: "保冷箱",
          type: "rest",
          actionLabel: "ひやす",
          x: 754,
          y: 444,
          width: 44,
          height: 54,
          heal: 4,
          firstLines: [
            line("SYSTEM", "冷却シートが少しだけ残っていた。"),
            line("主人公", "生き返る……。")
          ],
          repeatLines: [
            line("SYSTEM", "もう中身はほとんど残っていない。")
          ],
          required: true
        }
      ]
    },
    2: {
      battle: { attackPatterns: ["sweep", "wave", "ring"] },
      requiredObjectives: 3,
      interactives: [
        {
          id: "rumor-board",
          label: "うわさ板",
          type: "inspect",
          actionLabel: "よむ",
          x: 340,
          y: 132,
          width: 52,
          height: 54,
          required: true,
          firstLines: [
            line("SYSTEM", "『先輩はこわい』『先輩はやさしい』『先輩は冷蔵庫に強い』"),
            line("主人公", "最後だけ誰の感想なんだ。")
          ],
          repeatLines: [
            line("SYSTEM", "どの張り紙も、書き手が違うのに同じ熱気を帯びている。")
          ]
        },
        {
          id: "arcade-shutter",
          label: "閉じたシャッター",
          type: "inspect",
          actionLabel: "きく",
          x: 716,
          y: 170,
          width: 62,
          height: 74,
          required: true,
          firstLines: [
            line("SYSTEM", "耳を当てると、向こう側から誰かの笑い声と屋台の音が混ざって聞こえる。"),
            line("主人公", "まだ祭りの前触れが残ってるのか。")
          ],
          repeatLines: [
            line("SYSTEM", "金属の熱だけが残っている。")
          ]
        },
        {
          id: "receipt-pile",
          label: "レシート束",
          type: "inspect",
          actionLabel: "めくる",
          x: 538,
          y: 430,
          width: 56,
          height: 52,
          required: true,
          firstLines: [
            line("SYSTEM", "古いレシートが輪ゴムでまとめられている。時刻だけが全部『8:10』だ。"),
            line("主人公", "商店街までこの数字で揃ってるのか。")
          ],
          repeatLines: [
            line("SYSTEM", "紙は薄いのに、数字だけ妙に濃い。")
          ]
        }
      ]
    },
    3: {
      battle: { attackPatterns: ["cross", "ring", "drizzle"] },
      requiredObjectives: 3,
      interactives: [
        {
          id: "record-shelf",
          label: "記録棚",
          type: "inspect",
          actionLabel: "よむ",
          x: 216,
          y: 156,
          width: 60,
          height: 64,
          required: true,
          firstLines: [
            line("SYSTEM", "保健記録には、暑さのピークが『15:44』で揃っている。"),
            line("主人公", "またその時刻だ。")
          ],
          repeatLines: [
            line("SYSTEM", "同じ時間だけが何年分も重なっている。")
          ]
        },
        {
          id: "water-valve",
          label: "給水バルブ",
          type: "puzzle",
          actionLabel: "まわす",
          x: 720,
          y: 350,
          width: 46,
          height: 52,
          required: true,
          prompt: "バルブの目盛りを入力（4桁）",
          answer: "1544",
          firstLines: [
            line("SYSTEM", "バルブの横に、かすれた数字『15:44』のメモが貼られている。"),
            line("主人公", "まさかそのまま……？")
          ],
          successLines: [
            line("SYSTEM", "水圧が安定し、保健室側の扉が少し軽くなった。")
          ],
          failLines: [
            line("SYSTEM", "配管が唸るだけで変化はない。")
          ]
        },
        {
          id: "pool-marker",
          label: "コース札",
          type: "inspect",
          actionLabel: "たどる",
          x: 564,
          y: 150,
          width: 52,
          height: 56,
          required: true,
          firstLines: [
            line("SYSTEM", "コース札が『1』『1』『4』『5』『1』『4』の順で裏返されている。"),
            line("主人公", "114514を崩して残してるみたいだ。")
          ],
          repeatLines: [
            line("SYSTEM", "水面に映る数字だけがやけに鮮明だ。")
          ]
        }
      ]
    },
    4: {
      battle: { attackPatterns: ["wave", "walls", "cross"] },
      requiredObjectives: 3,
      interactives: [
        {
          id: "schedule-board",
          label: "時刻表",
          type: "inspect",
          actionLabel: "みる",
          x: 168,
          y: 146,
          width: 58,
          height: 64,
          required: true,
          firstLines: [
            line("SYSTEM", "どの便も『遅延』ではなく『保留』になっている。"),
            line("主人公", "終わってない扱いなんだな。")
          ],
          repeatLines: [
            line("SYSTEM", "誰かが『まだ帰れる』と書いて、消した跡がある。")
          ]
        },
        {
          id: "ticket-gate-key",
          label: "点検端末",
          type: "inspect",
          actionLabel: "のぞく",
          x: 690,
          y: 152,
          width: 56,
          height: 58,
          required: true,
          firstLines: [
            line("SYSTEM", "端末には『最終認証は第7章相当までロック』とだけ表示されている。"),
            line("主人公", "ずいぶんメタな閉じ方だな。")
          ],
          repeatLines: [
            line("SYSTEM", "今はまだ使えない。")
          ]
        },
        {
          id: "platform-speaker",
          label: "放送端末",
          type: "inspect",
          actionLabel: "きく",
          x: 458,
          y: 118,
          width: 56,
          height: 54,
          required: true,
          firstLines: [
            line("SYSTEM", "『8番ホーム、10番扉付近をご利用ください』という放送だけが繰り返される。"),
            line("主人公", "ここでも8と10か。")
          ],
          repeatLines: [
            line("SYSTEM", "途切れる直前だけ、人の息づかいが混ざる。")
          ]
        }
      ]
    },
    5: {
      battle: { attackPatterns: ["burst", "ring", "sweep"] },
      requiredObjectives: 3,
      interactives: [
        {
          id: "lantern-row",
          label: "提灯列",
          type: "inspect",
          actionLabel: "ともす",
          x: 110,
          y: 118,
          width: 74,
          height: 56,
          required: true,
          firstLines: [
            line("SYSTEM", "ひとつだけまだ灯る提灯がある。"),
            line("主人公", "終わってない気配を、誰かが残したんだな。")
          ],
          repeatLines: [
            line("SYSTEM", "赤い光がわずかに揺れている。")
          ]
        },
        {
          id: "festival-drum",
          label: "太鼓台",
          type: "puzzle",
          actionLabel: "たたく",
          x: 730,
          y: 352,
          width: 64,
          height: 60,
          required: true,
          prompt: "太鼓の拍を入力（3桁）",
          answer: "810",
          firstLines: [
            line("SYSTEM", "台の裏に『8・1・0』とチョークで書いてある。"),
            line("主人公", "ここでも810か。")
          ],
          successLines: [
            line("SYSTEM", "正しい拍で叩くと、祭りばやしが少しだけ整った。")
          ],
          failLines: [
            line("SYSTEM", "音が散って、すぐに消えた。")
          ]
        },
        {
          id: "goldfish-bowl",
          label: "金魚鉢",
          type: "inspect",
          actionLabel: "のぞく",
          x: 516,
          y: 420,
          width: 58,
          height: 54,
          required: true,
          firstLines: [
            line("SYSTEM", "水面に『8』『1』『0』の屋台札が揺れて映る。"),
            line("主人公", "祭りの景色まで、数字の癖が強いな。")
          ],
          repeatLines: [
            line("SYSTEM", "すくう網だけが誰も触れないまま残っている。")
          ]
        }
      ]
    },
    6: {
      battle: { attackPatterns: ["storm", "walls", "burst"] },
      requiredObjectives: 3,
      interactives: [
        {
          id: "fear-poster",
          label: "噂ポスター",
          type: "inspect",
          actionLabel: "はがす",
          x: 166,
          y: 160,
          width: 58,
          height: 64,
          required: true,
          firstLines: [
            line("SYSTEM", "『見た目だけで決めるな』と誰かが上書きしている。"),
            line("主人公", "先輩本人の字かもな。")
          ],
          repeatLines: [
            line("SYSTEM", "紙の下から別の悪口が何枚も出てくる。")
          ]
        },
        {
          id: "tower-switch",
          label: "時計台スイッチ",
          type: "inspect",
          actionLabel: "いれる",
          x: 772,
          y: 250,
          width: 52,
          height: 60,
          required: true,
          firstLines: [
            line("SYSTEM", "スイッチを入れると、時計台の影がわずかに短くなる。"),
            line("主人公", "正午に近づいてる……のか？")
          ],
          repeatLines: [
            line("SYSTEM", "影の角度だけが変わっていく。")
          ]
        },
        {
          id: "beast-shadow",
          label: "獣の影",
          type: "inspect",
          actionLabel: "みつめる",
          x: 468,
          y: 408,
          width: 62,
          height: 62,
          required: true,
          firstLines: [
            line("SYSTEM", "黒い影は先輩の形に似ているが、目だけが噂で塗りつぶされている。"),
            line("主人公", "これが町の見てる“こわさ”か。")
          ],
          repeatLines: [
            line("SYSTEM", "近くで見るほど、本人とは違う輪郭が増えていく。")
          ]
        }
      ]
    },
    7: {
      battle: { attackPatterns: ["storm", "ring", "walls"] },
      requiredObjectives: 3,
      interactives: [
        {
          id: "memory-note",
          label: "古いメモ",
          type: "inspect",
          actionLabel: "よむ",
          x: 124,
          y: 152,
          width: 54,
          height: 58,
          required: true,
          firstLines: [
            line("SYSTEM", "『ここに残る。最後に帰れなかったやつのぶんまで見送る』"),
            line("主人公", "これ、先輩の字だ。")
          ],
          repeatLines: [
            line("SYSTEM", "書き直した跡が何度も残っている。")
          ]
        },
        {
          id: "terminal-114514",
          label: "最終端末",
          type: "puzzle",
          actionLabel: "にんしょう",
          x: 730,
          y: 170,
          width: 64,
          height: 70,
          required: true,
          prompt: "最終認証コードを入力",
          answer: "114514",
          firstLines: [
            line("SYSTEM", "端末に『最終認証コード 114514』と薄く残っている。"),
            line("主人公", "露骨だな……でも、ここまで来たら使うしかない。")
          ],
          successLines: [
            line("SYSTEM", "認証成功。封じられていた記録がひらく。"),
            line("SYSTEM", "『最初にこの町へ残ったのは、当時の水泳部の先輩だった』"),
            line("主人公", "……先輩の正体。やっと繋がった。")
          ],
          failLines: [
            line("SYSTEM", "認証失敗。まだ何かが足りない。")
          ]
        },
        {
          id: "senpai-reveal",
          label: "先輩の記憶",
          type: "inspect",
          actionLabel: "ふれる",
          x: 492,
          y: 418,
          width: 56,
          height: 62,
          required: true,
          firstLines: [
            line("先輩", "……俺は、この町に最初に取り残された側だった。"),
            line("先輩", "誰かを帰らせるたびに、自分だけ後ろへ残る。それをずっとやってた。"),
            line("主人公", "だから、噂より先に人を助けて回ってたのか。")
          ],
          repeatLines: [
            line("先輩", "最後くらいは、自分も前に進みたい。")
          ]
        }
      ],
      overridePostBattle: {
        spared: [
          line("SYSTEM", "最終端末の記録とともに、先輩の本当の立場がほどけていく。"),
          line("先輩", "俺は、この町で最初に帰れなかった“先輩”だった。"),
          line("主人公", "ずっとみんなを見送って、自分だけ残ってたんだな。"),
          line("先輩", "ああ。でも、今回は違う。"),
          line("主人公", "今度は一緒に帰ろう。"),
          line("先輩", "見送るばかりで、自分が見送られる想像はしてなかった。"),
          line("主人公", "たまにはそっち側でいてください。"),
          line("先輩", "……悪くないな。")
        ],
        defeated: [
          line("SYSTEM", "記録がひらき、遅れて真実だけが残る。"),
          line("先輩", "俺は、この町で最初に帰れなかった側だった。"),
          line("主人公", "それでも、ここで終わりにはしない。"),
          line("先輩", "……頼む。最後だけでも前へ進ませてくれ。"),
          line("主人公", "今度は置いていかない。"),
          line("先輩", "その言葉があれば、歩ける。")
        ]
      }
    }
  };

  (function applyStoryAdjustments() {
    var chapter4 = ns.chapterData[3];
    var chapter7 = ns.chapterData[6];

    chapter4.intro = [
      line("主人公", "ここだけ、音まで止まってるみたいだ。"),
      line("先輩", "昔、この駅で帰れなかったやつがいた。"),
      line("主人公", "その話、まだ続きがあるんだろ。"),
      line("先輩", "……第7章まで取っておく。"),
      line("主人公", "引っ張るなあ。"),
      line("先輩", "軽く言える話じゃない。")
    ];

    chapter7.intro = [
      line("主人公", "ここが、一番暑くて、一番静かだ。"),
      line("先輩", "ここまで来たら話す。俺のことも、町のことも。"),
      line("主人公", "やっと本題だな。"),
      line("先輩", "お前が来てくれて助かった。ひとりじゃ終われなかった。"),
      line("主人公", "ひとりで終わらせないために、ここまで来たんだ。")
    ];

    chapter7.postBattle = ns.chapterExtras[7].overridePostBattle;
  })();
})(window.ManatsuRPG = window.ManatsuRPG || {});
