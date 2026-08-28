# The Roast Board

A fun, newspaper-themed web app where friends create profiles and write playful roasts about each other. Built with React, featuring a retro tabloid design with profiles, posts, comments, likes, and a leaderboard.

## Features

✨ **Profile Management**
- Add friends as "suspects" with custom names and emojis or photo avatars
- View individual profiles with all roasts filed about them

📰 **Roast Posts**
- File playful roasts about friends in various categories (Funny, Gaming, Cricket, School, Friends, Random)
- Post anonymously or with your name
- Track roasts by category and search

❤️ **Engagement**
- Like posts to show appreciation
- Leave friendly comments on roasts
- See the "Roast of the Day" (most liked post)

🏆 **Leaderboard**
- Rank suspects by number of roasts filed
- Track who gets roasted most (the "Most Wanted")
- See individual author levels (New Roaster → Roast Legend)

⚠️ **Community Moderation**
- Report inappropriate roasts
- Post authors or "admin" can delete roasts
- Flagged posts are marked for community review

💾 **Local Storage**
- All data persists locally in your browser
- No server needed — completely private

## Getting Started

### Prerequisites
- Node.js 14+ (for development)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/najahnhia/The-Roast-Board.git
cd The-Roast-Board
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Adding a Suspect
1. Go to the "SUSPECTS" tab
2. Click "ADD A SUSPECT"
3. Enter their name
4. Choose an emoji mugshot or upload a photo
5. Click "Add to file"

### Filing a Roast Report
1. Go to the "FEED" tab
2. Click "FILE A REPORT"
3. Select the suspect
4. Enter your name (or post anonymously)
5. Choose a category
6. Write your playful roast
7. Click "Publish"

### Interacting with Roasts
- **Like**: Click the ❤️ heart icon to like a roast
- **Comment**: Click the 💬 comment icon to reply
- **Report**: Click 🛡️ Report to flag inappropriate content
- **Delete**: If you authored the roast, click 🗑️ Delete to remove it

### View Leaderboard
Click the "LEADERBOARD" tab to see:
- Who's most roasted
- Total likes per suspect
- Number of roasts filed

## Community Rules

Please keep these guidelines in mind:

1. ✅ Keep it playful — this is for friends who are in on the joke
2. ❌ No threats, hate speech, or bullying
3. 🔒 Never post anyone's private information
4. 🚩 Report content that crosses a line
5. 🗑️ Respect delete requests from post authors

## Technology Stack

- **React** - UI framework
- **Lucide React** - Icon library
- **CSS-in-JS** - Inline styling with CSS variables
- **localStorage** - Browser-based data persistence
- **Google Fonts** - Anton, Special Elite, Inter typefaces

## Architecture

### State Structure
```javascript
{
  profiles: [{ id, name, avatar, photo, createdAt }],
  posts: [{ id, targetId, author, text, category, likes, createdAt }],
  comments: [{ id, postId, author, text, createdAt }],
  reportedIds: [postId, ...]
}
```

### Main Component
- `RoastBoard.tsx` - Single-file React component with all features

## Performance Considerations

The app stores all data locally in localStorage. For optimal performance:
- Keep the number of profiles under 100
- Archive old roasts periodically if the board gets very large
- Clear browser cache if you experience slowdowns

See the [Performance Issue](https://github.com/najahnhia/The-Roast-Board/issues/1) for optimization tracking.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Found a bug? Have a feature idea? 
- Open an [issue](https://github.com/najahnhia/The-Roast-Board/issues)
- Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

The Roast Board is designed for friends who have agreed to participate. Use responsibly and ensure all participants are comfortable with the content. The creators are not responsible for misuse or inappropriate content posted by users.

---

**Made with ❤️ for good-natured roasting among friends.**
