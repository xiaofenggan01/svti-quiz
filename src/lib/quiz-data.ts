/**
 * SVTI 测评问卷数据 + 评分逻辑
 *
 * 30 道基于《星露谷物语》的情景选择题（每轴 10 题）
 * 每题 3 个选项，分值贡献为 -3 / 0~+2 / +3
 * 三轴各累加后归一化到 0-100，再走 calcSVTI() 得到 25 种人格
 */

/* ------------------------------------------------------------------ */
/*  Persona Axes (self-contained, no external deps)                    */
/* ------------------------------------------------------------------ */

export interface PersonaAxes {
  /** 0 = 宅家驻守, 100 = 满地图探索 */
  initiative: number;
  /** 0 = 搞钱效率, 100 = 情感体验 */
  game_style: number;
  /** 0 = 死磕秩序, 100 = 随机整活 */
  speech_style: number;
}

/* ------------------------------------------------------------------ */
/*  SVTI Type Definitions                                              */
/* ------------------------------------------------------------------ */

export type SVTIId =
  | "RELA" | "JOJA" | "LOVE" | "WILD" | "MINE"
  | "CASH" | "DECO" | "OUTF" | "FARM"
  | "TIME" | "PETS" | "GAMB" | "ACHI"
  | "GIFT" | "CHEF" | "MODS" | "HOAR"
  | "BOMB" | "SLEP" | "MUSE" | "LUCK"
  | "FISH" | "WEED" | "CRAB" | "TAVN";

export interface SVTIType {
  id: SVTIId;
  name: string;
  icon: string;
  portrait: string;
  tags: string;
}

