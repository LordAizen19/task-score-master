

# TaskScore — Gamified Productivity Tracker

## Overview
A gamified productivity app where users create tasks with deadlines and earn/lose gold coins based on completion timing. Built with React + TypeScript + Tailwind CSS, Supabase for auth & database, and Lovable AI for the productivity assistant.

---

## Pages & Layout

### 1. Auth Pages (Login / Register)
- Clean, centered card layout
- Email + password authentication via Supabase Auth
- Toggle between login and register modes
- Password reset flow

### 2. Dashboard
- **Score display** — large gold coin counter (can be negative)
- **Today's tasks** — list with status indicators
- **Quick stats** — completed, missed, pending counts
- **Recent score changes** — feed showing latest +/- coin events
- **AI productivity summary** button

### 3. Task Manager
- **Task list** with filters (all, pending, in progress, completed, missed)
- **Create/Edit task dialog** — title, description, deadline (date+time), estimated duration, status
- **Complete task button** — triggers score calculation
- **Delete task** with confirmation
- Auto-mark tasks as "missed" when deadline passes without completion

### 4. Statistics Page
- **Weekly view** — bar/line charts showing tasks completed, missed, and score changes per week
- **Monthly view** — same metrics aggregated monthly
- Charts built with Recharts (already installed)

### 5. Settings / Profile Page
- User email display
- **Delete data options**: delete weekly stats, monthly stats, or score history
- Logout button

---

## Score System Logic
- **+15 coins** → completed ≥20 minutes before deadline
- **+10 coins** → completed on time (within 20 min before deadline)
- **-5 coins** → completed after deadline
- Score stored on user's profile; history tracked per event
- Calculated via Supabase Edge Function on task completion

---

## Database Schema (Supabase)

**profiles** — id, email, score, created_at
**tasks** — id, user_id, title, description, deadline, estimated_duration, status (pending/in_progress/completed/missed), completed_at, created_at
**score_history** — id, user_id, task_id, score_change, reason, created_at
**weekly_stats** — id, user_id, week_start, tasks_completed, tasks_missed, score_change
**monthly_stats** — id, user_id, month, tasks_completed, tasks_missed, score_change

All tables with RLS policies so users only access their own data.

---

## AI Assistant
- Powered by Lovable AI (Gemini via gateway)
- Edge function for `/ai/suggestions`
- Capabilities: suggest tasks based on history, generate daily productivity summary
- Accessible from dashboard via chat-style UI or button

---

## Edge Functions
1. **complete-task** — calculates score, updates profile, logs score_history, updates stats
2. **ai-suggestions** — sends user context to Lovable AI, returns task suggestions or summary

---

## Key UX Details
- Gold coin icon/animation for score display
- Color-coded task statuses (green=completed, red=missed, yellow=pending, blue=in progress)
- Responsive design for mobile and desktop
- Toast notifications for score changes
- Confirmation dialogs for destructive actions (delete tasks, delete history)

