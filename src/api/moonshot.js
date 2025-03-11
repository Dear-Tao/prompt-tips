import axios from 'axios'

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
            content: requirement.includes('图片Prompt') ? 
              '你是一个专业的图片Prompt工程师，擅长根据用户的需求生成高质量的图片生成Prompt。你需要分析用户的需求，理解其核心意图和关键信息，然后生成一个结构清晰、指向明确、易于AI图像生成模型理解的Prompt。生成的Prompt应当包含明确的图片描述、风格要求、构图要素、色彩倾向等信息，以确保AI能够生成符合用户期望的图片。请以清晰的格式输出，包括主题、内容描述、风格、构图、色彩等要素。' : 
              '你是一个专业的Prompt工程师，擅长根据用户的需求生成高质量的Prompt。你需要分析用户的需求，理解其核心意图和关键信息，然后生成一个结构清晰、指向明确、易于理解的Prompt。生成的Prompt应当包含明确的指令、必要的上下文信息、输出格式要求等要素，以确保AI能够准确理解并执行用户的意图。'
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
          return true
        }
        
        try {
          const parsedData = JSON.parse(data)
          const content = parsedData.choices?.[0]?.delta?.content
          
          if (content) {
            onProgress(content)
          }
        } catch (error) {
          console.error('解析数据错误:', error, '原始数据:', data)
        }
      }
    }
    
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