export const SVTI_TYPES: Record<SVTIId, SVTIType> = {
  RELA: { id: "RELA", name: "佛系养老玩家", icon: "/icons/Golden_Walnut.png", portrait: "不在乎进度，万物皆空，坐在海边听海浪。", tags: "绝对中立" },
  JOJA: { id: "JOJA", name: "Joja 蓝星人", icon: "/icons/Morris_Icon.png", portrait: "满世界跑只为了快速用钱砸开所有地图设施。", tags: "探索·搞钱" },
  LOVE: { id: "LOVE", name: "星露谷海王", icon: "/icons/Marriage_Icon.png", portrait: "常备全村人最爱的礼物，满地图乱窜触发红心事件。", tags: "探索·情感" },
  WILD: { id: "WILD", name: "捡破烂达人", icon: "/icons/Wild_Horseradish.png", portrait: "毫无目的地跑图，翻遍每一个垃圾桶，大葱和野洋葱都不放过。", tags: "探索·整活" },
  MINE: { id: "MINE", name: "矿洞原住民", icon: "/icons/The_Mines_Icon.png", portrait: "目标极其明确地往深处探索，眼里只有下到100层和五彩碎片。", tags: "探索·死磕" },
  CASH: { id: "CASH", name: "无情资本家", icon: "/icons/Iridium_Node.png", portrait: "绝不出门社交，农场里塞满酿酒桶，闷声发大财。", tags: "宅家·搞钱" },
  DECO: { id: "DECO", name: "农场装修大师", icon: "/icons/Furniture_Icon.png", portrait: "不出门，花大把时间规划地板颜色和花卉摆放，把农场建得像度假村。", tags: "宅家·美学" },
  OUTF: { id: "OUTF", name: "缝纫裁缝精", icon: "/icons/Red_Cowboy_Hat.png", portrait: "宅在家里沉迷缝纫机，把各种乱七八糟的物品塞进去尝试做衣服。", tags: "宅家·发散" },
  FARM: { id: "FARM", name: "纯粹种地狂魔", icon: "/icons/Standard_Farm_Map_Icon.png", portrait: "沉迷规划洒水器，守着自己的一亩三分地，死磕农业等级。", tags: "宅家·死磕" },
  TIME: { id: "TIME", name: "时间管理大师", icon: "/icons/Time_Icon.png", portrait: "路线精确到分钟，每天喝咖啡狂奔，绝不浪费10分钟。", tags: "搞钱·探索" },
  PETS: { id: "PETS", name: "摸猪大户", icon: "/icons/Animals_Icon.png", portrait: "如同打卡上班，每天早上的固定任务就是高效摸动物、捡松露。", tags: "搞钱·宅家" },
  GAMB: { id: "GAMB", name: "齐先生的赌徒", icon: "/icons/Mr._Qi_Icon.png", portrait: "为了一夜暴富的终极利益，沉迷赌场老虎机，倾家荡产搏一搏。", tags: "搞钱·随机" },
  ACHI: { id: "ACHI", name: "完美主义成就党", icon: "/icons/Achievements_Icon.png", portrait: "被100%完美度的面板无情驱动，少收集一个图鉴晚上都睡不着。", tags: "搞钱·死磕" },
  GIFT: { id: "GIFT", name: "星露谷跑腿侠", icon: "/icons/Traveling_Cart_Icon.png", portrait: "善良的化身，满世界找罗宾的斧头和村长的短裤。", tags: "情感·探索" },
  CHEF: { id: "CHEF", name: "料理大厨", icon: "/icons/Cooking_Icon.png", portrait: "用充满爱意的心收集菜谱，宅在厨房做出每一道带着「齐」标志的料理。", tags: "情感·宅家" },
  MODS: { id: "MODS", name: "Mod 魔改狂", icon: "/icons/Controls_Icon.png", portrait: "抛弃功利心，追求极致个性化的视觉体验，把游戏改得连亲妈都不认识。", tags: "情感·整活" },
  HOAR: { id: "HOAR", name: "终极仓鼠病", icon: "/icons/Inventory_Icon.png", portrait: "对哪怕一滴树液都充满感情，分类整理在20个箱子里，什么都舍不得卖。", tags: "情感·强迫" },
  BOMB: { id: "BOMB", name: "炸弹狂人", icon: "/icons/Cinder_Shard.png", portrait: "抛弃常规采矿，满世界乱丢超级炸弹，享受爆炸清屏的混沌快感。", tags: "整活·探索" },
  SLEP: { id: "SLEP", name: "快进党", icon: "/icons/Spa_Icon.png", portrait: "极其离谱的操作，为等酿酒完成，能在家里连续睡过一个季节。", tags: "整活·宅家" },
  MUSE: { id: "MUSE", name: "盲盒敲晶石狂", icon: "/icons/Ruby_Node.png", portrait: "追求开盲盒的随机刺激感，把攒了一箱子的晶石全砸了。", tags: "整活·搞钱" },
  LUCK: { id: "LUCK", name: "占卜玄学党", icon: "/icons/Wizard_Icon.png", portrait: "把人生的决定权交给玄学，每天看电视算命，运气不好直接躺平。", tags: "整活·情感" },
  FISH: { id: "FISH", name: "钓鱼吧老哥", icon: "/icons/Dressed_Spinner.png", portrait: "定力极强，跑到水边完美掌握钓鱼条节奏，一坐就是一天。", tags: "死磕·探索" },
  WEED: { id: "WEED", name: "除草清道夫", icon: "/icons/Hoe.png", portrait: "强迫症晚期，看不得农场有任何碎石杂草，每天死磕清理领地。", tags: "死磕·宅家" },
  CRAB: { id: "CRAB", name: "蟹篓大王", icon: "/icons/Coral.png", portrait: "沿着海岸线机械化放置蟹篓，每天进行极度枯燥但稳定的收割。", tags: "死磕·搞钱" },
  TAVN: { id: "TAVN", name: "酒馆钉子户", icon: "/icons/Gus_Icon.png", portrait: "社交强迫症。无论风霜雨雪，每晚8点必定准时出现在星光酒馆，给所有人买啤酒。", tags: "死磕·情感" },
};

/* ------------------------------------------------------------------ */
/*  SVTI Calculation                                                   */
/* ------------------------------------------------------------------ */

