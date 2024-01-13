import { Component } from '@angular/core';
import { AudioService } from './audio.service';

@Component({
  selector: 'app-read',
  templateUrl: './read.component.html',
  standalone: true,
})
export class ReadComponent {
  constructor(private audio: AudioService) { }

  public playTextToSpeech(text:string): void {
    this.audio.playTextToSpeech(text);
  }
  public playStreamAudio(text: string): void {
    this.audio.playStreamAudio(text);
  }
}
