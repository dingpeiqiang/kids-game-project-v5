import Quest from './objects/Managers/Quest';
import { getArmorByName } from './loot/armorAPI';


export default function getQuestByName(name = '') {

  const orcs = new Quest(
    1,
    "Slay Some Orcs",  // 保持英文键名用于查找
    "easy",
    "Kill",
    15,
    "orc",
    "我的朋友，我们没有时间了。迷宫已经发现了我们的位置，正在召唤它所有的怪物来摧毁我们。证明你的价值吧，也许你的事迹会被后人铭记。在你热身击杀 15 个这些弱小的被俘兽人后，再来找我谈话。",
    "你在浪费时间做什么？去杀了他们！",
    "所以你完成了，我就知道你会的。拿着这个戒指。这是我唯一能给你的东西，我已经把其他所有东西都给了之前来的其他人。",
    "指挥官想让我通过杀死 15 个这些破旧的兽人来证明我的价值。他说他会给我一个戒指之类的东西。他提到我没有多少时间来完成训练。",
    getArmorByName("Ring of Fury"),
    25

  )
  
  const intoTheLabyrinth = new Quest(
    2,
    "Into the Labyrinth",  // 保持英文键名用于查找
    "easy",
    "Kill",
    1500,
    "orc",
    "我的朋友，我们没有时间了。你还远未准备好，但没有其他选择了。你必须加入战斗。离开训练场，加入前线。我不会对你撒谎，你没有生存的机会。尽你所能吧，你的故事会在你的身体被毁灭后继续流传。",
    "你在这里做什么？我们的人民每秒钟都在死去。去做你的部分，也许你能暂时扭转局势。",
    "你做到了前人从未做到的事情。我在你面前感到谦卑。我们没有什么可以给予的，只有我们最真诚的感激。不过迷宫会注意到你的能力，你不能留在这里。我们无法承受你的行动所引发的反噬。为了你的生命，也为了我们的生命，快逃吧。",
    "我必须为我的人民付出我最后的每一分能量。队长似乎确信我会死，但也许通过我的行动，我可以延缓不可避免的命运。",
    getArmorByName("Ring of Fury"),
    250

  )

  const quests = [
    orcs,
    intoTheLabyrinth
  ]


  return quests.find(quest => quest.getName() === name);
}
