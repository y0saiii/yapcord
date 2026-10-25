(function () {
  "use strict";


  var RAW = {
    "Smileys & Emotion":
      "😀 grinning happy smile face,😃 grinning big eyes happy,😄 grinning smiling eyes happy," +
      "😁 beaming smile happy,😆 squinting laugh happy,😅 sweat smile relief nervous,🤣 rofl rolling laugh lol," +
      "😂 tears joy laughing cry funny,🙃 upside down silly sarcasm,🙂 slight smile,🙂 simple smile," +
      "😉 wink,🤭 giggle oops,😊 blush smile happy,😇 halo innocent angel,🥰 hearts love adore," +
      "😍 heart eyes love crush,😘 kiss love,😗 kissing face,😙 kiss smile,😋 yummy delicious food," +
      "😎 cool sunglasses,🤓 nerd geek smart,🧐 monocle curious,🤨 raised eyebrow skeptical," +
      "😒 unamused annoyed,🙄 rolling eyes whatever,😴 sleep tired Zzz,😪 sleepy tired," +
      "😫 exhausted tired,🥺 please pleading eyes cute,😢 cry sad tear,😭 sobbing crying sad," +
      "😤 frustrated steam triumph,😠 angry mad,😡 furious rage,🤬 cursing swearing," +
      "🤢 nauseated sick,🤮 vomiting sick,😱 scream shock fear,😨 fearful scared,😰 nervous worried," +
      "🤗 hug,🤔 thinking hmm consider,🫡 saluting respect,🤫 shush secret quiet,😶 speechless silent," +
      "😐 neutral blank,😑 expressionless,😬 awkward wince teeth,🤪 goofy zany wild,😵 dizzy crossed eyes," +
      "🤯 mind blown exploding,🤠 cowboy hat,😈 devil horns,👻 ghost spooky boo,💀 skull death," +
      "☠️ skull crossbones death,💩 poop,🤖 robot bot,🎃 halloween pumpkin,👽 alien space," +
      "🥵 hot face sweating,🥶 cold face freezing,😳 flushed embarrassed,🫠 melting overwhelmed," +
      "🥴 woozy face,😛 tongue out,😝 squinting tongue,😜 playful winking tongue,😔 pensive sad," +
      "😟 worried,😕 confused,😣 persevering sad,😖 confounded,😞 disappointed," +
      "😥 sad but relieved,😢 crying,😰 anxious,😨 fear,😩 weary,😪 drowsy,😷 face with mask," +
      "🤒 fever,🤕 injured head,🤑 money face,🤠 hat face,🤡 clown,💩 poop pile",

    "People & Body":
      "👍 thumbs up like yes good,👍 plus one,👎 thumbs down no dislike,👌 ok hand perfect," +
      "✌️ victory peace,🤞 crossed fingers luck,🤟 love you sign,🤘 rock horns,🤙 call me hand," +
      "👋 wave hello hi,✋ stop high five,🤚 raised hand,🖐️ fingers spread,☝️ point up," +
      "👇 point down,👉 point right,👈 point left,👆 point up,👊 fist bump,✊ fist power," +
      "🤛 left fist,🤜 right fist,👏 clap applause,🙌 raised hands celebrate,🙏 please thanks prayer," +
      "🤲 palms up together,💪 flex strong muscle,🤏 pinched small,💅 nails polish sass,👀 eyes look," +
      "👅 tongue,👄 lips,💋 kiss mark,🧍 standing person,🧎 kneeling person,🚶 walking," +
      "🏃 running fast,💃 dancing,🕺 dancing man,🧗 climbing,🏄 surfing,🏊 swimming,🚴 cycling," +
      "🏂 snowboarding,🏋️ lifting weights gym,🤸 cartwheel gymnastics,🤼 wrestling,🤽 water polo," +
      "🤾 handball,🧘 meditation yoga,🧖 spa steam,👯 dancers,🧑‍🚀 astronaut,👮 police officer," +
      "🕵️ detective,💂 guard,👷 construction worker,🤴 prince,👸 princess,🧙 wizard,🧚 fairy," +
      "🧛 vampire,🧟 zombie,🎅 santa claus,🤶 mrs claus,🧞 genie,🧜 mermaid," +
      "🧝 elf,🫶 heart hands love,🫰 hand with fingers money,🖖 vulcan salute,🫵 pointing at you," +
      "🤌 pinched fingers,🧠 brain smart,🦴 bone,🪶 feather,🧑‍🤝‍🧑 holding hands friends," +
      "👫 couple people,👪 family,🤰 pregnant woman,👶 baby,👦 boy,👧 girl,🧑 person,👨 man,👩 woman," +
      "👴 old man,👵 old woman,🙍 frowning person,🙎 pouting person,🙅 no gesture refusal," +
      "🙆 ok gesture,🙋 raising hand,🙇 bowing person,🤦 facepalm,🤷 shrug person,🫷 leftwards push," +
      "🫸 rightwards push,🤝 handshake deal agreement,👋 goodbye",

    "Animals & Nature":
      "🐶 dog puppy pet,🐱 cat kitten pet,🐭 mouse,🐹 hamster,🐰 rabbit bunny,🦊 fox,🦊 fox clever," +
      "🐻 bear,🐼 panda cute,🐨 koala,🐯 tiger,🦁 lion,🐮 cow,🐷 pig,🐸 frog,🐵 monkey,🐔 chicken," +
      "🐦 bird,🐤 chick baby,🦆 duck,🦅 eagle,🦉 owl,🦇 bat,🐺 wolf,🐗 boar,🐴 horse,🦄 unicorn," +
      "🐝 bee,🐛 bug caterpillar,🦋 butterfly,🐌 snail,🐜 ant,🕷️ spider,🕸️ spider web,🐢 turtle," +
      "🐍 snake,🦎 lizard,🐙 octopus,🦑 squid,🦐 shrimp,🦀 crab,🐡 puffer fish,🐠 tropical fish," +
      "🐬 dolphin,🐳 whale,🦈 shark,🐳 whale spout,🦞 lobster,🦑 squid ink,🐙 octopus legs," +
      "🌸 cherry blossom,🌷 tulip,🌹 rose,🌺 hibiscus,🌻 sunflower,🌼 blossom,🥀 wilting flower," +
      "🌿 herb,🍀 four leaf clover luck,🍁 maple leaf,🍂 fallen leaves,🍃 leaf wind,🌱 seedling," +
      "🌴 palm tree,🌵 cactus,🌲 evergreen,🌳 tree,🌎 earth americas world,🌏 earth asia," +
      "🌍 earth europe africa,🌑 new moon,🌕 full moon,🌙 crescent moon,⭐ star," +
      "🌟 glowing star,✨ sparkles magic,💫 dizzy star,🌈 rainbow,⛈️ thunderstorm,🌧️ rain cloud," +
      "❄️ snowflake cold,☀️ sun hot,☁️ cloud,⛅ partly sunny,🌤️ sun behind cloud,🌪️ tornado," +
      "🌊 wave,💧 droplet,🔥 fire hot lit trending,🌋 volcano,💨 wind dash,🐚 shell,🪸 coral," +
      "🐾 paw prints,🐈 cat small,🐕 dog small,🐓 rooster,🦃 turkey,🐧 penguin,🐞 ladybug," +
      "🐨 koala cute,🦁 mane,🐙 tentacles,🐡 blowfish,🦈 fin,🐋 large whale,🪲 beetle,🦗 cricket," +
      "🪳 cockroach,🦟 mosquito,🪰 fly,🐝 bumblebee,🐞 ladybird,🦀 pincer",

    "Food & Drink":
      "🍏 green apple,🍎 red apple,🍐 pear,🍊 orange fruit,🍋 lemon,🍌 banana,🍉 watermelon,🍇 grapes," +
      "🍓 strawberry,🍒 cherry,🥝 kiwi,🍑 peach,🥭 mango,🍍 pineapple,🥥 coconut,🍅 tomato," +
      "🥑 avocado,🍆 eggplant,🥔 potato,🥕 carrot,🌽 corn,🌶️ hot pepper spicy,🥒 cucumber," +
      "🥬 leafy green,🥦 broccoli,🧄 garlic,🧅 onion,🍄 mushroom,🥜 peanuts,🌰 chestnut,🍞 bread," +
      "🥐 croissant,🥖 baguette,🥨 pretzel,🥯 bagel,🧀 cheese,🥚 egg,🍳 cooked breakfast," +
      "🥞 pancakes,🧇 waffle,🥓 bacon,🍔 burger,🍟 fries potato,🍕 pizza pie,🌭 hotdog," +
      "🥪 sandwich,🌮 taco,🥙 pita wrap,🍜 ramen noodles,🍝 spaghetti,🍲 stew soup,🍣 sushi," +
      "🍱 bento box,🍤 shrimp tempura,🍚 cooked rice,🍘 rice cracker,🍥 fish cake,🥟 dumpling," +
      "🍡 dango,🍦 ice cream cone,🍨 sundae,🍰 shortcake slice,🎂 birthday cake,🧁 cupcake," +
      "🥧 pie,🍫 chocolate,🍬 candy,🍭 lollipop,🍯 honey,🥛 glass of milk,☕ coffee hot drink," +
      "🍵 tea cup,🧃 juice box,🥤 bubble tea with straw,🍺 beer mug,🍻 cheers clinking beers," +
      "🥂 champagne glasses,🍷 wine glass,🍸 cocktail drink,🍹 tropical drink,🧉 mate drink," +
      "🍶 sake bottle,🥃 whiskey glass,🍩 donut doughnut,🍪 cookie biscuit,🍰 dessert," +
      "🍨 frozen dessert,🥡 takeout box,🍙 rice ball,🥠 fortune cookie,🫖 teapot,🧂 salt shaker",

    "Travel & Places":
      "🚗 car taxi,🚕 taxi cab,🚙 sport utility vehicle,🚌 bus,🚎 trolleybus,🏎️ racing car," +
      "🚓 police car,🚑 ambulance,🚒 fire truck,🚐 van,🚚 truck,🚛 semi truck,🚜 tractor," +
      "🛵 motor scooter,🏍️ motorcycle,🚲 bicycle,🛴 kick scooter,🛹 skateboard,✈️ airplane travel," +
      "🚁 helicopter,🚀 rocket space,🛸 ufo flying saucer,🚂 train,🚃 tram car,🚄 high speed train," +
      "🚅 bullet train,🚝 monorail,🚞 mountain car,🚋 cable car,🚢 ship boat,⛵ sailboat," +
      "🛥️ motor boat,🚤 speed boat,🛳️ passenger ship,🗺️ world map,🗿 moai statue," +
      "🗽 statue of liberty,🗼 tokyo tower,🏰 european castle,🏯 japanese castle,🏟️ stadium," +
      "🎡 ferris wheel,🎢 roller coaster,🎠 carousel,⛲ water fountain,⛪ church," +
      "🕌 mosque,🕍 synagogue,⛰️ mountain,🏔️ snow mountain,🌋 volcano,🏕️ camping tent," +
      "⛺ tent,🏖️ beach umbrella,🏝️ island,🏜️ desert,🌅 sunrise,🌄 mountain sunrise,🌇 sunset," +
      "🌆 city dusk,🌃 city night,🌌 milky way,🌉 bridge,🏙️ cityscape,🛤️ railway track," +
      "📍 round pin,🧭 compass,🏠 house,🏢 office building,🏭 factory,🏡 house with garden," +
      "🏚️ abandoned house,🏯 fort,🕌 prayer building,🚉 station,🛫 airplane departure," +
      "🛬 airplane arrival,🚊 tram,🚈 light rail,🛰️ satellite in space,🚢 cargo",

    "Activities":
      "⚽ soccer football,🏀 basketball hoop,🏈 american football,⚾ baseball,🎾 tennis," +
      "🏐 volleyball,🏉 rugby,🎱 pool eight ball,🏓 ping pong,🏸 badminton,🥅 goal net," +
      "🏹 bow and arrow,🎣 fishing pole,🥊 boxing glove,🥋 martial arts uniform,🎽 running shirt," +
      "🛷 sled,⛸️ ice skate,🎿 ski,🏂 snowboard,🏋️ weight lifting,🤸 gymnastics,🤼 wrestling," +
      "🤽 water polo,🤾 handball,🏆 trophy winner,🥇 gold medal first,🥈 silver medal," +
      "🥉 bronze medal,🎖️ military medal,🏅 sports medal,🎫 ticket,🎪 circus tent," +
      "🎭 performing arts,🎬 clapper board,🎤 microphone stand,🎧 headphones music," +
      "🎼 musical score,🥁 drum,🎷 saxophone,🎺 trumpet,🎸 guitar,🎻 violin,🎹 piano keyboard," +
      "🎰 slot machine,🎲 dice game,🎯 dartboard target,🎳 bowling pins,🎮 video game controller," +
      "🕹️ joystick,🧩 puzzle piece,🃏 joker card,🀄 mahjong tile,🎴 flower playing cards," +
      "🏆 trophy champion,🎨 art palette,🎞️ film frames,📽️ movie projector,🎶 musical notes," +
      "📣 megaphone,📢 loudspeaker,🎪 big top,🎗️ reminder ribbon,🏅 champion award,🎟️ admission ticket," +
      "⚽ goal scored,🏸 shuttlecock,🏐 serve,🎲 roll,🎲 pair of dice",

    "Objects":
      "⌚ wristwatch,📱 mobile phone,📞 telephone receiver,☎️ black telephone,💻 laptop computer," +
      "⌨️ keyboard,🖥️ desktop computer,🖨️ printer,🖱️ computer mouse,💾 floppy disk,💿 optical disk," +
      "📀 dvd disc,📼 videocassette,📷 camera,📸 camera with flash,📹 camcorder,🎥 movie camera," +
      "📺 television,📻 radio,⏱️ stopwatch,⏲️ timer clock,⏰ alarm clock,🕰️ mantelpiece clock," +
      "📡 satellite antenna,📶 antenna bars,🔋 battery charge,🔌 electric plug,💡 idea light bulb," +
      "🔦 flashlight,🕯️ candle,🧯 fire extinguisher,🛢️ oil drum,💵 dollar banknote,💶 euro banknote," +
      "💳 credit card,🪙 coin,💰 money bag,🔧 wrench,🔨 hammer,🛠️ hammer wrench tools," +
      "⚙️ gear settings,⛓️ chains,⚡ high voltage lightning,🔒 lock closed,🔓 lock open,🔑 key," +
      "🪝 hook,🧲 magnet,💉 syringe,💊 pill capsule,🩹 adhesive bandage,🩺 stethoscope,🚬 cigarette," +
      "🧻 roll of paper,🪥 toothbrush,🪒 razor,🧼 soap bar,🧴 lotion bottle,🪣 bucket,🧹 broom," +
      "🧺 basket,🛒 shopping cart,🎁 wrapped gift present,🎈 balloon,🎊 confetti ball," +
      "🎉 party popper tada,🪅 piñata,🎀 ribbon bow,🏷️ label tag,📦 package box,📬 mailbox open," +
      "📮 postbox,📝 memo writing note,📋 clipboard,📊 bar chart,📈 chart increasing up," +
      "📉 chart decreasing down,📌 push pin,📎 paperclip,✂️ scissors,🗑️ wastebasket trash,🔪 kitchen knife," +
      "🍴 fork and knife,🥄 spoon,🫙 jar,🧳 luggage suitcase,🕶️ sunglasses,👓 eyeglasses," +
      "🥽 goggles,🧢 baseball cap,👒 woman hat,👑 crown royal,👗 dress,👕 t shirt,👖 jeans trousers," +
      "👔 necktie,🧣 scarf,🧤 gloves,🧦 socks,👞 leather shoe,👟 sneaker shoe,👡 sandal," +
      "👠 high heel shoe,👢 boot,👛 purse,👜 handbag,💼 briefcase,🎒 school backpack," +
      "👛 wallet purse,💄 lipstick makeup,💍 ring diamond,🎒 bag,🎁 present,⛑️ rescue worker helmet," +
      "💍 engagement ring,🔔 bell,🔕 bell with slash,📣 bullhorn",

    "Symbols":
      "🔴 red circle,🟠 orange circle,🟡 yellow circle,🟢 green circle,🔵 blue circle,🟣 purple circle," +
      "⚫ black circle,⚪ white circle,🟫 brown circle,⭕ heavy circle,✅ check mark yes done complete," +
      "✔️ heavy check mark,❌ cross mark no fail error,✖️ heavy multiplication,➕ heavy plus," +
      "➖ heavy minus,➗ heavy division,♾️ infinity,💲 heavy dollar sign,💱 currency exchange," +
      "™️ trademark,©️ copyright,®️ registered,❗ exclamation mark important,❓ question mark," +
      "❔ white question mark,❕ white exclamation mark,⁉️ interrobang,1️⃣ keycap one,2️⃣ keycap two," +
      "3️⃣ keycap three,🔟 keycap ten,🔢 input numbers,#️⃣ keycap number star,⭐ white star," +
      "🚩 triangular flag,🏳️ white flag,🏴 black flag,♻️ recycle symbol,🔰 Japanese beginner symbol," +
      "✴️ eight point star,✳️ eight spoked asterisk,❇️ sparkle emblem,🔱 trident emblem," +
      "⚜️ fleur de lis,☮️ peace symbol,☯️ yin yang,☸️ wheel of dharma,✡️ star of david," +
      "🔯 star of David six pointed,🕎 menorah,☦️ orthodox cross,🛐 religious symbol,⚛️ atom symbol," +
      "🉑 Japanese accept button,🆔 id button,🆑 cl button,🆎 ab button,🆒 cool button,🆕 new button," +
      "🆓 free button,🆖 ng button,🆗 ok button,🆘 sos button,🆙 up button,❤️ red heart love," +
      "🧡 orange heart,💛 yellow heart,💚 green heart,💙 blue heart,💜 purple heart,🖤 black heart," +
      "🤍 white heart,🤎 brown heart,💔 broken heart sad,❣️ heart exclamation,💕 two hearts," +
      "💞 revolving hearts,💓 beating heart,💗 growing heart,💖 sparkling heart,💘 heart with arrow," +
      "💝 heart with ribbon,💟 heart decoration,🅰️ a button,🅱️ b button,🅾️ o button," +
      "🈁 Japanese here button,🈂️ Japanese service charge,🈷️ Japanese monthly amount," +
      "🈚 Japanese free of charge,🈸 Japanese application,🈺 Japanese open for business," +
      "🈳 Japanese vacancy,⬆️ up arrow,⬇️ down arrow,⬅️ left arrow,➡️ right arrow,↗️ arrow up right," +
      "↘️ arrow down right,↙️ arrow down left,↖️ arrow up left,↔️ left right arrow,↕️ up down arrow," +
      "🔁 clockwise arrows,🔂 repeat single,🔀 shuffle arrows,▶️ play button,⏸️ pause button," +
      "⏹️ stop button,⏭️ next track button,⏮️ last track button,⏩ fast forward,⏪ fast reverse," +
      "🔔 bell notification,🔕 muted bell,♿ wheelchair accessible,☢️ radioactive,☣️ biohazard," +
      "📵 no mobile phones,📳 vibration mode,🆘 sos help,⚠️ warning caution,🚫 prohibited," +
      "⛔ no entry,🔞 no under eighteen,☑️ ballot box checked,❔ white question,❕ white bang," +
      "♻️ reusable,⚜️ heraldic,🔱 poseidon,✡️ jew,☯️ zen,☸️ buddhist,☮️ pacifist,⚛️ science," +
      "🔞 adult only,📵 phone off,🈳 empty,🈴 pass,㊗️ congrats,㊙️ secret,🈵 full,🈹 discount"
  };

  var ORDER = [
    "Smileys & Emotion", "People & Body", "Animals & Nature", "Food & Drink",
    "Travel & Places", "Activities", "Objects", "Symbols"
  ];

  var SITE_MAP = {
    "Smileys": "Smileys & Emotion",
    "Gestures": "People & Body",
    "Symbols": "Symbols",
    "Nature and things": "Animals & Nature"
  };

  var site = window.YapCordEmojiData || { UE: [], UMAP: {} };

  function parse(str) {
    var out = [];
    str.split(",").forEach(function (part) {
      part = part.trim();
      if (!part) return;
      var i = part.indexOf(" ");
      var ch = i < 0 ? part : part.slice(0, i);
      var kw = i < 0 ? "" : part.slice(i + 1);
      out.push([ch, kw]);
    });
    return out;
  }

  var cats = new Map();

  function add(name, list) {
    if (!cats.has(name)) cats.set(name, new Map());
    var m = cats.get(name);
    list.forEach(function (pair) {
      var ch = pair[0], kw = pair[1];
      if (!ch) return;
      if (!m.has(ch)) m.set(ch, []);
      if (kw && m.get(ch).indexOf(kw) < 0) m.get(ch).push(kw);
    });
  }

  (site.UE || []).forEach(function (cat) {
    if (!Array.isArray(cat)) return;
    add(SITE_MAP[cat[0]] || cat[0], cat[1] || []);
  });

  Object.keys(RAW).forEach(function (name) { add(name, parse(RAW[name])); });

  var names = ORDER.filter(function (n) { return cats.has(n); });
  Object.keys(cats).forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); });

  var scByChar = {};
  Object.keys(site.UMAP || {}).forEach(function (kw) {
    var ch = site.UMAP[kw];
    if (ch && !scByChar[ch]) scByChar[ch] = kw;
  });

  var categories = names.map(function (name) {
    var m = cats.get(name);
    var list = [];
    m.forEach(function (kws, ch) { list.push([ch, kws.join(" "), scByChar[ch] || ""]); });
    return [name, list];
  });

  var byChar = {};
  categories.forEach(function (c) {
    c[1].forEach(function (e) { byChar[e[0]] = { ch: e[0], kw: e[1], sc: e[2], cat: c[0] }; });
  });

  window.YapCordEmojiData = {
    UMAP: site.UMAP || {},
    categories: categories,
    byChar: byChar,
    count: Object.keys(byChar).length
  };
})();
