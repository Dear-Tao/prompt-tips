<template>
  <div class="home-container">
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 文本消息 -->
      <div v-if="activeTab === 'text'" class="messages-wrapper">
        <!-- 标题和模型信息 -->
        <div class="messages-header">
          <div class="header-left">
            <h2>文本对话</h2>
          </div>
        </div>
        
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
              <div class="header-left">
                <span class="role-badge">{{ msg.role === 'user' ? '您' : 'AI助手' }}</span>
                <span v-if="msg.role === 'assistant'" class="model-info" @click="goToApiConfig" title="点击配置API">
                  <el-icon><Monitor /></el-icon>
                  <span class="model-label">模型:</span> {{ formatModelName(msg.modelName || currentModel.value) }}
                </span>
              </div>
              <span class="message-time">{{ new Date().toLocaleTimeString() }}</span>
            </div>
            
            <!-- 思考过程区域 -->
            <div v-if="msg.role === 'assistant' && msg.thinking" class="thinking-section">
              <div class="thinking-header" @click="toggleThinking(msg)">
                <el-icon :class="{ 'is-rotate': msg.showThinking }"><ArrowDown /></el-icon>
                <span>思考过程</span>
              </div>
              <div v-show="msg.showThinking" class="thinking-content">
                <pre>{{ msg.thinking }}</pre>
              </div>
            </div>
            
            <!-- 回答内容 -->
            <pre>{{ msg.content }}</pre>
            
            <!-- 文本消息的操作按钮 -->
            <div v-if="msg.role === 'assistant' && msg.content" class="action-buttons">
              <el-button size="small" type="primary" @click="copyToClipboard(msg.content)">
                <el-icon><Document /></el-icon> 复制
              </el-button>
              <el-button 
                size="small" 
                :type="msg.showTranslation ? 'warning' : 'default'" 
                @click="translateMessage(msg)"
              >
                <el-icon><Connection /></el-icon> {{ msg.showTranslation ? '原文' : '翻译' }}
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
        <!-- 标题和模型信息 -->
        <div class="messages-header">
          <div class="header-left">
            <h2>图片对话</h2>
          </div>
        </div>
        
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
              <div class="header-left">
                <span class="role-badge">{{ msg.role === 'user' ? '您' : 'AI助手' }}</span>
                <span v-if="msg.role === 'assistant'" class="model-info" @click="goToApiConfig" title="点击配置API">
                  <el-icon><Monitor /></el-icon>
                  <span class="model-label">模型:</span> {{ formatModelName(msg.modelName || currentModel.value) }}
                </span>
              </div>
              <span class="message-time">{{ new Date().toLocaleTimeString() }}</span>
            </div>
            
            <!-- 思考过程区域 -->
            <div v-if="msg.role === 'assistant' && msg.thinking" class="thinking-section">
              <div class="thinking-header" @click="toggleThinking(msg)">
                <el-icon :class="{ 'is-rotate': msg.showThinking }"><ArrowDown /></el-icon>
                <span>思考过程</span>
              </div>
              <div v-show="msg.showThinking" class="thinking-content">
                <pre>{{ msg.thinking }}</pre>
              </div>
            </div>
            
            <!-- 回答内容 -->
            <pre>{{ msg.content }}</pre>
            
            <!-- 图片消息的操作按钮 -->
            <div v-if="msg.role === 'assistant' && msg.content" class="action-buttons">
              <el-button size="small" type="primary" @click="copyToClipboard(msg.content)">
                <el-icon><Document /></el-icon> 复制
              </el-button>
              <el-button 
                size="small" 
                :type="msg.showTranslation ? 'warning' : 'default'" 
                @click="translateMessage(msg)"
              >
                <el-icon><Connection /></el-icon> {{ msg.showTranslation ? '原文' : '翻译' }}
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
            @keydown.enter.exact.prevent="handleEnterKey"
            @keydown.enter.shift.exact.prevent="handleShiftEnter"
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
              @keydown.enter.exact.prevent="handleImageEnterKey"
              @keydown.enter.shift.exact.prevent="handleImageShiftEnter"
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
import { ref, onMounted, nextTick, watch, inject, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { 
  Document,
  Download,
  Setting,
  ChatDotRound,
  ChatLineRound,
  Promotion as Send,
  Delete,
  Picture,
  CircleClose,
  ArrowDown,
  Connection,
  Monitor
} from '@element-plus/icons-vue'
import { generatePrompt as generateMoonshotPrompt } from '../api/moonshot'
import { generatePrompt as generateDeepseekPrompt } from '../api/deepseek'

const router = useRouter()
const activeTab = inject('activeTab') // 注入App.vue提供的activeTab状态
const messages = ref([])
const imageMessages = ref([]) // 图片Prompt消息记录
const userInput = ref('')
const loading = ref(false)
const isGenerating = ref(false) // 控制生成状态
const isApiKeyConfigured = ref(false)
const currentModel = ref(localStorage.getItem('selected_model') || 'moonshot-v1-32k')
const STORAGE_KEY = 'chat_messages' // 定义存储消息的键名
const IMAGE_STORAGE_KEY = 'image_chat_messages' // 定义存储图片消息的键名
// 当前请求的控制器
let abortController = null

// 图片Prompt表单数据
const imagePromptForm = ref({
  description: '',
  style: 'realistic',
  size: '1920x1080'
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
        const parsedMessages = JSON.parse(savedMessages)
        
        // 确保所有消息的思考过程默认是折叠的，并且翻译状态正确
        parsedMessages.forEach(msg => {
          // 确保思考过程折叠（只有在有内容时才折叠，否则保持原状态）
          if (msg.thinking && msg.content) {
            msg.showThinking = false
            console.log('加载消息：思考过程已折叠（已有回答）', msg)
          }
          
          // 确保翻译状态正确
          if (msg.showTranslation === true && msg.translatedContent && msg.originalContent) {
            // 如果显示翻译，确保内容是翻译后的内容
            msg.content = msg.translatedContent
            console.log('加载消息：显示译文', msg)
          } else if (msg.originalContent && msg.translatedContent) {
            // 如果有原始内容和翻译内容，但不显示翻译，确保内容是原始内容
            msg.content = msg.originalContent
            msg.showTranslation = false
            console.log('加载消息：显示原文', msg)
          }
          
          // 确保每条消息都有modelName属性
          if (msg.role === 'assistant' && !msg.modelName) {
            // 如果没有modelName，使用默认值
            msg.modelName = 'moonshot-v1-32k'
            console.log('加载消息：添加默认模型信息', msg)
          }
        })
        
        messages.value = parsedMessages
      }
      
      // 加载图片消息
      const savedImageMessages = localStorage.getItem(IMAGE_STORAGE_KEY)
      if (savedImageMessages) {
        const parsedImageMessages = JSON.parse(savedImageMessages)
        
        // 确保所有图片消息的思考过程默认是折叠的，并且翻译状态正确
        parsedImageMessages.forEach(msg => {
          // 确保思考过程折叠（只有在有内容时才折叠，否则保持原状态）
          if (msg.thinking && msg.content) {
            msg.showThinking = false
            console.log('加载图片消息：思考过程已折叠（已有回答）', msg)
          }
          
          // 确保翻译状态正确
          if (msg.showTranslation === true && msg.translatedContent && msg.originalContent) {
            // 如果显示翻译，确保内容是翻译后的内容
            msg.content = msg.translatedContent
            console.log('加载图片消息：显示译文', msg)
          } else if (msg.originalContent && msg.translatedContent) {
            // 如果有原始内容和翻译内容，但不显示翻译，确保内容是原始内容
            msg.content = msg.originalContent
            msg.showTranslation = false
            console.log('加载图片消息：显示原文', msg)
          }
          
          // 确保每条消息都有modelName属性
          if (msg.role === 'assistant' && !msg.modelName) {
            // 如果没有modelName，使用默认值
            msg.modelName = 'moonshot-v1-32k'
            console.log('加载图片消息：添加默认模型信息', msg)
          }
        })
        
        imageMessages.value = parsedImageMessages
      }
      
      // 加载消息后，确保滚动到底部
      nextTick(() => {
        scrollToBottom(activeTab.value === 'image')
      })
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
    // 检查当前选择的模型类型
    const modelType = currentModel.value.split('-')[0].toLowerCase()
    
    if (modelType === 'deepseek') {
      // 检查DashScope API密钥
      const dashscopeApiKey = localStorage.getItem('dashscope_api_key')
      isApiKeyConfigured.value = !!dashscopeApiKey
    } else {
      // 默认检查Moonshot API密钥
      const moonshotApiKey = localStorage.getItem('moonshot_api_key')
      isApiKeyConfigured.value = !!moonshotApiKey
    }
  }
}

