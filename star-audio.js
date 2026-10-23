'use strict';
// Award sequencing remains in timer-stars.js; all playback belongs to one manager.
function stopStarSounds(){GameAudio.stopEffects()}
function playStarSound(number,options){return GameAudio.effect(`star_${number}`,options)}
