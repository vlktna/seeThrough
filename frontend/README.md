# Floorplan

An Expo Go frontend with only the latest floorplan, named head markers, and a list of people and their rooms below it.

```powershell
cd frontend
npm.cmd install
npm.cmd run web -- --clear
```

For Expo Go, run `npm.cmd start` and scan the QR code.

Edit `src/people.js` to supply the data:

```js
{ name: 'Alex Morgan', roomNumber: 1 }
```

Rooms 1–5 match the red numbers on the supplied screenshot. Multiple people in a room receive separate marker locations within that room. Unknown room numbers appear as Unknown in the list with no map marker. The included roster is sample data.

To integrate a data source, render `<Floorplan people={people} />` from `App.js` with an updated array whenever room assignments change. Each record needs only `name` and `roomNumber`; there are no starting coordinates, movement offsets, connection settings, or simulated movement.

The background is `assets/floorplan.png`, copied from the latest uploaded screenshot. `src/rooms.js` defines fixed display areas for each room on the 600 × 540 image.

Validation: `npm.cmd test` and `npm.cmd run build:web`.
For a static web preview after building, run `npm.cmd run preview` and open http://localhost:8090.
