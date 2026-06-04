/**
 * UI 组件集成测试
 * 
 * 测试 LevelProgressBar 和 ObjectiveList 组件的集成和功能
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LevelProgressBar from '../src/components/ui/LevelProgressBar.vue'
import ObjectiveList from '../src/components/ui/ObjectiveList.vue'
import type { Objective } from '../src/types/ObjectiveTypes'

describe('UI Component Integration Tests', () => {
  
  describe('LevelProgressBar', () => {
    
    it('should render with initial props', () => {
      const wrapper = mount(LevelProgressBar, {
        props: {
          progress: 0,
          visible: true,
          loadingText: '正在加载...'
        }
      })
      
      expect(wrapper.find('.progress-container').exists()).toBe(true)
      expect(wrapper.find('.progress-bar-fill').exists()).toBe(true)
      expect(wrapper.text()).toContain('正在加载...')
    })
    
    it('should update progress bar width when progress changes', async () => {
      const wrapper = mount(LevelProgressBar, {
        props: {
          progress: 50,
          visible: true
        }
      })
      
      const progressBar = wrapper.find('.progress-bar-fill')
      expect(progressBar.attributes('style')).toContain('width: 50%')
      
      await wrapper.setProps({ progress: 75 })
      expect(progressBar.attributes('style')).toContain('width: 75%')
    })
    
    it('should emit complete event when progress reaches 100', async () => {
      const wrapper = mount(LevelProgressBar, {
        props: {
          progress: 99,
          visible: true,
          autoHideDelay: 100
        }
      })
      
      await wrapper.setProps({ progress: 100 })
      
      // Wait for the timeout
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('complete')).toBeTruthy()
    })
    
    it('should hide when visible prop is false', async () => {
      const wrapper = mount(LevelProgressBar, {
        props: {
          progress: 50,
          visible: true
        }
      })
      
      await wrapper.setProps({ visible: false })
      expect(wrapper.find('.progress-container').exists()).toBe(false)
    })
    
    it('should have correct CSS classes for animation', () => {
      const wrapper = mount(LevelProgressBar, {
        props: {
          progress: 50,
          visible: true
        }
      })
      
      const fill = wrapper.find('.progress-bar-fill')
      expect(fill.classes()).toContain('progress-bar-fill')
      
      const breath = wrapper.find('.progress-breath')
      expect(breath.exists()).toBe(true)
    })
  })
  
  describe('ObjectiveList', () => {
    
    const mockObjectives: Objective[] = [
      {
        id: 'collect_food',
        type: 'collect',
        title: '收集食物',
        description: '收集 10 个食物',
        target: 10,
        current: 5,
        completed: false
      },
      {
        id: 'reach_score',
        type: 'score',
        title: '达到分数',
        description: '达到 100 分',
        target: 100,
        current: 100,
        completed: true
      }
    ]
    
    it('should render objectives list', () => {
      const wrapper = mount(ObjectiveList, {
        props: {
          objectives: mockObjectives
        }
      })
      
      expect(wrapper.find('.objective-list').exists()).toBe(true)
      expect(wrapper.findAll('.objective-item').length).toBe(2)
    })
    
    it('should display objective icons', () => {
      const wrapper = mount(ObjectiveList, {
        props: {
          objectives: mockObjectives
        }
      })
      
      const icons = wrapper.findAll('.objective-icon span')
      expect(icons.length).toBeGreaterThan(0)
      // collect type should show 🍎
      expect(icons[0].text()).toBe('🍎')
      // score type should show ⭐
      expect(icons[1].text()).toBe('⭐')
    })
    
    it('should show progress for incomplete objectives', () => {
      const wrapper = mount(ObjectiveList, {
        props: {
          objectives: mockObjectives
        }
      })
      
      const descriptions = wrapper.findAll('.objective-description')
      expect(descriptions[0].text()).toContain('(5/10)')
    })
    
    it('should apply completed class to finished objectives', () => {
      const wrapper = mount(ObjectiveList, {
        props: {
          objectives: mockObjectives
        }
      })
      
      const items = wrapper.findAll('.objective-item')
      expect(items[1].classes()).toContain('completed')
      
      const checkMarks = items[1].findAll('.objective-check span')
      expect(checkMarks.length).toBeGreaterThan(0)
      expect(checkMarks[0].text()).toBe('✓')
    })
    
    it('should calculate progress percentage correctly', () => {
      const wrapper = mount(ObjectiveList, {
        props: {
          objectives: mockObjectives
        }
      })
      
      const progressBar = wrapper.find('.objective-progress-bar-fill')
      // 5/10 = 50%
      expect(progressBar.attributes('style')).toContain('width: 50%')
    })
    
    it('should handle empty objectives list', () => {
      const wrapper = mount(ObjectiveList, {
        props: {
          objectives: []
        }
      })
      
      expect(wrapper.find('.objective-list').exists()).toBe(false)
    })
    
    it('should update when objectives change', async () => {
      const wrapper = mount(ObjectiveList, {
        props: {
          objectives: [mockObjectives[0]]
        }
      })
      
      expect(wrapper.findAll('.objective-item').length).toBe(1)
      
      await wrapper.setProps({ objectives: mockObjectives })
      expect(wrapper.findAll('.objective-item').length).toBe(2)
    })
  })
  
  describe('Component Integration', () => {
    
    const mockObjectives: Objective[] = [
      {
        id: 'collect_food',
        type: 'collect',
        title: '收集食物',
        description: '收集 10 个食物',
        target: 10,
        current: 5,
        completed: false
      },
      {
        id: 'reach_score',
        type: 'score',
        title: '达到分数',
        description: '达到 100 分',
        target: 100,
        current: 100,
        completed: true
      }
    ]
    
    it('should work together without conflicts', () => {
      const progressWrapper = mount(LevelProgressBar, {
        props: {
          progress: 50,
          visible: true
        }
      })
      
      const objectiveWrapper = mount(ObjectiveList, {
        props: {
          objectives: mockObjectives
        }
      })
      
      expect(progressWrapper.find('.progress-container').exists()).toBe(true)
      expect(objectiveWrapper.find('.objective-list').exists()).toBe(true)
    })
    
    it('should handle rapid prop updates', async () => {
      const wrapper = mount(LevelProgressBar, {
        props: {
          progress: 0,
          visible: true
        }
      })
      
      // Rapid updates
      for (let i = 0; i < 10; i++) {
        await wrapper.setProps({ progress: i * 10 })
      }
      
      expect(wrapper.find('.progress-bar-fill').attributes('style')).toContain('width: 90%')
    })
  })
})
