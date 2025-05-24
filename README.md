# 🎬 Telegram Video Downloader Bot

A powerful Telegram bot built with NestJS that downloads videos from popular social media platforms and removes watermarks. Features a premium subscription system with unlimited downloads and priority processing.

## ✨ Features

### 🆓 Free Tier
- 3 downloads per hour
- Watermark removal
- Support for multiple platforms
- Basic video processing

### 💎 Premium Tier
- ✅ Unlimited downloads
- 🚀 Priority processing queue
- ⏱️ No rate limits
- 📅 Monthly & Yearly plans

### 🎯 Supported Platforms
- **TikTok** - Videos and image carousels
- Easily extensible for additional platforms

## 🏗️ Architecture

Built with modern technologies and best practices:

- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Queue System**: BullMQ with Redis
- **Bot Framework**: Telegraf
- **Configuration**: Environment-based with validation

### 📁 Project Structure

```
src/
├── config/          # Configuration modules
├── common/          # Shared utilities and services
├── user/            # User management and authentication
├── subscription/    # Premium subscription handling
├── platform/        # Video platform integrations
│   └── tiktok/     # TikTok service implementation
├── queue/           # Background job processing
└── telegram/        # Bot logic and handlers
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis
- Telegram Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telegram-video-downloader-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**

   Create a `.env` file in the root directory:
   ```env
   # Telegram Configuration
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/video-downloader
   
   # Redis Configuration (for BullMQ)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

4. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## 🤖 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and bot introduction |
| `/help` | Display help information and supported platforms |
| `/premium` | View premium subscription benefits and pricing |
| `/subscribe` | Instructions for subscribing to premium |
| `/subscription` | View current subscription details |
| `/status` | Check account status and usage limits |

## 💳 Subscription Management

### Creating Subscriptions

Subscriptions are managed manually through the admin interface. To create a subscription:

```typescript
// Example: Create a monthly subscription
const subscriptionDto = {
  telegramId: 123456789,
  plan: SubscriptionPlanInterface.MONTHLY
};

await subscriptionService.createSubscription(subscriptionDto);
```

### Pricing Structure

- **Monthly Plan**: $9.99/month
- **Yearly Plan**: $99.99/year (17% savings)

## 🔧 Development

### Adding New Platforms

1. **Create Platform Service**
   ```typescript
   // src/platform/newplatform/newplatform.service.ts
   @Injectable()
   export class NewPlatformService implements PlatformService {
     public readonly name = 'NewPlatform';
     
     isValidUrl(url: string): boolean {
       // URL validation logic
     }
     
     async getVideoInfo(url: string): Promise<Video | null> {
       // Video extraction logic
     }
   }
   ```

2. **Register in Platform Factory**
   ```typescript
   // src/platform/platform.factory.ts
   onModuleInit() {
     this.registerPlatform(this.newPlatformService);
   }
   ```

### Queue Processing

The bot uses BullMQ for handling video processing jobs:

- **Premium users**: Priority 1 (highest)
- **Free users**: Priority 10 (normal)
- **Concurrency**: 5 concurrent jobs
- **Retry Logic**: 3 attempts with exponential backoff

### Rate Limiting

Free users are limited to 3 requests per hour:
- Counters reset automatically after 1 hour
- Premium users have no limits
- Rate limiting is enforced before job queuing

## 🔒 Security Features

- **Input Validation**: All URLs are validated before processing
- **Rate Limiting**: Prevents abuse from free users
- **Error Handling**: Graceful error handling with user-friendly messages
- **Subscription Validation**: Automatic subscription expiry handling

## 📈 Performance Optimization

- **Concurrent Processing**: 5 simultaneous video downloads
- **Queue Management**: Priority-based job processing
- **Memory Management**: Efficient video streaming
- **Error Recovery**: Automatic retries with exponential backoff

## 🔍 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check Telegram token validity
   - Verify bot is running: `npm run start:dev`

2. **Database connection errors**
   - Ensure MongoDB is running
   - Check MONGODB_URI in environment

3. **Queue processing issues**
   - Verify Redis connection
   - Check Redis service status

4. **Video download failures**
   - Platform API may be down
   - Check network connectivity
   - Review logs for specific errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and inquiries:
- Telegram: @bedonassef02
- Email: bedonassef71@gmail.com

---

Built with ❤️ using NestJS and TypeScript