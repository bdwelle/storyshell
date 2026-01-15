[x] clobber storyshell <- merge storygen as new head
[x] rename everything "storygen" -> "storyshell"
[x] restore change to run.js to look for includes in relative path in INSTALL DIR ~/lib/storyshell
[x] restore concept_extraction
[x] update concept_extraction to exclude common words like 'the' 'and' etc
[x] revive install.sh
[x] add `pov` template
[x] add elevenlabs text-to-speech 
[x] TTS from file should parse YAML and MD title, use YAML.id in resulting audio filename, then strip YAML and MD title before sending for speech generation.  
[x] add punch-up command
[x] install/make TTS agent work from project dir 
[x] move TTS agent from config to agents dir
[x] fix naming of tts agent & tool 
[x] rename run.js to storyshell.js
[x] fix bash quoting using HEREDOC / EOF
[x] move add templateBody to end of context built by storyshell.js 
[x] integrate Elevenlabs TTS subagent with primary Storyshell agent
[x] Add a second Writer agent defined in MD that uses Gemini
[ ] integrate TTS subagent logging with primary Storyshell logging? 
[ ] try Gemini TTS (vs Elevenlabs)

[ ] set permissions to * allow so that the writer agent doesn't stop to ask for permission to access a directory
[ ] Add Gemini jailbreak – necessary? https://www.injectprompt.com/p/gemini-25-flash-jailbreak-aleph-null

[ ] improve example-project AGENTS.md
[ ] revive setup-project.sh
