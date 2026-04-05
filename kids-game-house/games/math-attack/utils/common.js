// x1 ---- t1
// ?  ---- t2
function ruleOfThree(x1, t2, t1) {
    const x2 = (x1 * t2) / t1
    return x2
}

function createAnimation(key, texture, start, end, frameRate, repeat, yoyo) {
    this.anims.create({
        key: key,
        frames: this.anims.generateFrameNumbers(texture, { start: start, end: end }),
        frameRate: frameRate,
        repeat: repeat,
        yoyo: yoyo
    });
}

// tweens.timeline() 在 Phaser 3.60+ 已移除，改用 tweens.add yoyo 实现相同闪烁效果
function flashElement(element, callback, alpha = .5, duration = 40, easing = 'Linear', repeat = 10) {
    this.tweens.add({
        targets: element,
        alpha: { from: 1, to: alpha },
        ease: easing,
        duration: duration,
        yoyo: true,
        repeat: repeat,
        onComplete: () => {
            element.alpha = 1
            callback()
        }
    })
}


export {
    ruleOfThree,
    createAnimation,
    flashElement
}