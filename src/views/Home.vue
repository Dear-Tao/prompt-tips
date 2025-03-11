<template>
  <div class="home-container">
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 文本消息 -->
      <div v-if="activeTab === 'text'" class="messages-wrapper">
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="empty-state">
          <el-empty description="暂无对话记录">
            <template #image>
              <el-icon class="empty-icon"><ChatLineRound /></el-icon>
            </template>
            <p>在下方输入您的需求，开始生成Prompt</p>
          </el-empty>
        </div>
        
        <!-- 消息列表 -->
        <template v-else>
          <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
            <div class="message-header">
              <span class="role-badge">{{ msg.role === 'user' ? '您' : 'AI助手' }}</span>
              <span class="message-time">{{ new Date().toLocaleTimeString() }}</span>
            </div>
            <pre>{{ msg.content }}</pre>
            <div v-if="msg.role === 'assistant' && msg.content" class="action-buttons">
              <el-button size="small" type="primary" @click="copyToClipboard(msg.content)">
                <el-icon><Document /></el-icon> 复制
              </el-button>
              <el-button size="small" @click="exportPrompt(msg.content)">
                <el-icon><Download /></el-icon> 导出
              </el-button>
            </div>
          </div>
        </template>
      </div>
      
      <!-- 图片消息 -->
      <div v-else class="messages-wrapper">
        <!-- 空状态 -->
        <div v-if="imageMessages.length === 0" class="empty-state">
          <el-empty description="暂无图片Prompt记录">
            <template #image>
              <el-icon class="empty-icon"><Picture /></el-icon>
            </template>
            <p>在下方输入图片描述，开始生成图片Prompt</p>
          </el-empty>
        </div>
        
        <!-- 消息列表 -->
        <template v-else>
          <div v-for="(msg, index) in imageMessages" :key="index" :class="['message', msg.role]">
            <div class="message-header">
              <span class="role-badge">{{ msg.role === 'user' ? '您' : 'AI助手' }}</span>
              <span class="message-time">{{ new Date().toLocaleTimeString() }}</span>
            </div>
            <pre>{{ msg.content }}</pre>
            <div v-if="msg.role === 'assistant' && msg.content" class="action-buttons">
              <el-button size="small" type="primary" @click="copyToClipboard(msg.content)">
                <el-icon><Document /></el-icon> 复制
              </el-button>
              <el-button size="small" @click="exportPrompt(msg.content)">
                <el-icon><Download /></el-icon> 导出
              </el-button>
            </div>
          </div>
        </template>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-container">
      <!-- 文本输入 -->
      <template v-if="activeTab === 'text'">
        <div class="text-input-wrapper">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            placeholder="请输入您的需求描述，例如：我需要一个能够帮助我写技术博客的提示词..."
            @keyup.enter.exact.prevent="generatePrompt"
            :disabled="loading"
          />
          <div class="input-buttons">
            <el-button 
              v-if="loading"
              type="danger" 
              @click="stopGeneration"
              class="stop-btn"
            >
              <el-icon><CircleClose /></el-icon> 停止生成
            </el-button>
            <el-button 
              type="primary" 
              :loading="loading && !isGenerating" 
              @click="generatePrompt"
              :disabled="!userInput.trim() || !isApiKeyConfigured"
              class="generate-btn"
            >
              {{ loading ? '生成中...' : '生成Prompt' }}
              <el-icon class="el-icon--right"><Send /></el-icon>
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 图片输入 -->
      <template v-else>
        <div class="image-form">
          <div class="form-row">
            <el-select v-model="imagePromptForm.style" placeholder="图片风格">
              <el-option label="写实风格" value="realistic" />
              <el-option label="卡通风格" value="cartoon" />
              <el-option label="水彩画风格" value="watercolor" />
              <el-option label="油画风格" value="oil-painting" />
              <el-option label="素描风格" value="sketch" />
              <el-option label="科幻风格" value="sci-fi" />
              <el-option label="赛博朋克" value="cyberpunk" />
              <el-option label="未来主义" value="futuristic" />
            </el-select>
            <el-select v-model="imagePromptForm.size" placeholder="图片尺寸">
              <el-option label="1024 x 1024" value="1024x1024" />
              <el-option label="1920 x 1080" value="1920x1080" />
              <el-option label="1080 x 1920" value="1080x1920" />
              <el-option label="800 x 600" value="800x600" />
            </el-select>
          </div>
          
          <div class="description-row">
            <el-input
              v-model="imagePromptForm.description"
              type="textarea"
              :rows="3"
              placeholder="请描述您想要生成的图片内容，例如：海边日落，包含沙滩、椰子树和冲浪者..."
              :disabled="loading"
            />
            <div class="input-buttons">
              <el-button 
                v-if="loading"
                type="danger" 
                @click="stopGeneration"
              >
                <el-icon><CircleClose /></el-icon> 停止生成
              </el-button>
              <el-button 
                type="primary" 
                :loading="loading && !isGenerating" 
                @click="generateImagePrompt"
                :disabled="!imagePromptForm.description.trim() || !isApiKeyConfigured"
              >
                {{ loading ? '生成中...' : '生成图片Prompt' }}
                <el-icon class="el-icon--right"><Send /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, inject, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Document,
  Download,
  Setting,
  ChatDotRound,
  ChatLineRound,
  Promotion as Send,
  Delete,
  Picture,
  CircleClose
} from '@element-plus/icons-vue'
import { generatePrompt as generateApiPrompt } from '../api/moonshot'

