<template>
  <div class="api-config-container">
    <el-card class="api-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2><el-icon><Key /></el-icon> API配置</h2>
          <p class="subtitle">请配置您的API密钥</p>
        </div>
      </template>
      
      <el-tabs v-model="activeApiTab" class="api-tabs">
        <el-tab-pane label="月之暗面 API" name="moonshot">
          <el-form>
            <el-form-item>
              <el-input
                v-model="moonshotApiKey"
                type="password"
                placeholder="请输入月之暗面API密钥"
                show-password
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <div class="button-group">
                <el-button type="primary" @click="validateAndSaveMoonshotApiKey" :disabled="!moonshotApiKey">
                  <el-icon><Check /></el-icon> 保存密钥
                </el-button>
                <el-button type="info" @click="openMoonshotApiKeyPage">
                  <el-icon><Link /></el-icon> 获取密钥
                </el-button>
              </div>
            </el-form-item>
          </el-form>
          
          <div class="api-status" v-if="moonshotApiKey">
            <el-tag type="success" v-if="isMoonshotApiKeyConfigured">
              <el-icon><CircleCheck /></el-icon> 月之暗面API密钥已配置
            </el-tag>
            <el-tag type="warning" v-else>
              <el-icon><Warning /></el-icon> 月之暗面API密钥未验证
            </el-tag>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="阿里百炼 API" name="dashscope">
          <el-form>
            <el-form-item>
              <el-input
                v-model="dashscopeApiKey"
                type="password"
                placeholder="请输入阿里百炼 API密钥"
                show-password
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <div class="button-group">
                <el-button type="primary" @click="validateAndSaveDashscopeApiKey" :disabled="!dashscopeApiKey">
                  <el-icon><Check /></el-icon> 保存密钥
                </el-button>
                <el-button type="info" @click="openDashscopeApiKeyPage">
                  <el-icon><Link /></el-icon> 获取密钥
                </el-button>
              </div>
            </el-form-item>
          </el-form>
          
          <div class="api-status" v-if="dashscopeApiKey">
            <el-tag type="success" v-if="isDashscopeApiKeyConfigured">
              <el-icon><CircleCheck /></el-icon> 阿里百炼 API密钥已配置
            </el-tag>
            <el-tag type="warning" v-else>
              <el-icon><Warning /></el-icon> 阿里百炼 API密钥未验证
            </el-tag>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <div class="tips-section">
        <h3><el-icon><InfoFilled /></el-icon> 使用提示</h3>
        <ul>
          <li>API密钥用于访问AI服务</li>
          <li>点击「获取密钥」按钮前往官方网站获取API密钥</li>
          <li>密钥只存放于本地浏览器中，确保密钥安全</li>
          <li>配置成功后可返回首页生成Prompt</li>
        </ul>
      </div>

      <div class="back-button-container">
        <el-button @click="goBack" type="default">
          <el-icon><Back /></el-icon> 返回首页
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Key,
  Lock,
  Check,
  CircleCheckFilled as CircleCheck,
  WarningFilled as Warning,
  InfoFilled,
  ArrowLeft as Back,
  Link
} from '@element-plus/icons-vue'
import { validateApiKey } from '../api/moonshot'
import { validateApiKey as validateDeepseekApiKey } from '../api/deepseek'

const router = useRouter()
const moonshotApiKey = ref('')
const dashscopeApiKey = ref('')
const loading = ref(false)
const isMoonshotApiKeyConfigured = ref(false)
const isDashscopeApiKeyConfigured = ref(false)
const activeApiTab = ref('moonshot')

// 检查API密钥状态
const checkApiKeyStatus = () => {
  if (typeof window !== 'undefined') {
    // 检查月之暗面API密钥
    const savedMoonshotApiKey = localStorage.getItem('moonshot_api_key')
    if (savedMoonshotApiKey) {
      moonshotApiKey.value = savedMoonshotApiKey
      isMoonshotApiKeyConfigured.value = true
    }
    
    // 检查DashScope API密钥
    const savedDashscopeApiKey = localStorage.getItem('dashscope_api_key')
    if (savedDashscopeApiKey) {
      dashscopeApiKey.value = savedDashscopeApiKey
      isDashscopeApiKeyConfigured.value = true
    }
  }
}

