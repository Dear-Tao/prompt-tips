import { OpenAI } from 'openai'

// 创建OpenAI客户端实例
const createDeepseekClient = () => {
  const apiKey = localStorage.getItem('dashscope_api_key')
  
  if (!apiKey) {
    throw new Error('未设置DashScope API密钥')
  }
  
  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    dangerouslyAllowBrowser: true
  })
}

// 生成Prompt并获取流式响应
export const generatePrompt = async (requirement, onProgress, signal) => {
  try {
    const client = createDeepseekClient()
    const selectedModel = localStorage.getItem('selected_model') || 'deepseek-r1'
    
    console.log('使用模型:', selectedModel)
    console.log('请求内容:', requirement)
    
    let reasoningContent = ''
    let answerContent = ''
    let isAnswering = false
    
    // 根据当前选择的标签页确定系统提示
    const systemPrompt = requirement.includes('图片Prompt') ? 
      '你是一个专业的图片Prompt工程师，擅长根据用户的需求生成高质量的图片生成Prompt。你需要分析用户的需求，理解其核心意图和关键信息，然后生成一个结构清晰、指向明确、易于AI图像生成模型理解的Prompt。生成的Prompt应当包含明确的图片描述、风格要求、构图要素、色彩倾向等信息，以确保AI能够生成符合用户期望的图片。请以清晰的格式输出，包括主题、内容描述、风格、构图、色彩等要素。' : 
      '你是一个专业的Prompt工程师，擅长根据用户的需求生成高质量的Prompt。你需要分析用户的需求，理解其核心意图和关键信息，然后生成一个结构清晰、指向明确、易于理解的Prompt。生成的Prompt应当包含明确的指令、必要的上下文信息、输出格式要求等要素，以确保AI能够准确理解并执行用户的意图。'
    
    console.log('开始请求流式响应...')
    
    // 使用fetch直接请求API，以便更好地控制响应处理
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dashscope_api_key')}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请根据以下需求，生成一个高质量的Prompt：\n\n${requirement}` }
        ],
        stream: true,
        temperature: 0.7
      }),
      signal // 添加AbortController的signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    console.log('流式响应已开始...');
    
    // 获取响应的可读流
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    // 首先通知前端开始接收思考过程
    onProgress({ type: 'thinking_start', content: '正在思考中...' });
    
    // 处理流式响应
    while (true) {
      // 检查是否已中断
      if (signal && signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // 解码二进制数据
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      console.log('收到原始数据:', chunk);
      
      // 按行处理数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个可能不完整的行
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
        
        const data = trimmedLine.slice(5).trim();
        
        if (data === '[DONE]') {
          console.log('收到完成标记');
          continue;
        }
        
        try {
          const parsedData = JSON.parse(data);
          console.log('解析后的数据:', parsedData);
          
          if (parsedData.choices && parsedData.choices.length > 0) {
            const choice = parsedData.choices[0];
            
            // 处理思考过程
            if (choice.delta && choice.delta.reasoning_content) {
              const content = choice.delta.reasoning_content;
              console.log('从delta.reasoning_content提取内容:', content);
              reasoningContent += content;
              
              // 将思考过程发送给前端，标记类型为thinking
              onProgress({ type: 'thinking', content });
            } 
            // 处理正式回复
            else if (choice.delta && choice.delta.content) {
              const content = choice.delta.content;
              console.log('从delta.content提取内容:', content);
              
              if (!isAnswering) {
                isAnswering = true;
                console.log('开始回答');
                // 通知前端思考过程结束，开始显示回答
                onProgress({ type: 'thinking_end' });
                onProgress({ type: 'answer_start' });
              }
              
              answerContent += content;
              // 将回答内容发送给前端，标记类型为answer
              onProgress({ type: 'answer', content });
            }
          }
        } catch (error) {
          console.error('解析数据错误:', error, '原始数据:', data);
        }
      }
    }
    
    console.log('流式响应结束');
    console.log('思考过程:', reasoningContent);
    console.log('最终回答:', answerContent);
    
    // 如果没有收到任何回答内容，但有思考过程，则将思考过程作为回答
    if (!answerContent && reasoningContent) {
      console.log('没有收到回答内容，使用思考过程作为回答');
      onProgress({ type: 'thinking_end' });
      onProgress({ type: 'answer_start' });
      onProgress({ type: 'answer', content: reasoningContent });
    }
    
    // 通知前端回答结束
    onProgress({ type: 'answer_end' });
    
    return true;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

// 验证API密钥
export const validateApiKey = async (apiKey) => {
  try {
    console.log('开始验证API密钥...')
    
    // 使用fetch直接请求API
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1',
        messages: [{ role: 'user', content: 'test' }],
        temperature: 0.3,
        max_tokens: 5 // 限制生成的token数量，加快验证速度
      })
    });
    
    if (!response.ok) {
      console.error('API响应错误:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('API验证响应:', data);
    
    return !!(data && data.choices && data.choices.length > 0);
  } catch (error) {
    console.error('API密钥验证失败:', error);
    return false;
  }
} 