// 跳转到API配置页面
const goToApiConfig = () => {
  router.push('/api-config')
}

// 检查是否为代码提示
const isCodePrompt = (content) => {
  // 检查内容是否包含代码相关的关键词或模式
  const codeKeywords = [
    'function', 'class', 'import', 'export', 'const', 'let', 'var',
    'return', 'if', 'else', 'for', 'while', 'switch', 'case',
    'public', 'private', 'protected', 'static', 'void', 'int', 'string',
    'def ', 'async', 'await', '```', 'interface', 'implements', 'extends'
  ];
  
  // 检查是否包含代码块标记
  if (content.includes('```')) {
    return true;
  }
  
  // 检查是否包含多个代码关键词
  let keywordCount = 0;
  for (const keyword of codeKeywords) {
    if (content.includes(keyword)) {
      keywordCount++;
      if (keywordCount >= 2) { // 如果包含两个以上关键词，认为是代码
        return true;
      }
    }
  }
  
  // 检查是否包含HTML标签
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return true;
  }
  
  return false;
}

// 滚动到底部
const scrollToBottom = (isImageMessage = false) => {
  nextTick(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      // 直接设置scrollTop为scrollHeight，实现滚动到底部
      mainContent.scrollTop = mainContent.scrollHeight;
      console.log('已滚动到底部', mainContent.scrollHeight);
    }
  });
}

