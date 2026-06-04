export type WorldName =
  | 'RickiLand'
  | 'Plumbubo'
  | 'Contaminated'
  | 'Doopidoo'
  | 'Crystal'
  | 'Autumn'
  | 'Alien'
  | 'Desert'
  | 'Blue'
  | 'Ash'
  | 'Swamp'

export type WorldConfig = {
  id: number
  title: string
  description: string
  cover: string
  music: string
}

export type WorldsConfig = {
  [key in WorldName]: WorldConfig
}

const worldsConfig: WorldsConfig = {
  RickiLand: {
    id: 0,
    title: '瑞克之地',
    description: '',
    cover: 'world_0_cover',
    music: 'world_0',
  },
  Plumbubo: {
    id: 1,
    title: '普朗布博',
    description: '',
    cover: 'world_1_cover',
    music: 'world_1',
  },
  Contaminated: {
    id: 2,
    title: '污染地球',
    description: '',
    cover: 'world_2_cover',
    music: 'world_2',
  },
  Doopidoo: {
    id: 3,
    title: '杜皮杜',
    description: '',
    cover: 'world_3_cover',
    music: 'world_3',
  },
  Crystal: {
    id: 4,
    title: '永冻冰原',
    description: '',
    cover: 'world_4_cover',
    music: 'world_4',
  },
  Autumn: {
    id: 5,
    title: '又是9月3日',
    description: '',
    cover: 'world_5_cover',
    music: 'world_5',
  },
  Alien: {
    id: 6,
    title: '尼比鲁星球',
    description: '',
    cover: 'world_6_cover',
    music: 'world_6',
  },
  Desert: {
    id: 7,
    title: '沙漠',
    description: '',
    cover: 'world_7_cover',
    music: 'world_7',
  },
  Blue: {
    id: 8,
    title: '蓝色星球',
    description: '',
    cover: 'world_8_cover',
    music: 'world_8',
  },
  Ash: {
    id: 9,
    title: '灰烬世界',
    description: '',
    cover: 'world_9_cover',
    music: 'world_9',
  },
  Swamp: {
    id: 10,
    title: '沼泽',
    description: '',
    cover: 'world_10_cover',
    music: 'world_10',
  },
}

export default worldsConfig
