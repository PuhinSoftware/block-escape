# Asset provenance and licensing notes

The user supplied **Blok Kaçış_ Renkli Macera.png** in the task as the approved visual reference and explicitly requested a layered adaptation. The supplied composite is not bundled or displayed as a full-screen UI image. Its original author, third-party rights and distribution licence could not be independently verified from the chat attachment; approval of a design does not itself establish copyright ownership.

| Files | Source / use |
| --- | --- |
| `bloop.png` | Newly generated transparent character, guided by the supplied reference using the image generation tool. |
| `world.png` | Newly generated environment only: no mascot, logo, controls or text. Used behind independent DOM layers. |
| `foreground-island.png` | Newly generated transparent island; separate foreground and animated distant-island instances. |
| `miner-bloop.png` | Generated transparent miner-costume edit of the existing Bloop, preserving the character identity. Used only in gameplay/win decorations. |
| `crystal-mine.png` | Newly generated environment-only mine scene; no board, controls, text or character baked into it. |
| `mine-frame.svg` | Project-authored stone/wood frame and metal rivets. |
| `logo.svg` | Newly authored vector lettering/crown approximating the approved logo. Uses system font fallback, no font file redistribution. |
| `bloop.svg`, `island.svg` | Earlier project-authored vector assets, retained as unused source artwork. |

No stock images, third-party icon packs, external fonts or downloaded animation libraries were added. Generated assets are not represented as independently cleared, exclusive, CC0 or public-domain stock. Their use is subject to applicable generation-service terms and any underlying rights in the user-supplied reference. No repository-wide licence is inferred or granted by this file. Confirm ownership/permission for the reference before distributing the finished artwork under a licence.

Native HTML/CSS supplies all functional buttons, play triangle, motion controls and transitions. Background, clouds, logo, character and island images remain separate layers. Original generation outputs are retained outside the repository under `/workspace/generated_images`; shipping assets are copied into this directory.

The user also supplied an approved Crystal Mines gameplay reference in chat. Its palette, mine setting and layout guide the new gameplay adaptation; the supplied composite is not shipped as a screen replacement. Source ownership/third-party rights in that reference could not be independently verified. The new generated PNGs carry the same service-terms/reference-rights caveats stated above; no additional stock or font licences were introduced.

## v0.5.1 art upgrade

The additional approved art-quality target supplied in chat guides the gameplay adaptation. `gameplay/stone-cell.webp` and `gameplay/block-*.webp` derive from newly generated individual stone/enamel masters, not from cutting the supplied composite into the UI. The arrow, frames, panels, plaque, crystals, lantern and action-icon SVGs are project-authored vector graphics; the board frame embeds a small derived stone texture. `gameplay/miner-bloop.webp` and `gameplay/crystal-mine.webp` are optimized derivatives of the existing project PNGs, whose original files remain unchanged. `gameplay/README.md` records conversion steps and `manifest.json` records sizes/hashes. These derivatives retain the reference/service-terms caveats above; no new stock, web font, icon pack or public-domain/exclusivity claim is introduced.


## v0.6.3 user-supplied audio

`assets/audio/` comes from the user's `Block_Escape_Crystal_Mines_BGM_v1.zip`
and `Block_Escape_Crystal_Mines_SFX_v1.zip`, explicitly supplied for game
integration. Their preserved READMEs describe original synthesized audio; no
separate license document was included. The MP3 is derived locally from the
provided WAV. See `assets/audio/README.md` and `inventory.csv` for provenance,
formats and unchanged-original checksums. No third-party audio library is used.
