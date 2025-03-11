<template>
  <div class="api-config-container">
    <el-card class="api-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2><el-icon><Key /></el-icon> API配置</h2>
          <p class="subtitle">请配置您的API密钥</p>
        </div>
      </template>
      
      <!-- 月之暗面API配置 -->
      <div class="api-section">
        <h3 class="section-title">月之暗面 API</h3>
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
            <el-button type="primary" @click="validateAndSaveMoonshotApiKey" class="w-full" :disabled="!moonshotApiKey">
              <el-icon><Check /></el-icon> 保存月之暗面API密钥
            </el-button>
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
      </div>
      
      <!-- DeepSeek API配置 -->
      <div class="api-section">
        <h3 class="section-title">DeepSeek API</h3>
        <el-form>
          <el-form-item>
            <el-input
              v-model="deepseekApiKey"
              type="password"
              placeholder="请输入DeepSeek API密钥"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="validateAndSaveDeepseekApiKey" class="w-full" :disabled="!deepseekApiKey">
              <el-icon><Check /></el-icon> 保存DeepSeek API密钥
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="api-status" v-if="deepseekApiKey">
          <el-tag type="success" v-if="isDeepseekApiKeyConfigured">
            <el-icon><CircleCheck /></el-icon> DeepSeek API密钥已配置
          </el-tag>
          <el-tag type="warning" v-else>
            <el-icon><Warning /></el-icon> DeepSeek API密钥未验证
          </el-tag>
        </div>
      </div>
      
      <div class="tips-section">
        <h3><el-icon><InfoFilled /></el-icon> 使用提示</h3>
        <ul>
          <li>API密钥用于访问AI服务</li>
          <li>请确保您的API密钥安全</li>
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
  ArrowLeft as Back
} from '@element-plus/icons-vue'
import { validateApiKey } from '../api/moonshot'

const router = useRouter()
const moonshotApiKey = ref('')
const deepseekApiKey = ref('')
const loading = ref(false)
const isMoonshotApiKeyConfigured = ref(false)
const isDeepseekApiKeyConfigured = ref(false)

// 检查API密钥状态
const checkApiKeyStatus = () => {
  if (typeof window !== 'undefined') {
    // 检查月之暗面API密钥
    const savedMoonshotApiKey = localStorage.getItem('moonshot_api_key')
    if (savedMoonshotApiKey) {
      moonshotApiKey.value = savedMoonshotApiKey
      isMoonshotApiKeyConfigured.value = true
    }
    
    // 检查DeepSeek API密钥
    const savedDeepseekApiKey = localStorage.getItem('deepseek_api_key')
    if (savedDeepseekApiKey) {
      deepseekApiKey.value = savedDeepseekApiKey
      isDeepseekApiKeyConfigured.value = true
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

// 验证并保存DeepSeek API密钥
const validateAndSaveDeepseekApiKey = async () => {
  if (!deepseekApiKey.value) {
    ElMessage.warning('请输入DeepSeek API密钥')
    return
  }

  loading.value = true
  try {
    // TODO: 替换为实际的DeepSeek API验证函数
    const isValid = true // 临时设置为true，等待API验证函数实现
    if (isValid) {
      localStorage.setItem('deepseek_api_key', deepseekApiKey.value)
      isDeepseekApiKeyConfigured.value = true
      ElMessage.success('DeepSeek API密钥配置成功')
    } else {
      ElMessage.error('DeepSeek API密钥验证失败')
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
</script>

<style lang="scss" scoped>
.api-config-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 576px) {
    padding: 10px;
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

.api-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #e4e7ed;
  
  &:last-child {
    border-bottom: none;
  }
  
  .section-title {
    font-size: 1.1rem;
    margin-bottom: 15px;
    color: #606266;
  }
}

.api-card {
  transition: all 0.3s;
  
  .api-status {
    margin: 20px 0;
    text-align: center;
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
}
</style>