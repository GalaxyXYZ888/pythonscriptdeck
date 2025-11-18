# AI Code Generator - Supported Providers

The AI Code Generator action supports **4 major AI providers**, giving you flexibility in choosing the best model for your needs based on cost, speed, and capabilities.

## Supported Providers

### 🤖 OpenAI (GPT)
**Website:** https://platform.openai.com

**Available Models:**
- **GPT-4o** - Most capable model, best for complex code generation
- **GPT-4o Mini** - Fast and cost-effective, recommended for most use cases
- **GPT-4 Turbo** - Previous generation flagship model
- **GPT-3.5 Turbo** - Legacy model, fastest and cheapest

**API Key:** Get at https://platform.openai.com/api-keys

**Pricing (as of 2024):**
- GPT-4o Mini: $0.15 / 1M input tokens, $0.60 / 1M output tokens
- GPT-4o: $2.50 / 1M input tokens, $10.00 / 1M output tokens

**Best For:** General-purpose code generation, well-documented APIs

---

### 🧠 Anthropic (Claude)
**Website:** https://console.anthropic.com

**Available Models:**
- **Claude 3.5 Sonnet (Latest)** - Best balance of intelligence and speed
- **Claude 3.5 Haiku** - Fastest model, great for simple tasks
- **Claude 3 Opus** - Most capable model for complex reasoning
- **Claude 3 Sonnet** - Previous generation balanced model
- **Claude 3 Haiku** - Previous generation fast model

**API Key:** Get at https://console.anthropic.com/settings/keys

**Pricing (as of 2024):**
- Claude 3.5 Haiku: $0.80 / 1M input tokens, $4.00 / 1M output tokens
- Claude 3.5 Sonnet: $3.00 / 1M input tokens, $15.00 / 1M output tokens

**Best For:** Code quality, detailed explanations, safety-focused applications

---

### 🔷 Google (Gemini)
**Website:** https://aistudio.google.com

**Available Models:**
- **Gemini 1.5 Pro** - Most capable, best for complex tasks
- **Gemini 1.5 Flash** - Fast and efficient, recommended
- **Gemini 1.5 Flash-8B** - Fastest and most cost-effective
- **Gemini 2.0 Flash (Experimental)** - Latest experimental model

**API Key:** Get at https://aistudio.google.com/app/apikey

**Pricing (as of 2024):**
- Gemini 1.5 Flash: $0.075 / 1M input tokens, $0.30 / 1M output tokens
- Gemini 1.5 Pro: $1.25 / 1M input tokens, $5.00 / 1M output tokens

**Free Tier:** 15 requests per minute, 1 million tokens per minute

**Best For:** Cost-effective code generation, multimodal capabilities

---

### ⚡ Groq (Llama)
**Website:** https://console.groq.com

**Available Models:**
- **Llama 3.3 70B Versatile** - Recommended, best balance
- **Llama 3.1 70B Versatile** - Previous generation
- **Llama 3.1 8B Instant** - Fastest, for simple tasks
- **Mixtral 8x7B** - Alternative open-source model

**API Key:** Get at https://console.groq.com/keys

**Pricing (as of 2024):**
- Llama 3.3 70B: $0.59 / 1M input tokens, $0.79 / 1M output tokens
- Llama 3.1 8B: $0.05 / 1M input tokens, $0.08 / 1M output tokens

**Free Tier:** Generous free tier available

**Best For:** Ultra-fast inference, open-source models, cost-effective

---

## Quick Comparison

| Provider | Speed | Cost | Code Quality | Free Tier |
|----------|-------|------|--------------|-----------|
| **OpenAI** | ⭐⭐⭐⭐ | $$$ | ⭐⭐⭐⭐⭐ | Limited |
| **Anthropic** | ⭐⭐⭐⭐ | $$$ | ⭐⭐⭐⭐⭐ | Limited |
| **Google** | ⭐⭐⭐⭐ | $ | ⭐⭐⭐⭐ | Yes |
| **Groq** | ⭐⭐⭐⭐⭐ | $ | ⭐⭐⭐⭐ | Yes |

---

## Recommendations

### For Beginners
**Google Gemini 1.5 Flash** or **Groq Llama 3.3 70B**
- Both have generous free tiers
- Good code quality
- Fast response times

### For Best Code Quality
**OpenAI GPT-4o** or **Anthropic Claude 3.5 Sonnet**
- Highest quality code generation
- Best understanding of complex requirements
- Most reliable for production use

### For Speed
**Groq Llama 3.1 8B** or **Google Gemini 1.5 Flash-8B**
- Ultra-fast inference
- Great for simple scripts
- Cost-effective

### For Cost-Effectiveness
**Google Gemini 1.5 Flash** or **Groq Llama 3.3 70B**
- Lowest cost per token
- Good quality-to-price ratio
- Free tiers available

---

## How to Switch Providers

1. Open the **AI Code Generator** action in Stream Deck
2. In the Property Inspector, select your desired **AI Provider** from the dropdown
3. Select the **Model** you want to use
4. Enter your **API Key** for that provider
5. Click **Generate Code** to test

The plugin will automatically use the selected provider and model for all code generation.

---

## API Key Security

- API keys are stored securely in Stream Deck settings
- Keys are never logged or transmitted except to the respective AI provider
- Each provider requires its own API key
- You can switch providers at any time

---

## Troubleshooting

### "API Error" Messages
- Verify your API key is correct
- Check that you have credits/quota remaining
- Ensure you selected the correct provider

### Slow Response Times
- Try switching to a faster model (e.g., GPT-4o Mini, Gemini Flash, Llama 8B)
- Check your internet connection
- Some providers may have rate limits

### Code Quality Issues
- Try a more capable model (e.g., GPT-4o, Claude 3.5 Sonnet, Gemini Pro)
- Make your prompt more specific
- Use code templates as starting points

---

## Future Providers

We're considering adding support for:
- Azure OpenAI
- AWS Bedrock
- Cohere
- Mistral AI
- Local models (Ollama)

Let us know which providers you'd like to see added!

