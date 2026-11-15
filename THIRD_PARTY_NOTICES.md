# Third-Party Notices

This repository's own source code is licensed under the MIT License in
[`LICENSE`](LICENSE). That license does **not** cover third-party code,
character artwork, voice models, audio samples, model files, or external
services.

## npm dependencies

These are installed through `npm install` and are not vendored in this
repository. Their own licenses apply:

| Package | License | Source |
| --- | --- | --- |
| `@livliv-dev/player` | Apache-2.0 | https://github.com/livliv-dev/player |
| `electron` | MIT | https://github.com/electron/electron |
| `esbuild` | MIT | https://github.com/evanw/esbuild |
| `@orama/orama` | Apache-2.0 | https://github.com/oramasearch/orama |
| `@orama/tokenizers` | Apache-2.0 | https://github.com/oramasearch/orama |

Transitive dependencies and their license texts are recorded by the npm
packages in `node_modules` after installation and by `package-lock.json`.

## Character assets

This repository does not contain the character assets. `init.ps1` downloads
only the `p01` and `p02` folders from:

https://github.com/livliv-dev/player

Those two character folders are licensed under **CC BY-NC-SA 4.0**, not the
MIT License and not the LivLiv Featured Characters License:

- https://creativecommons.org/licenses/by-nc-sa/4.0/
- Attribution: “Kujira: 上善无形、ZipZipPipe（CC BY-NC-SA 4.0）；模型：LivLiv”
- Non-commercial use only; modified versions distributed to others must use
  the same license.
- The downloaded copy includes `characters/characters/LICENSE.md` and
  `characters/characters/CREDITS.md`; do not remove them when redistributing.

Other characters in the upstream repository, including `p03` (Pen), are not
covered by these notices. `p03` has no granted rights in the upstream credits;
`init.ps1` deliberately does not download it, and it should not be redistributed
without permission from the relevant rights holders.

## Voice, ASR, and image-generation models

The following are not included in this repository:

- `voices/`
- `voice-samples/`
- GPT-SoVITS weights or reference audio
- SenseVoice/ASR model files
- ComfyUI models or workflows

`ttsMode` defaults to `off`. If you enable TTS, ASR, or ComfyUI, you must obtain
the models and voice samples separately and comply with their own licenses and
the rights of the voice/model providers. Do not redistribute a real person's
voice model or reference audio without permission.

## External services

GPT-SoVITS, ComfyUI, SenseVoice, and any local LLM/embedding service are
external dependencies. They are not part of this repository and are governed by
their own licenses and terms. This repository only contains client-side
configuration and code that calls them.

## ScreenCap

`tools/ScreenCap.cs` and `tools/ScreenCap.exe` are first-party project code
under the root MIT License, not third-party code. Build instructions are in
[`tools/README.md`](tools/README.md).

## Example room assets

`pet_space.example/room/bedroom.png` is an example image asset and is not
automatically covered by the MIT License that covers the source code. Confirm
its provenance and grant a separate license before redistributing it outside
this repository, or replace it with an asset you are free to redistribute.

## Trademarks

DeepSeek, LivLiv, Kujira, and other names and character likenesses belong to
their respective rights holders. This project is unofficial and is not
endorsed, sponsored, or affiliated with DeepSeek or LivLiv.
