export type ItemTypeName = 'ExpGem' | 'GoldCoin' | 'PistolHealth'

export type ItemType = {
  title: string
  typeName: ItemTypeName
  keyFrame: string
  rarity: number
  value: number
}

type ItemConstantsType = { [key in ItemTypeName]: ItemType }

const typeConstants: ItemConstantsType = {
  ExpGem: {
    title: '经验宝石',
    typeName: 'ExpGem',
    keyFrame: 'ExpGem',
    rarity: 50,
    value: 5,
  },
  GoldCoin: {
    title: '金币',
    typeName: 'GoldCoin',
    keyFrame: 'GoldCoin',
    rarity: 25,
    value: 1,
  },
  PistolHealth: {
    title: '手枪生命值',
    typeName: 'PistolHealth',
    keyFrame: 'PistolHealth',
    rarity: 5,
    value: 30,
  },
}

export default typeConstants
