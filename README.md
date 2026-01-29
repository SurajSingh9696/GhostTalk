# WhatsApp-Like Chat Application

A full-featured real-time chat application with complete authentication, temporary chat rooms, and modern UI built with Next.js, Socket.io, and MongoDB.

## ✨ Features

### 🔐 Complete Authentication System
- **User Registration** with email verification (OTP via Resend)
- **Secure Login** with bcrypt password hashing
- **Forgot Password** flow with OTP-based password reset
- **Session Management** with secure, server-side sessions
- **Profile Management** - Edit name and avatar
- **Protected Routes** with middleware-based authentication

### 💬 Real-Time Chat System
- **Create Rooms** - Generate unique room IDs instantly
- **Join Rooms** - Join using room ID
- **Real-time Messaging** - Instant message delivery via Socket.io
- **Live Participants List** - See who's in the room
- **Typing Indicators** - Know when someone is typing
- **Admin Controls** - Room creator has delete permissions
- **Auto-scroll** - Smooth scrolling to latest messages

### 🗑️ Temporary Chat Logic (IMPORTANT)
- **Automatic Cleanup** - When all users leave, room and messages are deleted
- **Admin Delete** - Admin can manually delete room and all messages
- **No Persistence** - Zero chat history remains after room closure
- **Real-time Notifications** - Users notified when room is deleted

### 🎨 Modern UI/UX
- **WhatsApp-inspired Design** - Clean and familiar interface
- **Smooth Animations** - Polished transitions
- **Responsive** - Works on mobile and desktop
- **Tailwind CSS** - Modern, utility-first styling
- **Message Bubbles** - Distinct sent/received styling
- **Timestamps** - Message time display

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **Real-time**: Socket.io
- **Authentication**: bcrypt + JWT sessions
- **Email**: Resend
- **Date Handling**: date-fns

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher)
2. **MongoDB** (local or MongoDB Atlas)
3. **Resend API Key** (for sending emails)

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
cd 03-whatsapp-chat
npm install
```

### 2. Configure Environment Variables

Edit the `.env.local` file with your actual credentials:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/whatsapp-chat
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp-chat

# Resend API Key (Get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email sender (must be verified in Resend)
EMAIL_FROM=noreply@yourdomain.com
# For testing, you can use: onboarding@resend.dev

# JWT Secret (change this to a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Socket.io URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 3. Get a Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Create an API key from the dashboard
4. Add it to your `.env.local` file

**For Testing**: You can use `onboarding@resend.dev` as the EMAIL_FROM during development.

### 4. Start MongoDB

If using local MongoDB:
```bash
mongod
```

If using MongoDB Atlas, ensure your connection string is correct in `.env.local`.

### 5. Run the Application

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

## 📖 Usage Guide

### Step 1: Create an Account

1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Fill in your details:
   - Name
   - Email
   - Password (minimum 6 characters)
4. Submit the form
5. Check your email for a 6-digit verification code
6. Enter the code to verify your email

### Step 2: Login

1. After verification, login with your email and password
2. You'll be redirected to the dashboard

### Step 3: Create or Join a Room

**Option A: Create a New Room**
1. Click "Create New Room"
2. A unique Room ID will be generated (e.g., `A1B2C3D4`)
3. Share this ID with others to invite them

**Option B: Join an Existing Room**
1. Click "Join Room"
2. Enter the Room ID provided by the creator
3. Click "Join"

### Step 4: Start Chatting

1. Type your message in the input field
2. Press "Send" or hit Enter
3. Messages appear instantly for all participants
4. See who's online in the "Participants" panel
5. Typing indicators show when someone is composing

### Step 5: Managing Your Profile

1. Click "Profile" in the header
2. Edit your name or add an avatar URL
3. Save changes

### Step 6: Leaving or Deleting a Room

**Leave Room**: Click the back arrow in the room header

**Delete Room** (Admin only):
1. Click "Delete Room" in the header
2. Confirm the deletion
3. All messages will be permanently deleted
4. All participants will be disconnected

## 🔑 Important Features Explained

### Temporary Message Storage

This is a core feature of the application:

- **When all users leave a room**: The room and all messages are automatically deleted from the database
- **When admin deletes the room**: All messages are immediately deleted and users are notified
- **No chat history persists**: Once a room is closed, there's no way to recover messages

This ensures privacy and temporary communication.

### Admin Permissions

The user who creates a room becomes the admin and can:
- Delete the room at any time
- See participant list
- All admin actions are marked with an "Admin" badge

### Session Management

- Sessions last 7 days by default
- Secure HttpOnly cookies prevent XSS attacks
- Sessions are stored in MongoDB
- Expired sessions are automatically cleaned up

### Email Verification

- OTP codes are valid for 10 minutes
- After 10 minutes, users need to request a new code
- Users cannot login without verifying their email

## 🏗️ Project Structure

```
03-whatsapp-chat/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.js
│   │   │   ├── login/route.js
│   │   │   ├── verify-email/route.js
│   │   │   ├── forgot-password/route.js
│   │   │   ├── reset-password/route.js
│   │   │   ├── me/route.js
│   │   │   └── logout/route.js
│   │   ├── profile/route.js
│   │   └── rooms/
│   │       ├── create/route.js
│   │       ├── join/route.js
│   │       └── delete/route.js
│   ├── auth/
│   │   ├── login/page.jsx
│   │   ├── signup/page.jsx
│   │   └── forgot-password/page.jsx
│   ├── dashboard/page.jsx
│   ├── room/[id]/page.jsx
│   ├── layout.jsx
│   ├── page.jsx
│   └── globals.css
├── lib/
│   ├── db/
│   │   └── mongodb.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Auth.js
│   │   ├── Session.js
│   │   ├── Room.js
│   │   └── Message.js
│   ├── middleware/
│   │   └── auth.js
│   ├── socket/
│   │   └── server.js
│   └── utils/
│       ├── jwt.js
│       ├── password.js
│       ├── otp.js
│       └── email.js
├── server.js (Custom server for Socket.io)
├── package.json
├── next.config.js
├── tailwind.config.js
└── .env.local
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **Secure Sessions**: HttpOnly cookies, server-side validation
- **JWT Tokens**: Signed with secret key
- **OTP Expiry**: 10-minute validity for all OTPs
- **Email Verification**: Required before login
- **MongoDB Injection Protection**: Mongoose schema validation
- **XSS Protection**: React's built-in escaping

