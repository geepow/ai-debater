import { NextResponse } from 'next/server';


export async function POST() {
  
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const options = {
      method: 'POST',
      headers: {Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json'},
      body: '{"model":"deepseek/deepseek-chat:free","messages":[{"role":"user","content":"What is the meaning of life?"}]}'
    };
    
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(data);
      return NextResponse.json({
        response: data.choices[0]?.message?.content})

    } catch (error) {
      console.error(error);
    }
 
}