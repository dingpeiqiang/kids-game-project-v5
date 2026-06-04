import Restart from './restart'

export default class Car {
  // 优化速度和加速度 - 更平稳的驾驶体验
  readonly MAX_SPEED = 0.65              // 降低最高速度（原0.75）
  readonly MAX_SPEED_BACKWARDS = this.MAX_SPEED * 0.7
  readonly ACCELERATION = this.MAX_SPEED / 180    // 降低加速度（原/130），更平缓
  readonly ACCELERATION_BACKWARDS = this.ACCELERATION * 0.7

  bodies: any[] = []
  gas = {
    right: false,
    left: false
  }
  wheelsDown = {
    rear: false,
    front: false
  }
  private _scene: Phaser.Scene
  
  // 特技追踪
  private airTime: number = 0
  private flips: number = 0
  private lastRotation: number = 0
  public stats = {
    totalAirTime: 0,
    totalFlips: 0,
    maxSpeed: 0
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 278,
    height: number = 100,
    wheelSize: number = 50,
    wheelOffset: { x: number; y: number } = { x: 62, y: 62 }
  ) {
    this._scene = scene

    const wheelBase = wheelOffset.x,
      wheelAOffset = -width * 0.5 + wheelBase,
      wheelBOffset = width * 0.5 - wheelBase,
      wheelYOffset = wheelOffset.y

    // 优化物理参数 - 提高稳定性
    const wheelDensity = 0.004  // 增加车轮密度，提高抓地力
    const bodyDensity = 0.006   // 增加车身密度，降低重心
    const friction = 1.0        // 提高摩擦力
    // @ts-ignore
    const Matter = Phaser.Physics.Matter.Matter

    let group = scene.matter.world.nextGroup(true)

    // 创建车身 - 降低重心
    let body = scene.matter.add.image(x, y, 'atlas', 'car-body')
    body.setBody(
      {
        type: 'rectangle',
        width: width,
        height: height
      },
      {
        label: 'carBody',
        collisionFilter: {
          group: group
        },
        chamfer: {
          radius: height * 0.3  // 减小圆角，增加稳定性
        },
        density: bodyDensity,
        friction: 0.8,
        restitution: 0.1  // 降低弹性，减少弹跳
      }
    )

    // 后轮
    let wheelA = scene.matter.add.image(x + wheelAOffset, y + wheelYOffset, 'atlas', 'car-wheel')
    wheelA.setBody(
      {
        type: 'circle',
        radius: wheelSize
      },
      {
        label: 'wheelRear',
        collisionFilter: {
          group: group
        },
        friction,
        density: wheelDensity,
        restitution: 0.2  // 适度弹性
      }
    )

    // 前轮
    let wheelB = scene.matter.add.image(x + wheelBOffset, y + wheelYOffset, 'atlas', 'car-wheel')
    wheelB.setBody(
      {
        type: 'circle',
        radius: wheelSize
      },
      {
        label: 'wheelFront',
        collisionFilter: {
          group: group
        },
        friction,
        density: wheelDensity,
        restitution: 0.2
      }
    )

    // 优化悬挂系统 - 更稳定的约束
    let axelA = scene.matter.add.constraint(body.body, wheelA.body, 0, 0.4, {  // 提高刚度从0.2到0.4
      pointA: { x: wheelAOffset, y: wheelYOffset },
      stiffness: 0.4,  // 明确的刚度值
      damping: 0.1     // 添加阻尼，减少晃动
    })

    let axelB = scene.matter.add.constraint(body.body, wheelB.body, 0, 0.4, {  // 提高刚度从0.2到0.4
      pointA: { x: wheelBOffset, y: wheelYOffset },
      stiffness: 0.4,
      damping: 0.1
    })

    this.bodies = [body.body, wheelA.body, wheelB.body]
  }

