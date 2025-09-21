const mongoose = require('mongoose');
const User = require('../models/User');
const Tweet = require('../models/Tweet');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/twitter-clone');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Tweet.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = await User.insertMany([
      {
        handle: 'alex_dev',
        name: 'Alex Developer',
        bio: 'Full-stack developer passionate about React and TypeScript 🚀',
        followers: [],
        following: []
      },
      {
        handle: 'sarah_coder',
        name: 'Sarah Coder',
        bio: 'UI/UX Designer & Frontend Developer ✨',
        followers: [],
        following: []
      },
      {
        handle: 'mike_programmer',
        name: 'Mike Programmer',
        bio: 'Backend developer and DevOps enthusiast 🔧',
        followers: [],
        following: []
      }
    ]);

    console.log('Created users:', users.length);

    // Set up follow relationships
    users[0].following = [users[1]._id, users[2]._id];
    users[0].followers = [users[1]._id, users[2]._id];
    
    users[1].following = [users[0]._id];
    users[1].followers = [users[0]._id, users[2]._id];
    
    users[2].following = [users[0]._id, users[1]._id];
    users[2].followers = [users[0]._id];

    await Promise.all(users.map(user => user.save()));
    console.log('Set up follow relationships');

    // Create tweets
    const tweets = await Tweet.insertMany([
      {
        author: users[0]._id,
        content: 'Just shipped a new feature! 🚀 The power of React and TypeScript never ceases to amaze me.',
        likes: [users[1]._id, users[2]._id],
        retweets: [{ user: users[1]._id }],
        replies: []
      },
      {
        author: users[1]._id,
        content: 'Design systems are the backbone of scalable UI development. Here\'s what I learned building one from scratch 🎨',
        likes: [users[0]._id],
        retweets: [],
        replies: []
      },
      {
        author: users[2]._id,
        content: 'Docker containers are game-changers for development workflows. Setting up microservices has never been easier! 🐳',
        likes: [users[0]._id, users[1]._id],
        retweets: [{ user: users[0]._id }],
        replies: []
      },
      {
        author: users[0]._id,
        content: 'Working on a Twitter clone with React! The state management and real-time updates are fascinating to implement.',
        likes: [users[1]._id],
        retweets: [],
        replies: []
      }
    ]);

    console.log('Created tweets:', tweets.length);
    console.log('✅ Database seeded successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
