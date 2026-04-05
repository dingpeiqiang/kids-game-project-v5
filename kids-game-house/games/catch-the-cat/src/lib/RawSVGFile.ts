/// <reference path="../phaser.d.ts"/>

import Phaser from 'phaser';

/**
 * 自定义 SVG 文件加载器 - 直接将 SVG 字符串转换为 Phaser 纹理
 * 不继承 Phaser 内置的 SVGFile，避免重复处理
 */
export default class RawSVGFile extends Phaser.Loader.File {
    rawData: string;
    svgConfig?: { width?: number; height?: number; scale?: number };
    // 缓存 textures manager 引用
    private textures: Phaser.Textures.TextureManager | null = null;

    constructor(
        loader: Phaser.Loader.LoaderPlugin,
        key: string,
        data: string,
        svgConfig?: { width?: number; height?: number; scale?: number }
    ) {
        super(loader, {
            type: 'svg',
            key: key,
        });
        this.rawData = data;
        this.svgConfig = svgConfig;
        
        // 在构造函数中尽早获取 textures manager
        this.initTextures();
    }
    
    private initTextures(): void {
        try {
            // 方式1：通过 scene.sys.game.textures（最可靠）
            const loaderAny = this.loader as any;
            if (loaderAny.scene?.sys?.game?.textures) {
                this.textures = loaderAny.scene.sys.game.textures;
                return;
            }
            // 方式2：通过 sys.game.textures
            if (loaderAny.sys?.game?.textures) {
                this.textures = loaderAny.sys.game.textures;
                return;
            }
            // 方式3：通过全局 game 变量
            if (typeof window !== 'undefined' && (window as any).game?.textures) {
                this.textures = (window as any).game.textures;
                return;
            }
            // 方式4：等待游戏创建后从 window.game 获取
            const checkGame = () => {
                if ((window as any).game?.textures) {
                    this.textures = (window as any).game.textures;
                    return true;
                }
                return false;
            };
            if (!checkGame()) {
                // 尝试延迟获取
                setTimeout(() => {
                    if (!this.textures && checkGame()) {
                        console.log('[RawSVGFile] Textures manager obtained via delayed check');
                    }
                }, 100);
            }
        } catch (e) {
            console.error('[RawSVGFile] Error initializing textures:', e);
        }
    }

    load(): void {
        if (this.state === Phaser.Loader.FILE_POPULATED) {
            this.loader.nextFile(this, true);
        } else {
            this.processSVG();
        }
    }

    private processSVG(): void {
        try {
            const svgString = this.rawData;
            
            // 解析 SVG 获取尺寸
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgString, 'image/svg+xml');
            const svgElement = doc.documentElement as unknown as SVGElement;
            
            let svgWidth = this.svgConfig?.width || 32;
            let svgHeight = this.svgConfig?.height || 32;
            
            if (svgElement && svgElement.getAttribute) {
                const w = svgElement.getAttribute('width');
                const h = svgElement.getAttribute('height');
                if (w) svgWidth = parseFloat(w);
                if (h) svgHeight = parseFloat(h);
            }
            
            // 应用 scale
            if (this.svgConfig?.scale) {
                svgWidth *= this.svgConfig.scale;
                svgHeight *= this.svgConfig.scale;
            }
            
            // 创建 Canvas 来渲染 SVG
            const canvas = document.createElement('canvas');
            canvas.width = svgWidth;
            canvas.height = svgHeight;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
                    
                    // 使用缓存的 textures manager
                    if (this.textures) {
                        // 先检查是否已存在
                        if (this.textures.exists(this.key)) {
                            this.textures.remove(this.key);
                        }
                        // 添加 Canvas 作为纹理
                        this.textures.addCanvas(this.key, canvas);
                        this.onProcessComplete();
                    } else {
                        // 最后的备选方案：再次尝试获取
                        console.warn('[RawSVGFile] Textures not cached, trying window.game...');
                        const gameTextures = (window as any).game?.textures;
                        if (gameTextures) {
                            if (gameTextures.exists(this.key)) {
                                gameTextures.remove(this.key);
                            }
                            gameTextures.addCanvas(this.key, canvas);
                            this.textures = gameTextures;
                            this.onProcessComplete();
                        } else {
                            console.error('[RawSVGFile] Textures manager not available, key:', this.key);
                            this.onProcessError(new Error('Textures manager not available'));
                        }
                    }
                };
                img.onerror = () => {
                    console.error('[RawSVGFile] Failed to load SVG image, key:', this.key);
                    this.onProcessError(new Error('Failed to load SVG as image'));
                };
                
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
            } else {
                this.onProcessError(new Error('Failed to get canvas context'));
            }
        } catch (e) {
            console.error('[RawSVGFile] Error processing SVG:', e);
            this.onProcessError(e as Error);
        }
    }
}
