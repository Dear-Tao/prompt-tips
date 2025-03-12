<template>
  <el-config-provider :locale="zhCn">
    <el-container class="app-container">
      <el-header class="app-header">
        <div class="header-wrapper">
          <div class="brand-section">
            <h2><el-icon><ChatDotRound /></el-icon> Prompt生成平台</h2>
            <p class="subtitle">输入您的需求，生成高质量的Prompt</p>
          </div>
          <div class="header-content">
            <el-tabs v-model="activeTab" class="header-tabs">
              <el-tab-pane label="代码需求Prompt" name="text" />
              <el-tab-pane label="图片Prompt" name="image" />
            </el-tabs>
          </div>
          <div class="header-actions">
            <el-select
              v-model="currentModel"
              class="model-selector"
              size="small"
              @change="handleModelChange"
            >
              <el-option
                v-for="model in availableModels"
                :key="model.value"
                :label="model.label"
                :value="model.value"
              />
            </el-select>
            <el-button v-if="showClearButton" @click="clearMessages" type="danger" plain size="small" class="clear-button">
              <el-icon><Delete /></el-icon> 清空对话
            </el-button>
            <el-button type="primary" @click="goToApiConfig" class="settings-button">
              <el-icon><Setting /></el-icon> API配置
            </el-button>
            <div @click="openGithub" class="github-button">
              <img alt="GitHub stars" src="https://img.shields.io/github/stars/Dear-Tao/prompt-tips" class="github-badge">
            </div>
          </div>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <suspense>
            <template #default>
              <transition name="fade" mode="out-in">
                <keep-alive>
                  <component :is="Component" />
                </keep-alive>
              </transition>
            </template>
            <template #fallback>
              <div class="loading-state">
                <el-icon class="is-loading"><Loading /></el-icon>
                <p>加载中...</p>
              </div>
            </template>
          </suspense>
        </router-view>
      </el-main>
      <el-footer class="app-footer">
        <p>© 2025 Prompt生成平台 基于AI驱动</p>
      </el-footer>
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { ElConfigProvider } from 'element-plus'
import { Loading, Setting, ChatDotRound, Delete, Star } from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useRouter } from 'vue-router'
import { ref, watch, provide, onMounted, onUnmounted } from 'vue'

const router = useRouter()
const activeTab = ref('text')
const showClearButton = ref(false)

// 检查是否有消息历史
const checkMessagesHistory = () => {
  if (typeof window !== 'undefined') {
    const hasTextMessages = localStorage.getItem('chat_messages') && 
                           JSON.parse(localStorage.getItem('chat_messages')).length > 0
    const hasImageMessages = localStorage.getItem('image_chat_messages') && 
                            JSON.parse(localStorage.getItem('image_chat_messages')).length > 0
    
    showClearButton.value = activeTab.value === 'text' ? hasTextMessages : hasImageMessages
  }
}

// 可用的模型列表
const availableModels = [
  { label: 'Moonshot-v1-32k', value: 'moonshot-v1-32k' },
  { label: 'Deepseek-R1', value: 'deepseek-r1' },
  { label: 'deepseek-r1-distill-llama-70b', value: 'deepseek-r1-distill-llama-70b' }
]

// 当前选择的模型
const currentModel = ref(localStorage.getItem('selected_model') || 'moonshot-v1-32k')

// 处理模型变更
const handleModelChange = (value) => {
  localStorage.setItem('selected_model', value)
  // 这里可以触发事件通知其他组件模型已更改
  window.dispatchEvent(new CustomEvent('modelChange', { detail: value }))
}

// 清空对话
const clearMessages = () => {
  // 触发事件通知Home组件清空对话
  window.dispatchEvent(new CustomEvent('clearMessages'))
}

// 提供activeTab状态给子组件
provide('activeTab', activeTab)

// 从localStorage加载上次的Tab状态
const loadTabFromStorage = () => {
  const savedTab = localStorage.getItem('active_tab')
  if (savedTab) {
    activeTab.value = savedTab
  }
}

// 保存Tab状态到localStorage并更新路由
watch(activeTab, (newVal) => {
  localStorage.setItem('active_tab', newVal)
  // 更新当前路由的query参数
  router.replace({ query: { ...router.currentRoute.value.query, tab: newVal } })
  // 检查消息历史
  checkMessagesHistory()
})

// 初始化加载Tab状态
loadTabFromStorage()
// 初始化检查消息历史
checkMessagesHistory()

// 监听消息变化事件
onMounted(() => {
  window.addEventListener('storage', (event) => {
    if (event.key === 'chat_messages' || event.key === 'image_chat_messages') {
      checkMessagesHistory()
    }
  })
  
  // 监听清空消息事件
  window.addEventListener('clearMessages', () => {
    showClearButton.value = false
  })
})

onUnmounted(() => {
  window.removeEventListener('storage', null)
  window.removeEventListener('clearMessages', null)
})

// 跳转到API配置页面
const goToApiConfig = () => {
  router.push('/api-config')
}

const openGithub = () => {
  window.open('https://github.com/Dear-Tao/prompt-tips', '_blank')
}
</script>

<style lang="scss">
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 0 24px;
  height: auto !important;
  transition: all 0.3s ease;
  
  .header-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 12px 0;
    
    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 0;
      
      h2 {
        font-size: 20px;
        color: #2c3e50;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        
        .el-icon {
          font-size: 24px;
          color: #409eff;
        }
      }
      
      .subtitle {
        color: #606266;
        font-size: 14px;
        margin: 0;
        white-space: nowrap;
      }
    }
  }
  
  .header-content {
    flex: 1;
    min-width: 0;
    
    .header-tabs {
      .el-tabs__nav-wrap::after {
        height: 1px;
      }
      
      .el-tabs__item {
        font-size: 14px;
        padding: 0 20px;
      }
    }
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
    flex-shrink: 0;
  
    .clear-button {
      font-size: 14px;
      padding: 8px 16px;
      height: 32px;
      line-height: 1;
      white-space: nowrap;
    }
  
    .model-selector {
      width: 180px;
      margin-right: 8px;
      
      :deep(.el-input__wrapper) {
        background-color: transparent;
        border-radius: 4px;
        transition: all 0.3s ease;
        
        &:hover {
          background-color: #f5f7fa;
        }
      }
      
      :deep(.el-input__inner) {
        color: #606266;
        font-size: 14px;
      }
    }
    
    .settings-button {
      border-radius: 8px;
      padding: 8px 16px;
      transition: all 0.3s ease;
      white-space: nowrap;
      flex-shrink: 0;
      
      &:hover {
        transform: translateY(-1px);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      .el-icon {
        margin-right: 4px;
      }
    }
    
    .github-button {
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      
      &:hover {
        transform: translateY(-1px);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      .github-badge {
        height: 20px;
      }
    }
  }
}

.app-main {
  padding: 24px;
  background-color: #f5f7fa;
}

.app-footer {
  text-align: center;
  padding: 16px;
  background-color: #fff;
  color: #909399;
  font-size: 14px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  
  .el-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}
</style>