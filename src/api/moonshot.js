import axios from 'axios'
import { getSystemPrompt } from './promptTemplates'

const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions'

// 创建axios实例
const moonshotApi = axios.create({
  baseURL: MOONSHOT_API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// 请求拦截器
moonshotApi.interceptors.request.use(
  config => {
    const apiKey = localStorage.getItem('moonshot_api_key')
    if (apiKey) {
      config.headers['Authorization'] = `Bearer ${apiKey}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 生成Prompt并获取流式响应
export const generatePrompt = async (requirement, onProgress, signal) => {
  try {
    // 创建一个 TextDecoder 实例用于解码响应数据
    const decoder = new TextDecoder()
    let buffer = ''
    let isFirstContent = true
    
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('moonshot_api_key')}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: 'moonshot-v1-32k',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(requirement)
          },
          {
            role: 'user',
            content: `请根据以下需求，生成一个高质量的Prompt：\n\n${requirement}`
          }
        ],
        stream: true,
        temperature: 0.7,
        presence_penalty: 0,
        frequency_penalty: 0
      }),
      signal // 添加AbortController的signal
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    // 通知前端开始思考过程
    onProgress({ type: 'thinking_start', content: '正在思考中...' })
    
    // 获取响应的可读流
    const reader = response.body.getReader()
    
    // 处理流式响应
    while (true) {
      // 检查是否已中断
      if (signal && signal.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }
      
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }
      
      // 解码二进制数据
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      
      // 按行处理数据
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一个可能不完整的行
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue
        
        const data = trimmedLine.slice(5).trim()
        
        if (data === '[DONE]') {
          // 通知前端回答结束
          onProgress({ type: 'answer_end' })
          return true
        }
        
        try {
          const parsedData = JSON.parse(data)
          const content = parsedData.choices?.[0]?.delta?.content
          
          if (content) {
            if (isFirstContent) {
              isFirstContent = false
              // 通知前端思考过程结束，开始回答
              onProgress({ type: 'thinking_end' })
              onProgress({ type: 'answer_start' })
            }
            
            // 将回答内容发送给前端
            onProgress({ type: 'answer', content })
          }
        } catch (error) {
          console.error('解析数据错误:', error, '原始数据:', data)
        }
      }
    }
    
    // 通知前端回答结束
    onProgress({ type: 'answer_end' })
    
    return true
  } catch (error) {
    console.error('API请求错误:', error)
    throw error
  }
}

// 验证API密钥
export const validateApiKey = async (apiKey) => {
  try {
    const response = await moonshotApi.post('', {
      model: 'moonshot-v1-8k',
      messages: [{ role: 'user', content: 'test' }],
      temperature: 0.3
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    return response.status === 200
  } catch (error) {
    return false
  }
}