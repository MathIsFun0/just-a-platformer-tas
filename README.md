# just a platformer TAS tool

An attempt from me to create a TAS tool for a platformer.

Unlike the actual game, which has a framerate that syncs with the display refresh rate, this tool keeps the FPS fixed (at 60 FPS by default). This is due to the framerate slightly altering the game's physics.

## Commands

All commands must be listed chronologically, and start with the number of the frame that they should be executed on.

The # symbol is used to indicate comments, which are ignored.

### Control

`<press/rel/move> <left/right/up>`

Simulates pressing or releasing a key. The `move` command presses either left or right and releases the opposite key.

`jump`

Releases and immediately presses the up arrow, allowing the player to jump.

`respawn`

Causes the player to respawn.

`hub`

Causes the player to be teleported to the hub.

`reset`

Stops all input and sets the frame number to 0.
### TAS Tools

`savestate <game/player>`

Copies information about the game (switches pressed, branches, completed, deaths, checkpoint, etc.) or the player (position and velocity) to the clipboard.

`loadstate <game/player> data`

Loads a savestate.

`trigger x y`

Places a switch at the specified position in the current level, which sends a notification when pressed.

### Playback

`speed x`

Sets the game speed to a specified value.

`slowdown x`

Sets the game speed to the inverse of a specified value. (e.g. `slowdown 2` would set the game speed to 0.5)

`FPS x`

Sets the game's frames per second to a specified number.

The game is hardcoded to only allow over 10 FPS.

`frameTime x`

Sets the time per frame to the specified number of milliseconds.

`stop`

Permanently pauses the game until the TAS is updated.
