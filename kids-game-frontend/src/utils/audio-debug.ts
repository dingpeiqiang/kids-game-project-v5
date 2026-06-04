/**
 * 音频调试工具
 * 用于诊断录音和播放问题
 */

export class AudioDebug {
  private logs: string[] = []

  /**
   * 检查浏览器支持的录音格式
   */
  static checkSupportedFormats(): string[] {
    const formats = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/mp4;codecs=aac',
      'audio/ogg',
      'audio/ogg;codecs=opus',
      'audio/wav',
      'audio/mpeg'
    ]

    const supported: string[] = []

    if (typeof MediaRecorder === 'undefined') {
      console.error('❌ MediaRecorder API 不支持')
      return supported
    }

    formats.forEach(format => {
      if (MediaRecorder.isTypeSupported(format)) {
        console.log(`✅ 支持格式: ${format}`)
        supported.push(format)
      } else {
        console.log(`❌ 不支持: ${format}`)
      }
    })

    return supported
  }

  /**
   * 检查音频上下文支持
   */
  static checkAudioContextSupport(): boolean {
    if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
      console.error('❌ Web Audio API 不支持')
      return false
    }

    console.log('✅ Web Audio API 支持')
    return true
  }

  /**
   * 检查麦克风权限
   */
  static async checkMicrophonePermission(): Promise<{
    granted: boolean
    devices: MediaDeviceInfo[]
  }> {
    try {
      // 请求权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(device => device.kind === 'audioinput')

      console.log(`✅ 麦克风权限已授予，找到 ${audioDevices.length} 个音频输入设备`)
      audioDevices.forEach((device, index) => {
        console.log(`  ${index + 1}. ${device.label || '未知设备'}`)
      })

      // 停止流
      stream.getTracks().forEach(track => track.stop())

      return {
        granted: true,
        devices: audioDevices
      }
    } catch (error: any) {
      console.error('❌ 麦克风权限被拒绝:', error.message)
      return {
        granted: false,
        devices: []
      }
    }
  }

  /**
   * 测试音频播放
   */
  static async testAudioPlayback(blob: Blob): Promise<{
    success: boolean
    duration?: number
    sampleRate?: number
    error?: string
  }> {
    try {
      const audioContext = new AudioContext()
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      console.log(`✅ 音频解码成功`)
      console.log(`   时长: ${audioBuffer.duration.toFixed(2)} 秒`)
      console.log(`   采样率: ${audioBuffer.sampleRate} Hz`)
      console.log(`   声道数: ${audioBuffer.numberOfChannels}`)
      console.log(`   样本数: ${audioBuffer.length}`)

      audioContext.close()

      return {
        success: true,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate
      }
    } catch (error: any) {
      console.error('❌ 音频解码失败:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 诊断 Blob
   */
  static diagnoseBlob(blob: Blob): void {
    console.log('📋 Blob 诊断信息:')
    console.log(`   大小: ${blob.size} bytes (${(blob.size / 1024).toFixed(2)} KB)`)
    console.log(`   类型: ${blob.type}`)
    console.log(`   是否为 Blob: ${blob instanceof Blob}`)

    if (blob.size === 0) {
      console.error('⚠️  Blob 大小为 0，录音可能失败')
    } else if (blob.size < 1024) {
      console.warn('⚠️  Blob 大小小于 1KB，录音可能不完整')
    }
  }

  /**
   * 运行完整诊断
   */
  static async runFullDiagnostic(): Promise<{
    formatsSupported: boolean
    audioContextSupported: boolean
    microphonePermissionGranted: boolean
    audioDevices: number
  }> {
    console.log('🔍 开始音频系统诊断...')
    console.log('==========================================')

    // 检查格式支持
    const supportedFormats = this.checkSupportedFormats()
    const formatsSupported = supportedFormats.length > 0

    console.log('')

    // 检查 AudioContext
    const audioContextSupported = this.checkAudioContextSupport()

    console.log('')

    // 检查麦克风权限
    const { granted, devices } = await this.checkMicrophonePermission()

    console.log('')
    console.log('==========================================')
    console.log('📊 诊断结果:')
    console.log(`   格式支持: ${formatsSupported ? '✅' : '❌'} (${supportedFormats.length} 个格式)`)
    console.log(`   AudioContext: ${audioContextSupported ? '✅' : '❌'}`)
    console.log(`   麦克风权限: ${granted ? '✅' : '❌'}`)
    console.log(`   音频设备: ${devices.length} 个`)

    if (formatsSupported && audioContextSupported && granted) {
      console.log('✅ 所有检查通过，录音功能应该可以正常使用')
    } else {
      console.error('❌ 部分检查未通过，录音功能可能有问题')
    }

    return {
      formatsSupported,
      audioContextSupported,
      microphonePermissionGranted: granted,
      audioDevices: devices.length
    }
  }

  /**
   * 检查音频 URL 是否有效
   */
  static checkAudioUrl(url: string): { valid: boolean; protocol?: string } {
    if (!url) {
      console.error('❌ 音频 URL 为空')
      return { valid: false }
    }

    if (url.startsWith('blob:')) {
      console.log('✅ Blob URL:', url)
      return { valid: true, protocol: 'blob' }
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('✅ HTTP URL:', url)
      return { valid: true, protocol: 'http' }
    }

    if (url.startsWith('data:')) {
      console.log('✅ Data URL')
      return { valid: true, protocol: 'data' }
    }

    console.error('❌ 未知 URL 协议:', url)
    return { valid: false }
  }

  /**
   * 检查音频元素状态
   */
  static checkAudioElementStatus(audioElement: HTMLAudioElement): void {
    console.log('🎵 音频元素状态:')
    console.log(`   readyState: ${audioElement.readyState} (${this.getReadyStateText(audioElement.readyState)})`)
    console.log(`   networkState: ${audioElement.networkState} (${this.getNetworkStateText(audioElement.networkState)})`)
    console.log(`   currentTime: ${audioElement.currentTime}s`)
    console.log(`   duration: ${audioElement.duration}s`)
    console.log(`   paused: ${audioElement.paused}`)
    console.log(`   ended: ${audioElement.ended}`)
    console.log(`   muted: ${audioElement.muted}`)
    console.log(`   volume: ${audioElement.volume}`)

    if (audioElement.error) {
      console.error('❌ 音频错误:')
      console.error(`   code: ${audioElement.error.code} (${this.getErrorCodeText(audioElement.error.code)})`)
      console.error(`   message: ${audioElement.error.message}`)
    }
  }

  private static getReadyStateText(state: number): string {
    const states = [
      'HAVE_NOTHING',
      'HAVE_METADATA',
      'HAVE_CURRENT_DATA',
      'HAVE_FUTURE_DATA',
      'HAVE_ENOUGH_DATA'
    ]
    return states[state] || 'UNKNOWN'
  }

  private static getNetworkStateText(state: number): string {
    const states = [
      'NETWORK_EMPTY',
      'NETWORK_IDLE',
      'NETWORK_LOADING',
      'NETWORK_NO_SOURCE'
    ]
    return states[state] || 'UNKNOWN'
  }

  private static getErrorCodeText(code: number): string {
    const codes: Record<number, string> = {
      1: 'MEDIA_ERR_ABORTED',
      2: 'MEDIA_ERR_NETWORK',
      3: 'MEDIA_ERR_DECODE',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
    }
    return codes[code] || 'UNKNOWN_ERROR'
  }
}

// 导出调试工具
export default AudioDebug
