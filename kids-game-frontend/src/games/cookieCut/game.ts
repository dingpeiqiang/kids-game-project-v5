import { createCanvasGameLifecycle } from '@shell/platform/createCanvasGameLifecycle'
import { startCookieCutLifecycle } from './cookieCut.lifecycle'

const lifecycle = createCanvasGameLifecycle('cookieCut', startCookieCutLifecycle)

export const initCookieCut = lifecycle.init
export const destroyCookieCut = lifecycle.destroy