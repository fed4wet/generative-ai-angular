import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from 'src/environments/environment.development';

@Injectable()
export class AudioService {
  ELEVEN_LABS_VOICE_ID: string = environment.ELEVEN_LABS_VOICE_ID;
  ELEVEN_LABS_API_KEY: string = environment.ELEVEN_LABS_API_KEY;

  public audio!: HTMLAudioElement;
  public source!: AudioBufferSourceNode;
  private audioContext!: AudioContext;
  private streamPlaying: boolean = false;

  constructor(private http: HttpClient) {
    this.audio = new Audio();
  }

  public setAudioAndPlay(data: ArrayBuffer): void {
    if (this.isAudioPlaying()) return;
    const blob: Blob = new Blob([data], { type: 'audio/mpeg' });
    this.audio.src = URL.createObjectURL(blob);
    console.log('Started playing: ' + Date.now());
    this.audio.play();
    console.log('Ended playing: ' + Date.now());
  }

  public async playTextToSpeech(text: string) {
    if (this.isAudioPlaying()) return;
    await this.getAudio(text);
  }

  private async getAudio(text: string) {
    const ttsURL = `https://api.elevenlabs.io/v1/text-to-speech/${this.ELEVEN_LABS_VOICE_ID}`;

    const headers = {
      accept: 'audio/mpeg',
      'content-type': 'application/json',
      'xi-api-key': this.ELEVEN_LABS_API_KEY,
    };

    const request = {
      text,
      "model_id": "eleven_multilingual_v2",
      "voice_settings": { //defaults specific to voiceId
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0,
        "use_speaker_boost": true
      }
    };

    console.log('Call made: ' + Date.now());
    this.http
      .post(ttsURL, request, { headers, responseType: 'arraybuffer' })
      .subscribe({
        next: (response: ArrayBuffer) => {
          this.playAudio(response);
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
  }

  private playAudio(data: ArrayBuffer): void {
    this.setAudioAndPlay(data);
  }

  public async playStreamAudio(text: string): Promise<void> {
    await this.getStreamAudio(text);
  }

  private async getStreamAudio(text: string): Promise<void> {
    if (this.isAudioStreamingPlaying()) return;

    const streamingURL: string = `https://api.elevenlabs.io/v1/text-to-speech/${this.ELEVEN_LABS_VOICE_ID}/stream?optimize_streaming_latency=3`;

    const headers = {
      'content-type': 'application/json',
      'xi-api-key': this.ELEVEN_LABS_API_KEY,
    };

    console.log('Call made: ' + Date.now());
    const request = {
      text,
      "model_id": "eleven_multilingual_v2",
      "voice_settings": { //defaults specific to voiceId
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0,
        "use_speaker_boost": true
      }
    };
    this.http
      .post(streamingURL, request, { headers, responseType: 'arraybuffer' })
      .subscribe({
        next: (response: ArrayBuffer) => {
          this.playAudioStream(response);
          console.log('stream chunk');
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
  }

  private async playAudioStream(audioData: ArrayBuffer): Promise<void> {
    //todo: add error handling
    if (this.isAudioStreamingPlaying()) {
      return;
    }
    else {
      this.audioContext = new AudioContext();
      this.source = this.audioContext.createBufferSource();
    }
    this.source.buffer = await this.audioContext.decodeAudioData(audioData);
    this.source.connect(this.audioContext.destination);

    this.source.onended = () => {
      console.log('Ended playing: ' + Date.now());
    };

    let startTime: number = this.audioContext.currentTime + 0.1;
    console.log('Started playing: ' + startTime);
    this.streamPlaying = true;
    this.source.start(startTime);
  }

  pause(): void {
    if (this.isAudioPlaying()) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.isAudioStreamingPlaying()) {
      this.source.stop();
      this.source.disconnect();
      this.audioContext.close();
      this.streamPlaying = false;
    }
  }

  public isAudioPlaying(): boolean {
    return (this.audio
      && this.audio.currentTime > 0
      && !this.audio.paused
      && !this.audio.ended
      && this.audio.readyState > 2);
  }

  public isAudioStreamingPlaying(): boolean {
    return (this.source
      && this.audioContext
      && this.audioContext.state == 'running'
      && this.streamPlaying
    );
  }
}