  update() {
    // @ts-ignore
    const Matter = Phaser.Physics.Matter.Matter
    const carBody = this.bodies[0]
    const wheelRear = this.bodies[1]
    const wheelFront = this.bodies[2]

    // 重启游戏如果车掉落
    if (carBody.position.y > 3000) Restart.restart(this._scene)

    let angularVelocity = 0.005

    if (this.gas.right) {
      let newSpeed = wheelRear.angularSpeed <= 0 ? this.MAX_SPEED / 10 : wheelRear.angularSpeed + this.ACCELERATION
      if (newSpeed > this.MAX_SPEED) newSpeed = this.MAX_SPEED
      Matter.Body.setAngularVelocity(wheelRear, newSpeed)
      Matter.Body.setAngularVelocity(wheelFront, newSpeed)
      // if (!this.wheelsDown.rear && !this.wheelsDown.front) Matter.Body.setAngularVelocity(carBody, -angularVelocity)
    } else if (this.gas.left) {
      let newSpeed =
        wheelRear.angularSpeed <= 0
          ? this.MAX_SPEED_BACKWARDS / 10
          : wheelRear.angularSpeed + this.ACCELERATION_BACKWARDS
      if (newSpeed > this.MAX_SPEED_BACKWARDS) newSpeed = this.MAX_SPEED_BACKWARDS

      Matter.Body.setAngularVelocity(wheelRear, -newSpeed)
      // if (!this.wheelsDown.rear && !this.wheelsDown.front) Matter.Body.setAngularVelocity(carBody, angularVelocity)
    }
    
    // 防翻车辅助系统
    this.antiFlipAssist(carBody)
    
    // 特技检测
    this.detectStunts(carBody)
    
    // 更新最大速度
    const currentSpeed = Math.abs(wheelRear.angularVelocity * 100)
    if (currentSpeed > this.stats.maxSpeed) {
      this.stats.maxSpeed = currentSpeed
    }
  }
  
  /**
   * 防翻车辅助系统
   * 当车辆倾斜角度过大时，施加反向力矩帮助恢复平衡
   */
  private antiFlipAssist(carBody: any) {
    // @ts-ignore
    const Matter = Phaser.Physics.Matter.Matter
    
    // 获取当前旋转角度（弧度）
    const rotation = carBody.rotation
    
    // 规范化角度到 -PI 到 PI
    let normalizedRotation = rotation % (Math.PI * 2)
    if (normalizedRotation > Math.PI) normalizedRotation -= Math.PI * 2
    if (normalizedRotation < -Math.PI) normalizedRotation += Math.PI * 2
    
    // 当倾斜角度超过阈值时启动辅助
    const tiltThreshold = Math.PI * 0.35  // 约63度
    const assistStrength = 0.008          // 辅助力度
    
    if (Math.abs(normalizedRotation) > tiltThreshold) {
      // 计算需要施加的反向力矩
      const correctionTorque = -Math.sign(normalizedRotation) * assistStrength
      
      // 只在车轮着地时施加辅助（空中不干预）
      if (this.wheelsDown.rear || this.wheelsDown.front) {
        Matter.Body.setAngularVelocity(carBody, 
          carBody.angularVelocity + correctionTorque
        )
      }
    }
    
    // 极端角度保护：接近90度时强力修正
    const criticalThreshold = Math.PI * 0.45  // 约81度
    if (Math.abs(normalizedRotation) > criticalThreshold) {
      const strongCorrection = -Math.sign(normalizedRotation) * 0.02
      Matter.Body.setAngularVelocity(carBody, 
        carBody.angularVelocity + strongCorrection
      )
    }
  }
  
  private detectStunts(carBody: any) {
    const isAirborne = !this.wheelsDown.rear && !this.wheelsDown.front
    
    if (isAirborne) {
      this.airTime++
      this.stats.totalAirTime++
      
      // 检测翻转
      const currentRotation = carBody.rotation
      const rotationDiff = currentRotation - this.lastRotation
      
      // 检测完整翻转（360度）
      if (Math.abs(rotationDiff) > Math.PI * 1.8) {
        this.flips++
        this.stats.totalFlips++
      }
      
      this.lastRotation = currentRotation
    } else {
      // 着陆时重置
      if (this.airTime > 60) { // 在空中超过1秒
        console.log(`Landed! Air time: ${(this.airTime / 60).toFixed(1)}s`)
      }
      this.airTime = 0
      this.lastRotation = carBody.rotation
    }
  }
  
  getAirTime(): number {
    return this.airTime
  }
  
  getFlips(): number {
    return this.flips
  }
  
  resetStats() {
    this.airTime = 0
    this.flips = 0
    this.lastRotation = 0
    this.stats = {
      totalAirTime: 0,
      totalFlips: 0,
      maxSpeed: 0
    }
  }
}