const router = useRouter()
const activeTab = inject('activeTab') // 注入App.vue提供的activeTab状态
const messages = ref([])
const imageMessages = ref([]) // 图片Prompt消息记录
const userInput = ref('')
const loading = ref(false)
const isGenerating = ref(false) // 控制生成状态
const isApiKeyConfigured = ref(false)
const STORAGE_KEY = 'chat_messages' // 定义存储消息的键名
const IMAGE_STORAGE_KEY = 'image_chat_messages' // 定义存储图片消息的键名
// 当前请求的控制器
let abortController = null

// 图片Prompt表单数据
const imagePromptForm = ref({
  description: '',
  style: 'realistic',
  size: '1024x1024'
})

// 导航栏滚动状态
const isScrolled = ref(false)

// 监听滚动事件
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

// 从localStorage加载消息
const loadMessagesFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY)
      if (savedMessages) {
        messages.value = JSON.parse(savedMessages)
      }
      
      // 加载图片消息
      const savedImageMessages = localStorage.getItem(IMAGE_STORAGE_KEY)
      if (savedImageMessages) {
        imageMessages.value = JSON.parse(savedImageMessages)
      }
      

    } catch (error) {
      console.error('加载消息失败:', error)
    }
  }
}

// 保存消息到localStorage
const saveMessagesToStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value))
    } catch (error) {
      console.error('保存消息失败:', error)
    }
  }
}

// 保存图片消息到localStorage
const saveImageMessagesToStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(imageMessages.value))
    } catch (error) {
      console.error('保存图片消息失败:', error)
    }
  }
}

// 保存当前活动标签到localStorage
const saveActiveTabToStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('active_tab', activeTab.value)
    } catch (error) {
      console.error('保存活动标签失败:', error)
    }
  }
}

// 清空对话历史
const clearMessages = () => {
  if (activeTab.value === 'text') {
    messages.value = []
    saveMessagesToStorage()
    ElMessage({
      message: '文本Prompt对话历史已清空',
      type: 'success',
      duration: 2000
    })
  } else {
    imageMessages.value = []
    saveImageMessagesToStorage()
    ElMessage({
      message: '图片Prompt对话历史已清空',
      type: 'success',
      duration: 2000
    })
  }
}

// 检查API密钥状态
const checkApiKeyStatus = () => {
  if (typeof window !== 'undefined') {
    const savedApiKey = localStorage.getItem('moonshot_api_key')
    if (savedApiKey) {
      isApiKeyConfigured.value = true
    }
  }
}

// 跳转到API配置页面
const goToApiConfig = () => {
  router.push('/api-config')
}