// 添加一个自动滚动到底部的函数，用于监听消息变化
const autoScrollToBottom = () => {
  // 使用一个短延时确保DOM已更新
  setTimeout(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTop = mainContent.scrollHeight;
    }
  }, 10);
}

// 添加DOM变化监听器，确保在内容变化时自动滚动到底部
let observer = null;

// 设置DOM变化监听
const setupDOMObserver = () => {
  // 如果已经有观察者，先断开连接
  if (observer) {
    observer.disconnect();
  }
  
  // 创建新的观察者
  observer = new MutationObserver((mutations) => {
    // 检查是否有内容变化
    const hasContentChange = mutations.some(mutation => 
      mutation.type === 'childList' || 
      mutation.type === 'characterData'
    );
    
    if (hasContentChange) {
      // 内容变化时滚动到底部
      scrollToBottom();
    }
  });
  
  // 获取消息容器
  const messagesWrapper = document.querySelector('.messages-wrapper');
  if (messagesWrapper) {
    // 配置观察选项
    const config = { 
      childList: true, 
      subtree: true, 
      characterData: true
    };
    
    // 开始观察
    observer.observe(messagesWrapper, config);
    console.log('已设置DOM变化监听');
  }
};

// 更新消息内容
const updateMessage = (index, content, isImageMessage = false) => {
  console.log('更新消息:', index, content, isImageMessage)
  
  const msgArray = isImageMessage ? imageMessages : messages
  if (index >= 0 && index < msgArray.value.length) {
    console.log('当前消息内容:', msgArray.value[index].content)
    
    // 创建消息的深拷贝，确保响应式更新
    const updatedMessages = [...msgArray.value]
    const currentMsg = updatedMessages[index]
    
    // 保存当前的翻译状态
    const showTranslation = currentMsg.showTranslation
    const originalContent = currentMsg.originalContent
    const translatedContent = currentMsg.translatedContent
    
    // 处理不同类型的消息
    if (typeof content === 'object') {
      const messageType = content.type
      const messageContent = content.content
      
      // 根据消息类型处理
      if (messageType === 'thinking_start') {
        // 开始思考，创建思考区域
        updatedMessages[index] = {
          ...currentMsg,
          thinking: messageContent,
          content: '',
          showThinking: true, // 思考过程开始时显示
          // 保留翻译相关属性
          showTranslation: showTranslation,
          originalContent: originalContent,
          translatedContent: translatedContent
        }
        console.log('思考过程开始，默认显示')
      } else if (messageType === 'thinking') {
        // 添加思考内容
        const thinking = currentMsg.thinking || ''
        updatedMessages[index] = {
          ...currentMsg,
          thinking: thinking + messageContent,
          showThinking: true, // 思考过程中保持显示
          // 保留翻译相关属性
          showTranslation: showTranslation,
          originalContent: originalContent,
          translatedContent: translatedContent
        }
      } else if (messageType === 'thinking_end') {
        // 思考结束，折叠思考过程
        updatedMessages[index] = {
          ...currentMsg,
          showThinking: false, // 思考结束时折叠
          // 保留翻译相关属性
          showTranslation: showTranslation,
          originalContent: originalContent,
          translatedContent: translatedContent
        }
        console.log('思考过程已折叠 (thinking_end)')
      } else if (messageType === 'answer_start') {
        // 开始回答，折叠思考过程
        updatedMessages[index] = {
          ...currentMsg,
          showThinking: false, // 开始回答时折叠思考过程
          // 保留翻译相关属性
          showTranslation: showTranslation,
          originalContent: originalContent,
          translatedContent: translatedContent
        }
        console.log('思考过程已折叠 (answer_start)')
      } else if (messageType === 'answer') {
        // 添加回答内容
        const newContent = currentMsg.content + messageContent
        
        // 根据当前翻译状态决定如何更新内容
        if (showTranslation && translatedContent) {
          // 如果正在显示翻译，更新原始内容但保持显示翻译内容
          updatedMessages[index] = {
            ...currentMsg,
            content: translatedContent, // 保持显示翻译内容
            originalContent: newContent, // 更新原始内容
            showThinking: false, // 回答时确保思考过程折叠
            showTranslation: true
          }
        } else {
          // 正常更新内容
          updatedMessages[index] = {
            ...currentMsg,
            content: newContent,
            showThinking: false, // 回答时确保思考过程折叠
            // 如果有原始内容，则更新它
            originalContent: originalContent ? newContent : originalContent
          }
        }
      } else if (messageType === 'answer_end') {
        // 回答结束，确保思考过程折叠
        updatedMessages[index] = {
          ...currentMsg,
          showThinking: false, // 回答结束时确保思考过程折叠
          // 保留翻译相关属性
          showTranslation: showTranslation,
          originalContent: originalContent,
          translatedContent: translatedContent
        }
        console.log('思考过程已折叠 (answer_end)')
      }
    } else {
      // 兼容旧的字符串格式
      // 如果开始接收到内容，说明已经开始回答，应该折叠思考过程
      if (currentMsg.thinking && !currentMsg.content) {
        // 根据当前翻译状态决定如何更新内容
        if (showTranslation && translatedContent) {
          // 如果正在显示翻译，更新原始内容但保持显示翻译内容
          updatedMessages[index] = {
            ...currentMsg,
            content: translatedContent, // 保持显示翻译内容
            originalContent: content, // 更新原始内容
            showThinking: false, // 开始回答时折叠思考过程
            showTranslation: true
          }
        } else {
          updatedMessages[index] = {
            ...currentMsg,
            content: content,
            showThinking: false, // 开始回答时折叠思考过程
            // 如果有原始内容，则保留它
            originalContent: originalContent || content
          }
        }
        console.log('思考过程已折叠 (字符串格式)')
      } else {
        const newContent = currentMsg.content + content
        
        // 根据当前翻译状态决定如何更新内容
        if (showTranslation && translatedContent) {
          // 如果正在显示翻译，更新原始内容但保持显示翻译内容
          updatedMessages[index] = {
            ...currentMsg,
            content: translatedContent, // 保持显示翻译内容
            originalContent: newContent, // 更新原始内容
            showThinking: false, // 回答时确保思考过程折叠
            showTranslation: true
          }
        } else {
          updatedMessages[index] = {
            ...currentMsg,
            content: newContent,
            showThinking: false, // 回答时确保思考过程折叠
            // 如果有原始内容，则更新它
            originalContent: originalContent ? newContent : originalContent
          }
        }
      }
    }
    
    console.log('更新后的消息:', updatedMessages[index])
    
    // 替换整个数组以触发响应式更新
    msgArray.value = updatedMessages
    
    // 确保滚动到底部
    scrollToBottom(isImageMessage)
  } else {
    console.error('消息索引超出范围:', index, msgArray.value.length)
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

  const userMessage = { 
    role: 'user', 
    content: userInput.value.trim(),
    showTranslation: false,
    originalContent: '',
    translatedContent: ''
  }
  messages.value.push(userMessage)
  userInput.value = ''

  // 保存消息到localStorage
  saveMessagesToStorage()
  
  // 添加用户消息后滚动到底部
  scrollToBottom()

  loading.value = true
  isGenerating.value = true
  const assistantMessage = { 
    role: 'assistant', 
    content: '',
    showTranslation: false,
    originalContent: '',
    translatedContent: '',
    modelName: currentModel.value
  }
  messages.value.push(assistantMessage)
  const messageIndex = messages.value.length - 1
  
  // 添加助手消息后再次滚动到底部
  scrollToBottom()

  try {
    console.log('开始生成Prompt...')
    // 创建新的AbortController
    abortController = new AbortController()
    
    // 根据当前选择的模型调用不同的API
    const modelType = currentModel.value.split('-')[0].toLowerCase()
    console.log('当前使用的模型类型:', modelType)
    
    if (modelType === 'deepseek') {
      // 使用DashScope API调用Deepseek模型
      console.log('使用DashScope API调用Deepseek模型')
      await generateDeepseekPrompt(userMessage.content, (content) => {
        console.log('Deepseek模型返回内容:', content)
        if (typeof content === 'string') {
          // 字符串格式的响应，直接更新消息
          updateMessage(messageIndex, content)
          // 每次更新内容后保存到localStorage
          saveMessagesToStorage()
        } else if (typeof content === 'object') {
          // 对象格式的响应，根据类型处理
          console.log('收到对象格式响应:', content)
          updateMessage(messageIndex, content)
          saveMessagesToStorage()
          
          // 确保思考过程状态正确
          if (messages.value[messageIndex] && messages.value[messageIndex].thinking) {
            // 如果是思考过程，保持显示；如果已经开始回答，则折叠
            if (content.type === 'thinking' || content.type === 'thinking_start') {
              messages.value[messageIndex].showThinking = true;
              console.log('Deepseek响应处理：思考过程显示');
            } else if (content.type === 'thinking_end' || content.type === 'answer_start' || content.type === 'answer' || content.type === 'answer_end') {
              messages.value[messageIndex].showThinking = false;
              console.log('Deepseek响应处理：思考过程折叠');
            }
            saveMessagesToStorage();
          }
        }
      }, abortController.signal)
    } else {
      // 默认使用Moonshot API
      console.log('使用Moonshot API')
      await generateMoonshotPrompt(userMessage.content, (content) => {
        console.log('Moonshot模型返回内容:', content)
        updateMessage(messageIndex, content)
        // 每次更新内容后保存到localStorage
        saveMessagesToStorage()
      }, abortController.signal)
    }
    
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
  
  const userMessage = { 
    role: 'user', 
    content: promptRequest,
    showTranslation: false,
    originalContent: '',
    translatedContent: '',
    modelName: currentModel.value
  }
  imageMessages.value.push(userMessage)
  
  // 保存消息到localStorage
  saveImageMessagesToStorage()
  
  // 添加用户消息后滚动到底部
  scrollToBottom(true)

  loading.value = true
  isGenerating.value = true
  const assistantMessage = { 
    role: 'assistant', 
    content: '',
    showTranslation: false,
    originalContent: '',
    translatedContent: '',
    modelName: currentModel.value
  }
  imageMessages.value.push(assistantMessage)
  const messageIndex = imageMessages.value.length - 1
  
  // 添加助手消息后再次滚动到底部
  scrollToBottom(true)

  try {
    console.log('开始生成图片Prompt...')
    // 创建新的AbortController
    abortController = new AbortController()
    
    // 根据当前选择的模型调用不同的API
    const modelType = currentModel.value.split('-')[0].toLowerCase()
    console.log('图片Prompt - 当前使用的模型类型:', modelType)
    
    if (modelType === 'deepseek') {
      // 使用DashScope API调用Deepseek模型
      console.log('图片Prompt - 使用DashScope API调用Deepseek模型')
      await generateDeepseekPrompt(promptRequest, (content) => {
        console.log('图片Prompt - Deepseek模型返回内容:', content)
        if (typeof content === 'string') {
          // 字符串格式的响应，直接更新消息
          updateMessage(messageIndex, content, true)
          // 每次更新内容后保存到localStorage
          saveImageMessagesToStorage()
        } else if (typeof content === 'object') {
          // 对象格式的响应，根据类型处理
          console.log('图片Prompt - 收到对象格式响应:', content)
          updateMessage(messageIndex, content, true)
          saveImageMessagesToStorage()
          
          // 确保思考过程状态正确
          if (imageMessages.value[messageIndex] && imageMessages.value[messageIndex].thinking) {
            // 如果是思考过程，保持显示；如果已经开始回答，则折叠
            if (content.type === 'thinking' || content.type === 'thinking_start') {
              imageMessages.value[messageIndex].showThinking = true;
              console.log('Deepseek图片响应处理：思考过程显示');
            } else if (content.type === 'thinking_end' || content.type === 'answer_start' || content.type === 'answer' || content.type === 'answer_end') {
              imageMessages.value[messageIndex].showThinking = false;
              console.log('Deepseek图片响应处理：思考过程折叠');
            }
            saveImageMessagesToStorage();
          }
        }
      }, abortController.signal)
    } else {
      // 默认使用Moonshot API
      console.log('图片Prompt - 使用Moonshot API')
      await generateMoonshotPrompt(promptRequest, (content) => {
        console.log('图片Prompt - Moonshot模型返回内容:', content)
        updateMessage(messageIndex, content, true)
        // 每次更新内容后保存到localStorage
        saveImageMessagesToStorage()
      }, abortController.signal)
    }
    
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

// 检查API密钥
onMounted(() => {
  checkApiKeyStatus()
  loadMessagesFromStorage() // 加载保存的消息
  
  // 页面加载后滚动到最新消息
  nextTick(() => {
    scrollToBottom()
    // 设置DOM变化监听
    setupDOMObserver();
  })
  
  window.addEventListener('scroll', handleScroll)
  
  // 监听模型变更事件
  window.addEventListener('modelChange', (event) => {
    currentModel.value = event.detail
    console.log('模型已切换为:', currentModel.value)
  })
  
  // 监听清空消息事件
  window.addEventListener('clearMessages', () => {
    clearMessages()
  })
  
  // 添加窗口大小变化监听，确保在窗口大小变化时也滚动到底部
  window.addEventListener('resize', () => {
    scrollToBottom(activeTab.value === 'image')
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('modelChange', null)
  window.removeEventListener('clearMessages', null)
  window.removeEventListener('resize', null)
  
  // 断开观察者连接
  if (observer) {
    observer.disconnect();
    observer = null;
  }
})

// 监听activeTab变化，切换标签后滚动到底部
watch(activeTab, (newTab) => {
  console.log('标签切换为:', newTab)
  // 使用nextTick确保DOM更新后再滚动
  nextTick(() => {
    scrollToBottom(newTab === 'image')
  })
})

// 监听messages变化，确保消息更新后滚动到底部
watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

// 监听imageMessages变化，确保图片消息更新后滚动到底部
watch(imageMessages, () => {
  nextTick(() => {
    scrollToBottom(true)
  })
}, { deep: true })

// 监听模型变化，重新检查API密钥状态
watch(currentModel, () => {
  checkApiKeyStatus()
})

// 折叠/展开思考过程
const toggleThinking = (msg) => {
  msg.showThinking = !msg.showThinking
  console.log('切换思考过程显示状态:', msg.showThinking)
  
  // 保存到localStorage
  if (activeTab.value === 'text') {
    saveMessagesToStorage()
  } else {
    saveImageMessagesToStorage()
  }
  
  // 切换思考过程显示状态后，滚动到底部
  nextTick(() => {
    scrollToBottom(activeTab.value === 'image')
  })
}

// 翻译消息
const translateMessage = async (msg) => {
  // 检查消息是否有内容
  if (!msg.content || msg.content.trim() === '') {
    ElMessage.warning('没有可翻译的内容')
    return
  }
  
  // 如果消息已经有翻译，则切换显示原文/译文
  if (msg.translatedContent) {
    // 切换显示原文/译文
    msg.showTranslation = !msg.showTranslation
    console.log('切换翻译状态:', msg.showTranslation ? '显示译文' : '显示原文')
    
    if (msg.showTranslation) {
      // 保存当前内容为原始内容（如果尚未保存）
      if (!msg.originalContent) {
        msg.originalContent = msg.content
      }
      // 显示翻译内容
      msg.content = msg.translatedContent
    } else {
      // 恢复原始内容
      msg.content = msg.originalContent
    }
    
    // 保存到localStorage
    if (activeTab.value === 'text') {
      saveMessagesToStorage()
    } else {
      saveImageMessagesToStorage()
    }
    
    // 切换翻译后，滚动到底部
    nextTick(() => {
      scrollToBottom(activeTab.value === 'image')
    })
    
    return
  }
  
  // 检查是否为代码内容
  if (isCodePrompt(msg.content)) {
    ElMessage.warning('代码内容不建议翻译，可能会破坏代码结构')
    // 但仍然允许用户翻译，只是给出警告
  }
  
  // 检测语言
  const isChineseText = isChineseLanguage(msg.content)
  
  // 显示加载中
  const loading = ElLoading.service({
    lock: true,
    text: '翻译中...',
    background: 'rgba(255, 255, 255, 0.7)'
  })
  
  try {
    // 调用翻译API
    const targetLang = isChineseText ? 'en' : 'zh'
    const sourceLang = isChineseText ? 'zh' : 'en'
    
    // 使用免费的翻译API
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(msg.content)}&langpair=${sourceLang}|${targetLang}`)
    const data = await response.json()
    
    if (data && data.responseData && data.responseData.translatedText) {
      // 保存原始内容
      msg.originalContent = msg.content
      // 保存翻译内容
      msg.translatedContent = data.responseData.translatedText
      // 显示翻译内容
      msg.content = msg.translatedContent
      // 标记为显示翻译
      msg.showTranslation = true
      
      console.log('翻译完成，设置显示译文:', msg.showTranslation)
      
      // 保存到localStorage
      if (activeTab.value === 'text') {
        saveMessagesToStorage()
      } else {
        saveImageMessagesToStorage()
      }
      
      ElMessage.success(isChineseText ? '已翻译为英文' : '已翻译为中文')
    } else {
      throw new Error('翻译失败')
    }
  } catch (error) {
    console.error('翻译错误:', error)
    ElMessage.error('翻译失败，请稍后重试')
    
    // 备用方案：使用另一个免费API
    try {
      const targetLang = isChineseText ? 'en' : 'zh-CN'
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(msg.content)}`)
      const data = await response.json()
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        // 保存原始内容
        msg.originalContent = msg.content
        // 保存翻译内容
        msg.translatedContent = data[0][0][0]
        // 显示翻译内容
        msg.content = msg.translatedContent
        // 标记为显示翻译
        msg.showTranslation = true
        
        console.log('备用翻译完成，设置显示译文:', msg.showTranslation)
        
        // 保存到localStorage
        if (activeTab.value === 'text') {
          saveMessagesToStorage()
        } else {
          saveImageMessagesToStorage()
        }
        
        ElMessage.success(isChineseText ? '已翻译为英文' : '已翻译为中文')
      } else {
        ElMessage.error('翻译失败，请稍后重试')
      }
    } catch (backupError) {
      console.error('备用翻译错误:', backupError)
      ElMessage.error('翻译失败，请稍后重试')
    }
  } finally {
    // 关闭加载中
    loading.close()
  }
  
  // 在翻译完成后，滚动到底部
  nextTick(() => {
    scrollToBottom(activeTab.value === 'image')
  })
}

// 检测是否为中文
const isChineseLanguage = (text) => {
  // 使用正则表达式检测中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/
  return chineseRegex.test(text)
}

// 处理文本输入的回车键
const handleEnterKey = () => {
  // 如果输入框不为空且API密钥已配置，则触发生成按钮
  if (userInput.value.trim() && isApiKeyConfigured.value && !loading.value) {
    generatePrompt();
  }
}

// 处理文本输入的Shift+Enter键
const handleShiftEnter = (event) => {
  // Shift+Enter 插入换行符
  userInput.value += '\n';
}

// 处理图片输入的回车键
const handleImageEnterKey = () => {
  // 如果输入框不为空且API密钥已配置，则触发生成按钮
  if (imagePromptForm.value.description.trim() && isApiKeyConfigured.value && !loading.value) {
    generateImagePrompt();
  }
}

// 处理图片输入的Shift+Enter键
const handleImageShiftEnter = (event) => {
  // Shift+Enter 插入换行符
  imagePromptForm.value.description += '\n';
}

// 监听消息变化，保存到localStorage
watch(messages, () => {
  saveMessagesToStorage();
}, { deep: true });

// 监听图片消息变化，保存到localStorage
watch(imageMessages, () => {
  saveImageMessagesToStorage();
}, { deep: true });

// 监听Tab变化，保存到localStorage
watch(activeTab, () => {
  saveActiveTabToStorage();
});

// 监听activeTab变化，切换标签后滚动到底部
watch(activeTab, (newTab) => {
  console.log('标签切换为:', newTab)
  // 使用nextTick确保DOM更新后再滚动
  nextTick(() => {
    scrollToBottom(newTab === 'image')
  })
})

// 监听messages变化，确保消息更新后滚动到底部
watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

// 监听imageMessages变化，确保图片消息更新后滚动到底部
watch(imageMessages, () => {
  nextTick(() => {
    scrollToBottom(true)
  })
}, { deep: true })

// 监听模型变化，重新检查API密钥状态
watch(currentModel, () => {
  checkApiKeyStatus()
})

// 格式化模型名称
const formatModelName = (modelName) => {
  if (!modelName) return '未知模型';
  
  // 处理Moonshot模型
  if (modelName.toLowerCase().includes('moonshot')) {
    const parts = modelName.split('-');
    if (parts.length >= 3) {
      return `Moonshot ${parts[1].toUpperCase()} ${parts[2]}`;
    } else if (parts.length === 2) {
      return `Moonshot ${parts[1].toUpperCase()}`;
    }
    return 'Moonshot';
  }
  
  // 处理Deepseek模型
  if (modelName.toLowerCase().includes('deepseek')) {
    const parts = modelName.split('-');
    if (parts.length >= 2) {
      // 将版本号格式化为更友好的形式
      const version = parts.slice(1).join(' ').toUpperCase();
      return `Deepseek ${version}`;
    }
    return 'Deepseek';
  }
  
  // 处理Claude模型
  if (modelName.toLowerCase().includes('claude')) {
    return modelName.replace(/-/g, ' ').replace(/claude/i, 'Claude');
  }
  
  // 处理GPT模型
  if (modelName.toLowerCase().includes('gpt')) {
    return modelName.replace(/-/g, ' ').toUpperCase();
  }
  
  // 默认返回原始模型名，但格式化为更易读的形式
  return modelName.replace(/-/g, ' ');
}

// 当前选择的模型名称（格式化后）
const formattedCurrentModel = computed(() => {
  return formatModelName(currentModel.value);
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
  overflow: hidden; /* 防止容器本身产生滚动条 */
}

.main-content {
  flex: 1;
  padding: 20px;
  padding-top: 30px;
  margin-bottom: 80px;
  overflow-y: auto; /* 保留这个滚动条 */
  height: calc(100vh - 120px); /* 固定高度 */
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

.messages-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  @media (max-width: 480px) {
    .header-left {
      gap: 8px;
      
      h2 {
        font-size: 18px;
      }
    }
  }
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
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
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
    
    .model-info {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #909399;
      background-color: #f5f7fa;
      padding: 3px 6px;
      border-radius: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid transparent;
      font-weight: normal;
      
      .model-label {
        color: #606266;
        font-weight: 500;
      }
      
      &:hover {
        color: #409eff;
        background-color: #ecf5ff;
        border-color: #d9ecff;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .el-icon {
        font-size: 14px;
        color: #409eff;
      }
      
      @media (max-width: 768px) {
        max-width: 140px;
        font-size: 11px;
      }
      
      @media (max-width: 480px) {
        max-width: 120px;
        font-size: 10px;
        
        .model-label {
          display: none; /* 在小屏幕上隐藏"模型:"标签，节省空间 */
        }
      }
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
    
    .el-button {
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
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

.thinking-section {
  margin-bottom: 16px;
  border-radius: 8px;
  background-color: #f0f9ff;
  border: 1px dashed #a0cfff;
  overflow: hidden;
  
  .thinking-header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    background-color: #ecf5ff;
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: #d9ecff;
    }
    
    .el-icon {
      margin-right: 8px;
      font-size: 14px;
      transition: transform 0.3s ease;
      
      &.is-rotate {
        transform: rotate(180deg);
      }
    }
    
    span {
      font-size: 14px;
      color: #409eff;
      font-weight: 500;
    }
  }
  
  .thinking-content {
    padding: 12px;
    max-height: 300px;
    overflow-y: auto;
    
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #606266;
    }
  }
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