## 🐛 Troubleshooting

### MongoDB Connection Issues

```
Error: Could not connect to MongoDB
```

**Solution**: 
- Ensure MongoDB is running: `mongod`
- Check your `MONGODB_URI` in `.env.local`
- For Atlas, verify your IP is whitelisted

### Email Not Sending

```
Error: Failed to send email
```

**Solution**:
- Verify your `RESEND_API_KEY` is correct
- Check that your sender email is verified in Resend
- For testing, use `onboarding@resend.dev`

### Socket.io Connection Failed

```
Error: Socket connection failed
```

**Solution**:
- Ensure the server is running with `npm run dev`
- Check that `NEXT_PUBLIC_SOCKET_URL` matches your server URL
- Verify port 3000 is not being used by another process

### Session/Cookie Issues

```
Error: Unauthorized
```

**Solution**:
- Clear your browser cookies
- Logout and login again
- Check that `JWT_SECRET` is set in `.env.local`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/login` - Login to account
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Rooms
- `POST /api/rooms/create` - Create new room
- `POST /api/rooms/join` - Join existing room
- `DELETE /api/rooms/delete` - Delete room (admin only)

### Socket.io Events

**Client → Server:**
- `join-room` - Join a chat room
- `send-message` - Send a message
- `typing` - Typing indicator
- `leave-room` - Leave a room

**Server → Client:**
- `room-messages` - Initial messages on join
- `new-message` - New message broadcast
- `participants-update` - Participant list update
- `user-joined` - User joined notification
- `user-typing` - Typing indicator
- `room-deleted` - Room deletion notification
- `error` - Error messages

## 🎯 Testing the Complete Flow

1. **Sign Up**: Create account → Receive email → Verify with OTP
2. **Login**: Login with credentials → Redirect to dashboard
3. **Create Room**: Generate room ID → Copy and share
4. **Join Room** (2nd user): Use room ID → Join successfully
5. **Chat**: Send messages → See real-time delivery
6. **Participants**: View online users → See admin badge
7. **Profile**: Edit name/avatar → Changes persist
8. **Leave Room**: Leave room → Room remains if others present
9. **Delete Room**: Admin deletes → All messages deleted, users notified
10. **Logout**: Logout → Session cleared

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Note**: Socket.io requires a custom server, which Vercel doesn't support well. Consider using:
- Railway
- Render
- DigitalOcean
- Heroku

### Environment Variables for Production

```env
MONGODB_URI=your_production_mongodb_uri
RESEND_API_KEY=your_production_resend_key
EMAIL_FROM=your_verified_email
JWT_SECRET=strong_random_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
NODE_ENV=production
```

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

Built with ❤️ using Next.js, Socket.io, and MongoDB

---

**Happy Chatting! 💬**
# GhostTalk