function toSVTIAxes(axes: PersonaAxes): { a: number; b: number; c: number } {
  return {
    a: Math.round((axes.initiative - 50) / 25),
    b: Math.round((50 - axes.game_style) / 25),
    c: Math.round((axes.speech_style - 50) / 25),
  };
}

export function calcSVTI(axes: PersonaAxes): SVTIType {
  const { a, b, c } = toSVTIAxes(axes);
  const absA = Math.abs(a), absB = Math.abs(b), absC = Math.abs(c);

  if (absA === 0 && absB === 0 && absC === 0) return SVTI_TYPES.RELA;

  const sorted = [
    { axis: "a", val: a, abs: absA },
    { axis: "b", val: b, abs: absB },
    { axis: "c", val: c, abs: absC },
  ].sort((x, y) => y.abs - x.abs);

  const dom = sorted[0];
  const sec = sorted[1];
  const domSign = dom.val >= 0 ? "+" : "-";
  const secSign = sec.val >= 0 ? "+" : "-";
  const key = `${dom.axis}${domSign}${sec.axis}${secSign}`;

  const MAP: Record<string, SVTIId> = {
    "a+b+": "JOJA", "a+b-": "LOVE", "a+c+": "WILD", "a+c-": "MINE",
    "a-b+": "CASH", "a-b-": "DECO", "a-c+": "OUTF", "a-c-": "FARM",
    "b+a+": "TIME", "b+a-": "PETS", "b+c+": "GAMB", "b+c-": "ACHI",
    "b-a+": "GIFT", "b-a-": "CHEF", "b-c+": "MODS", "b-c-": "HOAR",
    "c+a+": "BOMB", "c+a-": "SLEP", "c+b+": "MUSE", "c+b-": "LUCK",
    "c-a+": "FISH", "c-a-": "WEED", "c-b+": "CRAB", "c-b-": "TAVN",
  };

  return SVTI_TYPES[MAP[key] || "RELA"];
}

/* ------------------------------------------------------------------ */
/*  Quiz Questions                                                     */
/* ------------------------------------------------------------------ */

export type AxisKey = "initiative" | "game_style" | "speech_style";

export interface QuizOption {
  text: string;
  icon: string;
  delta: Partial<Record<AxisKey, number>>;
}

export interface QuizQuestion {
  scenario: string;
  options: QuizOption[];
}

