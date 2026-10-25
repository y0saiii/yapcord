(function () {
  "use strict";
  const UE = [
  ['Smileys','😀 grinning,😃 smiley,😄 smile,😁 grin,😆 laughing,😅 sweat_smile,😂 joy,🤣 rofl,🙂 slight_smile,😉 wink,😊 blush,😇 innocent,🥰 smiling_hearts,😍 heart_eyes,🤩 star_struck,😘 kissing_heart,😋 yum,😛 tongue,😜 wink_tongue,🤪 zany,🤔 thinking,🤗 hugging,🤭 giggle,🤫 shushing,😐 neutral,😑 expressionless,😶 no_mouth,😏 smirk,😒 unamused,🙄 eye_roll,😬 grimacing,😌 relieved,😔 pensive,😴 sleeping,😷 mask,🤒 sick,🥵 hot,🥶 cold,😵 dizzy_face,🤯 mind_blown,🥳 partying,😎 sunglasses,🤓 nerd,😕 confused,😟 worried,😮 open_mouth,😲 astonished,😳 flushed,🥺 pleading,😢 cry,😭 sob,😱 scream,😞 disappointed,😩 weary,😡 rage,😠 angry,🤬 cursing,😈 imp,💀 skull,💩 poop,🤡 clown,👻 ghost,👽 alien,🤖 robot'],
  ['Gestures','👍 thumbsup,👎 thumbsdown,👌 ok_hand,✌️ victory,🤞 crossed_fingers,🤟 love_you,🤘 metal,👈 point_left,👉 point_right,👆 point_up,👇 point_down,✋ raised_hand,👋 wave,🤝 handshake,🙏 pray,👏 clap,🙌 raised_hands,💪 muscle,🫡 salute,👀 eyes,hi 👋'],
  ['Symbols','❤️ heart,🧡 orange_heart,💛 yellow_heart,💚 green_heart,💙 blue_heart,💜 purple_heart,🖤 black_heart,💔 broken_heart,💯 hundred,🔥 fire,✨ sparkles,⭐ star,🌟 glowing_star,💥 boom,✅ check,❌ x,⚠️ warning,❓ question,❗ exclamation,💤 zzz,🎉 tada,🎁 gift,🏆 trophy'],
  ['Nature and things','🐶 dog,🐱 cat,🐭 mouse,🐰 rabbit,🦊 fox,🐻 bear,🐼 panda,🐸 frog,🐵 monkey,🦄 unicorn,🐢 turtle,🍕 pizza,🍔 burger,🍟 fries,🌮 taco,🍣 sushi,🍩 donut,🍪 cookie,🍰 cake,☕ coffee,🍺 beer,🍎 apple,🍌 banana,🍓 strawberry,⚽ soccer,🏀 basketball,🎮 video_game,🎵 music,🎧 headphones,📱 phone,💻 laptop,💡 bulb,📷 camera,🚀 rocket,🌍 earth,🌈 rainbow,☀️ sun,🌙 moon,🌹 rose,💎 gem,👑 crown']
  ].map(c=>[c[0],c[1].split(',').filter(x=>!x.startsWith('hi ')).map(x=>{const i=x.indexOf(' ');return[x.slice(0,i),x.slice(i+1)]})]);
  UE[1][1].push(['👋','hi']);
  const UMAP = {};
  UE.forEach(c => c[1].forEach(x => { UMAP[x[1]] = x[0]; }));
  window.YapCordEmojiData = { UE: UE, UMAP: UMAP };
})();