// 更新消息内容
const updateMessage = (index, content, isImageMessage = false) => {
  const msgArray = isImageMessage ? imageMessages : messages
  if (index >= 0 && index < msgArray.value.length) {
    // 创建消息的深拷贝，确保响应式更新
    const updatedMessages = [...msgArray.value]
    updatedMessages[index] = {
      ...updatedMessages[index],
      content: updatedMessages[index].content + content
    }
    // 替换整个数组以触发响应式更新
    msgArray.value = updatedMessages
    
    // 确保滚动到底部
    nextTick(() => {
      scrollToBottom(isImageMessage)
    })
  }
}

// 生成文本Prompt
const generatePrompt = async () => {
  if (!userInput.value.trim()) {
    ElMessage.warning('请输入您的需求描述')
    return
  }

  if (!isApiKeyConfigured.value) {
    ElMessage.warning('请先配置API密钥')
    return
  }

  const userMessage = { role: 'user', content: userInput.value.trim() }
  messages.value.push(userMessage)
  userInput.value = ''

  // 保存消息到localStorage
  saveMessagesToStorage()

  loading.value = true
  isGenerating.value = true
  const assistantMessage = { role: 'assistant', content: '' }
  messages.value.push(assistantMessage)
  const messageIndex = messages.value.length - 1

  try {
    console.log('开始生成Prompt...')
    // 创建新的AbortController
    abortController = new AbortController()
    
    await generateApiPrompt(userMessage.content, (content) => {
      console.log('收到内容:', content)
      updateMessage(messageIndex, content)
      // 每次更新内容后保存到localStorage
      saveMessagesToStorage()
    }, abortController.signal)
    
    console.log('Prompt生成完成')
  } catch (error) {
    console.error('生成Prompt错误:', error)
    if (error.name === 'AbortError') {
      ElMessage.info('已停止生成')
    } else {
      ElMessage.error(error.message || '生成失败，请重试')
      // 移除失败的消息
      messages.value.pop()
      // 保存更新后的消息
      saveMessagesToStorage()
    }
  } finally {
    loading.value = false
    isGenerating.value = false
    abortController = null
  }
}

// 生成图片Prompt
const generateImagePrompt = async () => {
  if (!imagePromptForm.value.description.trim()) {
    ElMessage.warning('请输入图片描述内容')
    return
  }

  if (!isApiKeyConfigured.value) {
    ElMessage.warning('请先配置API密钥')
    return
  }

  // 构建用户消息内容，包含图片描述、风格和尺寸
  const promptRequest = `请为我生成一个图片Prompt，描述内容：${imagePromptForm.value.description}，风格：${imagePromptForm.value.style}，尺寸：${imagePromptForm.value.size}`
  
  const userMessage = { role: 'user', content: promptRequest }
  imageMessages.value.push(userMessage)
  
  // 保存消息到localStorage
  saveImageMessagesToStorage()

  loading.value = true
  isGenerating.value = true
  const assistantMessage = { role: 'assistant', content: '' }
  imageMessages.value.push(assistantMessage)
  const messageIndex = imageMessages.value.length - 1

  try {
    console.log('开始生成图片Prompt...')
    // 创建新的AbortController
    abortController = new AbortController()
    
    await generateApiPrompt(promptRequest, (content) => {
      console.log('收到内容:', content)
      updateMessage(messageIndex, content, true)
      // 每次更新内容后保存到localStorage
      saveImageMessagesToStorage()
    }, abortController.signal)
    
    console.log('图片Prompt生成完成')
  } catch (error) {
    console.error('生成图片Prompt错误:', error)
    if (error.name === 'AbortError') {
      ElMessage.info('已停止生成')
    } else {
      ElMessage.error(error.message || '生成失败，请重试')
      // 移除失败的消息
      imageMessages.value.pop()
      // 保存更新后的消息
      saveImageMessagesToStorage()
    }
  } finally {
    loading.value = false
    isGenerating.value = false
    abortController = null
  }
}

// 停止生成
const stopGeneration = () => {
  if (abortController) {
    abortController.abort()
    abortController = null
    console.log('已停止生成')
  }
}

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      ElMessage({
        message: '已复制到剪贴板',
        type: 'success',
        duration: 2000
      })
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}

