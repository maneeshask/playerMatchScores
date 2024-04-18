const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000)
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertIntoPlayerObj = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  }
}

const convertIntoMatchObj = dbObj => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  }
}

const convertIntoPlayerMatchObj = dbObj => {
  return {
    playerMatchId: dbObj.player_match_id,
    playerId: dbObj.player_id,
    matchId: dbObj.match_id,
    score: dbObj.score,
    fours: dbObj.fours,
    sixes: dbObj.sixes,
  }
}
//1.API TO GET ALL THE PLAYERS FROM PLAYER TABLE
app.get('/players/', async (request, response) => {
  const getPlayersQ = `SELECT * FROM player_details ORDER BY player_id`
  const result = await db.all(getPlayersQ)
  const resultsArray = result.map(each => convertIntoPlayerObj(each))
  response.send(resultsArray)
})

//2.API TO GET THE PLAYERS BASED ON PLAYERID

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQ = `SELECT * FROM player_details WHERE player_id=${playerId};`
  const result = await db.get(getPlayerQ)
  const resArr = convertIntoPlayerObj(result)
  response.send(resArr)
})

//3.API TO UPDATE THE DETAILS OF A PLAYER
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updatePlayerDetails = `UPDATE player_details 
  SET player_name='${playerName}' WHERE player_id=${playerId}; `
  await db.run(updatePlayerDetails)

  response.send('Player Details Updated')
})

//4.API TO GET THE DETAILS OF SPECIFIC MATCH
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetails = `SELECT * FROM match_details WHERE match_id=${matchId};`
  const result = await db.get(getMatchDetails)
  const resArr = convertIntoMatchObj(result)
  response.send(resArr)
})

//5. API TO GET AL MATCHES OF A PLAYER

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQ = `SELECT match_id AS matchId, match, year
   FROM match_details NATURAL JOIN player_match_score
   WHERE player_id=${playerId};`
  const result = await db.all(getPlayerMatchesQ)
  response.send(result)
})

//6.API TO RETURN LIST OF PLAYERS IN A SPECIFIC MATCH
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayersInMatchQ = `SELECT player_id AS playerId,
  player_name AS playerName 
  FROM player_details NATURAL JOIN player_match_score 
  WHERE match_id=${matchId};`
  const result = await db.all(getPlayersInMatchQ)
  response.send(result)
})

//7.API TO RETURN THE STATISTICS OF A SPECIFIC PLAYER BASED ON PLAYERID
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getStatisticsQ = `SELECT player_details.player_id AS playerId,
  player_details.player_name AS playerName,
  SUM(player_match_score.score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes 
  FROM player_details INNER JOIN player_match_score ON 
  player_details.player_id=player_match_score.player_id 
  WHERE player_details.player_id=${playerId};`
  const result = await db.get(getStatisticsQ)
  response.send(result)
})
