import { createApp, h } from 'vue'
import { ElSkeleton, ElSkeletonItem } from 'element-plus'

/**
 * 创建骨架屏加载组件
 */
export function createSkeletonLoader(type: 'text' | 'image' | 'table' | 'card' = 'text') {
  const getItems = () => {
    switch (type) {
      case 'text':
        return [
          h(ElSkeletonItem, { variant: 'h3', style: { width: '50%' } }),
          h(ElSkeletonItem, { variant: 'p', style: { width: '70%' } }),
          h(ElSkeletonItem, { variant: 'p', style: { width: '60%' } })
        ]
      case 'image':
        return [
          h(ElSkeletonItem, { variant: 'image', style: { width: '200px', height: '200px' } })
        ]
      case 'table':
        return Array(5).fill(null).map(() => 
          h(ElSkeletonItem, { variant: 'rect', style: { height: '40px', marginBottom: '10px' } })
        )
      case 'card':
        return [
          h(ElSkeletonItem, { variant: 'image', style: { width: '100%', height: '180px' } }),
          h(ElSkeletonItem, { variant: 'h3', style: { margin: '10px 0' } }),
          h(ElSkeletonItem, { variant: 'text', style: { width: '80%' } }),
          h(ElSkeletonItem, { variant: 'text', style: { width: '60%' } })
        ]
      default:
        return []
    }
  }
  
  return {
    render() {
      return h(ElSkeleton, { loading: true }, () => [
        ...getItems()
      ])
    }
  }
}

/**
 * 表格骨架屏
 */
export function TableSkeleton({ rows = 5 }: { rows?: number } = {}) {
  return {
    render() {
      return h('div', { class: 'skeleton-table' },
        Array(rows).fill(null).map((_, index) =>
          h(ElSkeletonItem, {
            key: index,
            variant: 'rect',
            style: {
              height: '40px',
              marginBottom: '10px',
              borderRadius: '4px'
            }
          })
        )
      )
    }
  }
}

/**
 * 卡片骨架屏
 */
export function CardSkeleton({ count = 4 }: { count?: number } = {}) {
  return {
    render() {
      return h('div', { class: 'skeleton-cards' },
        Array(count).fill(null).map((_, index) =>
          h(ElSkeleton, { key: index, loading: true }, () => [
            h(ElSkeletonItem, { variant: 'image', style: { width: '100%', height: '180px' } }),
            h(ElSkeletonItem, { variant: 'h3', style: { margin: '10px 0' } }),
            h(ElSkeletonItem, { variant: 'text', style: { width: '80%' } }),
            h(ElSkeletonItem, { variant: 'text', style: { width: '60%' } })
          ])
        )
      )
    }
  }
}