// 导出Prompt
const exportPrompt = (text) => {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `prompt-${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage({
    message: 'Prompt已导出为文本文件',
    type: 'success',
    duration: 2000
  })
}

// 滚动到底部
const scrollToBottom = (isImageMessage = false) => {
  nextTick(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTop = mainContent.scrollHeight;
    }
  });
}

// 检查API密钥
onMounted(() => {
  checkApiKeyStatus()
  loadMessagesFromStorage() // 加载保存的消息
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 监听消息变化，保存到localStorage
watch(messages, () => {
  saveMessagesToStorage()
}, { deep: true })

// 监听图片消息变化，保存到localStorage
watch(imageMessages, () => {
  saveImageMessagesToStorage()
}, { deep: true })

// 监听Tab变化，保存到localStorage
watch(activeTab, () => {
  saveActiveTabToStorage()
})
</script>

<style lang="scss" scoped>
.home-container {
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.main-content {
  flex: 1;
  padding: 20px;
  padding-top: 30px;
  margin-bottom: 80px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  
  @media (max-width: 768px) {
    padding: 12px;
    padding-top: 20px;
  }
}

.messages-wrapper {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 900px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  
  .empty-icon {
    font-size: 4.5rem;
    color: #909399;
    margin-bottom: 24px;
  }
  
  p {
    color: #606266;
    font-size: 15px;
    margin: 0;
    letter-spacing: 0.3px;
    line-height: 1.6;
  }
}

.message {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
  
  &.user {
    background-color: #ecf5ff;
    margin-left: 32px;
    border: 1px solid #d9ecff;
  }
  
  &.assistant {
    background-color: #f8f9fa;
    margin-right: 32px;
    border: 1px solid #ebeef5;
  }
  
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .role-badge {
      font-weight: 600;
      font-size: 13px;
      color: #409eff;
      background-color: #ecf5ff;
      padding: 4px 12px;
      border-radius: 16px;
      box-shadow: 0 2px 5px rgba(64, 158, 255, 0.15);
    }
    
    .message-time {
      font-size: 12px;
      color: #909399;
    }
  }
  
  pre {
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #2c3e50;
  }
  
  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
    opacity: 0.8;
    transition: opacity 0.2s ease;
    
    &:hover {
      opacity: 1;
    }
  }
}

.input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;

  .text-input-wrapper {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    max-width: 1200px;
    margin: 0 auto;

    .el-input {
      flex: 1;

      :deep(.el-textarea__inner) {
        min-height: 60px;
        padding: 12px;
        font-size: 16px;
        border-radius: 8px;
        border: 2px solid #e4e7ed;
        transition: all 0.3s ease;

        &:hover, &:focus {
          border-color: #409eff;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
        }
      }
    }

    .input-buttons {
      display: flex;
      gap: 8px;
      
      .el-button {
        height: 60px;
        padding: 0 24px;
        font-size: 16px;
        border-radius: 8px;
        
        &.generate-btn {
          min-width: 140px;
        }
        
        &.stop-btn {
          min-width: 120px;
        }
      }
    }
  }

  .image-form {
    max-width: 1200px;
    margin: 0 auto;

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;

      .el-select {
        width: 160px;
        opacity: 0.85;
        transition: opacity 0.3s ease;

        &:hover {
          opacity: 1;
        }

        :deep(.el-input__wrapper) {
          background-color: #f5f7fa;
        }
      }
    }

    .description-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;

      .el-input {
        flex: 1;

        :deep(.el-textarea__inner) {
          min-height: 60px;
          padding: 12px;
          font-size: 16px;
          border-radius: 8px;
          border: 2px solid #e4e7ed;
          transition: all 0.3s ease;

          &:hover, &:focus {
            border-color: #409eff;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
          }
        }
      }

      .input-buttons {
        display: flex;
        gap: 8px;

        .el-button {
          height: 60px;
          padding: 0 24px;
          font-size: 16px;
          border-radius: 8px;
        }
      }
    }
  }
}

.main-content {
  padding-bottom: 120px;
}
</style>
<style scoped>
.image-prompt-form {
  width: 100%;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.style-select,
.size-select {
  flex: 1;
  margin-bottom: 0;
}

.input-group {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.description-input {
  flex: 1;
  margin-bottom: 0;
}

.generate-button {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 30px;
}

.w-full {
  width: 100%;
}
</style>

