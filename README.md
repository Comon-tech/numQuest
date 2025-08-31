# 🎮 NumQuest Multiplayer

**NumQuest** is now a **real-time multiplayer number guessing game** that you can play with your Discord friends! Challenge each other in competitive battles, work together in team modes, and climb the global leaderboards.

* Join our server on [discord](https://discord.gg/RCFAKcna)

## 🌟 **New Multiplayer Features**

### 🏠 **Game Rooms & Lobby System**
- **Create custom rooms** with your own settings
- **Join existing rooms** or **spectate** ongoing games
- **Real-time player matching** and room discovery
- **Host controls** for game management

### 🎯 **Multiple Game Modes**
- **🏆 Competitive Mode**: Race against friends to guess first
- **👥 Team Mode**: Work together with your teammates
- **🤝 Cooperative Mode**: Everyone wins together
- **🏅 Tournament Mode**: Multi-round championships

### ⚡ **Power-up System**
- **💡 Hint Power-up**: Get a range hint for the target number
- **⏰ Extra Time**: Add 30 seconds to the clock
- **💎 Double Points**: Multiply your score by 2
- **🛡️ Shield**: Protect your minimum score

### 🏆 **Achievement System**
- **🎯 First Try**: Guess correctly on your first attempt
- **⚡ Speed Demon**: Solve quickly with time to spare
- **🏅 Champion**: Win multiple rounds
- **🌟 Streak Master**: Consecutive correct guesses

### 💬 **Real-time Communication**
- **In-game chat** with all players
- **Live notifications** for game events
- **Player status updates** and room announcements

### 📊 **Advanced Statistics**
- **Global leaderboards** across all games
- **Personal stats tracking** (games played, won, best scores)
- **Performance analytics** and improvement tracking

## 🚀 **How to Play Multiplayer**

### 1. **Getting Started**
```bash
# Install dependencies
npm install

# Start the multiplayer server
npm start

# Or for development with auto-restart
npm run dev
```

### 2. **Joining the Game**
1. **Enter your username** and choose an avatar
2. **Browse available rooms** or create your own
3. **Join a room** or **spectate** ongoing games
4. **Wait for the host** to start the game

### 3. **Gameplay**
- **Make your guesses** within the time limit
- **Use power-ups** strategically
- **Chat with other players** during the game
- **Compete for the highest score** and fastest time

### 4. **Room Management**
- **Host controls**: Start games, manage settings
- **Player limits**: Up to 8 players per room
- **Custom settings**: Time limits, number ranges, rounds
- **Spectator mode**: Watch without playing

## 🛠️ **Technical Features**

### **Real-time Technology**
- **WebSocket connections** via Socket.IO
- **Instant game updates** and player synchronization
- **Low-latency gameplay** for competitive matches
- **Automatic reconnection** handling

### **Scalable Architecture**
- **Room-based game sessions** for optimal performance
- **Player state management** with persistent statistics
- **Achievement system** with unlockable rewards
- **Global leaderboards** with real-time updates

### **Cross-platform Support**
- **Responsive design** for all devices
- **Modern browser compatibility** (Chrome, Firefox, Safari, Edge)
- **Mobile-friendly interface** with touch controls
- **Progressive Web App** capabilities

## 🎨 **Game Modes Explained**

### **🏆 Competitive Mode**
- **Goal**: Be the first to guess the number
- **Scoring**: Points based on speed and attempts
- **Strategy**: Balance speed vs. accuracy
- **Rewards**: Bonus points for quick wins

### **👥 Team Mode**
- **Goal**: Work together to solve puzzles
- **Scoring**: Combined team score
- **Strategy**: Coordinate hints and guesses
- **Rewards**: Team achievements and bonuses

### **🤝 Cooperative Mode**
- **Goal**: Everyone reaches the target together
- **Scoring**: Individual scores contribute to group total
- **Strategy**: Share information and help each other
- **Rewards**: Group completion bonuses

### **🏅 Tournament Mode**
- **Goal**: Win multiple rounds to become champion
- **Scoring**: Cumulative score across rounds
- **Strategy**: Consistent performance over time
- **Rewards**: Tournament trophies and rankings

## 🔧 **Server Configuration**

### **Environment Variables**
```bash
PORT=3000                    # Server port (default: 3000)
NODE_ENV=production         # Environment mode
MAX_PLAYERS_PER_ROOM=8      # Maximum players per room
GAME_TIMEOUT=300000         # Game timeout in milliseconds
```

### **Custom Game Settings**
- **Number Ranges**: 1-1000 (customizable)
- **Time Limits**: 30-300 seconds
- **Round Counts**: 1-10 rounds per game
- **Power-up Distribution**: Random or strategic

## 📱 **Mobile Experience**

### **Touch-Optimized Controls**
- **Large buttons** for easy tapping
- **Swipe gestures** for navigation
- **Responsive layouts** for all screen sizes
- **Mobile-first design** principles

### **Performance Optimizations**
- **Efficient rendering** for smooth gameplay
- **Battery optimization** for mobile devices
- **Offline capabilities** for single-player mode
- **Push notifications** for game invites

## 🎵 **Audio & Visual Features**

### **Sound Effects**
- **Success sounds** for correct guesses
- **Error sounds** for wrong attempts
- **Timer warnings** for low time
- **Achievement fanfares** for unlocks

### **Visual Feedback**
- **Animated notifications** for game events
- **Color-coded status** indicators
- **Progress bars** for game progression
- **Particle effects** for celebrations

## 🔒 **Security & Privacy**

### **Player Protection**
- **Username validation** and filtering
- **Rate limiting** for chat and guesses
- **Anti-cheat measures** for fair play
- **Data encryption** for sensitive information

### **Room Security**
- **Host verification** for game controls
- **Player authentication** for room access
- **Chat moderation** tools
- **Report system** for inappropriate behavior

## 🌐 **Deployment**

### **Local Development**
```bash
npm run dev          # Start with nodemon
npm run watch        # Watch Tailwind CSS
```

### **Production Deployment**
```bash
npm start            # Start production server
NODE_ENV=production npm start
```

### **Docker Support**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- **Code standards** and best practices
- **Testing requirements** and quality assurance
- **Feature requests** and bug reports
- **Community guidelines** and etiquette

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Background music** and sound effects from [Pixabay](https://pixabay.com/sound-effects/)
- **Socket.IO** for real-time communication
- **Tailwind CSS** for beautiful, responsive design
- **Font Awesome** for amazing icons
- **Press Start 2P** font for retro gaming aesthetics

---

**🎮 Ready to challenge your friends? Start the server and join the fun!**

*For support and updates, join our [Discord server](https://discord.gg/RCFAKcna)*
