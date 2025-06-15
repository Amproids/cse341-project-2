const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const mongodb = require('../db/connect');
const router = express.Router();

// Configure GitHub Strategy
passport.use(new GitHubStrategy({
   clientID: process.env.GITHUB_CLIENT_ID,
   clientSecret: process.env.GITHUB_CLIENT_SECRET,
   callbackURL: process.env.GITHUB_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
   try {
       const db = mongodb.getDb().db('cse341-project2');
       const email = profile.emails?.[0]?.value?.toLowerCase() || `${profile.username}@github.local`;
       
       // First try to find by GitHub ID
       let user = await db.collection('users').findOne({ githubId: profile.id });

       // If no GitHub ID match, try email
       if (!user) {
           user = await db.collection('users').findOne({ email: email });
           
           // If found by email, link the GitHub account
           if (user) {
               await db.collection('users').updateOne(
                   { _id: user._id },
                   { $set: { githubId: profile.id, githubUsername: profile.username } }
               );
           }
       }
       
       if (!user) {
           // Create new user with GitHub OAuth data
           const newUser = {
               firstName: profile.displayName?.split(' ')[0] || profile.username,
               lastName: profile.displayName?.split(' ')[1] || '',
               email: email,
               githubId: profile.id,
               githubUsername: profile.username,
               dateOfBirth: new Date('1990-01-01'), // Default
               gender: 'NOT_SPECIFIED',
               height: 170,
               weight: 70,
               role: 'user',
               emailVerified: true, // OAuth emails are verified
               isActive: true,
               isTestUser: false,
               createdAt: new Date()
           };
           
           const result = await db.collection('users').insertOne(newUser);
           user = { ...newUser, _id: result.insertedId };
       }
       
       return done(null, user);
   } catch (error) {
       return done(error, null);
   }
}));

// OAuth routes
router.get('/github', 
   passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
   passport.authenticate('github', { session: false }),
   (req, res) => {
       // Generate JWT using your existing logic
       const tokenPayload = {
           userId: req.user._id,
           email: req.user.email,
           role: req.user.role || 'user'
       };
       
       const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
           expiresIn: '2h',
           algorithm: 'HS256',
           issuer: 'cse341-project2'
       });
       
       // For demo purposes, return JSON with token
       res.status(200).json({
           message: 'GitHub OAuth login successful',
           token: token,
           user: {
               id: req.user._id,
               firstName: req.user.firstName,
               lastName: req.user.lastName,
               email: req.user.email,
               role: req.user.role,
               githubUsername: req.user.githubUsername
           }
       });
   }
);

module.exports = router;