// 验证并保存月之暗面API密钥
const validateAndSaveMoonshotApiKey = async () => {
  if (!moonshotApiKey.value) {
    ElMessage.warning('请输入月之暗面API密钥')
    return
  }

  loading.value = true
  try {
    const isValid = await validateApiKey(moonshotApiKey.value)
    if (isValid) {
      localStorage.setItem('moonshot_api_key', moonshotApiKey.value)
      isMoonshotApiKeyConfigured.value = true
      ElMessage.success('月之暗面API密钥配置成功')
    } else {
      ElMessage.error('月之暗面API密钥验证失败')
    }
  } catch (error) {
    ElMessage.error('验证过程出错，请重试')
  } finally {
    loading.value = false
  }
}

// 验证并保存DashScope API密钥
const validateAndSaveDashscopeApiKey = async () => {
  if (!dashscopeApiKey.value) {
    ElMessage.warning('请输入阿里百炼API密钥')
    return
  }

  loading.value = true
  try {
    // 使用DeepSeek API验证函数来验证阿里百炼密钥
    const isValid = await validateDeepseekApiKey(dashscopeApiKey.value)
    if (isValid) {
      localStorage.setItem('dashscope_api_key', dashscopeApiKey.value)
      isDashscopeApiKeyConfigured.value = true
      ElMessage.success('阿里百炼API密钥配置成功')
    } else {
      ElMessage.error('阿里百炼API密钥验证失败')
    }
  } catch (error) {
    ElMessage.error('验证过程出错，请重试')
  } finally {
    loading.value = false
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 检查API密钥
onMounted(() => {
  checkApiKeyStatus()
})

// 打开月之暗面API密钥页面
const openMoonshotApiKeyPage = () => {
  window.open('https://platform.moonshot.cn/console/api-keys', '_blank')
}

// 打开阿里百炼API密钥页面
const openDashscopeApiKeyPage = () => {
  window.open('https://bailian.console.aliyun.com/?apiKey=1#/api-key', '_blank')
}
</script>

<style lang="scss" scoped>
.api-config-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 576px) {
    padding: 10px 5px;
  }
}

.card-header {
  h2 {
    margin: 0;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #409EFF;
  }
  
  .subtitle {
    margin: 8px 0 0;
    color: #909399;
    font-size: 0.9rem;
  }
}

.api-tabs {
  margin-bottom: 20px;
  
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
  
  :deep(.el-tabs__item) {
    font-size: 15px;
    padding: 0 20px;
    height: 40px;
    line-height: 40px;
    
    &.is-active {
      font-weight: 600;
    }
  }
  
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }
}

.api-card {
  transition: all 0.3s;
  
  .api-status {
    margin: 20px 0;
    text-align: center;
  }
  
  .button-group {
    display: flex;
    gap: 10px;
    width: 100%;
    
    .el-button {
      flex: 1;
      justify-content: center;
    }
  }
  
  .tips-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px dashed #e4e7ed;
    
    h3 {
      font-size: 1rem;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    ul {
      padding-left: 20px;
      margin: 10px 0;
      
      li {
        margin-bottom: 8px;
        color: #606266;
      }
    }
  }
}

.back-button-container {
  margin-top: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .card-header {
    h2 {
      font-size: 1.3rem;
    }
    
    .subtitle {
      font-size: 0.85rem;
    }
  }
}

@media (max-width: 576px) {
  .api-config-container {
    padding: 10px 5px;
  }
  
  .el-card {
    --el-card-padding: 15px;
  }
  
  .card-header h2 {
    font-size: 1.2rem;
  }
  
  .button-group {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
}
</style>