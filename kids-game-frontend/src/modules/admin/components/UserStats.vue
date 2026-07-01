<template>
  <div class="user-stats">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon kid">
              <el-icon><Baby /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.kidCount }}</div>
              <div class="stat-label">儿童用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon parent">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.parentCount }}</div>
              <div class="stat-label">家长用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon online">
              <el-icon><VideoPlay /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.onlineCount }}</div>
              <div class="stat-label">在线用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <!-- 用户类型分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-title">用户类型分布</div>
          </template>
          <div ref="userTypeChartRef" class="chart"></div>
        </el-card>
      </el-col>

      <!-- 用户状态分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-title">用户状态分布</div>
          </template>
          <div ref="userStatusChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 活跃度趋势图 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-title">近 7 天用户活跃度趋势</div>
          </template>
          <div ref="activityTrendChartRef" class="chart-large"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 游学币使用统计 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-title">游学币使用情况</div>
          </template>
          <div ref="fatigueChartRef" class="chart"></div>
        </el-card>
      </el-col>

      <!-- 游戏时长统计 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-title">儿童游戏时长 TOP10</div>
          </template>
          <div ref="gameTimeChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// 统计数据
const stats = reactive({
  totalUsers: 0,
  kidCount: 0,
  parentCount: 0,
  adminCount: 0,
  onlineCount: 0
})

// Chart refs
const userTypeChartRef = ref<HTMLDivElement>()
const userStatusChartRef = ref<HTMLDivElement>()
const activityTrendChartRef = ref<HTMLDivElement>()
const fatigueChartRef = ref<HTMLDivElement>()
const gameTimeChartRef = ref<HTMLDivElement>()

// 获取统计数据
const fetchStats = async () => {
  try {
    // TODO: 调用真实 API
    // const res = await getUserStats()
    
    // Mock 数据
    stats.totalUsers = 150
    stats.kidCount = 100
    stats.parentCount = 45
    stats.adminCount = 5
    stats.onlineCount = 32
    
    // 渲染图表
    nextTick(() => {
      renderUserTypeChart()
      renderUserStatusChart()
      renderActivityTrendChart()
      renderFatigueChart()
      renderGameTimeChart()
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 用户类型分布饼图
const renderUserTypeChart = () => {
  if (!userTypeChartRef.value) return
  
  const chart = echarts.init(userTypeChartRef.value)
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '用户类型',
        type: 'pie',
        radius: '60%',
        data: [
          { value: stats.kidCount, name: '儿童' },
          { value: stats.parentCount, name: '家长' },
          { value: stats.adminCount, name: '管理员' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        color: ['#67C23A', '#E6A23C', '#F56C6C']
      }
    ]
  }
  
  chart.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 用户状态分布饼图
const renderUserStatusChart = () => {
  if (!userStatusChartRef.value) return
  
  const chart = echarts.init(userStatusChartRef.value)
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '用户状态',
        type: 'pie',
        radius: '60%',
        data: [
          { value: 140, name: '正常' },
          { value: 8, name: '禁用' },
          { value: 2, name: '锁定' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        color: ['#67C23A', '#909399', '#E6A23C']
      }
    ]
  }
  
  chart.setOption(option)
  
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 活跃度趋势图
const renderActivityTrendChart = () => {
  if (!activityTrendChartRef.value) return
  
  const chart = echarts.init(activityTrendChartRef.value)
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['登录次数', '游戏次数', '答题次数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['03-17', '03-18', '03-19', '03-20', '03-21', '03-22', '03-23']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '登录次数',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210],
        smooth: true,
        areaStyle: {
          opacity: 0.3
        }
      },
      {
        name: '游戏次数',
        type: 'line',
        data: [220, 182, 191, 234, 290, 330, 310],
        smooth: true,
        areaStyle: {
          opacity: 0.3
        }
      },
      {
        name: '答题次数',
        type: 'line',
        data: [150, 232, 201, 154, 190, 330, 410],
        smooth: true,
        areaStyle: {
          opacity: 0.3
        }
      }
    ]
  }
  
  chart.setOption(option)
  
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 游学币使用情况
const renderFatigueChart = () => {
  if (!fatigueChartRef.value) return
  
  const chart = echarts.init(fatigueChartRef.value)
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['充足', '不足', '已耗尽']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '人数'
    },
    yAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    series: [
      {
        name: '充足',
        type: 'bar',
        stack: 'total',
        data: [320, 302, 301, 334, 390, 330, 320],
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '不足',
        type: 'bar',
        stack: 'total',
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '已耗尽',
        type: 'bar',
        stack: 'total',
        data: [20, 18, 19, 23, 29, 33, 31],
        itemStyle: { color: '#F56C6C' }
      }
    ]
  }
  
  chart.setOption(option)
  
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 游戏时长统计
const renderGameTimeChart = () => {
  if (!gameTimeChartRef.value) return
  
  const chart = echarts.init(gameTimeChartRef.value)
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['张小宝', '李小贝', '王小星', '赵小辰', '刘小宇', '黄小轩', '周小怡', '吴小涵', '郑小琪', '孙小睿'],
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '分钟'
    },
    series: [
      {
        name: '游戏时长',
        type: 'bar',
        data: [120, 200, 150, 80, 70, 110, 130, 90, 100, 140],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  }
  
  chart.setOption(option)
  
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 生命周期
onMounted(() => {
  fetchStats()
})
</script>

<style scoped lang="scss">
.user-stats {
  padding: 20px;
  
  .stats-cards {
    margin-bottom: 20px;
    
    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          color: white;
          margin-right: 15px;
          
          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          &.kid {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          
          &.parent {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
          
          &.online {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        }
        
        .stat-info {
          flex: 1;
          
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #303133;
          }
          
          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-top: 5px;
          }
        }
      }
    }
  }
  
  .charts-row {
    margin-bottom: 20px;
    
    .card-title {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }
    
    .chart {
      height: 300px;
      width: 100%;
    }
    
    .chart-large {
      height: 400px;
      width: 100%;
    }
  }
}
</style>
