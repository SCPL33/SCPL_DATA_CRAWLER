# Supply Chain Wars: Factory Tycoon Arena

A self-contained browser MVP for **Supply Chain Wars: Factory Tycoon Arena**, a strategy + idle tycoon game about running a manufacturing business.

## Gameplay

Players manage a small factory and compete in a weekly market battle by:

- Buying raw material when market prices are favorable.
- Running production lines while watching machine health.
- Performing quality checks to protect reputation.
- Accepting local and export contracts.
- Dispatching finished goods for cash and leaderboard score.
- Reinvesting profits into machine speed, storage, and quality lab upgrades.

## MVP Features Included

- Factory dashboard with cash, inventory, material price, health, reputation, and arena score.
- Rotating market events such as fuel price rises, export booms, raw material dips, and machine crises.
- Rule-based AI Business Advisor that recommends actions based on the current game state.
- Contract scouting and order acceptance loop.
- Production, quality control, dispatch, and upgrade mechanics.
- Simulated weekly leaderboard against rival factories.
- Responsive web layout with no external dependencies.

## Run Locally

Open `index.html` in any modern browser.

For a local static server, run:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.
