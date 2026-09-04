# 🏈 Fantasy Football Auction Draft Bot

An intelligent, real-time auction draft assistant and strategy engine for Fantasy Football built with React, Vite, and custom financial valuation algorithms.

![Auction Bot Banner](https://img.shields.io/badge/Fantasy_Football-Auction_Draft_Bot-blue?style=for-the-badge&logo=nfl)

---

## 🌟 Key Features

1. **Real-Time Dynamic Inflation Engine**:
   - Continuously calculates room inflation/deflation based on remaining league budget vs. baseline player values.
   - Dynamically recalibrates target prices for remaining players as market overpays or underpays occur.

2. **Smart Nomination Strategy Advisor**:
   - **Budget Drainer**: Recommends nominating high-AAV players at positions you don't need to force rivals to drain cash early.
   - **Bully Bidding**: Identifies windows where your cash stack dominates the room to secure top targets.
   - **Sleeper Snipe**: Identifies $1-$3 upside targets for late-draft nomination.

3. **Interactive Bidding & Draft Dashboard**:
   - Live nomination box with 1-click bid increases (+$1, +$5).
   - Recommended Walk-Away Price (Max Target Bid) calculated per player based on your roster needs and budget constraints.
   - Max Bid Ceiling enforcement: Automatically ensures you leave at least $1 for every remaining roster spot.

4. **AI Mock Draft Simulator**:
   - Practice auction strategy against 11 AI managers with distinct bidding personalities (Star Hunter, Value Hunter, Balanced, Zero-RB).

5. **Sleeper API Integration**:
   - Sync directly with Sleeper fantasy football leagues to import roster sizes, draft boards, and team counts.

---

## 📐 Mathematical Model & Valuation Logic

### 1. Room Inflation Index ($	ext{Inflation Index}$)
$$	ext{Inflation Index} = rac{	ext{Total Remaining League Cash}}{\sum 	ext{Baseline AAV of Top Undrafted Players}}$$

- **Index > 1.0 (Inflated Market)**: Managers saved cash early; player prices are projected to rise.
- **Index < 1.0 (Deflated Market)**: Heavy spending early; cash is scarce and remaining players can be drafted at bargains.

### 2. Dynamic Player Value ($	ext{Dynamic Value}$)
$$	ext{Dynamic Value} = 	ext{Baseline AAV} 	imes 	ext{Inflation Index} 	imes 	ext{Positional Need Multiplier}$$

### 3. Max Bid Limit ($	ext{Max Bid}$)
$$	ext{Max Bid} = 	ext{Remaining Budget} - (	ext{Empty Roster Spots} - 1)$$

---

## 🚀 Getting Started

### Running Locally

```bash
# Navigate into the frontend directory
cd frontend

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will launch at `http://localhost:5173`.

---

## 🔗 Link to New GitHub Repository

To push this project to a brand-new repository on your GitHub account:

1. Create a new empty repository named `fantasy-football-auction-bot` on GitHub ([github.com/new](https://github.com/new)).
2. Run the following commands in your terminal:

```bash
# Add your new GitHub repository remote URL
git remote set-url origin https://github.com/calreilly/fantasy-football-auction-bot.git

# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: Fantasy Football Auction Draft Bot application & engine"

# Push main branch
git push -u origin main
```

---

## 📄 License
MIT License. Built for winning Fantasy Football Auction Leagues.
