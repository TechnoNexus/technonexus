/**
 * Nexus Multiplayer Room Protocol
 * Centralized definition of all PeerJS message types and payload structures.
 */

export const RoomMessageType = {
  // Connection Lifecycle
  JOIN: 'join',
  WELCOME: 'welcome',
  PLAYER_LIST_UPDATE: 'player-list-update',
  KEEP_ALIVE: 'keep-alive',
  
  // Game State & Sync
  START_GAME: 'start-game',
  ROOM_STATUS_UPDATE: 'room-status-update',
  MODE_UPDATE: 'mode-update',
  NEW_CUSTOM_GAME: 'new-custom-game',
  GAME_ACTION: 'game-action',
  
  // Scoring & AI
  SUBMIT_RAW: 'submit-raw-submission',
  ROUND_VERDICT: 'round-verdict',
  BATCH_RESULTS: 'batch-results',
  
  // Specific Game Actions
  NPATM_SUBMIT: 'npatm-submit',
  NPATM_STOP: 'npatm-stop'
};
