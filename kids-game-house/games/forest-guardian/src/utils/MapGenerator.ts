/**
 * 🗺️ 简易地图生成器
 * 用于在没有外部 Tiled 文件的情况下，动态生成测试用的瓦片地图数据
 */
export class MapGenerator {
  /**
   * 生成一个村庄风格的地图数据
   * @param width 地图宽度（格）
   * @param height 地图高度（格）
   */
  static generateVillageMap(width: number = 46, height: number = 60): any {
    // 初始化全草地 (gid: 1)
    const data = new Array(width * height).fill(1)

    // 🎨 绘制村庄布局
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        
        // 1. 主干道 (gid: 2 - 砖块路)
        if ((x >= 20 && x <= 25) || (y >= 28 && y <= 31)) {
          data[index] = 2
        }

        // 2. 房屋地基与墙壁 (gid: 3 - 深色砖块)
        // 左上角的房子
        if (x >= 5 && x <= 15 && y >= 5 && y <= 15) {
          if (x === 5 || x === 15 || y === 5 || y === 15) data[index] = 3 // 墙
          else if (y === 15 && x >= 9 && x <= 11) data[index] = 2 // 门
          else data[index] = 4 // 地板
        }

        // 右上角的房子
        if (x >= 30 && x <= 40 && y >= 5 && y <= 15) {
          if (x === 30 || x === 40 || y === 5 || y === 15) data[index] = 3
          else if (y === 15 && x >= 34 && x <= 36) data[index] = 2
          else data[index] = 4
        }

        // 3. 装饰性花坛 (gid: 5 - 假设 tileset 里有花)
        if ((x === 18 && y === 18) || (x === 27 && y === 18)) {
          data[index] = 5
        }
      }
    }

    return {
      version: "1.10",
      tiledversion: "1.10.0",
      orientation: "orthogonal",
      renderorder: "right-down",
      width,
      height,
      tilewidth: 16,
      tileheight: 16,
      nextlayerid: 2,
      nextobjectid: 1,
      layers: [
        {
          id: 1,
          name: 'Ground',
          type: 'tilelayer',
          data: data,
          width,
          height,
          x: 0,
          y: 0,
          opacity: 1,
          visible: true
        }
      ],
      tilesets: [
        {
          firstgid: 1,
          source: 'tileset.json' // 指向 GTRS 中定义的 tileset
        }
      ]
    }
  }
}