/**
 * 30 道题，每轴 10 题，三轴交替排列（I/G/S 顺序）
 *
 * 评分：每选项对目标轴贡献 -3 ~ +3
 * 10 题后范围 -30 ~ +30，归一化到 0-100
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ─── Initiative #1 ───
  {
    scenario: "春天第一天醒来，你的计划是？",
    options: [
      { text: "先把农场规划好，种子必须今天就种下去", icon: "/icons/Standard_Farm_Map_Icon.png", delta: { initiative: -3 } },
      { text: "去镇上逛一圈，看看大家都干嘛呢", icon: "/icons/Pierre_Icon.png", delta: { initiative: 1 } },
      { text: "直奔那个还没解锁的神秘区域！", icon: "/icons/Railroad_Icon.png", delta: { initiative: 3 } },
    ],
  },
  // ─── Game Style #1 ───
  {
    scenario: "社区中心 vs Joja 超市，你选哪个？",
    options: [
      { text: "Joja，花钱搞定最省事", icon: "/icons/Morris_Icon.png", delta: { game_style: -3 } },
      { text: "社区中心，但主要是为了解锁方便", icon: "/icons/Bundle_Icon.png", delta: { game_style: -1 } },
      { text: "社区中心！帮祝尼魔修复社区的感觉太棒了", icon: "/icons/Junimo_Icon.png", delta: { game_style: 3 } },
    ],
  },
  // ─── Speech Style #1 ───
  {
    scenario: "你的箱子是怎么整理的？",
    options: [
      { text: "按类别严格分区，每个箱子都贴标签", icon: "/icons/Inventory_Icon.png", delta: { speech_style: -3 } },
      { text: "大概分一下类，差不多就行", icon: "/icons/ShippingBox.png", delta: { speech_style: 0 } },
      { text: "往最近的箱子里一塞，找得到就行", icon: "/icons/Wild_Horseradish.png", delta: { speech_style: 3 } },
    ],
  },
  // ─── Initiative #2 ───
  {
    scenario: "下雨天你会做什么？",
    options: [
      { text: "太好了不用浇水！在家整理农场、做料理", icon: "/icons/Cooking_Icon.png", delta: { initiative: -3 } },
      { text: "去海边转转，说不定有好东西", icon: "/icons/Willy_Icon.png", delta: { initiative: 1 } },
      { text: "趁不用浇水，直奔矿洞冲层！", icon: "/icons/The_Mines_Icon.png", delta: { initiative: 3 } },
    ],
  },
  // ─── Game Style #2 ───
  {
    scenario: "你攒了 5000g，最想花在……",
    options: [
      { text: "高级种子和肥料，投资回报率最高", icon: "/icons/Basic_Fertilizer.png", delta: { game_style: -3 } },
      { text: "升级工具，提升整体效率", icon: "/icons/Copper_Node.png", delta: { game_style: -1 } },
      { text: "给心仪的NPC买生日礼物", icon: "/icons/Festivals_Icon.png", delta: { game_style: 3 } },
    ],
  },
  // ─── Speech Style #2 ───
  {
    scenario: "农场里有块地长满了杂草碎石，你？",
    options: [
      { text: "无法忍受！必须清理到干干净净", icon: "/icons/Hoe.png", delta: { speech_style: -3 } },
      { text: "有空的时候收拾一下就好", icon: "/icons/Quality_Sprinkler.png", delta: { speech_style: 0 } },
      { text: "这不就是「自然风」嘛，多好看", icon: "/icons/Dandelion.png", delta: { speech_style: 3 } },
    ],
  },
  // ─── Initiative #3 ───
  {
    scenario: "你发现一条没走过的路，但游戏时间已经很晚了……",
    options: [
      { text: "回家睡觉，明天再来", icon: "/icons/Floor_TV.png", delta: { initiative: -3 } },
      { text: "快速扫一眼附近就撤", icon: "/icons/Energy.png", delta: { initiative: 1 } },
      { text: "继续走！晕倒在野外也是一种体验", icon: "/icons/Rusty_Sword.png", delta: { initiative: 3 } },
    ],
  },
  // ─── Game Style #3 ───
  {
    scenario: "酿酒桶出酒了，你怎么处理？",
    options: [
      { text: "全部出货！金币滚滚来", icon: "/icons/Iridium_Node.png", delta: { game_style: -3 } },
      { text: "留一瓶给自己，其他卖掉", icon: "/icons/Artisan_Icon.png", delta: { game_style: 0 } },
      { text: "留着送给村民，帕姆阿姨最爱啤酒", icon: "/icons/Gus_Icon.png", delta: { game_style: 3 } },
    ],
  },
  // ─── Speech Style #3 ───
  {
    scenario: "朋友说「用炸弹在矿洞开路吧」，你？",
    options: [
      { text: "不安全也不高效，老老实实挖", icon: "/icons/Sturdy_Ring.png", delta: { speech_style: -3 } },
      { text: "可以试试，但别浪费太多炸弹", icon: "/icons/Tundra_Boots.png", delta: { speech_style: 0 } },
      { text: "炸它丫的！超级炸弹满天飞！", icon: "/icons/Cinder_Shard.png", delta: { speech_style: 3 } },
    ],
  },
  // ─── Initiative #4 ───
  {
    scenario: "威利邀请你出海，但家里的动物还没摸……",
    options: [
      { text: "先摸完动物再说，它们等着我呢", icon: "/icons/Animals_Icon.png", delta: { initiative: -3 } },
      { text: "快速摸完再赶去港口！", icon: "/icons/Willy_Icon.png", delta: { initiative: 0 } },
      { text: "走走走！鱿鱼季不等人！动物明天摸也行", icon: "/icons/Dressed_Spinner.png", delta: { initiative: 3 } },
    ],
  },
  // ─── Game Style #4 ───
  {
    scenario: "游戏里最有成就感的时刻是？",
    options: [
      { text: "日收入突破 10000g 的瞬间", icon: "/icons/ShippingBox.png", delta: { game_style: -3 } },
      { text: "完成社区中心的所有献祭", icon: "/icons/Bundle_Icon.png", delta: { game_style: -1 } },
      { text: "触发了一个超感人的NPC剧情", icon: "/icons/Speech_bubble.png", delta: { game_style: 3 } },
    ],
  },
  // ─── Speech Style #4 ───
  {
    scenario: "洒水器怎么摆？",
    options: [
      { text: "精确计算覆盖面积，一格都不能浪费", icon: "/icons/Quality_Sprinkler.png", delta: { speech_style: -3 } },
      { text: "大概摆好就行，差不多覆盖了", icon: "/icons/Basic_Fertilizer.png", delta: { speech_style: 0 } },
      { text: "哪有土就放哪，随缘生长", icon: "/icons/Wild_Horseradish.png", delta: { speech_style: 3 } },
    ],
  },
  // ─── Initiative #5 ───
  {
    scenario: "刚解锁沙漠公路，你的第一反应？",
    options: [
      { text: "等有空了再说，先把农场的事忙完", icon: "/icons/Standard_Farm_Map_Icon.png", delta: { initiative: -3 } },
      { text: "打算明天去看看", icon: "/icons/Desert_Trader_Icon.png", delta: { initiative: 1 } },
      { text: "立刻买票出发！新地图在召唤！", icon: "/icons/Golden_Walnut.png", delta: { initiative: 3 } },
    ],
  },
  // ─── Game Style #5 ───
  {
    scenario: "你会为了什么放弃最高效的赚钱路线？",
    options: [
      { text: "不会，效率就是正义", icon: "/icons/Time_Icon.png", delta: { game_style: -3 } },
      { text: "偶尔换个心情，但很快回到正轨", icon: "/icons/Forester.png", delta: { game_style: 0 } },
      { text: "经常，赚钱不如体验故事", icon: "/icons/Book_of_Mysteries.png", delta: { game_style: 3 } },
    ],
  },
  // ─── Speech Style #5 ───
  {
    scenario: "你捡到一颗晶石（晶洞），你会？",
    options: [
      { text: "攒够一批再统一找克林特开", icon: "/icons/Inventory_Icon.png", delta: { speech_style: -3 } },
      { text: "想起来就去找克林特开一下", icon: "/icons/Ruby_Node.png", delta: { speech_style: 0 } },
      { text: "立刻去找克林特！等不及想看里面是什么！", icon: "/icons/Mr._Qi_Icon.png", delta: { speech_style: 3 } },
    ],
  },
  // ─── Initiative #6 ───
  {
    scenario: "旅行商人的车子来了，你？",
    options: [
      { text: "不去了，需要的东西自己都能做", icon: "/icons/Hoe.png", delta: { initiative: -3 } },
      { text: "去翻翻看，万一有稀有的东西", icon: "/icons/Traveling_Cart_Icon.png", delta: { initiative: 1 } },
      { text: "每次必去！她卖的东西千奇百怪太有趣了", icon: "/icons/Secret_Note_Icon.png", delta: { initiative: 3 } },
    ],
  },
  // ─── Game Style #6 ───
  {
    scenario: "NPC跟你说了他的烦心事，你？",
    options: [
      { text: "嗯嗯好的知道了，该去干活了", icon: "/icons/Time_Icon.png", delta: { game_style: -3 } },
      { text: "记下了，下次带个他喜欢的东西", icon: "/icons/Quests_Icon.png", delta: { game_style: 0 } },
      { text: "立刻帮他解决！跑遍全镇也要找到他要的东西", icon: "/icons/Multiplayer_Icon.png", delta: { game_style: 3 } },
    ],
  },
  // ─── Speech Style #6 ───
  {
    scenario: "电视说今天运气很差，你？",
    options: [
      { text: "在家整理农场，不冒险了", icon: "/icons/Floor_TV.png", delta: { speech_style: -3 } },
      { text: "运气而已，不太影响我的计划", icon: "/icons/Energy.png", delta: { speech_style: 0 } },
      { text: "偏不信邪！运气差说不定反而出奇迹", icon: "/icons/Wizard_Icon.png", delta: { speech_style: 3 } },
    ],
  },
  // ─── Initiative #7 ───
  {
    scenario: "镇上节日活动开始了，你先……",
    options: [
      { text: "先把自己摊位的东西摆好", icon: "/icons/ShippingBox.png", delta: { initiative: -3 } },
      { text: "去逛逛活动，感受节日氛围", icon: "/icons/Festivals_Icon.png", delta: { initiative: 1 } },
      { text: "把活动地图的每个角落翻个遍！", icon: "/icons/Secret_Note_Icon.png", delta: { initiative: 3 } },
    ],
  },
  // ─── Game Style #7 ───
  {
    scenario: "「你为什么玩星露谷？」",
    options: [
      { text: "看着数字增长和农场扩张很满足", icon: "/icons/Achievements_Icon.png", delta: { game_style: -3 } },
      { text: "完成所有目标和成就的成就感", icon: "/icons/Quests_Icon.png", delta: { game_style: -1 } },
      { text: "生活在小镇里，交朋友，体验田园生活", icon: "/icons/Sweet_Pea.png", delta: { game_style: 3 } },
    ],
  },
  // ─── Speech Style #7 ───
  {
    scenario: "你会为了一个目标反复做枯燥的事吗？",
    options: [
      { text: "会，目标在那里必须完成", icon: "/icons/Achievements_Icon.png", delta: { speech_style: -3 } },
      { text: "看心情吧，不勉强自己", icon: "/icons/Dressed_Spinner.png", delta: { speech_style: 0 } },
      { text: "不会，太无聊了，我要去尝试新玩法", icon: "/icons/Controls_Icon.png", delta: { speech_style: 3 } },
    ],
  },
  // ─── Initiative #8 ───
  {
    scenario: "你打开地图时最常看的是……",
    options: [
      { text: "看看农场区域，确认一切正常", icon: "/icons/Standard_Farm_Map_Icon.png", delta: { initiative: -3 } },
      { text: "看看NPC们都在哪里", icon: "/icons/Speech_bubble.png", delta: { initiative: 1 } },
      { text: "哪些区域我还没探索过", icon: "/icons/Golden_Walnut.png", delta: { initiative: 3 } },
    ],
  },
  // ─── Game Style #8 ───
  {
    scenario: "NPC送你一件礼物，你的反应？",
    options: [
      { text: "看看值多少钱", icon: "/icons/Iridium_Node.png", delta: { game_style: -3 } },
      { text: "留着吧，万一以后有用", icon: "/icons/Inventory_Icon.png", delta: { game_style: 0 } },
      { text: "太感动了！我要加倍对他好", icon: "/icons/Marriage_Icon.png", delta: { game_style: 3 } },
    ],
  },
  // ─── Speech Style #8 ───
  {
    scenario: "有人说「换个玩法试试看」，你？",
    options: [
      { text: "现在的策略很好，不需要改", icon: "/icons/Time_Icon.png", delta: { speech_style: -3 } },
      { text: "看看是什么玩法再决定", icon: "/icons/Controls_Icon.png", delta: { speech_style: 0 } },
      { text: "好呀好呀！带我一个！", icon: "/icons/Red_Cowboy_Hat.png", delta: { speech_style: 3 } },
    ],
  },
  // ─── Initiative #9 ───
  {
    scenario: "一整个季节过去，你大部分时间花在了……",
    options: [
      { text: "农场里种地、养殖、整理布局", icon: "/icons/Standard_Farm_Map_Icon.png", delta: { initiative: -3 } },
      { text: "在农场和镇上之间来回跑腿", icon: "/icons/Railroad_Icon.png", delta: { initiative: 0 } },
      { text: "矿洞、沙漠、姜岛到处冒险", icon: "/icons/The_Mines_Icon.png", delta: { initiative: 3 } },
    ],
  },
  // ─── Game Style #9 ───
  {
    scenario: "你看到两个NPC在吵架，你会？",
    options: [
      { text: "不关我的事，走了走了", icon: "/icons/The_Player_Icon.png", delta: { game_style: -3 } },
      { text: "远远看一下热闹", icon: "/icons/Speech_bubble.png", delta: { game_style: 0 } },
      { text: "过去了解情况，帮他们调解", icon: "/icons/Harvey_Icon.png", delta: { game_style: 3 } },
    ],
  },
  // ─── Speech Style #9 ───
  {
    scenario: "你发现一个新游戏机制/彩蛋，你会？",
    options: [
      { text: "查Wiki把相关信息研究透彻", icon: "/icons/Book_of_Mysteries.png", delta: { speech_style: -3 } },
      { text: "大概了解一下就好", icon: "/icons/Secret_Note_Icon.png", delta: { speech_style: 0 } },
      { text: "自己瞎试！翻车了更好玩", icon: "/icons/Mr._Qi_Icon.png", delta: { speech_style: 3 } },
    ],
  },
  // ─── Initiative #10 ───
  {
    scenario: "你在鹈鹕镇待了一整天，原因是？",
    options: [
      { text: "在农场忙着种地、整理、规划新布局", icon: "/icons/Quality_Sprinkler.png", delta: { initiative: -3 } },
      { text: "去商店补货、跟NPC聊天", icon: "/icons/Pierre_Icon.png", delta: { initiative: 1 } },
      { text: "什么？我早就在矿洞第80层了", icon: "/icons/The_Mines_Icon.png", delta: { initiative: 3 } },
    ],
  },
  // ─── Game Style #10 ───
  {
    scenario: "你最重要的游戏目标是什么？",
    options: [
      { text: "赚够钱买一切想要的东西", icon: "/icons/Iridium_Node.png", delta: { game_style: -3 } },
      { text: "100%完成度，一个都不落下", icon: "/icons/Achievements_Icon.png", delta: { game_style: -1 } },
      { text: "和所有村民成为好朋友，看他们的故事", icon: "/icons/Abigail_Icon.png", delta: { game_style: 3 } },
    ],
  },
  // ─── Speech Style #10 ───
  {
    scenario: "做料理的动机是？",
    options: [
      { text: "完成图鉴，每道菜都必须做出来", icon: "/icons/Cooking_Icon.png", delta: { speech_style: -3 } },
      { text: "做些有用的buff料理就够了", icon: "/icons/Health.png", delta: { speech_style: 0 } },
      { text: "看到食材就往锅里丢，看能做出啥", icon: "/icons/Red_Cowboy_Hat.png", delta: { speech_style: 3 } },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Scoring                                                            */
/* ------------------------------------------------------------------ */

export function calculateQuizScores(answers: number[]): PersonaAxes {
  const sums: Record<AxisKey, number> = {
    initiative: 0,
    game_style: 0,
    speech_style: 0,
  };

  for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
    const optIdx = answers[i];
    if (optIdx < 0) continue;
    const option = QUIZ_QUESTIONS[i].options[optIdx];
    for (const [axis, delta] of Object.entries(option.delta)) {
      sums[axis as AxisKey] += delta;
    }
  }

  // 归一化: sum ∈ [-30, +30] → value ∈ [0, 100]
  const axes: PersonaAxes = {
    initiative: 50,
    game_style: 50,
    speech_style: 50,
  };
  for (const key of ["initiative", "game_style", "speech_style"] as AxisKey[]) {
    axes[key] = Math.round(Math.max(0, Math.min(100, 50 + (sums[key] / 30) * 50)));
  }

  return axes;
}
