import {Component, ViewChild} from '@angular/core';


import {RichTextEditorComponent} from '../rich-text-editor/rich-text-editor.component';
import {AudioService} from '../read/audio.service';
import {
  EnhancedGenerateContentResponse,
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI
} from "@google/generative-ai";
import {environment} from '../../environments/environment.development';


const MAX_PHRASES = 10;

@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
})
export class TextComponent {
  @ViewChild(RichTextEditorComponent)
  editor!: RichTextEditorComponent;
  editorEmpty: boolean = true;

  constructor(
    private audio: AudioService
  ) {
  }

  editorChange(empty: boolean): void {
    this.editorEmpty = empty;
  }

  async run(): Promise<void> {
    if (!this.editor) return;
    const prompt: string = this.editor.extractPrompt();


    // Gemini Client
    const genAI: GoogleGenerativeAI = new GoogleGenerativeAI(environment.API_KEY);
    const generationConfig: { maxOutputTokens: number } = {
      maxOutputTokens: 100,
    };
    const model: GenerativeModel = genAI.getGenerativeModel({model: "gemini-pro", generationConfig});

    const result: GenerateContentResult = await model.generateContent([
      "Reply using a maximum of a 100 characters.",
      prompt
    ]);
    const response: EnhancedGenerateContentResponse = result.response;
    const text: string = response.text();
    if (text.length > 0) {
      this.editor.insertAndFormatMarkdown(text);
    }
  }


  clear(): void {
    this.editor.clear();
  }

  speakOutPrompt(): void {
    if (this.audio.isAudioStreamingPlaying()) {
      this.audio.pause();
      return;
    }
    const prompt: string = this.editor.extractPrompt();
    if (prompt.length == 0) return;
    const phrases: string[] = prompt.split('.');
    const limitedPhrases: string = phrases.slice(0, MAX_PHRASES).join('.');
    if (limitedPhrases.length > 0) {
      this.audio.playStreamAudio(limitedPhrases);
    }
  }
}

